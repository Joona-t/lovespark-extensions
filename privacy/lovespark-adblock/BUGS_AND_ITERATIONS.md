# Bugs & Iterations

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css,settings.css
**Commit:** 07dfe7d

## : |2026-03-10|||fix: counter stuck at 0 in packed extensions (CWS Red Potassium)

**Problem:** |2026-03-10|||fix: counter stuck at 0 in packed extensions (CWS Red Potassium)
**Details:** Root cause: pollMatchedRules() read result.matchedRules but the Chrome
API returns result.rulesMatchedInfo. Property was always undefined, so
writeStats() was never called. Invisible in dev because onRuleMatchedDebug
bypasses polling in unpacked mode.
**Files:** background.js,lib/lovespark-base.css,lib/lovespark-footer.css,manifest.json,settings.js
**Commit:** 97961ec

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** b5e959a

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css,settings.css
**Commit:** f429679

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->
