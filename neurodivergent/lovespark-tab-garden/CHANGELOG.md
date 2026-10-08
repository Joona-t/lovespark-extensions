# Changelog

All notable changes to LoveSpark Tab Garden will be documented in this file.

## [1.0.27] - 2026-07-08

### Fixed
- Re-synced `lib/lovespark-tokens.css` to canonical shared-lib after the fleet-wide contrast fix (ITER-P2-SYNC-1)
- Built first-ever chrome/firefox store zips via `build-zips.sh` (AMO validator clean)

## [1.0.22] - 2026-04-20

### Added
- Footer with LoveSpark Suite, Ko-fi, and Report a Bug buttons
- Full shared lovespark-shared-lib integration (badge, lifecycle, popup, stats helpers)
- LICENSE and README at repo root
- BUGS_AND_ITERATIONS.md log

### Changed
- Synced popup styles with latest LoveSpark base CSS and themes
- Refreshed footer styling to match suite-wide design tokens

### Fixed
- Restored fleet-wide automation regressions surfaced in 2026-03-28 audit

## [1.0.0] - 2026-03-19

### Added
- Initial release: gamified tab manager for neurodivergent coders
- Auto-archive idle tabs after configurable threshold (15 min – 2 hr)
- Visual garden grid of archived tabs as plants
- Search across archived tabs
- Configurable max garden size and excluded domains
- 4 cozy themes (Retro Pink, Dark, Beige, Slate)
- Local-only storage (chrome.storage.local) — no tracking, no network calls
