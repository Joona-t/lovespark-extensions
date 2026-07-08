# LoveSpark Body Double - Bugs and Iterations

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
