# Neurodivergent Reader by LoveSpark

Improve reading focus with dyslexia fonts, reading rulers, paragraph focus, and distraction removal. Built for ADHD, dyslexia & autism.

Free, open-source, privacy-first. No data collection. No ads. Ever.

## Features

- **Reading Font** — Replace page fonts with OpenDyslexic, Lexend, Atkinson Hyperlegible, or System Default. Configurable size, line height, letter spacing, and word spacing.
- **Reading Ruler** — Transparent ruler follows your cursor/touch. Adjustable gap height, shade opacity, and color. Touch support + keyboard control.
- **Paragraph Focus** — Dims everything except the paragraph you're reading. Click to lock, j/k to navigate between paragraphs.
- **Distraction Removal** — Independently toggle hiding of sidebars, ads, cookie banners, and floating overlays. CSS-first, instantly reversible.
- **Per-site disable** — Turn off the extension on specific domains.

## Load Unpacked Extension

1. Clone or download this repository
2. Generate icons: `python generate_icons.py` (requires Pillow: `pip install Pillow`)
3. Open Chrome and navigate to `chrome://extensions`
4. Enable "Developer mode" (top right toggle)
5. Click "Load unpacked" and select the `neurodivergent-reader/` folder
6. Click the extension icon on any webpage to activate

## How It Works

1. Click the extension icon to open the popup
2. Toggle the master switch to enable/disable
3. Enable individual features (font, ruler, focus, distractions)
4. Click the gear icon to open the full settings page with sliders
5. Use keyboard shortcuts while features are active:
   - **Shift + Arrow Up/Down** — Move reading ruler (Shift required so page scroll still works)
   - **j/k** — Navigate between paragraphs (focus mode)
   - **Escape** — Unlock/disable current feature
   - **Click** — Lock paragraph focus (click outside to unlock)

## Architecture

This extension uses an internal agent-based architecture with explicit roles:

| Agent | Location | Responsibility |
|-------|----------|----------------|
| SettingsAgent | Service Worker | Settings schema, defaults, migrations |
| OrchestratorAgent | Service Worker | Message routing, badge updates |
| InjectionAgent | Service Worker | chrome.scripting injection |
| ContentOrchestrator | Content Script | Agent lifecycle, storage.onChanged |
| StyleAgent | Content Script | CSS vars, @font-face, data attributes |
| RulerAgent | Content Script | Reading ruler (Shadow DOM, rAF+lerp) |
| FocusAgent | Content Script | Paragraph focus (box-shadow vmax) |
| DistractionAgent | Content Script | CSS hiding, MutationObserver |
| TelemetryAgent | Content Script | Local perf counters (console only) |

Agents communicate via a local MessageBus (EventTarget). Settings flow through `chrome.storage.onChanged`.

See `docs/DECISIONS.md` for architectural tradeoffs.

## What Works

- All four features (font, ruler, focus, distractions) work independently and together
- Settings persist across browser restarts via chrome.storage.sync
- Per-site disable list
- Full settings page with live-updating sliders
- Shadow DOM isolates ruler from page CSS
- All effects cleanly removed when disabled

## Known Limitations

- Content scripts only inject after clicking the extension icon (activeTab permission). No auto-injection on page load.
- Google Docs, PDFs, and chrome:// pages cannot be modified (browser restriction).
- Icon fonts may occasionally be affected by font override despite exclusion selectors.
- Reading ruler and paragraph focus may conflict visually on some layouts if both enabled simultaneously.

## Permissions

- `activeTab` — Temporary access to the current tab on user click
- `scripting` — Inject content scripts and CSS
- `storage` — Save user preferences

No host permissions. No data collection. Zero install-time permission warnings.

## License

MIT License. OpenDyslexic font is licensed under SIL Open Font License v1.1 (see `fonts/OFL.txt`).

Part of the [LoveSpark Suite](https://github.com/Joona-t).
