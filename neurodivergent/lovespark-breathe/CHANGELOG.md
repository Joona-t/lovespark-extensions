# Changelog — LoveSpark Breathe

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.19] — 2026-04-20

### Fixed
- **Sparky not showing in Step Back overlay** — added `web_accessible_resources` to manifest so `mascot.png` loads correctly from content script DOM injection
- **CSP violation on every popup open** — removed broken `@import url('https://fonts.googleapis.com/...')` that was blocked by `font-src 'self'`; popup falls back to system fonts gracefully
- **logSession async race** — background now awaits `logSession()` before responding so popup log refreshes with correct counts

### Improved
- **MutationObserver debounced (250ms)** — comment dimmer observer reduced from ~60 querySelectorAll calls/sec to ≤4/sec during active scrolling
- **Dead lib scripts removed** — `lovespark-stats.js`, `lovespark-badge.js`, `lovespark-popup.js`, `lovespark-lifecycle.js` were loaded in popup context but never called; removed to reduce parse overhead

---

## [1.0.17] — 2026-04-16

### Added
- CWS listing JSON for centralized marketing pipeline
- Chrome Web Store screenshot placeholders

### Changed
- Bumped manifest version for CWS submission

## [1.0.16] — 2026-04

### Added
- Initial `cws-listing.json` with store description, keywords, and category

## [1.0.x] — 2026-03

### Added
- Footer with LoveSpark Suite, Ko-fi, and Report a Bug buttons
- `BUGS_AND_ITERATIONS.md` log for fleet-wide automation regression (2026-03-28)

### Fixed
- Replaced undefined `--ls-btn-bg` with `--ls-pink-accent` so toggle colors render correctly
- Restored disabled-state opacity after fleet-sync regression
- Re-injected footer buttons after shared-lib sync bug

## [1.0.0] — 2026-03

### Added
- Initial public release
- Breathing exercises: Box Breathing (4-4-4-4), 4-7-8, Physiological Sigh
- Animated visual breathing guide with cycle tracking
- Keyboard shortcut `Alt+B` to start breathing exercise
- 5-4-3-2-1 grounding technique with tap-to-advance flow
- Comment dimmer for Twitter/X, Reddit, YouTube, Facebook, Instagram
- Manual and always-on toggle modes for dimmer
- Daily session log with rotating encouragement messages
- 4 themes: Retro Pink, Dark, Beige, Slate
- Full keyboard navigation and screen reader support
- `prefers-reduced-motion` support on all animations
- Local-only storage — no tracking, no accounts, no ads
