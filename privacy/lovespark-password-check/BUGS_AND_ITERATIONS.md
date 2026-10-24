# BUGS_AND_ITERATIONS — LoveSpark Password Check

## v1.0.0 (2026-03-25)
- **Initial release.** Local password strength meter with real-time feedback.
- Checks length, character variety, common patterns. No data stored or sent.
- Show/hide toggle for password visibility.
- Feedback list built with DOM API (createElement), zero innerHTML.
- Uses shared LoveSpark lib (themes, stats, badge, footer).
- WCAG AA focus indicators, prefers-reduced-motion support.
- Password input auto-focused on popup open.

---
*Log every bug fix and iteration below with date, problem, root cause, and fix.*


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-10-24 — Chromium fleet audit (1.0.3 → 1.0.4)

- Replace a nonexistent footer appendTo method with the supported HTML renderer.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
