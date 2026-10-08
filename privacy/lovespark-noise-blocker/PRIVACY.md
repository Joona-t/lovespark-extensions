# Privacy Policy — LoveSpark Noise Blocker

_Last updated: 2026-10-08_

LoveSpark Noise Blocker is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only a few settings and counters, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `isEnabled` — whether autoplay blocking is on or paused.
- `noiseBlockedToday`, `noiseBlockedTotal` and `lastResetDate` — the number of autoplaying audio/video elements paused today and in total, and the date used to reset the daily count.
- `theme` — your chosen popup theme.

No browsing history, page addresses, page content or media information is stored. You can remove everything at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Noise Blocker makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Its fonts and styles are packaged inside the extension. The content script only sends a local count message ("N media elements paused") to the extension's own background worker; this never leaves your device. No data ever leaves your device.

The popup footer contains three ordinary links (lovespark.love, ko-fi.com/joonat, and a "Report a Bug" `mailto:` link that opens your own email app). Each one does something only if you click it.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the on/off setting, the blocked-media counters and your theme locally. |
| `activeTab` | Declared but not currently used by any feature. |
| `scripting` | Declared but not currently used by any feature. |
| Content script on `<all_urls>` | Runs `content.js` on the pages you visit so it can find `<video>` and `<audio>` elements, pause them and remove their `autoplay` attribute. It does not read, store or send page content. |

The extension requests **no host permissions** beyond the content script match above.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-noise-blocker
