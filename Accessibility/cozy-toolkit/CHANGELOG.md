# Changelog

All notable changes to Cozy: ADHD & Dyslexia Accessibility Toolkit.

## [1.1.23] - 2026-04-13
- Fleet maintenance pass: screenshots, CWS readiness

## [1.1.0] - 2026-03-08
- Fix hover/focus/component contrast across all 4 themes
- Add --ls-focus-ring and --ls-btn-hover-bg per-theme variables
- Toggle checked state passes 3:1 on beige
- Slider thumb uses focus-ring color for component contrast

## [1.0.9] - 2026-03-08
- Bundle UI fonts locally (DM Mono, Lora, Press Start 2P) — remove Google Fonts CDN
- Fix WCAG 2.1 AA contrast ratios across all 4 themes
- Increase touch targets to 32px minimum
- Respect prefers-reduced-motion for message rotation
- Add ARIA labels to preset buttons, TTS FAB, disabled badges

## [1.0.0] - 2026-03-08
- Initial release: Cozy Accessibility Toolkit
- 4 presets: Dyslexia, ADHD, Sensory, Low Vision
- Font & Typography with OpenDyslexic, Lexend, Atkinson Hyperlegible
- Bionic Reading mode with 3 intensity levels
- Reading Ruler with configurable height, opacity, color
- Color Tint overlay with brightness, contrast, temperature controls
- Color blindness filters (protanopia, deuteranopia, tritanopia)
- Reading Mode with max-width and background color
- Paragraph Focus with dim level and lock-on-click
- Sensory Controls: freeze animations, hide GIFs, reduce motion, pause autoplay
- Hide Distractions: sidebars, ads, cookie banners, floating elements, comments, social
- Text-to-Speech with speed and voice selection
- Writing Comfort: font and spacing in forms
- Large Cursor option
- Per-site settings and disable list
- 4 themes: Retro Pink, Dark, Beige, Slate
