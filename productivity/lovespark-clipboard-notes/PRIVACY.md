# Privacy Policy — LoveSpark Clipboard Notes

_Last updated: 2026-10-08_

LoveSpark Clipboard Notes is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

- The clipboard text you choose to save (each note's text, an ID, and the time it was saved). Text is read from your clipboard only when you click **Paste from Clipboard** in the popup. It is never read in the background.
- Notes older than 7 days are deleted automatically.
- Simple counters (notes saved today and in total, plus the date of the last daily reset), an on/off flag, and your theme preference.

Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can delete individual notes in the popup, or remove everything by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Clipboard Notes makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device. The popup footer has links to lovespark.love and Ko-fi, which open only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your clipboard notes, counters and settings locally so they are still there next time. |

Clipboard access uses the standard `navigator.clipboard.readText()` call, run only when you click the paste button in the popup. The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-clipboard-notes
