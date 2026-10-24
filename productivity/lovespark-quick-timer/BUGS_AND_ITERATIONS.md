# LoveSpark Quick Timer - Bugs and Iterations

## v1.0.0 (2026-03-23) - Initial Build

### Architecture Decisions
- **storage + alarms only** — Timer state persisted in storage, ticked via chrome.alarms at 15-second intervals.
- **Badge shows remaining minutes** — Pink badge during countdown, green "!" on completion. Instant visual feedback without opening popup.
- **4 presets (5/10/15/25 min)** — Covers common use cases. No decision paralysis.
- **Custom input (1-120 min)** — Number input with Go button. Enter key supported.
- **SVG ring progress** — 100px ring with stroke-dashoffset animation. Clean, lightweight.
- **Completion state** — Shows checkmark + "Timer complete!" with dismiss button. Persists until dismissed.
- **3-second polling** — Popup polls background for timer state while active. Stops when idle.
- **No focus/session framing** — Pure utility timer. Different from Body Double (which adds encouragement + body doubling).
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- No notification/sound on completion (popup must be open to see)
- No pause/resume (only start/cancel)
- No timer history
- No multiple concurrent timers

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-23 | Initial build | Expansion Agent Cycle 13 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-10-24 — Chromium fleet audit (1.0.2 → 1.0.3)

- Package the local font stylesheet and the font files it references so the UI renders without missing assets or remote font requests.
- Wire the shared theme menu to this popup’s dropdown IDs, persist selections, and support Escape with accurate expanded state.
- Insert the shared footer HTML into its mount instead of discarding the renderer’s return value.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
