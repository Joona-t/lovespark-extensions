# Privacy Policy — Are You Cooked?

_Last updated: 2026-10-08_

Are You Cooked? is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- Your chosen theme (`theme`).
- Your highest open-tab count today (`worstToday`) and the date it was last reset.
- How many times you used the "close this tab" mindful button today and in total (`mindfulHelpToday`, `mindfulHelpTotal`) and the date the daily count was last reset.

In addition, one flag recording whether the gentle 5-tab warning has already been shown (`mildWarningDelivered`) is kept in `chrome.storage.session`, which lives only in memory and is cleared when the browser closes.

Only tab **counts** are stored. The extension does not read or store the addresses, titles or contents of your tabs. You can remove everything at any time by uninstalling the extension.

## What is transmitted

**Nothing.** Are You Cooked? makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Fonts are bundled inside the extension. No data ever leaves your device.

The popup footer contains two ordinary links (lovespark.love and ko-fi.com) that open in a new tab only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your theme, today's peak tab count and your mindful-close counters locally, and remembers (for the current browser session only) whether the 5-tab warning was already shown. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit. It counts open tabs, opens its own warning window, and closes a tab only when you press the mindful "close this tab" button, using browser tab APIs that need no extra permission and give it no access to tab addresses or page content.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/are-you-cooked
