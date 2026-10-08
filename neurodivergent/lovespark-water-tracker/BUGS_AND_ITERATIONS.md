# BUGS_AND_ITERATIONS.md — LoveSpark Water Tracker

## v1.0.0 — 2026-03-25

### Initial Release
- **Scaffolded** via scaffold-extension.py, shared lib synced
- **Features:** 8 tap-to-log glass icons, visual fill meter, daily reset, undo button, goal completion message, badge shows cups/goal
- **Permissions:** storage only
- **A11y:** WCAG AA focus indicators, prefers-reduced-motion (disables hover scale), aria-live regions, role=dialog, role=group on glass grid, descriptive aria-labels on each glass button
- **Themes:** 4 themes via shared lovespark-theme.js (retro/dark/beige/slate)
- **Zero innerHTML** — glass grid built entirely with createElement

### Known Considerations
- Badge shows "X/8" format or checkmark when goal reached
- Fill meter uses blue gradient (water color) shifting to teal on completion
- Glass buttons have 48px min touch targets for accessibility
- Daily reset handled by shared LoveSparkStats.checkDailyReset


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
