# LoveSpark Retro Cursor

A retro-pink cursor pack browser extension (Manifest V3) with a cute LoveSpark aesthetic.

## Features
- Toggle cursors ON/OFF from popup
- Popup themes: Seoul Y2K (서울, default), Gingham Sticker (깅엄), Holo Mochi (모찌), Neon Usagi (네온), Bubblegum
- 18 Y2K Korean cursor packs (9 themes × 2 variants):
    - **Emoji** subcategory — symmetric kawaii icon as the cursor
    - **Pointer** subcategory — traditional arrow with theme decoration
    - Themes: Honey Bunny (꿀토끼), Cyworld Dotti (싸이월드), Coquette Ribbon (리본), Strawberry Milk (딸기우유), Glossy Pearl, Bubble Boba (버블티), Phone Charm (폰꽂이), Heart Locket (하트 로켓), Cyber Butterfly (나비)
- Lightweight CSS injection (no DOM crawling, no mutation observers)
- Settings stored locally in `chrome.storage.local` (nothing leaves the browser)
- Live updates open tabs after toggle/pack changes, including tabs open across an extension update

## Where the cursor shows
Custom cursors are applied by CSS injected into web pages, so they appear on every
regular `http(s)://` page, including iframes (and on local `file://` pages if you enable
"Allow access to file URLs" on `chrome://extensions`). No extension can script Chrome's
own pages, so the cursor stays default on the **New Tab page**, `chrome://` pages, the
Chrome Web Store, the built-in PDF viewer and other extensions' pages. Tabs that were
already open get the cursor automatically on install (v1.1.38+).

If cursors show on only *some* sites, check the extension's site access: Chrome →
`chrome://extensions` → Details → "Site access" → **On all sites**. Firefox → Add-ons →
the extension → Permissions → allow access for all sites.

## Regenerating cursors
- Y2K SVG packs: `python3 gen_cursors.py` (or `--only honey-bunny`); one file per pack in
  `packs/`, shared drawing helpers in `cursor_lib.py`.
- Review at native size on white / pink / dark: `python3 render_pack.py [pack-id ...] --out sheet.png`
  (headless Chrome). Judge the small 32px rows, not the big tiles.

## Install Locally (Chrome / Edge)
1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable Developer mode
3. Click **Load unpacked**
4. Select this folder

## Packaging
Zip this folder with `manifest.json` at the zip root for store submission.

## Firefox Notes
For AMO upload/signing, add `browser_specific_settings.gecko` in `manifest.json`.
