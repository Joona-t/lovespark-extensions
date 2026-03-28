# LoveSpark Affirmation Cards - Bugs and Iterations

## v1.0.0 (2026-03-21) - Initial Build

### Architecture Decisions
- **storage only** - Simplest possible permission surface. No alarms needed (cards are on-demand, not scheduled).
- **60 ADHD-specific affirmations** - 8 categories (Identity, Momentum, Rest, Strength, Worth, Compassion, Resilience, Pace). All written for neurodivergent self-compassion.
- **Random without repeat** - Ensures you never see the same card twice in a row.
- **Favorites deck** - Max 50 saved cards. Stored locally with category metadata.
- **Card entrance animation** - Subtle translateY + fade. Wrapped in prefers-reduced-motion.
- **Keyboard shortcuts** - Space/ArrowRight for next card, F to favorite.
- **DOM API only** - Zero innerHTML per KI-011.

### Known Limitations (V1)
- No favorites gallery view (can see count but not browse saved cards)
- No card sharing (copy to clipboard — V2 candidate)
- No custom affirmation input (V2 candidate)
- No daily reminder notification (could use chrome.alarms — V2)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-21 | Initial build | Expansion Agent Cycle 4 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
