# Privacy Policy — LoveSpark Tab Counter

_This extension is archived and no longer maintained._

_Last updated: 2026-10-08_

LoveSpark Tab Counter is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only your settings: whether the counter is on or off (`isEnabled`), your tab warning threshold (`tabThreshold`), and your chosen popup theme (`theme`). Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. Tab counts are calculated on the fly and are never saved. You can remove the stored settings at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Tab Counter makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your on/off setting, warning threshold and theme locally so they are still there next time. |
| `tabs` | Counts your open tabs (`chrome.tabs.query`) for the toolbar badge and popup, and listens for tabs being opened, closed or moved between windows to keep the count current. Only the number of tabs is used; tab titles and addresses are not read, stored or sent anywhere. |

The popup also shows a tab count per window using `chrome.windows.getAll`, which needs no extra permission.

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/_archive/lovespark-tab-counter
