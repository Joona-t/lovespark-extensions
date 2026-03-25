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
