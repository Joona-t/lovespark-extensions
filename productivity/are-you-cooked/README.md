# Are You Cooked? 🔥

A Chrome extension that counts your open tabs and roasts you accordingly. Part of the [LoveSpark Suite](https://github.com/Joona-t) — retro pink productivity tools for a calmer internet.

## Features

- **Live tab count** with badge on the extension icon
- **7-tier panic system** — Sparky (the mascot) escalates from calm to full chaos as your tab count rises
- **Mild warning** at 5 tabs — a gentle popup that auto-dismisses in 5 seconds
- **Strict warning** at 10+ tabs — fires on every new tab with two options:
  - "Ignore" — dismiss and keep your tab
  - "Be mindful" — closes the tab that triggered the warning
- **Zero permissions** — does not read your URLs, titles, or any browsing data
- **No data collection** — everything stays local, nothing is transmitted

## Privacy

This extension does not collect, store, or transmit any user data. Tab counts are calculated in memory and never saved or sent anywhere. Zero permissions required.

## Install

### Chrome Web Store
Coming soon.

### Manual (Developer Mode)
1. Clone this repo
2. Open `chrome://extensions`
3. Enable "Developer mode"
4. Click "Load unpacked" and select this folder

### Firefox
1. Open `about:debugging#/runtime/this-firefox`
2. Click "Load Temporary Add-on"
3. Select `manifest.json`

## Tech Stack

- Vanilla JavaScript, no frameworks
- Manifest V3 service worker
- LoveSpark design system (retro pink gradient + frosted glass)
- Zero dependencies

## License

MIT — see [LICENSE](LICENSE)

## Credits

Built by [Joona](https://github.com/Joona-t) as part of the LoveSpark Suite 💕
