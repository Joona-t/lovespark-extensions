# Privacy Policy — Dopamine Control

_Last updated: 2026-10-08_

Dopamine Control is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your YouTube watch-time tracking and settings: your daily time limits (weekday and weekend), today's watch time (including Shorts time), warning and override flags, your current and best streak, level, XP and achievements, a rolling 90-day history of daily totals (date, seconds watched, limit, whether you stayed under it, whether an override was used), and display preferences (floating timer visibility and position, break reminders, YouTube Music and Shorts options), plus the install date and aggregate counters. It does **not** store the videos, channels, URLs or titles you watch — only time totals. Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can wipe it with the extension's reset option or by uninstalling the extension.

## What is transmitted

**Nothing.** Dopamine Control makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Its fonts are packaged inside the extension. No data ever leaves your device.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your limits, watch-time totals, streaks, achievements and settings locally so they are still there next time. |
| `alarms` | Schedules the midnight daily reset and the expiry of a temporary "override" unlock. |
| `notifications` | Shows local warnings when you have used 80% and 95% of your daily YouTube time. |
| `tabs` | Finds your open YouTube tabs to tell them when to block or unblock, and opens the extension's own stats dashboard in a new tab. |
| Host access `*://*.youtube.com/*` | Lets the extension's content script run on YouTube. |

The content script runs **only on `*.youtube.com` pages**. There it counts how long a video is playing, shows the floating timer, and displays the block overlay when your limit is reached. It does not read or change any other website.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/dopamine-control
