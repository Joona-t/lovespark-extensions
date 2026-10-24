# Privacy Policy — LoveSpark Download Guard

_Last updated: 2026-10-08_

LoveSpark Download Guard is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- Whether the guard is turned on (`isEnabled`).
- Counters of how many suspicious downloads were caught today and in total (`blockedToday`, `blockedTotal`), plus the date of the last daily reset (`lastResetDate`).
- While a suspicious download is paused and waiting for your decision: that one download's ID, file name, download URL, file extension and the time it was paused (`pendingDownload`). This entry is deleted as soon as you choose "Allow download" or "Cancel".
- Your chosen popup theme (`theme`).

You can remove all of it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Download Guard makes no network requests of its own. File names and URLs of downloads are checked locally against a built-in list of file extensions and are never sent anywhere. No analytics, no tracking, no ads, no accounts, and no remote code. Fonts are bundled with the extension. No data ever leaves your device.

The popup footer contains two ordinary links (lovespark.love and ko-fi.com) that open only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the on/off setting, the caught-download counters, your theme, and the details of a currently paused download locally. |
| `downloads` | Watches new downloads as they start, checks the file extension (for example `.exe`, `.bat`, `.scr`), pauses suspicious ones, and resumes or cancels them when you click "Allow download" or "Cancel" in the popup. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-download-guard
