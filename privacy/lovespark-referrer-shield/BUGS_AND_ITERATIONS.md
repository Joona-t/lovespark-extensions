# Bugs & Iterations

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css
**Commit:** 26fe0fb

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** c24aa60

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** c4146b7

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

**Problem:** `ls-check` reported 5 failures: A11Y-DIALOG (no role="dialog"/aria-labelledby), A11Y-EXPANDED (theme trigger had no aria-expanded), A11Y-INPUT (mode radios + whitelist input had no explicit accessible label), SEC-INNERHTML (`whitelistList.innerHTML = ''`), BRAND-LIB-WIRED (popup.html did not load `lovespark-base.css` / `lovespark-theme.js`).
**Root cause:** The popup predates the shared-lib wiring and a11y checks. It carried an inline copy of the theme logic instead of loading the shared lib, and the ARIA attributes were never added.
**Fix:** Loaded `lib/lovespark-base.css` before popup.css (same order as download-guard, so popup.css still wins) and `lib/lovespark-theme.js`. `applyTheme` now calls `LoveSparkTheme.apply`; the legacy `darkMode` migration is kept. Added role="dialog" + aria-labelledby/aria-describedby to the container, plus aria-expanded/aria-haspopup/aria-label on the theme trigger. JS keeps aria-expanded in sync, and Escape closes the menu. Added role=menu/menuitem, role=radiogroup, and aria-labelledby on each radio pointing at its title. Added aria-label on the whitelist input and on each remove button, aria-live on the status text, and a :focus-visible outline on `.wl-input` (which had outline:none). Replaced `innerHTML = ''` with `replaceChildren()`.
**Files:** popup.html, popup.js, popup.css, manifest.json
