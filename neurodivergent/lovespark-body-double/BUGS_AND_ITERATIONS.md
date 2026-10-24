# LoveSpark Body Double - Bugs and Iterations

## 2026-10-07: BUG-002 — dead theme dropdown + unstyled `.sr-only` theme label leak (PR #1 skeptic refutation)

**Problem:** (1) The theme dropdown never opened. `popup.html` used `id="themeDropdownTrigger"`/`id="themeDropdownMenu"`, but `lib/lovespark-theme.js:21-22` (canonical shared lib) does `getElementById('themeToggle')`/`getElementById('themeMenu')`. The `if (toggle && menu)` guard silently skipped wiring the click handlers, so theme switching was dead. This was already broken on `main`. (2) PR #1 added `<span id="themeLabel" class="sr-only" aria-live="polite">`, but `.sr-only` is defined in no stylesheet (not lib/*.css, not popup.css, not the canonical shared lib). `LoveSparkTheme.init()` → `apply()` writes "Retro Pink" into it on every popup open, so the name rendered as stray visible text next to the trigger and the live region announced it on load. The trigger itself showed static, never-updated "retro".
**Root cause:** The popup markup was hand-written against a different id convention than the shared lib it loads, and the shared lib fails silently when its ids are missing. `ls-check` has no check that the ids a script looks up exist in the HTML, or that the classes the HTML uses are defined anywhere.
**Fix:** Adopted the sibling-extension pattern (e.g. reading/lovespark-reader): ids `themeToggle`/`themeMenu`, with `#themeLabel` inside the trigger as its visible text (`Theme: <span id="themeLabel">Retro Pink</span> ▾`, arrow `aria-hidden`). The menu header now reads "Change Theme" per UI rule #2. `aria-live` was dropped from the label. The shared lib stays byte-identical to canonical. Bumped manifest 1.0.36 → 1.0.37 + CHANGELOG. Known residual (shared-lib-wide, out of scope): `lovespark-theme.js` never toggles `aria-expanded`, and it no longer honours the legacy `darkMode` storage key.
**Regression check (no test harness in this repo; exit 0 = pass, fails 3 ways on the pre-fix head 369c43a):**
```
fail=0
for id in $(grep -ohE "getElementById\('[A-Za-z]+'\)" lib/lovespark-theme.js popup.js | sed -E "s/.*\('([A-Za-z]+)'\)/\1/" | sort -u); do grep -q "id=\"$id\"" popup.html || { echo "MISSING id #$id"; fail=1; }; done
for c in $(grep -oE 'class="[^"]+"' popup.html | sed -E 's/class="(.*)"/\1/' | tr ' ' '\n' | sort -u); do cat lib/*.css popup.css | grep -qE "\.$c([^A-Za-z0-9_-]|$)" || { echo "UNSTYLED .$c"; fail=1; }; done
exit $fail
```
**Files:** popup.html, manifest.json (1.0.36 → 1.0.37), CHANGELOG.md

## 2026-10-07: BUG-001 — missing lib/lovespark-fonts.css + recursive store zips (PR #1 verification)

