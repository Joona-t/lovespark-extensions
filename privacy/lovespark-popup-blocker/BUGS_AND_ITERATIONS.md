# Bugs & Iterations

## : |2026-02-20|||fix(youtube): accurate counter + dedup guard for ad skip reporting

**Problem:** |2026-02-20|||fix(youtube): accurate counter + dedup guard for ad skip reporting
**Details:** - Rename skipAd→attemptSkip, onAdSkipped→reportSkip for clarity
- Fix polling fallback: was calling skipAd() but never reportSkip(),
  so ads caught by the interval were silently skipped without counting
- Add lastSkipReportedAt dedup guard (4s window) — MutationObserver
  and polling could both fire for the same ad state, causing double-counts
**Files:** content-youtube.js
**Commit:** 25a4e1d

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css
**Commit:** 5899688

## : |2026-02-25|||fix: remove tabs/webNavigation/feedback permissions, drop link-breaking webNav listener

**Problem:** |2026-02-25|||fix: remove tabs/webNavigation/feedback permissions, drop link-breaking webNav listener
**Details:** Strip three unnecessary permissions (tabs, webNavigation,
declarativeNetRequestFeedback) for Chrome Web Store compliance.
Delete the webNavigation.onCreatedNavigationTarget popup-blocking
path that was closing user-initiated tabs. Popup blocking now
relies solely on the content-script window.open override.
**Files:** background.js,content-general.js,manifest.json
**Commit:** 5a802f2

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** b965c5b

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** f39af46

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

## 2026-10-08: ls-check cleanup (v1.0.39)

**Problem:** `ls-check` reported 3 failures: A11Y-DIALOG (popup.html missing role="dialog" + aria-labelledby), A11Y-EXPANDED (theme dropdown trigger missing aria-expanded), BRAND-LIB-WIRED (popup.html not loading shared lib `lovespark-base.css` / `lovespark-theme.js`).
**Root cause:** Popup was built with an inline theme dropdown in popup.js/popup.css before the shared-lib wiring and dialog/aria-expanded checks were enforced; the lib files were already vendored in `lib/` but never linked.
**Fix:** `<body>` now has `role="dialog"` with `aria-labelledby="popup-title"` / `aria-describedby="popup-desc"` (ids added to the title/subtitle). Theme trigger gets `aria-haspopup`, `aria-controls`, `aria-expanded="false"`; popup.js keeps it in sync via a `setOpen()` helper on toggle / option pick / outside click. Linked `lib/lovespark-base.css` before popup.css (so local styles still win; adds shared focus-visible rings + 32px touch targets) and `lib/lovespark-theme.js` (no auto-init, so the existing popup.js theme logic incl. legacy `darkMode` migration is unchanged). Patch version 1.0.38 → 1.0.39.
**Files:** popup.html, popup.js, manifest.json
