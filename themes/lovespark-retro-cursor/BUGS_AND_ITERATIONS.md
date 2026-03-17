# Bugs & Iterations

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 1001acd

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** 3daec09

## : |2026-02-23|||Fix excessive permissions — strip to storage-only for CWS resubmission

**Problem:** |2026-02-23|||Fix excessive permissions — strip to storage-only for CWS resubmission
**Details:** Remove scripting, tabs, and host_permissions. Static content_scripts
handles injection; chrome.storage.onChanged handles settings propagation.
Delete redundant ensureScriptAndBroadcast() and onMessage listener.
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
**Files:** background.js,content_script.js,manifest.json
**Commit:** a5daacf

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json
**Commit:** b958a4d

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->
