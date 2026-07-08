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
