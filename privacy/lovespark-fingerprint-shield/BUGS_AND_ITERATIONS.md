# Bugs & Iterations

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** 05acaf4

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 35635ab

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css
**Commit:** bb9c76b

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

## 2026-10-08: ls-check cleanup (v1.0.37)

**Problem:** ls-check reported 5 failures: A11Y-DIALOG (no role="dialog"/aria-labelledby), A11Y-EXPANDED (theme trigger had no aria-expanded), SEC-EMPTY-CATCH (background.js broadcast `.catch(function() {})`), BRAND-LIB-WIRED (popup.html did not load lovespark-base.css / lovespark-theme.js), PERM-MISSING ('tabs' for chrome.tabs.query/sendMessage).
**Root cause:** The popup came before the shared-lib wiring and a11y conventions; the empty catch was intentional but had no comment.
**Fix:** Added role="dialog" + aria-labelledby="popupTitle" + aria-describedby="statusText" on the container. Added aria-expanded/aria-haspopup on the theme trigger, kept in sync by a `setOpen()` helper in popup.js. Made statusText `role="status" aria-live="polite"` and the emoji icon aria-hidden. Wired lib/lovespark-base.css (before popup.css, so popup.css still wins) and lib/lovespark-theme.js (exposes LoveSparkTheme, no auto-init, so it does not bind twice). Added `min-height: 24px` to .toggle-switch because base.css adds `button{min-height:32px}`, and the 24px switch would otherwise stretch (see the 2026-03-28 base.css regression entry above). Commented the intentional catch: tabs without the content script reject sendMessage.
**Not changed:** PERM-MISSING is a false positive. `chrome.tabs.query({})` with no url/title filter and `chrome.tabs.sendMessage` both work without the "tabs" permission, so no permission was added.
**Files:** popup.html, popup.js, popup.css, background.js, manifest.json
