# BUGS_AND_ITERATIONS — LoveSpark Fidget Clicker

## v1.0.0 (2026-03-25)

### Initial Release
- **Features:** Big click button with ripple + float animations, 3 modes (single/double/hold), session counter, daily/total stats
- **Tech:** Manifest V3, storage-only permissions, DOM API (zero innerHTML), 4 themes, WCAG AA
- **Compliance:** prefers-reduced-motion, aria-live, role=dialog, role=radiogroup, focus-visible indicators
- **No known bugs at initial release**

## v1.0.1 (2026-10-08) — ls-check cleanup

- **Failure:** `A11Y-KI001` — `--ls-pink-accent` used as background behind white text on `.click-btn` and `.mode-btn.active` (fails 4.5:1 in all themes).
- **Root cause:** Pre-KI-001 color choice; pink-accent is a decorative token, not a text background.
- **Fix:** Swapped those backgrounds (and the active border) to `--ls-pink-deep` per `color-decisions.md`. Bumped version 1.0.0 → 1.0.1. No behavior change.
