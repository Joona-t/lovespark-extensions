# Bugs & Iterations

> Log every bug fix and iteration with date, problem, root cause, and fix.

| Date | Problem | Root Cause | Fix |
|------|---------|------------|-----|


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-10-08: ls-check cleanup (v1.0.28 → v1.0.29)

**Problem:** `ls-check` reported 4 failures: A11Y-DIALOG (no `role="dialog"`/`aria-labelledby`), BRAND-SPARKY (no `mascot.png`), BRAND-GRADIENT (body used hardcoded `#1A0A12`, not `--ls-bg-gradient`), BRAND-LIB-WIRED (`lib/lovespark-base.css` and `lib/lovespark-theme.js` present but never loaded by popup.html).
**Root cause:** The popup was written as a standalone dark UI with hardcoded hex colors before the shared lib/brand rules were enforced; the lib files were synced into `lib/` but never wired in.
**Fix:** Copied `assets/mascot.png` to the extension root and added it to a flex header row (alt text). Wired `lib/lovespark-base.css` (+ tokens via @import) and `lib/lovespark-theme.js` into popup.html, added the "Change Theme" dropdown top-right, and called `LoveSparkTheme.init()` from popup.js with `aria-expanded` kept in sync (click + Escape-to-close). Wrapped the popup in `role="dialog"` with `aria-labelledby="ls-title"` / `aria-describedby="ls-desc"`, marked the 🌉 emoji `aria-hidden`. Replaced every hardcoded color in popup.css with theme tokens; body now uses `var(--ls-bg-gradient)`. Primary button uses `--ls-btn-hover-bg` (white text ≥4.62:1 on all themes per color-decisions.md — `--ls-pink-accent` fails at 3.77:1). Status ok/err no longer rely on green/red alone (both use text color; err adds weight + underline). All element IDs and JS behavior unchanged.
**Files:** popup.html, popup.css, popup.js, manifest.json, mascot.png
