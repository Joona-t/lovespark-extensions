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
