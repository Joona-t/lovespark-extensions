# LoveSpark Focus Sounds - Bugs and Iterations

## v1.0.0 (2026-03-25) - Initial Build

### Architecture Decisions
- **storage only** — No offscreen API in V1. Audio plays via Web Audio API in popup context (while popup is open).
- **5 procedurally generated sounds** — White noise, Brown noise, Pink noise (Voss-McCartney), Rain (filtered + amplitude modulated), Fire (brown + crackle bursts). Zero audio files — all generated via AudioContext buffers.
- **Looping buffers** — 2-second buffers looped seamlessly. Low memory, instant start.
- **Volume slider** — 0-100% with live gain node adjustment. Saved to storage for persistence.
- **Tap to toggle** — Click active sound to stop. Click different sound to switch.
- **CWS keyword targeting** — "focus sounds" / "ambient noise" / "white noise" are high-search in ADHD communities.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- Sound stops when popup closes (no offscreen/background audio)
- No sound mixing (one sound at a time)
- No timer integration (play for X minutes)
- Rain and Fire are simplified approximations

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-25 | Initial build | CWS keyword: "focus sounds" |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