**Problem:** (1) `popup.html` line 8 links `lib/lovespark-fonts.css`, but that file never existed in this repo (absent since the initial commit 650afb3; `git ls-tree origin/main lib/` has no fonts.css). The popup therefore 404s the stylesheet and `--ls-font-body: 'DM Mono'` / `--ls-font-display: 'Press Start 2P'` fall back to generic `monospace`/`cursive` — brand fonts never rendered. Not caught by `ls-check` (BRAND-LIB-SYNC only compares files that are present). (2) The two store zips committed in e281798/d05559a each contained `lovespark-body-double-chrome.zip` + `lovespark-body-double-firefox.zip` (v1.0.32, 249 KB each) nested inside, and those nested zips contained 3 more zips — the 708 KB packages were ~70% stale zips, plus `CWS-LISTING.md`/`PRIVACY.md`/`SUBMIT.md`/`screenshots/`.
**Root cause:** (1) The shared-lib sync passes copied individual `.css`/`.js` files but never `lovespark-fonts.css` + `fonts/`, unlike sibling extensions (doomscroll, calm-down-kit, Anti-Brainrot all ship the full 51-file `lib/fonts/`). (2) `scripts/build-zips.sh` stages the whole extension dir and does not exclude `*.zip`, so once a zip is left in the repo root every rebuild swallows the previous build. Committing build output to the repo (main has none) created the feedback loop.
**Fix:** Copied canonical `lovespark-fonts.css` (byte-identical, `cmp` verified) + `lib/fonts/*.woff2` (51 files, 1.1 MB) from `Extensions/infrastructure/lovespark-shared-lib/`. `git rm`'d both zips and added `*.zip` to `.gitignore`; zips are rebuilt by `scripts/build-zips.sh` into `lovespark zips/` (where `SUBMIT.md` already points). Bumped manifest 1.0.35 → 1.0.36 + CHANGELOG. Follow-up (outside this repo): add `--exclude '*.zip'` to `build-zips.sh`'s rsync stage so this class of bug is impossible.
**Regression check (no test harness in this repo):**
```
# every local asset popup.html references must exist (exit 0 = pass)
grep -oE '(src|href)="[^"#h][^"]*"' popup.html | sed -E 's/.*="([^"]*)"/\1/' | while read f; do test -e "$f" || { echo "MISSING $f"; exit 1; }; done
# every woff2 the font stylesheet references must exist
grep -oE 'fonts/[a-z0-9-]+\.woff2' lib/lovespark-fonts.css | sort -u | while read f; do test -e "lib/$f" || { echo "MISSING lib/$f"; exit 1; }; done
# no build zips tracked in git
test "$(git ls-files '*.zip' | wc -l)" -eq 0
```
**Files:** lib/lovespark-fonts.css (new), lib/fonts/ (new, 51 files), lovespark-body-double-chrome.zip (deleted), lovespark-body-double-firefox.zip (deleted), .gitignore, manifest.json (1.0.35 → 1.0.36), CHANGELOG.md

## 2026-07-08: P0-7-sweep-2 — shared-lib sync + missing mascot.png + untracked project files

**Problem:** `lib/lovespark-footer.css` and `lib/lovespark-theme.js` on disk already matched canonical `Extensions/infrastructure/lovespark-shared-lib/` byte-for-byte but were never committed. Two dead/unreferenced files (`lib/browser-polyfill.min.js`, `lib/lovespark-tokens.css`, neither used by any `.html`/`.js`/manifest) had already been deleted from disk but the deletion was never committed either. Separately, `popup.html` references `mascot.png` at the repo root but that file had never been committed — the extension was shipping without its own mascot per git history. `CHANGELOG.md`, `LICENSE`, and `screenshots/` (CWS listing assets) also existed on disk only, never committed.
**Root cause:** Prior sync/asset-generation passes wrote files to disk but stopped short of `git add`/commit.
**Fix:** Committed the shared-lib sync, finalized the two dead-file deletions, committed `mascot.png` + `CHANGELOG.md` + `LICENSE` + `screenshots/` as-is (verified `mascot.png` is the actual file `popup.html` already `<img src="mascot.png">`s). Also committed an unrelated uncommitted a11y improvement to `popup.html` found alongside the sync (added `aria-live` regions to the companion/timer/preset sections and a live theme label) in its own commit.
**Files:** lib/lovespark-footer.css, lib/lovespark-theme.js, lib/browser-polyfill.min.js (deleted), lib/lovespark-tokens.css (deleted), mascot.png, CHANGELOG.md, LICENSE, screenshots/, popup.html

## v1.0.0 (2026-03-21) - Initial Build

