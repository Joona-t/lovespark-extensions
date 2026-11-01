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

## 2026-10-08: ls-check cleanup (v1.0.3)

**Problem:** ls-check failed BRAND-LIB-WIRED (popup.html did not load `lib/lovespark-base.css` / `lib/lovespark-theme.js`) and QUAL-PAID-API (OpenAI API call in background.js).
**Root cause:** Both shared-lib files were already vendored in `lib/` but never referenced from popup.html; the popup carries its own theme dropdown code in popup.js.
**Fix:** Linked `lib/lovespark-base.css` before `popup.css` (so the extension's own styles still win) and loaded `lib/lovespark-theme.js` before `popup.js`. The theme lib does not auto-init, so popup.js's existing dropdown (with aria-expanded sync) stays the single owner of the behavior — no double listeners. Bumped 1.0.2 → 1.0.3.
**Left open:** QUAL-PAID-API — the OpenAI call violates rule #10 and needs a research/plan pass (local CLI bridge via sparkd) rather than a cleanup edit.
