# Privacy Policy — LoveSpark — YouTube Ad Comfort Mode

_Last updated: 2026-10-08_

LoveSpark — YouTube Ad Comfort Mode is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only your Comfort Mode settings, saved under a single key (`loveSparkSettings`): whether Comfort Mode is on by default, auto-mute on/off, low-volume mode on/off and its percentage, and the dim overlay on/off. These are kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can remove them at any time by uninstalling the extension.

The per-tab on/off state of Comfort Mode is held only in memory while the browser's background worker is running; it is never written to storage. Ad detection happens entirely on the YouTube page in your browser: the extension looks for YouTube's own ad markers in the page and temporarily mutes, lowers the volume of, or dims the video, then restores your previous volume when the ad ends. Nothing about the videos or ads you see is recorded.

## What is transmitted

**Nothing.** LoveSpark — YouTube Ad Comfort Mode makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Fonts are packaged with the extension, not loaded from the internet. No data ever leaves your device.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your Comfort Mode settings locally so they are still there next time. |
| `scripting` | When you press the toggle shortcut (Alt+Shift+L) and the content script is not yet running in the YouTube tab, the extension injects its own packaged `content.js` into that tab once. |
| `activeTab` | Grants temporary access to the current tab when you use the keyboard shortcut. The YouTube host permission below already covers this, so it is supplementary. |
| `tabs` | Finds the active tab and checks that its address is on `https://www.youtube.com/` before toggling Comfort Mode, and clears the in-memory per-tab state when a tab is closed. |
| `https://www.youtube.com/*` (host permission) | Lets the extension run its content script on YouTube pages and inject it on demand for the toggle shortcut. |

The content script runs **only on `https://www.youtube.com/*`**. It reads YouTube's player state locally to detect ads and adjusts the video's mute, volume, and an on-page dim overlay. It cannot read or change any other website.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-youtube-ad-comfort-mode
