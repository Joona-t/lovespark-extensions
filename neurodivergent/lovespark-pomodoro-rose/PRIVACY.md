# Privacy Policy — LoveSpark Pomodoro Rose

_Last updated: 2026-10-08_

LoveSpark Pomodoro Rose is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your timer state (current session: preset, work/break phase, start and end times), your chosen preset, your Pomodoro counts (today and all-time) with the date of the last daily reset, today's list of completed roses (the time of day each session finished), whether the extension is enabled, and your theme preference. Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Pomodoro Rose makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer contains two ordinary links (to lovespark.love and the developer's Ko-fi page). They open in a new tab only if you click them; nothing is sent automatically.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your timer session, Pomodoro counts, rose garden, enabled state and theme locally so they are still there next time. |
| `alarms` | Runs the timer in the background (a `pomo-tick` alarm) so work and break phases switch over and the badge countdown updates even when the popup is closed. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-pomodoro-rose
