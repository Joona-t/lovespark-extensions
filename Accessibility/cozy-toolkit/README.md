# Cozy Accessibility by LoveSpark

**The internet, made cozy. Free, forever.**

A comprehensive, free, open-source accessibility extension for neurodivergent users. Combines dyslexia-friendly typography, sensory management, focus tools, bionic reading, text-to-speech, and more — all in one extension.

## Features

- **Typography** — OpenDyslexic, Lexend, Atkinson Hyperlegible fonts with full size/spacing controls
- **Color Tint** — Adjustable overlay with brightness, contrast, and temperature controls
- **Color Blindness** — Protanopia, deuteranopia, tritanopia simulation filters
- **Bionic Reading** — Bold first syllables for faster reading
- **Reading Ruler** — Follow-cursor guide strip with adjustable height and opacity
- **Paragraph Focus** — Dim surrounding content, j/k navigation, click-to-lock
- **Sensory Controls** — Freeze animations, hide GIFs, reduce motion, pause autoplay, large cursor
- **Distraction Hiding** — Remove sidebars, ads, cookie banners, floating elements, comments, social buttons
- **Text-to-Speech** — Select text and hear it read aloud with adjustable speed
- **Writing Comfort** — Dyslexia-friendly fonts in form fields
- **Reading Mode** — Clean, distraction-free article view
- **One-Click Presets** — Dyslexia, ADHD, Sensory, and Low Vision profiles

## Privacy

- No data collection, ever
- No remote requests (all fonts bundled locally)
- No tracking, analytics, or telemetry sent anywhere
- All settings stored locally in your browser

## Permissions

| Permission | Why it's needed |
|------------|----------------|
| `activeTab` | Apply accessibility features to the current page when you click the extension |
| `scripting` | Inject content scripts that modify page fonts, colors, and layout |
| `storage` | Save your settings locally in the browser |
| `<all_urls>` (host) | Apply accessibility features on any website you visit |

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `j` / `k` | Move paragraph focus forward / backward (when Paragraph Focus is enabled) |
| `Tab` | Navigate popup controls |
| `Arrow keys` | Switch between popup tabs |
| `Escape` | Close theme dropdown |

## Install

### Chrome
1. Download or clone this repository
2. Open `chrome://extensions`
3. Enable Developer Mode
4. Click "Load unpacked" and select this folder

### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json`

## Generate Icons

```bash
pip install Pillow
python generate_icons.py
```

## Troubleshooting

- **Extension not working on a page?** Check if the site is in your Disabled Sites list (Settings page). Also, some browser-internal pages (`chrome://`, `about:`) cannot be modified by extensions.
- **Fonts look wrong?** Try toggling the Reading Font off and back on. If using a preset, re-click it to reapply.
- **Text-to-Speech not working?** Make sure TTS is enabled in the popup, then select text on the page. The "Read aloud" button appears near your selection.
- **Settings not saving?** Check that the extension has storage permission enabled in `chrome://extensions`.

## License

MIT License — free forever.

Made with love by [Joona](https://joona-t.github.io) as part of the LoveSpark Suite.
