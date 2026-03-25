# LoveSpark Stim Board - Bugs and Iterations

## v1.0.0 (2026-03-21) - Initial Build

### Architecture Decisions
- **storage only** - Simplest possible permission. No alarms, no content scripts.
- **6 interactive stim widgets** in a 3x2 grid:
  1. **Clicker** - Tap to count, long-press (1.5s) to reset. Persistent count across sessions.
  2. **Color Blob** - Tap to cycle through 16 satisfying colors. Visual stim.
  3. **Breathing Circle** - CSS-only 6s inhale/exhale animation. Passive calming stim.
  4. **Pattern Tapper** - 3x3 grid of cells, tap to light up/toggle. Creative tactile stim.
  5. **Fidget Spinner** - Tap for 720-degree spin animation. Classic fidget.
  6. **Satisfying Toggle** - Flip on/off with smooth slide animation.
- **All interactions count as stims** tracked in daily/total stats via shared accumulator.
- **CSS animations wrapped in prefers-reduced-motion** - breathing circle and spinner respect user preference.
- **DOM API only** - pattern grid built programmatically via createElement. Zero innerHTML per KI-011.
- **Touch-friendly** - All tiles min 80px, active state scales down for tactile feedback.

### Known Limitations (V1)
- No sound effects (V2 — satisfying click/pop sounds)
- No haptic feedback (browser limitation)
- No custom color palette
- No stim history or heatmap
- Pattern grid doesn't save state (resets on popup close — intentional for fidget use)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-21 | Initial build | Expansion Agent Cycle 8 |
