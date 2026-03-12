# LoveSpark — YouTube Ad Comfort Mode

**This extension does not block ads; it only adjusts volume/overlay during ads.**

LoveSpark Comfort Mode improves ad moments on YouTube without ad-blocking or evasion behavior.
It detects likely ad playback, applies local comfort effects, then restores your prior playback audio state.

## Features

- Ad-aware comfort behavior on `https://www.youtube.com/*`
- Debounced ad state machine: `UNKNOWN -> CONTENT -> AD`
- Auto-mute or low-volume mode during ads
- Optional subtle LoveSpark dim overlay + `Ad playing` badge (with countdown when available)
- Exact restore of previous mute/volume after ads
- Per-tab Comfort Mode toggle via commands hotkey
- Settings persisted with `chrome.storage.sync`

## Compliance Notes

- No network interception or request modification
- No DOM ad removal
- No skip/spoof/stealth/evasion logic
- Local UI and audio adjustments only

## Install (Unpacked)

1. Open Chrome and go to `chrome://extensions`.
2. Enable **Developer mode**.
3. Click **Load unpacked**.
4. Select this folder:
   the `lovespark-youtube-ad-comfort-mode` folder
5. (Optional) Open extension options and tune comfort settings.
6. (Optional) Set/change the hotkey at `chrome://extensions/shortcuts` for command `toggle-comfort-mode`.

## File Structure

- `manifest.json` - MV3 definition, permissions, command, content/background wiring
- `background.js` - service worker command handling and per-tab toggle state
- `content.js` - ad inference state machine, mute/volume logic, overlay/badge UI
- `options.html` + `options.css` + `options.js` - settings UI and persistence
- `icons/` - placeholder icons to replace with production assets

## Icon Placeholders

Current `icons/icon16.png`, `icons/icon48.png`, and `icons/icon128.png` are placeholders.
Replace them with final LoveSpark artwork before publishing.
