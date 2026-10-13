# LoveSpark Notes — Bugs & Iterations

## ITER-001 — 2026-10-08 — ls-check cleanup (v1.0.42 → v1.0.43)

**Failures (ls-check):** A11Y-DIALOG, A11Y-EXPANDED, A11Y-LABEL, SEC-INNERHTML, SEC-EMPTY-CATCH, BRAND-LIB-WIRED.

**Root cause:** The popup and full app were written with their own copy of the theme
dropdown code and never wired to the shared lib. Icon-only buttons depended on `title`
alone. Lists and markdown preview were rendered with `innerHTML`. Two catch blocks in
the service worker were empty, so failures were dropped without any trace.

**What changed:**
- `popup/popup.html`: loads `../lib/lovespark-base.css` (before `popup.css`, so local styles still win) and `../lib/lovespark-theme.js`. The container now has `role="dialog"`, `aria-labelledby`, and `aria-describedby` (visually hidden description, `.sr-only` added to `popup.css`). Added `aria-expanded`/`aria-haspopup` on the theme and sync triggers, an aria-label on "Open app →", labels on the textarea and title input, and a `role="status"` live region on the save status.
- `popup/popup.js`: `applyTheme` now delegates to `LoveSparkTheme.apply`. The local init stays so the legacy `darkMode` fallback still works. Category pills are built with `createElement` + `replaceChildren` (same DOM, plus `aria-pressed`). A MutationObserver keeps `aria-expanded` in sync with the open state of each menu.
- `app/app.html`, `index.html`: aria-labels on the emoji and × icon buttons, and `aria-expanded` on the theme, template and sync triggers. `app/app.js` uses the same MutationObserver helper to keep them in sync. Row delete, restore and clear-filter buttons got aria-labels.
- `app/app.js`: the 8 `innerHTML =` assignments now go through the new `shared/safe-html.js` `setHTML()`, which parses in an inert DOMParser document and swaps nodes in with `replaceChildren`. The resulting DOM is the same. User data is still escaped with `escapeHtml` as before.
- `background.js`: the two empty catches now `console.debug` the error, with a comment saying why it is ignored (sync is optional; a manual sync error is recorded in the sync state). Control flow is unchanged.
- **Bug fix:** `#syncDropdown` had an inline `style="display:none"`, which overrode `.sync-dropdown.open { display:block }`. The sync account menu could never open in either the popup or the app. The inline style is removed; the CSS already hides the menu by default.

**Remaining warnings (not failures):** A11Y-KI004 opacity, A11Y-LIVE heuristics, MV3-STORAGE-KEY (`darkMode` is a legacy read-only key), QUAL-LICENSE.

**Verifier follow-up (same day):** wiring `lovespark-base.css` into the popup applies `min-height: 32px` to every button. That stretched the 22×22 sync avatar (`.sync-avatar-btn` in `popup/popup.css`) into a 22×32 oval. The avatar is now 32×32, so it stays a circle and meets the 32px touch-target rule. Other popup buttons and inputs also grow to 32px tall. That is intended (the touch-target rule) and the popup still fits.
