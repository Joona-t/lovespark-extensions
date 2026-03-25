# Changelog

All notable changes to LoveSpark Popup Fortress will be documented in this file.

## [1.0.8] - 2026-03-21

### Added
- Five-layer popup and redirect blocking (window.open, location.assign/replace, synthetic anchor clicks, meta refresh, declarativeNetRequest)
- Gesture-aware detection — allows user-initiated navigation, blocks programmatic popups
- Daily and lifetime popup counter with badge display
- CSS injection to hide overlay-style popup elements
- Four themes: Retro Pink, Dark, Beige, Slate
- Full i18n support (57 locales)
- LoveSpark shared library integration (stats, themes, popup, footer)
- CWS store listing

### Privacy
- Zero data collection — all stats stored locally via chrome.storage.local
- No remote code execution
- No analytics or telemetry
