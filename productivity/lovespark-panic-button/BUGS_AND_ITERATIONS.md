# LoveSpark Panic Button - Bugs and Iterations

## v1.0.0 (2026-03-23) - Initial Build

### Architecture Decisions
- **storage only** — No content scripts, no host permissions. The popup IS the safe space.
- **Popup = safe space** — Opening the extension immediately shows calming visuals, breathing circle, and grounding message. No configuration screen, no settings to navigate. Instant relief.
- **8-second breathing cycle** — CSS-animated circle: inhale 4s, hold 4s, exhale 4s, hold 2s. Text label cycles through phases via setTimeout.
- **12 calming messages** — Rotated randomly. "Another message" button fades and swaps.
- **Keyboard shortcut** — Alt+Shift+P via commands API. Opens popup from any page.
- **Auto-logs escape** — Every popup open counts as one escape in stats. No manual action needed.
- **Minimal stats** — Inline "X escapes today · Y total" instead of full stats card. Keeps focus on calm, not numbers.
- **prefers-reduced-motion** — Disables breathing animation.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- No sound/ambient audio
- No option to close current tab on escape
- No customizable messages
- No session duration tracking (how long user stayed in safe space)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-23 | Initial build | Expansion Agent Cycle 11 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
