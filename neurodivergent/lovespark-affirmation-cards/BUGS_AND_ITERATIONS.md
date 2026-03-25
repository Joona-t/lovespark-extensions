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
