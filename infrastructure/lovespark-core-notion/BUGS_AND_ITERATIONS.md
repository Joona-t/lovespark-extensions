# Bugs & Iterations — lovespark-core-notion

## 2026-04-22 — v0.1.27 unblock strict_fail

**Problem:** `ls-check --strict` failing with A11Y-KI004 (low opacity) and BRAND-THEME (no theme support). Extension stalled at health 76-78.

**Root causes:**
- Disabled-state opacities (0.65) and placeholder opacity (0.75) below 0.85 threshold
- `lovespark-theme.js` not included — BRAND-THEME linter couldn't detect theme wiring
- Adding theme.js introduced A11Y-LIVE hit on `#themeLabel` (dynamic target without aria-live)

**Fixes:**
- Bumped `.toggle-switch:disabled`, `.module-row.disabled` to opacity 0.85; placeholder to 0.9
- Copied `lovespark-theme.js` from canonical shared lib into `lib/`; referenced in `options.html`; `LoveSparkTheme.init()` called in `options.js`
- Added hidden `<span id="themeLabel" aria-live="polite">` so theme-name updates are announced
- Bumped manifest to v0.1.27

## 2026-04-21 — v0.1.25 ship-readiness pass

**Problem:** strict `ls-check` failing with 7 issues blocking CWS submission.

**Root causes:**
- Low opacity values (0.4/0.45/0.6) failing AA contrast in beige theme
- Dynamic DOM targets (`#cursorSettings`, `#dataStatus`) lacked `aria-live`
- `innerHTML = ""` used to clear exclusion list (SEC-INNERHTML)
- 9 shared-lib files copied in but never referenced — dead weight in the zip
- Missing `README.md`, `LICENSE`, `BUGS_AND_ITERATIONS.md`

**Fixes:**
- Raised disabled-state opacities to 0.65, placeholder to 0.75
- Added `aria-live="polite"` to `#cursorSettings`, `#dataStatus`, and `#exclusionList`; `role="status"` on data status
- Replaced `innerHTML = ""` with `replaceChildren()`
- Deleted 9 unused lib files; kept `browser-polyfill.min.js` (referenced by manifest + now by options.html)
- Wired `browser-polyfill.min.js` into `dashboard/options.html` — fixes latent Chrome runtime bug where `browser.storage.local` was undefined
- Added `aria-label` to the "add domain" `+` button
- Generated README / LICENSE / this file
- Bumped manifest version 0.1.24 → 0.1.25
