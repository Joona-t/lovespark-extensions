# Bugs & Iterations

## : |2026-03-02|||v1.2.0: Two-tier warning escalation + bug fixes 🔥

**Problem:** |2026-03-02|||v1.2.0: Two-tier warning escalation + bug fixes 🔥
**Details:** - 5 tabs: mild popup warning (auto-dismiss 5s, single dismiss button)
- 10+ tabs: strict popup (forced choice: Ignore or Be Mindful)
- "Be Mindful" closes the offending tab via chrome.tabs.remove
- Rotating copy for titles, dismiss buttons, and mindful buttons
- Deeper pink gradient + Sparky shake for strict mode
**Files:** .gitignore,background.js,manifest.json,popup.css,popup.html
**Commit:** 438c5d4

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** 920879c

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css
**Commit:** ec5c740

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** f1dc842

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->