### Architecture Decisions
- **storage + alarms only** - Timer ticks via chrome.alarms (1-min interval). No content scripts, no host permissions.
- **Body doubling concept** - Sparky acts as a virtual companion who "sits with you" during focus sessions. Based on the ADHD technique of having someone present while working.
- **4 duration presets** - Sprint (15m), Flow (25m), Deep (45m), Marathon (60m). No custom duration in V1 to reduce decision paralysis.
- **SVG ring timer** - Circular progress indicator using stroke-dashoffset animation. Lightweight, no canvas.
- **Encouraging messages** - 16 ADHD-specific encouragements rotated randomly during sessions.
- **Session log** - 30-day retention, auto-prune. Tracks preset, duration, completion.
- **5-second polling** - Popup polls background for timer state every 5s during active sessions. Minimal overhead.
- **DOM API only** - Zero innerHTML per KI-011.

### Known Limitations (V1)
- No notification when session completes (popup must be open)
- No custom duration input (V2 — reduces decision paralysis for V1)
- No break timer between sessions (V2 — Pomodoro-style)
- No session history view (V2 — calendar/heatmap)
- No sound effects (V2 — gentle chime on completion)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-21 | Initial build | Expansion Agent Cycle 5 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-07-08: CWS/AMO submission bundle committed (P0-4-commit-3)

**Problem:** LoveSpark Body Double had no committed CWS Web Store / AMO submission package — CWS-LISTING.md, PRIVACY.md, SUBMIT.md, and cws-shots/ existed only as generator output on disk, never landed in git, so the extension wasn't submission-ready from a clean checkout.
**Root cause:** `fleet-to-store` generates these artifacts locally but a separate commit step was needed to land them, bump the patch version, and rebuild the store zips.
**Fix:** Verified PRIVACY.md is truthful (local-storage-only, zero external transmission) and CWS-LISTING.md's single-purpose + per-permission + host-permission justifications match the actual manifest.json permissions. Bumped manifest.json to v1.0.32. Rebuilt *-chrome.zip / *-firefox.zip via the canonical `scripts/build-zips.sh`; Firefox zip passed `amo-validate.py`. Committed the bundle.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/, manifest.json

## 2026-07-08: R-cws-a11y-3 — restore BRAND-LIB-SYNC (lovespark-tokens.css)

**Problem:** `ls-check .` failed `BRAND-LIB-SYNC` — `lib/lovespark-tokens.css` was missing locally even though `lovespark-shared-lib`'s canonical set ships it, blocking the CWS submission gate (`ls-check . --gate cws`). Note this file had been deliberately deleted in the 2026-07-08 P0-7-sweep-2 pass above as "dead/unreferenced" — but `ls-check`'s `BRAND-LIB-SYNC` check requires the full 7-file canonical set present regardless of HTML usage (that nuance is covered separately by the non-blocking `BRAND-DEAD-LIB` warning), so the earlier deletion regressed this specific gate.
**Root cause:** Two ls-check rules have conflicting expectations for unreferenced shared-lib files: `BRAND-LIB-SYNC` (fail) wants every canonical file present and byte-identical; `BRAND-DEAD-LIB` (warn-only) flags files not wired into HTML. Deleting an unused file satisfies the warn but breaks the fail.
**Fix:** Copied `lovespark-tokens.css` back from canonical `Extensions/infrastructure/lovespark-shared-lib/` (byte-identical, verified via md5) — did not run the fleet-wide `sync-shared-lib.sh` since it walks every extension under `Extensions/` and this unit is scoped to 6 repos only. Also confirmed `A11Y-CONTRAST` (3 failures: beige hint-text opacity, slate muted-on-glass-strong, slate slider-thumb-on-track — KI-002/003/004) is a fleet-wide defect in canonical `lovespark-shared-lib/lovespark-tokens.css` itself (reproduced with `--hardcoded` fallback passing clean, proving the live canonical values are the actual regression, not a per-repo issue) — out of scope for this repo, flagged separately for the `lovespark-shared-lib` repo.
**Files:** lib/lovespark-tokens.css (restored), manifest.json (1.0.32 → 1.0.33)

