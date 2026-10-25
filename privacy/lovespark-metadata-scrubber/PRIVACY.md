# Privacy Policy — LoveSpark Metadata Scrubber

_Last updated: 2026-10-08_

LoveSpark Metadata Scrubber is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only your preferences and simple counters, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `settings` — output format (original / PNG / JPEG), JPEG quality, and whether to add a `_clean` filename suffix
- `theme` — your chosen popup theme
- `scrubsToday`, `scrubsTotal`, `lastResetDate` — how many images you have scrubbed today and in total

The images you scrub are **not** stored by the extension. They are re-encoded in memory on your device and handed to your browser's download, or offered as a download in the popup. You can remove all stored data at any time by uninstalling the extension.

## What is transmitted

**Nothing is sent from your device.** No analytics, no tracking, no ads, no accounts, and no remote code.

The only network request the extension makes is a download, never an upload: when you right-click an image and choose "Scrub Metadata & Download Clean", the extension fetches that image from the address your page already loaded it from (the same request your browser makes to display it) so it can strip the metadata locally. No information about you, your browsing, or the image is sent anywhere. Images you drop, paste or browse into the popup are processed entirely on your device with no network request at all.

## Permissions

| Permission | Why it is needed |
|---|---|
| `contextMenus` | Adds the "Scrub Metadata & Download Clean" item to the right-click menu on images. |
| `offscreen` | Opens a hidden extension page with a canvas so a right-clicked image can be re-encoded (which removes EXIF, GPS and other metadata) from the background worker. |
| `storage` | Saves your output settings, theme and scrub counters locally so they are still there next time. |
| `downloads` | Saves the cleaned copy of a right-clicked image to your Downloads folder. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-metadata-scrubber
