# LoveSpark Wind Down - Bugs and Iterations

## v1.0.0 (2026-03-26) - Initial Build

### Architecture Decisions
- **storage + alarms + activeTab + scripting** — 5-minute alarm checks time, applies sepia+brightness filter to pages as bedtime approaches.
- **Progressive warmth** — Screen tone gradually warms over the wind-down period (default 60 min before bed). At bedtime: 40% sepia + 15% brightness reduction.
- **Configurable bedtime** — Hour + minute dropdowns. Default 22:00.
- **Badge countdown** — Shows "Xh" or "Xm" until bed within 3 hours. Shows "BED" after bedtime.
- **Different from sensory-dimmer** — Dimmer is on-demand with manual sliders. Wind Down is time-aware and automatic.
- **Different from page-tint** — Page-tint is a static color overlay. Wind Down progressively intensifies based on time of day.
- **CWS keyword** — "sleep hygiene ADHD" / "ADHD bedtime" are high-search.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- No gradual OS-level dimming (browser only)
- Wind-down period not configurable (fixed 60 min)
- No "snooze" for bedtime reminder
- Filter affects all tabs equally

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Initial build | CWS keyword: "sleep hygiene ADHD" |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
