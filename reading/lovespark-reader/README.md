# LoveSpark Reader

Turn the internet pink. A browser extension that recolors popular sites
(YouTube, Reddit, Twitter/X, GitHub, Google) into three soft, low-glare
color modes, built for neurodivergent readers who find the default
high-contrast web fatiguing.

Part of the [LoveSpark suite](https://lovespark.love) — free, open-source,
privacy-first browser tools. No ads, no accounts, no data collection.

## Modes

- **Sakura** — soft blush tones
- **Hot Pink** — bold bubblegum
- **Starlight** — dreamy iridescent

Pick a mode from the popup; it applies instantly via injected CSS filters
scoped per-site (`filters/youtube.css`, `filters/reddit.css`,
`filters/twitter.css`, `filters/github.css`, `filters/google.css`,
`filters/base-filter.css`).

## How it works

- `manifest.json` — MV3, `storage` permission only, content scripts run at
  `document_start` on `http(s)://*/*`.
- `background.js` — service worker; manages extension lifecycle state.
- `content.js` — applies the selected filter CSS to the active page.
- `popup.html` / `popup.js` / `popup.css` — mode picker UI, theme dropdown
  (retro/dark/beige/slate), and settings.
- `lib/` — shared LoveSpark extension library (theme system, footer,
  lifecycle helpers), synced from `lovespark-shared-lib`.

## Install (dev)

1. `chrome://extensions` → enable Developer Mode → **Load unpacked** →
   select this folder.
2. Or load into Firefox via `about:debugging` → **This Firefox** → **Load
   Temporary Add-on** → select `manifest.json`.

## Privacy

Zero data collection. All settings live in `chrome.storage.local` on your
own machine. No network requests, no analytics, no third-party scripts.

## License

MIT.
