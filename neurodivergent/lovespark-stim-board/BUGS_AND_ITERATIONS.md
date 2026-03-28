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


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
