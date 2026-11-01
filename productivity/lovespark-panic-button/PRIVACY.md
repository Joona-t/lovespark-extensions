# Privacy Policy — LoveSpark Panic Button

_Last updated: 2026-10-08_

LoveSpark Panic Button is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

A small amount of data, kept only in your browser's own extension storage (`chrome.storage.local`) on your device:

- Your escape counters: how many times you opened the safe space today and in total (`escapesToday`, `escapesTotal`), plus the date of the last daily reset (`lastResetDate`).
- A badge on/off flag (`isEnabled`), set to on when the extension is installed. The popup has no switch to change it.
- Your chosen theme (`theme`).

The breathing guide and grounding messages are built into the extension and are not stored. Nothing else is saved. You can remove all of it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Panic Button makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer has links to lovespark.love and ko-fi.com. They open only if you click them, as ordinary web pages in a new tab, and the extension sends no data with them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your escape counters, the badge on/off flag and your theme locally so they are still there next time. |

The extension also registers a keyboard shortcut (Alt+Shift+P) that opens the safe-space popup. This uses the browser's `commands` feature and needs no extra permission.

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-panic-button
