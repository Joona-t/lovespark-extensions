# Changelog

## 1.0.35 (2026-10-07)

### Fixed
- Store zips no longer embed the previous store zips (BUG-001: zip-in-zip recursion inflated 1.0.34 zips to 10.2 MB each). Added `.zipignore` with `*.zip`; rebuilt via canonical `build-zips.sh` (1.2 MB, 83 files, AMO-valid).

## 1.0.34 (2026-07-08)

### Fixed
- Re-synced `lib/lovespark-tokens.css` to canonical shared-lib after the fleet-wide contrast fix (ITER-P2-SYNC-1)
- Rebuilt chrome/firefox store zips via `build-zips.sh` (AMO validator clean)
- Replaced README.md stub with full listing mirroring CWS-LISTING.md

## 1.0.0 (2026-03-25)

### Added
- Initial release
- Habit tracking with daily check-ins
- Visual garden grid — plants grow as streaks build
- Streak counter and total completions stats
- Daily reset via background alarms
- 4 LoveSpark themes (Retro, Dark, Beige, Slate)
- Full keyboard navigation and screen reader support
- Local-only storage — no data collection
- Chrome and Firefox support (Manifest V3)
