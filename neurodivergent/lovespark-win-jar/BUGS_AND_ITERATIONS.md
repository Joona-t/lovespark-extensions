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
