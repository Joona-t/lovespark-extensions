# Bugs & Iterations

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css
**Commit:** 00f3964

## : |2026-03-06|||fix: storage listeners, pause tracking, decay race, and SPA guard

**Problem:** |2026-03-06|||fix: storage listeners, pause tracking, decay race, and SPA guard
**Details:** Storage onChanged listeners filtered for 'sync' but all writes use
chrome.storage.local — settings, snooze, mode changes, and live stat
updates were silently ignored. Also fixes bumpPause gated on sparkles,
decay loop race condition, missing shouldBeActive guard in reinit,
stale popup state, and adds www/non-www match patterns.
**Files:** content.js,manifest.json,popup.js
**Commit:** 38edd00

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 47de4f1

## : |2026-03-01|||Fix: standardize chrome.* API, deep merge sites, init guard

**Problem:** |2026-03-01|||Fix: standardize chrome.* API, deep merge sites, init guard
**Details:** - Replace all browser.* calls with chrome.* in content.js
- Remove polyfill stub (browser-polyfill.min.js) and manifest ref
- Deep merge sites in getState() so new sites survive storage updates
- Add didInit guard to prevent double history.pushState patching
- Bump MAX_SCROLL_DELTA_MS 200→500 (scroll wheel fix from prior)
**Files:** content.js,lib/browser-polyfill.min.js,manifest.json,popup.js
**Commit:** 9b81222

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** ea458ab

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->
