# LoveSpark Time Blindness Clock - Bugs and Iterations

## v1.0.0 (2026-03-25) - Initial Build

### Architecture Decisions
- **storage only** — No alarms needed (clock updates on popup open, 10s interval while open).
- **Big visible clock** — 36px display font, impossible to miss. Shows HH:MM + full date.
- **Time-until markers** — 3 defaults: Lunch (12:00), End of work (17:00), Bedtime (22:00). Shows "in Xh Ym" countdown, "now", or "passed".
- **Day progress bar** — 6 AM to 10 PM (16-hour day). Visual fill shows how much day is left.
- **Every popup open = a time check** — Logged as a stat. Helps users see how often they check time (awareness building).
- **CWS keyword** — "time blindness ADHD" is high-search in neurodivergent communities.
- **DOM API only** — createElement for marker items. Zero innerHTML per KI-011.

### Known Limitations (V1)
- No custom markers (uses 3 defaults only)
- No 12-hour format option
- No badge showing current time
- Markers not configurable from popup UI

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-25 | Initial build | CWS keyword: "time blindness" |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-10-24 — Chromium fleet audit (1.0.4 → 1.0.5)

- Wire the shared theme menu to this popup’s dropdown IDs, persist selections, and support Escape with accurate expanded state.
- Insert the shared footer HTML into its mount instead of discarding the renderer’s return value.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
