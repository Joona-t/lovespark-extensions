# LoveSpark Hyperfocus Guard - Bugs and Iterations

## v1.0.0 (2026-03-25) - Initial Build

### Architecture Decisions
- **storage + alarms + tabs** — Tracks active tab hostname via tabs.onActivated/onUpdated. 1-minute alarm checks time-on-site. Badge shows elapsed minutes.
- **Configurable threshold** — 15/30/45/60/90/120 min via dropdown. Default 30 min.
- **Gentle alert** — Pink "!" badge + soft question in popup: "Is this still what you want to be doing?" No blocking, no shame.
- **Dismiss + reset** — "Got it, reset" button resets timer for current site. Allows conscious continuation.
- **tabs permission justified** — Required to detect active tab URL changes for time-on-site tracking. Documented in gecko justification.
- **Different from gentle-timer** — Gentle-timer shows how long on a site passively. Hyperfocus guard actively alerts at a configurable threshold.
- **CWS keyword** — "hyperfocus" is high-search in ADHD communities.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- No per-site threshold customization
- No history of hyperfocus sessions
- No allowlist (sites to ignore)
- No sound alert on threshold

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-25 | Initial build | CWS keyword: "hyperfocus" |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-10-24 — Chromium fleet audit (1.0.2 → 1.0.3)

- Package the local font stylesheet and the font files it references so the UI renders without missing assets or remote font requests.
- Wire the shared theme menu to this popup’s dropdown IDs, persist selections, and support Escape with accurate expanded state.
- Insert the shared footer HTML into its mount instead of discarding the renderer’s return value.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
