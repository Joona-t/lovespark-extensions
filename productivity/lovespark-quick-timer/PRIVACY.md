# Privacy Policy — LoveSpark Quick Timer

_Last updated: 2026-10-08_

LoveSpark Quick Timer is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

The extension keeps only what it needs to run your timer, in your browser's own extension storage (`chrome.storage.local`) on your device:

- `activeTimer` — the current timer's length in minutes, its start and end timestamps, and whether it is running or completed.
- `timersToday`, `timersTotal`, `lastResetDate` — counts of completed timers (today and all-time) and the date used to reset the daily count.
- `isEnabled` — an on/off flag used for the toolbar badge.
- `theme` — the popup theme preference (defaults to `retro`).

Nothing is stored in `chrome.storage.sync`, so none of this is synced between devices. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Quick Timer makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer contains two ordinary links (lovespark.love and ko-fi.com) that open in a new tab only if you click them; the extension sends no data with them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the running timer, your completed-timer counts and your theme locally so they survive closing the popup or restarting the browser. |
| `alarms` | Runs a repeating `timer-tick` alarm (every 15 seconds) while a timer is active, so the background worker can update the badge countdown and mark the timer complete when time is up. The alarm is cleared when the timer ends or is cancelled. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-quick-timer