## 2026-07-08: P2-sync-3 — re-sync canonical tokens.css after KI-002/003/004 contrast fix, rebuild zips

**Problem:** `ls-check .` was blocked on `A11Y-CONTRAST` (3 failures: beige hint-text 0.8-opacity 4.26:1, slate muted-on-glass-strong 4.17:1, slate slider-thumb-on-track 2.65:1 — KI-002/003/004), previously confirmed fleet-wide and out of scope for this repo (logged in the prior R-cws-a11y-3 entry above). During this unit, a concurrent session landed the actual fix in canonical (`lovespark-shared-lib` commit 41b43cc "fix: canonical lovespark-tokens.css fails its own contrast gate (BUG-002 / KI-002, KI-003, KI-004)"), darkening `--ls-text-dark` to #564424, `--ls-glass-border` to #3e3e3e, and lightening `--ls-text-muted` to #a8a8a8 for the affected themes.
**Root cause:** This repo's `lib/lovespark-tokens.css` was still on the pre-fix canonical snapshot; the fix landing in the shared-lib repo mid-session left this repo one sync behind.
**Fix:** Re-copied `lovespark-tokens.css` from canonical `Extensions/infrastructure/lovespark-shared-lib/` (md5-verified byte-identical post-copy). `ls-check .` now passes `A11Y-CONTRAST` clean (verified via `audit-contrast.py --json`: 80 pass, 0 fail across all 4 themes) and `BRAND-LIB-SYNC`. One residual fail remains: `BRAND-TOKEN-DRIFT` — the fix was hand-patched directly into the shared-lib CSS but `design-tokens/tokens.json` (the generator source of truth) was never updated to match, so `generate-tokens.py`'s output no longer matches canonical by md5. This check compares only canonical `design-tokens/` + `lovespark-shared-lib/` files (identical for every repo in the fleet), is not fixable at the per-repo level, and is outside this unit's assigned repos (`lovespark-shared-lib`/`design-tokens`) — flagged as a separate follow-up task rather than patched here. Bumped manifest.json, rebuilt `*-chrome.zip`/`*-firefox.zip` via `scripts/build-zips.sh`; Firefox zip passed `amo-validate.py`.
**Files:** lib/lovespark-tokens.css (re-synced), manifest.json (1.0.33 → 1.0.34)


## 2026-07-08: P2-sync-3 (completion pass) — close ls-check-to-zero gate, rebuild zips

**Problem:** `ls-check .` was clean on shared-lib sync (tokens already matched canonical from the prior P2-sync-3 commit) but still reported `BRAND-TOKEN-DRIFT` (fail) and, on this repo, a `QUAL-CHANGELOG-DRIFT` (warn). Distributable zips were also stale relative to the current manifest version.
**Root cause:** `BRAND-TOKEN-DRIFT` is a canonical-infra gap — the KI-002/003/004 contrast fix was hand-patched directly into `lovespark-shared-lib/lovespark-tokens.css` but `design-tokens/tokens.json` (the generator source of truth, outside this unit's assigned repos) was never regenerated to match, so `generate-tokens.py`'s output no longer md5-matches canonical for any fleet repo. Not fixable at the per-repo level.
**Fix:** Bumped manifest.json 1.0.34 → 1.0.35, added a matching CHANGELOG.md entry where drift was flagged, and rebuilt `*-chrome.zip`/`*-firefox.zip` via `scripts/build-zips.sh` (Firefox zip passed `amo-validate.py`). `BRAND-TOKEN-DRIFT` remains open and is flagged as a separate follow-up task against `lovespark-shared-lib`/`design-tokens` (not one of this unit's repos).
**Files:** manifest.json (1.0.34 → 1.0.35), lovespark-body-double-chrome.zip, lovespark-body-double-firefox.zip

## 2026-10-24 — Chromium fleet audit (1.0.37 → 1.0.38)

- Insert the shared footer HTML into its mount instead of discarding the renderer’s return value.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
