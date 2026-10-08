# LoveSpark Pomodoro Rose - Bugs and Iterations

## v1.0.0 (2026-03-25) - Initial Build

### Architecture Decisions
- **storage + alarms** — Timer ticks via chrome.alarms at 15-second intervals. State persisted in storage.
- **Work/Break cycle** — Automatic transition: work phase completes -> break starts -> break completes -> idle. Badge shows remaining minutes (pink for work, green for break).
- **3 presets** — Short (15/5), Classic (25/5), Long (50/10). One-tap selection + Start button.
- **Rose garden** — Each completed work session adds a rose emoji to today's garden. Visual proof of focus.
- **CWS keyword targeting** — "Pomodoro" is high-search in ADHD/productivity communities. Description leads with ADHD identity.
- **Distinct from Body Double** — Body Double is companion-based focus with encouragement. This is structured Pomodoro technique with work/break cycles and garden growth.
- **Distinct from Quick Timer** — Quick Timer is a generic countdown. This has work/break phases, preset management, and rose rewards.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- No long break after 4 sessions (classic Pomodoro has 15-min break every 4th)
- No custom work/break durations beyond 3 presets
- No notification sound on phase change
- No session history beyond today's roses

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-25 | Initial build | CWS keyword targeting: "Pomodoro" |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
