# Bugs & Iterations

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** 25f0693

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 6ece18a

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css,settings.css
**Commit:** 8a158f3

## : |2026-02-26|||Fix blocked page redirect: add web_accessible_resources

**Problem:** |2026-02-26|||Fix blocked page redirect: add web_accessible_resources
**Details:** declarativeNetRequest redirect to blocked.html requires the page
and its dependencies to be listed in web_accessible_resources,
otherwise Chrome shows ERR_BLOCKED_BY_CLIENT instead of the garden.
**Files:** manifest.json
**Commit:** ad6a9c4

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->
