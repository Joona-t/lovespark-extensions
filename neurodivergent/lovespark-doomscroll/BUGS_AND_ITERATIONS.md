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


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
