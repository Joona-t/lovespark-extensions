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
