# Privacy Policy — LoveSpark Gentle Timer

_Last updated: 2026-10-08_

LoveSpark Gentle Timer is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- **Time spent per site, per day:** for the website in your active tab, the extension records the site's domain name (for example `example.com`, never the full page address or page content) and the number of seconds you spent on it. These totals are saved under one entry per calendar day (`time_YYYY-MM-DD`). Sites on your allowlist are not tracked. Older days are not automatically deleted.
- **Your settings** (`settings`): nudge threshold, water/food/movement break intervals, whether the on-page badge is shown, and your allowlist of domains not to track.
- **Break status:** whether a water/food/movement break is currently due (`breakDue_*`) and when you last marked each break as done (`lastBreak_*`).
- **Theme preference** (`theme`) for the popup.

You can remove all of it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Gentle Timer makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer contains ordinary links (LoveSpark website, Ko-fi, and a "Report a Bug" email link). They only open if you click them, and they send no extension data.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your per-site daily time totals, settings, break status and theme locally. |
| `alarms` | Runs a once-a-minute timer that saves elapsed time and refreshes the badge, and schedules your water, food and movement break reminders. |
| `tabs` | Lets the background script see which tab is active and its address, so it can work out the current site's domain, time it, and send time updates and break reminders to that tab. |
| `activeTab` | Declared but not currently used by any feature. |

**Content script on all sites (`<all_urls>`):** the extension injects a small script and stylesheet into web pages to show the floating time badge, the gentle "you've been here a while" nudge, and break reminder banners. It reads only the page's hostname to look up today's time for that site. It does not read, collect or change page content beyond adding these elements. The extension requests no separate host permissions.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-gentle-timer
