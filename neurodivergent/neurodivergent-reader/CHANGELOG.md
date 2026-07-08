# Changelog — Neurodivergent Reader

All notable changes to Neurodivergent Reader by LoveSpark.

## [1.0.34] - 2026-07-09

### Fixed
- Lexend and Atkinson Hyperlegible font overrides silently falling back on real pages:
  added `fonts/*.woff2` to `web_accessible_resources` (only `fonts/*.woff` was declared)
  and set `use_dynamic_url: false` — Chrome 130+ blocks static `chrome.runtime.getURL()`
  access from page context when `use_dynamic_url` is true, which broke ALL injected
  `@font-face` loads (including OpenDyslexic)

## [1.0.13] - 2026-04-01

### Fixed
- Strict ls-check compliance (all 39 checks passing)
- Added CWS listing and changelog for store submission

## [1.0.12] - 2026-03-31

### Improved
- Health score progression: 57 → 77 → 79 → 80 → 95
- Accessibility audit fixes (contrast, ARIA, focus indicators)

## [1.0.0] - 2026-03-28

### Added
- Reading Font overlay (OpenDyslexic, Lexend, Atkinson Hyperlegible, System)
- Configurable font size, line height, letter spacing, word spacing
- Reading Ruler with adjustable height, opacity, color, and smoothing
- Paragraph Focus mode with click-to-lock and j/k navigation
- Distraction Removal (sidebars, ads, cookie banners, floating overlays)
- Per-site disable list
- Settings page with full slider controls
- Keyboard shortcuts (Shift+Arrows, j/k, Escape)
- Touch support for reading ruler
- 4 themes (Retro Pink, Dark, Beige, Slate)
- Full keyboard navigation and screen reader support
- Service worker with agent-based architecture
- Content script agent system (Style, Ruler, Focus, Distraction, Telemetry agents)
