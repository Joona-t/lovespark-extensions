# LoveSpark Notes 💖

A calm, beautiful notes app for neurodivergent coders. Part of the [LoveSpark Suite](https://github.com/Joona-t).

## Features

- **Quick Capture Popup** — CMD+Shift+N opens popup, cursor auto-focused, zero clicks to start writing
- **Full App** — Three-pane layout with sidebar, editor, and version history drawer
- **4 Categories** — Idea, Project, Someday, Daily — with free-form tags
- **Daily Brain Dump** — CMD+D creates/opens today's daily note with date header
- **Markdown Preview** — CMD+P toggles live preview (headings, bold, italic, code, lists, blockquotes)
- **Version History** — Automatic snapshots every 2 minutes, last 20 versions per note, one-click restore
- **Distraction-Free Mode** — CMD+Shift+F hides everything except title + content
- **Accessibility Fonts** — DM Mono (default), Atkinson Hyperlegible, OpenDyslexic — bundled locally
- **Pin/Favourite** — Pin up to 10 notes to the top of the sidebar
- **Export/Import** — Export as .md or full JSON backup, import from JSON
- **Cross-Device Sync** — Note metadata syncs via chrome.storage.sync (extension only)
- **Zero Data Collection** — Everything stays local. No ads, no tracking, no accounts.

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| CMD+N | New note |
| CMD+D | Daily brain dump |
| CMD+P | Toggle markdown preview |
| CMD+Shift+F | Distraction-free mode |
| CMD+E | Export current note |
| CMD+S | Force save |
| CMD+Enter (popup) | Save and open full app |
| Escape | Exit distraction-free / close version drawer |

## Storage Architecture

**Chrome Extension (hybrid sync):**
- `chrome.storage.sync` — Note index (metadata) + preferences (~200 bytes/note, supports ~500 notes)
- `chrome.storage.local` — Note content + version history (unlimited with `unlimitedStorage`)

**Standalone Web App:**
- `localStorage` — All data stored locally in the browser

## Permissions

| Permission | Justification |
|---|---|
| `storage` | chrome.storage.sync + chrome.storage.local for notes |
| `unlimitedStorage` | Version history can exceed 10MB default |
| `alarms` | 2-minute version snapshot timer |

## Font Options

All fonts bundled locally — never loaded from CDN. Applied to note content only (UI stays DM Mono).

- **DM Mono** — Standard monospace coding font (default)
- **Atkinson Hyperlegible** — High-legibility sans-serif, designed by Braille Institute
- **OpenDyslexic** — Dyslexia-friendly weighted font

## Development

```bash
# Generate icons (requires Python + Pillow)
python generate_icons.py

# Load in Chrome
# 1. Go to chrome://extensions
# 2. Enable Developer Mode
# 3. Click "Load unpacked" and select this folder

# Load in Firefox
# 1. Go to about:debugging#/runtime/this-firefox
# 2. Click "Load Temporary Add-on"
# 3. Select manifest.json
```

## Standalone Web App

Open `index.html` in any browser — no extension required. Same full-app UI with localStorage backend.

## License

MIT — Free forever. No ads, no data collection, no tracking.

Made with 💖 by [Joona](https://github.com/Joona-t)
