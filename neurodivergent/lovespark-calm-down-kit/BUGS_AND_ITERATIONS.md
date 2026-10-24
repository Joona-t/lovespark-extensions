# LoveSpark Calm Down Kit - Bugs and Iterations

## v1.0.0 (2026-03-26) - Initial Build

### Architecture Decisions
- **storage only** — No content scripts, no alarms. Popup is the intervention.
- **Intensity-matched techniques** — Slider 1-10 maps to 3 levels: High (8-10) = crisis tools (ice dive, TIPP, intense exercise, paced breathing). Medium (4-7) = grounding (5-4-3-2-1, body scan, opposite action, self-soothing). Low (1-3) = reflection (journal, gratitude, mindful observation, kind self-talk).
- **DBT/CBT-inspired** — Techniques adapted from Dialectical Behavior Therapy and Cognitive Behavioral Therapy for ADHD emotional dysregulation.
- **Different from panic-button** — Panic button is instant escape to calm space. Calm Down Kit is guided: rate intensity first, get matched technique.
- **Different from sensory-break** — Sensory break has 3 fixed tools (breathe/ground/calm). Calm Down Kit has 12 techniques matched to intensity level.
- **Different from RSD Shield** — RSD Shield targets rejection sensitivity specifically. Calm Down Kit handles all emotional dysregulation.
- **CWS keyword** — "emotional dysregulation ADHD" is high-search.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- No technique favorites/history
- No custom techniques
- No integration with mood tracking
- Intensity slider is subjective (no biometric input)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Initial build | CWS keyword: "emotional dysregulation" |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-10-24 — Chromium fleet audit (1.0.4 → 1.0.5)

- Wire the shared theme menu to this popup’s dropdown IDs, persist selections, and support Escape with accurate expanded state.
- Insert the shared footer HTML into its mount instead of discarding the renderer’s return value.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
