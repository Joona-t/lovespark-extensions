# LoveSpark Retro Cursor

A retro-pink cursor pack browser extension (Manifest V3) with a cute LoveSpark aesthetic.

## Features
- Toggle cursors ON/OFF from popup
- 21 cursor packs across 2 categories:
  - **OG** (3 packs): Retro Pink, Sakura Peach, Starlight Purple
  - **Y2K Korean** (9 themes × 2 variants = 18 packs):
    - **Emoji** subcategory — symmetric kawaii icon as the cursor
    - **Pointer** subcategory — traditional arrow with theme decoration
    - Themes: Honey Bunny (꿀토끼), Cyworld Dotti (싸이월드), Coquette Ribbon (리본), Strawberry Milk (딸기우유), Glossy Pearl, Bubble Boba (버블티), Phone Charm (폰꽂이), Heart Locket (하트 로켓), Cyber Butterfly (나비)
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
