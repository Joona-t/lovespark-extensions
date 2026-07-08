# Bugs & Iterations

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->

## 2026-07-08 — Canonical repo shipped with no README/LICENSE/BUGS log (BUG-001 / KI-037)

**Problem:** This repo — the single canonical source every extension's `lib/` directory is
copied from — had no `README.md`, no `LICENSE`, and no `BUGS_AND_ITERATIONS.md`, despite
being flagged as the fleet's single most-repeated audit finding (shared-lib drift confirmed
in 20+ extensions across 6 independent audit batches).

**Root cause:** Two compounding gaps. (1) This repo was never given the standard governance
docs when it was extracted into its own repo. (2) The instrument meant to catch downstream
drift — `lovespark-a11y-toolkit`'s `audit-contrast.py` and `ls-check.py` — was itself silently
broken: `CSS_FILE`/`SHARED_LIB` path resolution was a single hardcoded "one directory up" path
that stopped resolving to this repo the moment the toolkit was extracted into its own repo
(`Apps & Tools/lovespark-a11y-toolkit` sits *two* levels below `Claude x LoveSpark`, not one).
`audit-contrast.py` silently fell back to hardcoded token values every run; `ls-check`'s
`BRAND-LIB-SYNC` check silently skipped every file comparison (`canonical.exists()` was always
`False`) and reported a false "matches canonical" pass on every extension, healthy or not.
Digging further, even the file target was stale: color tokens live in `lovespark-tokens.css`,
not `lovespark-base.css` — a later shared-lib split the checker was never updated for, so even
with the path fixed it was parsing 0 tokens from the wrong file.

Direct real-world consequence: the March 2026 `--ls-btn-bg` regression shipped stale button
styling to 9 extensions simultaneously, and nothing caught it because the drift detector had
been dark since the repo extraction.

**Fix:**
- Added this `README.md` documenting the sync contract (this repo is edit-of-record; extension
  `lib/` copies are sync targets, never hand-edited; `sync-shared-lib.sh` propagates changes;
  `ls-check --only brand` verifies).
- Added `LICENSE` (MIT, matching the rest of the LoveSpark suite).
- Added this `BUGS_AND_ITERATIONS.md`.
- Fixed in `lovespark-a11y-toolkit` (and ported to the canonical `Claude x LoveSpark/scripts/`
  copies): `find_shared_lib()` now walks up from the script's own location until it finds
  `Extensions/infrastructure/lovespark-shared-lib`, with a `LOVESPARK_SHARED_LIB` env var
  override, so resolution survives future repo moves instead of assuming a fixed depth.
  `CSS_FILE` now targets `lovespark-tokens.css` (verified live: went from "0 tokens loaded,
  silent hardcoded fallback" to "46 tokens loaded, real drift detected"). `BRAND-LIB-SYNC` now
  fails loudly instead of silently passing when the canonical directory can't be resolved.
- Added a new rule-#10 grep-gate check (`QUAL-PAID-API`) to `ls-check` in the same pass, since
  it shares the same "instrument was supposed to catch this class of defect and didn't" shape.

**Prevention:** `ls-check`'s own test suite should grow a fixture asserting `find_shared_lib()`
resolves correctly from an arbitrarily nested repo layout (not just the current one), so a
future repo move can't silently reintroduce this exact bug a second time.

---

## 2026-07-08 — Canonical lovespark-tokens.css fails its own contrast gate (BUG-002 / KI-002, KI-003, KI-004)

**Problem:** This repo's own canonical `lovespark-tokens.css` — the single source every
extension's theme colors derive from — failed 3 of the checks in `audit-contrast.py`,
blocking the fleet CWS upload pipeline (which gates on a clean contrast audit): beige
hint-text at 0.8 opacity (4.26:1), slate muted-text on glass-strong (4.17:1), and slate
slider-thumb on track (2.65:1) — all below their WCAG 2.1 thresholds (4.5:1 text / 3:1 UI).
Documented for months in KI-002/003/004 but never landed in the token file itself.

**Root cause:** The fix direction was documented (`~/.claude/docs/memory/known-issues.md`
KI-002/003/004, `~/.claude/docs/memory/color-decisions.md`) but nobody had actually edited
`lovespark-tokens.css` with the corrected values — the KI entries described the target
ratios and candidate fixes, not applied code.

**Fix:** Adjusted three token values in `lovespark-tokens.css`, computed with the exact WCAG
2.1 relative-luminance formula `audit-contrast.py` uses, verified via
`python3 "Claude x LoveSpark/scripts/audit-contrast.py" --verbose --history`:

| Theme | Token | Before | After | Check | Before ratio | After ratio |
|-------|-------|--------|-------|-------|--------------|-------------|
| Beige | `--ls-text-dark` | #5C4A2A | #564424 | Hint text (0.8 opacity) on glass | 4.26:1 FAIL | 4.54:1 PASS |
| Slate | `--ls-text-muted` | #9A9A9A | #A8A8A8 | Muted text on glass-strong | 4.17:1 FAIL | 4.93:1 PASS |
| Slate | `--ls-glass-border` | #4A4A4A | #3E3E3E | Slider thumb on track | 2.65:1 FAIL | 3.19:1 PASS |

All other checks that use these three tokens (body text, dropdown text, muted-on-glass,
focus-ring-on-bg/glass, title overrides) already had margin above threshold and only
improved or stayed flat — no regressions. Full audit went from 77/80 to **80/80 checks
passing, exit code 0**, across all 4 themes (retro 19/19, dark 19/19, beige 21/21, slate
21/21). Updated KI-002/003/004 in `known-issues.md` to RESOLVED with these before/after
ratios, and refreshed the Beige/Slate token tables + Universal Dangerous Pairings in
`color-decisions.md` to match.

**Note on the beige fix:** the audit's "hint text" check simulates `--ls-text-dark` at 0.8
opacity as a generic proxy for real hint-text CSS in consuming extensions (out of this
repo's scope). Darkening the canonical `--ls-text-dark` token raises the floor for every
consumer without touching extension code, but the KI-004 prevention rule (extensions should
prefer `--ls-text-muted` or opacity ≥0.85 for hint text, not opacity-reduced `--ls-text-dark`)
still stands.

**Prevention:** The checker itself was never weakened — this was a token-only fix. Any future
theme token change must run `audit-contrast.py --verbose --history` before commit; `--history`
now has a green baseline (2026-07-08) so any new regression trips the "REGRESSIONS DETECTED"
block on the next run.
