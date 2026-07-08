# Bugs & Iterations — LoveSpark Hub

<!-- Log every bug fix and iteration with date, problem, root cause, and fix. -->

| Date | Problem | Root Cause | Fix |
|------|---------|------------|-----|
| | | | |

## 2026-07-08: BUG-001 — shared-lib copies drifted from canonical (missing tokens.css + stale files)

**Problem:** `lib/lovespark-base.css`, `lib/lovespark-footer.css`, `lib/lovespark-theme.js` carried uncommitted local edits matching canonical's pending state (base.css migrated to the `@import lovespark-tokens.css` split architecture; footer.css hover → underline; theme.js dropped the legacy `darkMode` boolean fallback). `lib/lovespark-tokens.css`, `lovespark-badge.js`, `lovespark-lifecycle.js`, `lovespark-popup.js`, `lovespark-stats.js` existed on disk but were never added to git — hub was one `git clean` away from a broken theme (base.css `@import`s tokens.css).
**Root cause:** A prior fleet shared-lib sync pass (P0-7-sweep) copied files into the working tree but never staged/committed them.
**Fix:** Verified every file byte-identical to `Extensions/infrastructure/lovespark-shared-lib/` and committed the full set. `ls-check .` "Shared lib matches canonical" now passes; gate went from 3 fail → 0 fail.
**Files:** lib/lovespark-base.css, lib/lovespark-footer.css, lib/lovespark-theme.js, lib/lovespark-tokens.css, lib/lovespark-badge.js, lib/lovespark-lifecycle.js, lib/lovespark-popup.js, lib/lovespark-stats.js


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
