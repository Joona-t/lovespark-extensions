# Privacy Policy — LoveSpark Stretch Reminder

_Last updated: 2026-10-08_

LoveSpark Stretch Reminder is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your reminder settings (reminders on/off, reminder interval), your popup theme choice, a count of stretch reminders today and in total, the date of the last daily reset, the index of the last stretch shown, and the time of the next scheduled reminder. Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Stretch Reminder makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Fonts are bundled inside the extension, not loaded from the web. No data ever leaves your device.

The popup footer contains ordinary links (LoveSpark website, Ko-fi, and a "Report a Bug" email link). They only open if you click them, and nothing about your usage is attached to them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your reminder settings, theme and stretch counts locally so they are still there next time. |
| `alarms` | Schedules the recurring stretch reminder at the interval you choose (15, 30, 45 or 60 minutes). |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-stretch-reminder
