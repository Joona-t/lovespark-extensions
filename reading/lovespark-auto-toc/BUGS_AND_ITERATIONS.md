# BUGS_AND_ITERATIONS — LoveSpark Auto TOC

## v1.0.0 (2026-03-25)
- **Initial release.** Generates a floating sidebar TOC from h1-h6 headings on any page.
- Click-to-jump with smooth scrolling and temporary heading flash.
- Sidebar position configurable (left/right) via popup dropdown.
- Close button on sidebar to dismiss.
- Zero innerHTML — all DOM built via createElement/appendChild.
- prefers-reduced-motion respected (disables sidebar transitions, uses instant scroll).
- WCAG AA focus indicators on all interactive elements.
- Shared lib integrated (stats, badge, theme, lifecycle).

### Known Limitations
- Long heading text truncated to 50 characters in sidebar (with tooltip showing full text).
- TOC does not auto-update if page dynamically adds headings after generation (would need MutationObserver — deferred).
- Sidebar styling is fixed (white background) and does not adapt to page dark mode.


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
