# Privacy Policy — LoveSpark Focus Pro

_Last updated: 2026-10-08_

LoveSpark Focus Pro is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- Timer state (idle/running/paused, current session type, end time, position in the Pomodoro cycle).
- Focus statistics: sessions and focus minutes today, lifetime totals, current and longest streak, and a daily focus history (date, minutes, sessions).
- Your settings: focus/break durations, long-break interval, auto-start options, theme.
- The list of sites you choose to block and whether site blocking is on.
- Your ambient-sound choice and volume.
- A local `proStatus` flag (currently a stub; no payment system is connected).
- A `distractionLog` slot (site + timestamp) reserved for the analytics feature; no part of the extension currently writes to it.

Nothing is stored in `chrome.storage.sync`, so none of it is synced to other devices. You can delete it all with the reset option in Settings, or by uninstalling the extension. The "Export CSV" button saves your focus history as a file on your own device; it is not uploaded anywhere.

## What is transmitted

**Nothing.** LoveSpark Focus Pro makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Ambient sounds are generated on your device with the Web Audio API, and fonts are bundled with the extension. No data ever leaves your device.

The extension contains links (lovespark.love, the upgrade page, Ko-fi, GitHub, a bug-report email link) that open only when you click them; no data from the extension is attached to them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your timer state, statistics, settings, and blocked-site list locally so they are still there next time. |
| `alarms` | Keeps the Pomodoro timer running in the background and fires when a focus or break session ends. |
| `declarativeNetRequest` | Blocks the sites on your own block list by redirecting them to the extension's "Stay Focused!" page, using dynamic rules created from that list. The browser applies the rules; the extension does not see your browsing. |
| `notifications` | Shows a desktop notification when a focus session or break finishes. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-focus-pro
