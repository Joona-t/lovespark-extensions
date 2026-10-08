# Privacy Policy — LoveSpark Fingerprint Shield

_Last updated: 2026-10-08_

LoveSpark Fingerprint Shield is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only a few small values, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `isEnabled` — whether the shield is switched on or off.
- `fingerprintsSpoofedToday` and `fingerprintsSpoofedTotal` — counters of how many fingerprinting calls were given noisy output (shown in the popup and the toolbar badge).
- `lastResetDate` — the date the daily counter was last reset.
- `theme` — your chosen popup theme.

No browsing history, page addresses, page content or fingerprint values are stored. The random seed used to generate noise lives only in the page's memory and is discarded when the page closes. You can remove all stored data at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Fingerprint Shield makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

On the pages you visit, the extension adds tiny random noise to the results of fingerprinting APIs (canvas, WebGL, audio, font measurement, element dimensions, screen, hardware/navigator properties, media devices and timing). This happens entirely inside your browser; it changes what a page's own scripts read back, and sends nothing anywhere. The only messages it passes are internal ones between its own scripts (a spoof count from the page script to the extension's background worker to update the counter).

The popup footer contains two ordinary links (lovespark.love and ko-fi.com) that open only if you click them. The popup's fonts are packaged with the extension and are not downloaded from any server.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the on/off setting, the spoof counters, the daily-reset date and your popup theme locally. |
| Content scripts on `<all_urls>` | `inject.js` runs in each page at load time to add noise to fingerprinting APIs; `bridge.js` relays the on/off state to it and passes spoof counts to the background worker. Neither reads, collects or sends page content. |

The extension requests **no host permissions** beyond the content-script matches above, and no other permissions.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-fingerprint-shield
