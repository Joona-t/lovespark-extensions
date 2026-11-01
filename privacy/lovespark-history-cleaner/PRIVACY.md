# Privacy Policy — LoveSpark History Cleaner

_Last updated: 2026-10-08_

LoveSpark History Cleaner is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only small usage counters and your preferences: how many cleanups you ran today and in total (`clearedToday`, `clearedTotal`), the date of the last daily reset (`lastResetDate`), whether the extension is enabled (`isEnabled`), and your chosen theme (`theme`). Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can remove it at any time by uninstalling the extension.

The extension does **not** store any of your browsing history, URLs or page titles. To show the "items found" preview, it asks the browser how many history entries fall inside the selected time range and displays only that number; the entries themselves are not saved or shown.

## What is transmitted

**Nothing.** LoveSpark History Cleaner makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Its fonts are bundled inside the extension. No data ever leaves your device.

The popup footer contains two ordinary links (lovespark.love and a Ko-fi page) that open in a new tab only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your cleanup counters, enabled/paused state and theme locally so they are still there next time. |
| `history` | Counts how many history entries exist in the selected range (last hour, day or week) to show the "items found" preview before you clear. Only the count is used. |
| `browsingData` | Deletes your browsing history for the selected time range when you click "Clear History". |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-history-cleaner
