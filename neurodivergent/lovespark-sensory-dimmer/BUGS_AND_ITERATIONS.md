# LoveSpark Sensory Dimmer - Bugs and Iterations

## v1.0.0 (2026-03-26) - Initial Build

### Architecture Decisions
- **activeTab + storage + scripting** — Applies CSS filter to documentElement via scripting API. No content scripts needed.
- **3 adjustable filters** — Brightness (20-100%), Contrast (20-100%), Saturation (0-100%). Defaults: 70/85/60 — a gentle dim without making pages unreadable.
- **Auto-apply on page load** — tabs.onUpdated applies filter to new pages when enabled.
- **Keyboard shortcut** — Alt+Shift+X toggles dim on/off from any page.
- **Different from page-tint** — Page-tint adds color overlay. Sensory dimmer reduces brightness/contrast/saturation via CSS filter. Different visual effect, different use case.
- **Different from dark-mode** — Dark mode inverts colors. Dimmer reduces intensity without changing colors.
- **CWS keyword** — "sensory overload" is high-search in ADHD/autism communities.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- No per-site dim settings
- No preset dim levels (mild/moderate/heavy)
- Filter affects entire page including videos
- No schedule (always on or off)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Initial build | CWS keyword: "sensory overload" |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
