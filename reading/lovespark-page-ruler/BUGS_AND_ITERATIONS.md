# BUGS_AND_ITERATIONS — LoveSpark Page Ruler

## v1.0.0 (2026-03-25)
- **Initial release.** Horizontal reading ruler follows cursor to help dyslexic readers track lines.
- Height adjustable (10-100px), opacity adjustable (5-50%), color customizable via color picker.
- Live preview in popup shows current ruler appearance.
- Ruler uses pointer-events: none so it never blocks page interaction.
- Zero innerHTML — all DOM built via createElement/appendChild.
- prefers-reduced-motion respected (disables ruler position transition).
- WCAG AA focus indicators on all interactive elements.
- Shared lib integrated (stats, badge, theme, lifecycle).

### Known Limitations
- Ruler position only updates on mousemove — does not track during keyboard-only scrolling.
- Color picker input may look different across browsers (native browser widget).


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-10-24 — Chromium fleet audit (1.0.2 → 1.0.3)

- Load the shared footer before popup initialization.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
