# Bugs & Iterations — LoveSpark Popup Fortress

## 2026-03-29 — Strict audit fixes (overnight automation)

### A11Y-KI004: Low opacity on hover text
- **Problem:** `.ls-suite-btn:hover` used `opacity: 0.75`, failing contrast in beige theme
- **Root cause:** Opacity-based hover reduces contrast below WCAG threshold on light backgrounds
- **Fix:** Replaced `opacity: 0.75` with `text-decoration: underline` for hover feedback

### MV3-STORAGE-KEY: darkMode read without set
- **Problem:** `popup.js` read `darkMode` key from storage but never wrote it — stale migration path
- **Root cause:** Legacy dark mode toggle was replaced by theme system but read was never cleaned up
- **Fix:** Removed `darkMode` from storage.get call; theme system handles dark mode via theme key

### BRAND-DEAD-LIB: Unused shared lib files
- **Problem:** 6 lib files synced but not referenced in popup.html
- **Root cause:** `sync-shared-lib.sh` copies all files; this extension only uses base, fonts, footer, theme
- **Fix:** Removed unused files (lovespark-popup.js, lovespark-badge.js, lovespark-lifecycle.js, browser-polyfill.min.js, lovespark-stats.js, lovespark-tokens.css)

### QUAL-LICENSE: Missing LICENSE
- **Problem:** No LICENSE file present
- **Fix:** Added MIT LICENSE

### QUAL-BUGS-LOG: Missing BUGS_AND_ITERATIONS.md
- **Problem:** Required by CLAUDE.md but not present
- **Fix:** Created this file
