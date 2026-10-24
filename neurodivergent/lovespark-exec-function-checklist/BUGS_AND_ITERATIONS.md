# LoveSpark Executive Function Checklist - Bugs and Iterations

## v1.0.0 (2026-03-25) - Initial Build

### Architecture Decisions
- **storage only** — No alarms, no content scripts.
- **6 default prompts** — Materials, First Step, Time Estimate, Distraction Shield, Energy Check, Reward Planning. Each with emoji for visual scanning.
- **Tap-to-check interaction** — Click/Enter toggles each item. Circle fills pink when checked. Text gets strikethrough.
- **Progress bar** — Visual fill + "X/6" counter. Completion triggers stat bump + celebration message.
- **Reset button** — "New task" clears all checks for next task.
- **CWS keyword targeting** — "executive function" is a high-search term in ADHD communities. Description leads with ADHD identity + specific dysfunction.
- **DOM API only** — el() helper for checklist items. Zero innerHTML per KI-011.

### Known Limitations (V1)
- No custom prompts (uses default 6 only)
- No task name input (just the checklist)
- No history of completed checklists
- No configurable prompt order

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-25 | Initial build | Expansion Agent — CWS keyword targeting |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
