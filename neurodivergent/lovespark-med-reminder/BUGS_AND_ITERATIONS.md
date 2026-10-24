# LoveSpark Med Reminder - Bugs and Iterations

## v1.0.0 (2026-03-26) - Initial Build

### Architecture Decisions
- **storage + alarms** — 15-minute alarm checks for daily reset + badge update. No content scripts.
- **2 default reminders** — Morning meds (08:00), Evening meds (20:00). User sees both, taps to confirm.
- **Badge shows pending count** — Pink badge with number of untaken meds. Green checkmark when all taken.
- **Daily auto-reset** — All reminders reset to untaken at midnight.
- **Tap to take / undo** — Click toggles taken status. Undo available in case of accidental tap.
- **Different from med-tracker** — Med tracker is a full medication management app (Expo). Med reminder is a simple browser badge + one-tap confirmation.
- **Privacy emphasis** — Description explicitly states no health data leaves the browser. Gecko justification mentions health data specifically.
- **CWS keyword** — "ADHD medication reminder" / "med reminder" have search volume in neurodivergent communities.
- **DOM API only** — createElement for med items. Zero innerHTML per KI-011.

### Known Limitations (V1)
- No custom reminder times (fixed at 08:00 and 20:00)
- No custom medication names
- No notification sounds
- Only 2 reminder slots (no arbitrary count)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Initial build | CWS keyword: "medication reminder ADHD" |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
