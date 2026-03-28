# LoveSpark Mood Bloom - Bugs and Iterations

## v1.0.0 (2026-03-21) - Initial Build

### Architecture Decisions
- **storage + alarms only** - Simplest possible permission surface. No content scripts, no host permissions.
- **Emoji-based mood picker** - 5 moods (Amazing/Good/Okay/Low/Rough) with single-tap selection. Optimized for ADHD: minimal friction, no dropdowns.
- **Flower growth metaphor** - Streak → plant growth (Seed → Sprout → Daisy → Cherry Blossom → Sunflower → Bouquet at 30+ days).
- **Week garden** - 7-day visual overview using mood-to-flower mapping. Gives instant emotional pattern recognition.
- **90-day log retention** - Auto-prunes entries older than 90 days. Keeps storage bounded.
- **Optional note** - 140 chars max. Appears only after mood selection (progressive disclosure).
- **DOM API only** - el() helper for building garden days. Zero innerHTML per KI-011.

### Known Limitations (V1)
- No export/import of mood data
- No weekly/monthly trend charts (V2 candidate)
- No reminder notifications (V2 candidate — could use chrome.alarms)
- Delete only removes last entry (no per-entry deletion UI)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-21 | Initial build | Expansion Agent Cycle 3 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
