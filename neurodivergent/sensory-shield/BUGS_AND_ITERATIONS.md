# Bugs & Iterations

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup/popup.css
**Commit:** 0df05db

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup/popup.html
**Commit:** 72a5296

## : |2026-03-05|||Fix dead code in popup, dynamic version in settings (v1.0.6)

**Problem:** |2026-03-05|||Fix dead code in popup, dynamic version in settings (v1.0.6)
**Details:** Remove orphaned theme code at popup.js lines 36-38 that would error.
Settings page now reads version from manifest dynamically instead of
hardcoding v1.0.0. Bump to v1.0.6.
**Files:** manifest.json,popup/popup.js,settings/settings.html,settings/settings.js
**Commit:** 8888b61

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json
**Commit:** b1362a7

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->
