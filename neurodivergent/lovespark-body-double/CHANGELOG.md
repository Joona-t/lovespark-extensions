# Changelog

## [1.0.37] - 2026-10-07 - Theme dropdown wiring (BUG-002)
### Fixed
- Theme dropdown never opened: `popup.html` used `#themeDropdownTrigger`/`#themeDropdownMenu`, but the shared `lib/lovespark-theme.js` binds `#themeToggle`/`#themeMenu`. Renamed the ids to match the shared lib, so theme switching works again.
- `#themeLabel` carried `class="sr-only"`, but no stylesheet defines `.sr-only`, so the theme name leaked as stray visible text beside the trigger. The label now sits inside the trigger as its visible text ("Theme: Retro Pink"), as in the sibling extensions. The stale static "retro" text and the aria-live announcement on load are gone.

## [1.0.36] - 2026-10-07 - PR #1 verification fixes
### Fixed
- `popup.html` linked `lib/lovespark-fonts.css`, which was never in the repo, so the popup fell back to generic `monospace`/`cursive` instead of DM Mono / Press Start 2P. Synced canonical `lovespark-fonts.css` + `lib/fonts/` (51 woff2) per fleet convention.
- Removed the committed store zips: both contained the previous v1.0.32 zips nested inside (which in turn nested older zips), plus marketing docs. Zips are build output (`scripts/build-zips.sh` → `lovespark zips/`), now gitignored.

## [1.0.35] - 2026-07-08 - Fleet token re-sync (P2-sync-3)
### Fixed
- Version bump only — shared-lib tokens were already synced to canonical (KI-002/003/004 contrast fix) in a prior commit; this entry closes the QUAL-CHANGELOG-DRIFT gap and rebuilds the store zips against the current version.

## [1.0.2] - 2026-03-31
### Fixed
- Version bump for CWS submission prep

## [1.0.1] - 2026-03-31
### Fixed
- Minor polish and quality checks

## [1.0.0] - 2026-03-31
### Added
- Virtual body doubling companion (Sparky sits with you while you work)
- 4 focus session presets: Sprint (15m), Flow (25m), Deep (45m), Marathon (60m)
- Animated timer ring with live countdown
- Random encouragement messages from Sparky during sessions
- Session tracking: minutes today, sessions today, total minutes
- 30-day session log with automatic pruning
- Daily stat reset via alarms API
- Badge showing today's focus minutes
- 4 themes: Retro Pink, Dark Noir, Warm Beige, Cool Slate
- Full WCAG 2.1 AA accessibility (ARIA labels, keyboard nav, reduced motion)
- Privacy-first: all data stays in local browser storage
- No ads, no tracking, always free
