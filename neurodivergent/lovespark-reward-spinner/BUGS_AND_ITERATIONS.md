# Bugs & Iterations — LoveSpark Reward Spinner

## 2026-07-08: P0-4-commit-4 — commit CWS/AMO submission bundle, bump to 1.0.30, build store zips

**Problem:** `fleet-to-store` had generated `CWS-LISTING.md`, `PRIVACY.md`, `SUBMIT.md`, and `cws-shots/` (12 CWS visual assets) on disk but they were never committed; `manifest.json` had been bumped to 1.0.30 locally without a commit.
**Root cause:** Same generation-without-commit pattern seen fleet-wide (P0-7-sweep-2 in sibling repos).
**Fix:** Verified `PRIVACY.md`/`CWS-LISTING.md` accurately declare the single `storage` permission and no host permissions — matches manifest exactly, no hand-fixes needed. Synced the stale "v1.0.29" reference in `PRIVACY.md` to v1.0.30. Committed the bundle + version bump, then ran `scripts/build-zips.sh` to produce `lovespark-reward-spinner-chrome.zip`/`lovespark-reward-spinner-firefox.zip`; Firefox zip passed `amo-validate.py`.
**Note (out of scope, not fixed here):** `ls-check .` reports a pre-existing gate failure — `BRAND-SPARKY: mascot.png missing` (repo root has no `mascot.png`, unlike sibling repos) — unrelated to the CWS bundle work in this unit, left for a mascot-asset fix pass. `lib/lovespark-footer.css` and `lib/lovespark-theme.js` were already modified in the working tree from an earlier, unrelated session; left untouched/uncommitted here since they're outside this unit's scope.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/ (12 files), manifest.json (1.0.29 → 1.0.30)

## v1.0.0 (2026-03-25)
- **Initial release.** No bugs logged yet.
- Scaffolded with shared lib, 4 themes, WCAG AA focus indicators, prefers-reduced-motion.
- Zero innerHTML — all DOM built via DOM API.
- Storage-only permissions. No data collection.


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
