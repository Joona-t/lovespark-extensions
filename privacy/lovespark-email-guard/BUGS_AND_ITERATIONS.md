# Bugs & Iterations

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css
**Commit:** 9aa43cf

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** b343840

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** c9928e6

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

## 2026-10-08: ls-check cleanup (v1.0.35)

**Problem:** `ls-check` reported 3 failures: A11Y-DIALOG (popup missing `role="dialog"` + `aria-labelledby`), A11Y-EXPANDED (theme dropdown trigger missing `aria-expanded`), BRAND-LIB-WIRED (popup.html not loading `lovespark-base.css` / `lovespark-theme.js`).
**Root cause:** Popup predates the shared-lib wiring + a11y conventions; the theme dropdown logic was inlined in popup.js and never toggled ARIA state, even though both lib files were already vendored in `lib/`.
**Fix:** popup.html now loads `lib/lovespark-base.css` (before popup.css, so local styles still win) and `lib/lovespark-theme.js` (before popup.js). Container gets `role="dialog"` with `aria-labelledby="popupTitle"` / `aria-describedby="popupDesc"`; trigger gets `aria-expanded`/`aria-haspopup`/`aria-label`, menu `role="menu"`, options `role="menuitem"`. popup.js uses `LoveSparkTheme.apply()` and its own open/close helper keeps `aria-expanded` in sync (plus Escape-to-close); legacy `darkMode` migration preserved. Remaining items are warnings only.
**Files:** popup.html, popup.js, manifest.json
