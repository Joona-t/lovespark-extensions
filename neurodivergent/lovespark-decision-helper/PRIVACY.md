# Privacy Policy — LoveSpark Decision Helper

_Last updated: 2026-10-08_

LoveSpark Decision Helper is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only small counters and a display preference, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `decisionHelperToday` / `decisionHelperTotal` — how many wheel spins or coin flips you have made today and in total (shown in the popup and on the toolbar badge).
- `lastResetDate` — the date used to reset the daily counter.
- `theme` — your chosen popup theme.

The options you type into the wheel are **not** saved; they exist only while the popup is open. You can remove all stored data at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Decision Helper makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer contains two ordinary links (to lovespark.love and the developer's Ko-fi page). They only open in a new tab if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the decision counters and your theme locally so they are still there next time. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-decision-helper
