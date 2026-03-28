# BUGS_AND_ITERATIONS.md — LoveSpark Task Anchor

## v1.0.0 — Initial Build (2026-03-19)

### Decisions
- Banner uses `position: fixed` with `z-index: 2147483647` to stay above all page content
- Content script uses `chrome.storage.onChanged` for real-time updates across all tabs
- Auto-save on task input with 800ms debounce + Enter key for immediate save
- Dismissed state resets when task changes or extension is re-enabled
- Stats track "nudges shown" (each page load where banner appears counts as 1 nudge)

### Known Considerations
- Banner may conflict with sites that also use max z-index (rare)
- `<all_urls>` permission required for content script injection on all pages

## v1.0.4 — Touch Target Fix (2026-03-25)

### Bug Fix
- **Problem:** Close button on injected banner was 28px (below 32px minimum touch target)
- **Root cause:** Initial implementation used 28px for a compact look
- **Fix:** Increased to 32px x 32px in content.css to meet WCAG/LoveSpark UI rules


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
