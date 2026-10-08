# Privacy Policy — LoveSpark Link Saver

_Last updated: 2026-10-08_

LoveSpark Link Saver is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

- **Your saved links.** When you click "Save This Page", the extension reads the active tab's URL and title and stores them with a random ID and the time you saved it (up to 100 links, key `savedLinks`).
- **Save counters.** How many links you saved today and in total, plus the date of the last daily reset (`linkSaverToday`, `linkSaverTotal`, `lastResetDate`).
- **Preferences.** The on/off state (`isEnabled`) and your chosen theme (`theme`).

Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. Nothing is stored in `chrome.storage.sync`. You can delete individual links from the popup, or remove everything by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Link Saver makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Fonts are bundled with the extension. No data ever leaves your device.

The popup contains links you can choose to click (your saved links, plus footer links to lovespark.love and the author's Ko-fi page). These only open in a new tab when you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your links, save counters and settings locally so they are still there next time. |
| `activeTab` | Lets "Save This Page" read the URL and title of the tab you are on, only when you open the popup. It grants no access to other tabs or to page content. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit. It only looks up the URL and title of the current tab at the moment you click "Save This Page".

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-link-saver
