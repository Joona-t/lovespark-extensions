# Dark Mode — Are You Cooked? v2.1.0

## Context
Add dark mode (LoveSpark Noir) toggle to the popup. The spec is in CLAUDE.md lines 210-314. Applied via `data-theme="dark"` on `<html>`. Stored in `chrome.storage.local` as `darkMode: boolean`. Default: light mode.

## Scope
- Popup: dark mode toggle + dark CSS variables
- Warning page: inherit dark mode preference
- Storage: `darkMode` boolean in `chrome.storage.local` (needs `storage` permission)

## Plan

### 1. manifest.json
- Add `"storage"` to permissions array (currently `[]`)
- Bump version to `2.1.0`

### 2. popup.html
- Add a dark mode toggle button in the header (sun/moon icon)

### 3. popup.css
- Add `:root[data-theme="dark"]` block with LoveSpark Noir variables from CLAUDE.md
- Add dark-aware state colors (fine/spicy/cooked/911 on dark backgrounds)
- Add starfield `body::before` texture for dark mode

### 4. popup.js
- Read `darkMode` from `chrome.storage.local` on load
- Apply `data-theme="dark"` to `<html>`
- Toggle handler: flip theme, save to storage

### 5. warning.css
- Add `:root[data-theme="dark"]` block with same Noir variables
- Dark starfield texture

### 6. warning.js
- Read `darkMode` from `chrome.storage.local` on load
- Apply `data-theme="dark"` to `<html>`

## Files Modified
| File | Action |
|------|--------|
| manifest.json | EDIT — add `storage` permission, bump to 2.1.0 |
| popup.html | EDIT — add toggle button |
| popup.css | EDIT — add dark mode variables + state overrides |
| popup.js | EDIT — add theme init + toggle logic |
| warning.css | EDIT — add dark mode variables |
| warning.js | EDIT — add theme init on load |
