# Changelog

All notable changes to LoveSpark YT Shield are documented here.
This project adheres to [Semantic Versioning](https://semver.org/).

## [1.0.27] - 2026-04-17
### Changed
- Synced shared library (`lovespark-badge.js`, `lovespark-tokens.css`, and related `lib/` files) with canonical source.
- Removed bundled `lib/browser-polyfill.min.js` (now uses `chrome.*` directly).
- Added `BUGS_AND_ITERATIONS.md` and `LICENSE` at repo root.
- Background and content script hardening.

## [1.0.2] - 2026-03-28
### Added
- Footer with LoveSpark Suite, Ko-fi, and "Report a Bug" buttons in the popup.

## [1.0.1] - 2026-03-25
### Added
- Initial release of **LoveSpark YT Shield** — three-layer YouTube ad neutralizer.
- Layer 1: `declarativeNetRequest` static rules for known ad-serving URLs.
- Layer 2: Page-context `fetch` / `XMLHttpRequest` interception for ad-related API responses.
- Layer 3: Content script `MutationObserver` fallback for ad DOM containers.
- Daily stats counter with local-only storage.
- Popup with toggle + 4 themes (Retro Pink, Dark, Beige, Slate).
