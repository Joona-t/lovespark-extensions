# LoveSpark Retro Cursor

A retro-pink cursor pack browser extension (Manifest V3) with a cute LoveSpark aesthetic.

## Features
- Toggle cursors ON/OFF from popup
- Choose cursor packs:
  - Retro Pink
  - Sakura Peach
  - Starlight Purple
- Lightweight CSS injection (no DOM crawling, no mutation observers)
- Syncs settings with `chrome.storage.sync`
- Live updates open tabs after toggle/pack changes

## Install Locally (Chrome / Edge)
1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable Developer mode
3. Click **Load unpacked**
4. Select this folder

## Packaging
Zip this folder with `manifest.json` at the zip root for store submission.

## Firefox Notes
For AMO upload/signing, add `browser_specific_settings.gecko` in `manifest.json`.
