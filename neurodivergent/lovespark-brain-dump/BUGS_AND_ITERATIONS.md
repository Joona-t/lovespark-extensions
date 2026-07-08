# LoveSpark Brain Dump - Bugs and Iterations

## 2026-07-08: P0-4-commit-4 — commit CWS/AMO submission bundle, bump to 1.0.32, build store zips

**Problem:** `fleet-to-store` had generated `CWS-LISTING.md`, `PRIVACY.md`, `SUBMIT.md`, and `cws-shots/` (12 CWS visual assets) on disk but they were never committed, and `manifest.json` had been bumped to 1.0.32 locally without a commit.
**Root cause:** Same pattern as P0-7-sweep-2 — asset-generation pass wrote files to disk and stopped short of `git add`/commit.
**Fix:** Verified `PRIVACY.md` (local-storage-only, zero-transmission, single `storage` permission — matches manifest exactly) and `CWS-LISTING.md` (single-purpose + per-permission + host-permission justifications match the actual manifest, which declares only `storage` and no host permissions) were accurate as generated — no hand-fixes needed for this repo. Committed the bundle + version bump, then ran `scripts/build-zips.sh` (canonical) to produce `lovespark-brain-dump-chrome.zip` and `lovespark-brain-dump-firefox.zip`; Firefox zip passed `amo-validate.py` on the first pass.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/ (12 files), manifest.json (1.0.31 → 1.0.32)

## 2026-07-08: P0-7-sweep-2 — shared-lib sync + missing mascot.png + untracked project files

**Problem:** `lib/lovespark-footer.css` and `lib/lovespark-theme.js` on disk already matched canonical `Extensions/infrastructure/lovespark-shared-lib/` byte-for-byte but were never committed. Two dead/unreferenced files (`lib/browser-polyfill.min.js`, `lib/lovespark-tokens.css`) had already been deleted from disk but the deletion was never committed. `popup.html` references `mascot.png` at the repo root but that file had never been committed. `CHANGELOG.md`, `LICENSE`, and `screenshots/` (CWS listing assets) also existed on disk only, never committed.
**Root cause:** Prior sync/asset-generation passes wrote files to disk but stopped short of `git add`/commit — same pattern as lovespark-body-double, likely the same batch run across both repos.
**Fix:** Committed the shared-lib sync, finalized the two dead-file deletions, committed `mascot.png` + `CHANGELOG.md` + `LICENSE` + `screenshots/` as-is. Also committed an unrelated uncommitted a11y/design tweak found alongside the sync (`popup.html` theme-label live region + thought-list aria-live, `popup.css` delete-icon hover opacity 0.6 → 0.85) in its own commit.
**Files:** lib/lovespark-footer.css, lib/lovespark-theme.js, lib/browser-polyfill.min.js (deleted), lib/lovespark-tokens.css (deleted), mascot.png, CHANGELOG.md, LICENSE, screenshots/, popup.html, popup.css

## v1.0.0 (2026-03-21) - Initial Build

### Architecture Decisions
- **storage only** - Simplest possible permission. No alarms, no content scripts.
- **Zero-friction capture** - Open popup, type, Enter. That's it. No categories to choose, no folders, no organization paralysis. Tags are optional.
- **3 optional tags** - Do (action items), Think (ideas/questions), Feel (emotions). Tags are one-tap toggles, not required.
- **7-day retention** - Auto-prunes thoughts older than 7 days. Brain dumps are ephemeral by design — they clear working memory, not create archives.
- **Newest-first display** - Most recent thought at top. Scrollable list with max-height.
- **Per-item delete + bulk clear** - Delete individual thoughts or clear all of today's dump.
- **280 char limit** - Keeps thoughts concise. This is a dump, not a journal.
- **DOM API only** - el() helper for building thought items. Zero innerHTML per KI-011.

### Known Limitations (V1)
- No search or filter by tag
- No export functionality
- No keyboard shortcut to open popup (would need commands API — V2)
- No "done" checkbox for Do-tagged items
- No drag-to-reorder

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-21 | Initial build | Expansion Agent Cycle 7 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
