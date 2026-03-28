# LoveSpark Gratitude Journal - Bugs and Iterations

## v1.0.0 (2026-03-24) - Initial Build

### Architecture Decisions
- **storage only** — No alarms, no content scripts, no host permissions. Simplest possible surface.
- **3 entries per day** — Hard cap prevents overwhelm. Slot indicators (3 dots) show progress. Input hides when full.
- **10 random prompts** — Rotating gratitude prompts reduce decision paralysis ("Something that made you smile", "A person you're grateful for", etc).
- **Flower growth streak** — Consecutive days with entries: Seed -> Sprout -> Daisy -> Blossom -> Sunflower -> Bouquet (30d+).
- **Entry flowers** — Each of the 3 daily entries gets a unique flower emoji (daisy, blossom, sunflower).
- **90-day retention** — Auto-prunes entries older than 90 days.
- **DOM API only** — el() helper for entry rendering. Zero innerHTML per KI-011.

### Known Limitations (V1)
- No browse/search past entries
- No export functionality
- No weekly/monthly reflection view
- No custom prompts

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-24 | Initial build | Expansion Agent Cycle 14 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
