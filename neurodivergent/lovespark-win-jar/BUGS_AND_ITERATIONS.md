# LoveSpark Win Jar - Bugs and Iterations

## v1.0.0 (2026-03-21) - Initial Build

### Architecture Decisions
- **storage only** - Simplest possible permission surface. No alarms needed (wins are user-initiated, not scheduled).
- **Win jar metaphor** - Targets ADHD rejection sensitivity dysphoria (RSD) and negative self-talk. The jar fills visually as you log wins, providing tangible proof of progress.
- **6 jar levels** - Empty jar, A few wins (5+), Getting full (15+), Half full (30+), Nearly full (50+), Overflowing (100+). Each level has a distinct emoji.
- **Shake for random win** - The core loop: when feeling down, shake the jar to surface a random past victory. Combats the ADHD tendency to fixate on failures.
- **500 win cap** - Auto-prunes oldest entries. Keeps storage bounded while preserving a rich history.
- **Streak tracking** - Consecutive days with at least one win logged. Encourages daily use without punishment for breaks.
- **8 celebration messages** - Rotated randomly on each win add. Positive reinforcement.
- **DOM API only** - el() helper for building win items. Zero innerHTML per KI-011.

### Known Limitations (V1)
- No win categories/tags (V2 candidate)
- No export/share functionality
- No weekly summary view
- No search through past wins
- Delete only available via background message (no UI button in V1)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-21 | Initial build | Expansion Agent Cycle 6 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
