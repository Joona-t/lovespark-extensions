# Changelog

## [1.0.33] — 2026-04-19 — Ship Day

### Fixed (blockers before Chrome Web Store submission)
- **blocked.html now includes Sparky mascot** as a decorative top-left icon in the info panel (CLAUDE.md Rule 3 compliance).
- **`scripts/build-zips.sh` rewritten** to stage extensions via `rsync --exclude` instead of relying on `zip -x` (which had inconsistent recursive-exclusion behavior). The zip now correctly omits `_cws/`, `BUGS_AND_ITERATIONS.md`, `generate_*.py`, `.claude/`, `__pycache__/`, `node_modules/`, `*.md.bak`, `*.log`, and `.git/`. Drop in zip size: 4.1 MB → 1.3 MB.

### Added
- CWS listing assets generated via headless-Chrome screenshot pipeline (`_cws/*.html` + `_cws/mock.js`):
  - 3× 1280×800 screenshots (blocked hero, popup side-by-side, settings with feature sidebar)
  - 440×280 small promo tile
  - 1400×560 marquee promo tile

### Notes
- Known non-blockers tracked for follow-up: i18n coverage gap across 54 non-English locales, hardcoded English strings in HTML, ~1.1 MB of unreferenced files in `lib/`. None affect functionality or CWS approval.

---

## [1.0.32] and earlier
See `BUGS_AND_ITERATIONS.md` for detailed history prior to ship day.
