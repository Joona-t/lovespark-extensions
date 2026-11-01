# Privacy Policy — LoveSpark Med Reminder

_Last updated: 2026-10-08_

LoveSpark Med Reminder is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your medication reminders (each reminder's label, time, and whether it is marked as taken today), a count of doses confirmed today and in total, the date of the last daily reset, whether reminders are enabled, and your theme preference. Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Med Reminder makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer contains two plain links (lovespark.love and a Ko-fi page). They open in a new tab only if you click them, and nothing from the extension is sent with them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your reminders, taken/not-taken status, dose counts, and theme locally so they are still there next time. |
| `alarms` | Runs a check every 15 minutes that resets the reminders at the start of a new day and refreshes the toolbar badge showing how many doses are still pending. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-med-reminder
