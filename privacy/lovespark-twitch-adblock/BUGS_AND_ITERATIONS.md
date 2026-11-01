# Bugs & Iterations

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 3e288c2

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** 52a4ba9

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,settings.css
**Commit:** 8df7ae0

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

**Problem:** ls-check reported 3 failures: A11Y-DIALOG (popup.html had no role="dialog"/aria-labelledby), A11Y-EXPANDED (theme dropdown trigger had no aria-expanded), BRAND-LIB-WIRED (popup.html did not load lib/lovespark-base.css or lib/lovespark-theme.js).
**Root cause:** The popup predates the fleet a11y/shared-lib wiring rules; the lib files were already in lib/ but never referenced, and the dropdown JS toggled only a CSS class.
**Fix:** popup-container now has role="dialog" aria-labelledby="popup-title" aria-describedby="status-text" (title span got id="popup-title"). Theme trigger got aria-haspopup/aria-expanded/aria-label; popup.js routes all open/close through setOpen() which keeps aria-expanded in sync. Settings gear got aria-label. lovespark-base.css linked before popup.css (popup.css still wins on overlap) and lovespark-theme.js loaded before popup.js, matching lovespark-adblock. Patch bump 1.0.34 -> 1.0.35. ls-check: 32 pass, 0 fail, 6 warn (pre-existing warnings).
**Files:** popup.html, popup.js, manifest.json
