# LoveSpark Desk Stretch - Bugs and Iterations

## v1.0.0 (2026-03-26) - Initial Build

### Architecture Decisions
- **storage only** — No alarms, no content scripts. On-demand stretches.
- **12 desk-friendly exercises** — Neck Roll, Shoulder Shrug, Wrist Circles, Seated Twist, Standing Stretch, Eye Rest (20-20-20), Chest Opener, Ankle Circles, Deep Breath, Finger Spread, Hip Opener, Wall Push-Up.
- **Random without repeat** — Never shows the same stretch twice in a row.
- **Done/Skip flow** — "Done!" logs the stretch to stats + shows next. "Skip" shows next without logging.
- **Different from stretch-reminder** — Stretch-reminder is alarm-based (pushes reminders). Desk Stretch is on-demand (pull when you want to move).
- **CWS keyword** — "desk exercise" / "movement break" are searched by ADHD office workers.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- No stretch illustrations (emoji only)
- No timer per stretch (duration shown as text)
- No favorite stretches
- No custom stretch additions

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Initial build | CWS keyword: "desk exercise" |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-10-24 — Chromium fleet audit (1.0.1 → 1.0.2)

- Package the local font stylesheet and the font files it references so the UI renders without missing assets or remote font requests.
- Wire the shared theme menu to this popup’s dropdown IDs, persist selections, and support Escape with accurate expanded state.
- Insert the shared footer HTML into its mount instead of discarding the renderer’s return value.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
