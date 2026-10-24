# BUGS_AND_ITERATIONS — LoveSpark Focus Highlight

## v1.0.0 (2026-03-25)
- **Initial release.** Spotlight reading mode that dims everything except the hovered paragraph.
- Content script uses clip-path polygon to punch a transparent hole in a fixed overlay.
- Dim intensity adjustable via popup slider (10-80%).
- Zero innerHTML — all DOM built via createElement/appendChild.
- prefers-reduced-motion respected (disables overlay transition).
- WCAG AA focus indicators on all interactive elements.
- Shared lib integrated (stats, badge, theme, lifecycle).

### Known Limitations
- clip-path polygon does not produce rounded corners on the highlight hole (CSS limitation).
- Overlay does not track during scroll without mouse movement (by design — avoids janky repositioning).


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
