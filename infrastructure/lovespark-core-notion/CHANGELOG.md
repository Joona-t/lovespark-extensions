# Changelog

All notable changes to lovespark-core-notion are documented here.

## [0.1.32] - 2026-04-25

### Fixed
- Auto-overnight maintenance: shared lib re-sync, manifest hygiene
- Bundled fonts locally, added CSP, security + perf + reliability hardening (swarm audit pass)
- Replaced broken footer with aesthetic `ls-footer` component
- Theme cycling button replaced with accessible dropdown menu
- Production audit pass: gecko block, mascot, permission audit, `storage.local` migration

### Added
- BUGS_AND_ITERATIONS.md, LICENSE, README.md
- i18n localization support (55 languages)

### Notes
- All 39 fleet-audit checks pass
- All 80 contrast checks pass across 4 themes
- Shared lib in sync with canonical `Extensions/infrastructure/lovespark-shared-lib/`
