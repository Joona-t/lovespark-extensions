# BUGS_AND_ITERATIONS.md — LoveSpark Noise Blocker

## v1.0.0 — 2026-03-25

### Initial Release
- **Scaffolded** via scaffold-extension.py, shared lib synced
- **Features:** Block autoplay audio/video, simple toggle, blocked media count, content script pauses and removes autoplay attribute, MutationObserver for dynamically added media
- **Permissions:** storage, activeTab, scripting
- **Content script:** Runs at document_start for early interception, uses MutationObserver for SPA/dynamic content
- **A11y:** WCAG AA focus indicators, prefers-reduced-motion, aria-live regions, role=dialog
- **Themes:** 4 themes via shared lovespark-theme.js (retro/dark/beige/slate)
- **Zero innerHTML** — all popup DOM via textContent

### Known Considerations
- Content script runs in IIFE to avoid global scope pollution
- Extension context invalidation caught gracefully in content script
- MutationObserver only triggers scan when video/audio elements are actually added
- Storage listener re-scans page when user re-enables blocking


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
