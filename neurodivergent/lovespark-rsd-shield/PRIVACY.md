# Privacy Policy — LoveSpark RSD Shield

_Last updated: 2026-10-08_

LoveSpark RSD Shield is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

A small set of counters and settings, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `shieldsToday` and `shieldsTotal` — how many times you have opened the shield today and in total
- `lastResetDate` — the date used to reset the daily counter
- `isEnabled` — whether the extension is switched on
- `theme` — your chosen display theme

The affirmations are built into the extension. Nothing you type or browse is stored. You can remove all of this data at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark RSD Shield makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer contains two ordinary links (to lovespark.love and the developer's Ko-fi page). They open only if you click them, like any link, and the extension sends no data with them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your shield counters, the on/off setting and your theme locally so they are still there next time. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-rsd-shield
