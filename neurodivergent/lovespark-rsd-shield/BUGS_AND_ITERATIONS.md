# LoveSpark RSD Shield - Bugs and Iterations

## v1.0.0 (2026-03-25) - Initial Build

### Architecture Decisions
- **storage only** — No content scripts, no alarms. Popup IS the intervention.
- **15 RSD-specific affirmations** — Written specifically for rejection sensitivity dysphoria, not generic positivity. Addresses the neurological nature of RSD, validates the pain, provides reality-testing.
- **20-minute countdown** — "This feeling will pass" timer counts down from 20:00. Based on research that acute RSD episodes typically peak and begin fading within 15-20 minutes.
- **Breathing circle** — 8-second CSS animation (inhale/hold/exhale/hold). Calms the nervous system during acute emotional pain.
- **Shield metaphor** — Every popup open = one "shield used". Framing: you're protecting yourself, not being weak.
- **CWS keyword** — "rejection sensitivity dysphoria ADHD" / "RSD ADHD" are high-search in neurodivergent communities. No CWS extension specifically addresses this.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- No custom affirmations
- No RSD trigger logging/patterns
- No "text a friend" integration
- Timer resets on popup close (by design — each open is a fresh shield)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-25 | Initial build | CWS keyword: "rejection sensitivity" |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
