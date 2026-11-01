# Bugs & Iterations

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 4cf121a

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** c38a58d

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css
**Commit:** ec9bf76

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

## 2026-10-08 — ls-check cleanup (v1.0.35)
- **Failures:** A11Y-DIALOG, A11Y-EXPANDED, A11Y-LABEL (💾 Download button), A11Y-LANG (offscreen.html), BRAND-LIB-WIRED (lovespark-base.css + lovespark-theme.js not loaded).
- **Root cause:** popup predates the shared-lib wiring and ARIA conventions; theme logic was an inline copy of lovespark-theme.js; offscreen.html was written without `lang`.
- **Fix:** popup.html loads `lib/lovespark-base.css` (before popup.css so local styles still win; settings gear resized 28 to 32px so the base.css 32px min-height keeps it circular) and `lib/lovespark-theme.js`; popup.js `applyTheme` now delegates to `LoveSparkTheme.apply` (local init kept for the darkMode migration). Added `role="dialog"` + `aria-labelledby`/`aria-describedby` on body, `aria-expanded` on the theme trigger and settings gear (kept in sync by popup.js), aria-labels on the Download/Settings/Theme buttons, `aria-hidden` on the decorative header emoji, `lang="en"` on offscreen.html. No permission changes.
