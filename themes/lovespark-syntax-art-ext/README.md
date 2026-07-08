# LoveSpark Syntax Art

Right-click any image on the web and convert it into syntax-highlighted
code art — turns photos, screenshots, or art into a stylized "code block"
render, picked from 4 palettes (Dracula, Monokai, LoveSpark, GitHub Light).

Part of the [LoveSpark suite](https://lovespark.love) — free, open-source,
privacy-first browser tools. No ads, no accounts, no data collection.

## How it works

1. Right-click any image → **"Convert to Syntax Art"** (context menu, added
   by `background.js`).
2. The image is decoded and converted off-screen (`offscreen.html` /
   `offscreen.js`, MV3 offscreen document API — no visible tab needed) into
   a glyph-density render using the `pipeline/` module (theming, ASCII/code
   mapping).
3. Result opens in `result.html` for viewing/saving.

## Settings (popup)

- **Theme** — Dracula / Monokai / LoveSpark / GitHub Light code palette
- **Width** — output character width (60–200 chars)
- **Font size** — 6–12px
- Conversion stats (today / total) tracked locally

## File layout

- `manifest.json` — MV3, `contextMenus` + `offscreen` + `storage`
  permissions only
- `background.js` — context menu registration + message routing
- `offscreen.html` / `offscreen.js` — headless conversion via the Offscreen
  Documents API
- `pipeline/` — theming + syntax-art conversion logic
- `popup.html` / `popup.js` / `popup.css` — settings UI, theme dropdown
- `result.html` / `result.js` — conversion output viewer
- `lib/` — shared LoveSpark extension library, synced from
  `lovespark-shared-lib`

## Install (dev)

1. `chrome://extensions` → enable Developer Mode → **Load unpacked** →
   select this folder.
2. Or load into Firefox via `about:debugging` → **This Firefox** → **Load
   Temporary Add-on** → select `manifest.json`.

## Privacy

Zero data collection. Image conversion happens entirely locally in the
offscreen document; nothing is uploaded. Settings/stats live in
`chrome.storage.local` on your own machine.

## License

MIT.
