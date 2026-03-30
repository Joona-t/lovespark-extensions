# Bugs & Iterations — LoveSpark Cookie Annihilator

## 2026-03-30 — CWS Ship Prep

- **Problem:** Legacy `darkMode` storage key read but never set (MV3 storage key mismatch)
- **Root cause:** Old migration path from pre-theme-system era left in popup.js
- **Fix:** Removed `darkMode` from storage.get call; theme system handles this via `theme` key

- **Problem:** 6 unused shared lib files bundled in `lib/`
- **Root cause:** `sync-shared-lib.sh` copies all files; this extension only uses fonts, base CSS, theme JS, and footer
- **Fix:** Removed unused files (popup.js, badge.js, lifecycle.js, polyfill, stats.js, tokens.css)
