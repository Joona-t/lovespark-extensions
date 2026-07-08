# Dopamine Control

A YouTube watch-time limiter with streaks and gamification. Sets a
weekday/weekend time budget, tracks it while you browse YouTube, warns you
as you approach the limit, and rewards consistency with streaks, levels, and
achievements instead of just nagging you to stop.

Part of the [LoveSpark suite](https://lovespark.love) — free, open-source,
privacy-first browser tools. No ads, no accounts, no data collection.

## Features

- Configurable daily watch-time limits (weekday vs. weekend)
- Live tracking of watch time, whitelist time, and Shorts time, reset daily
- 80% / 95% warning thresholds, with a one-time daily override
- Streaks (current + best) and a leveling/XP/achievement system
- 90-day rolling history for the stats dashboard
- Per-channel whitelist (exempt channels from the limit)
- Optional break reminders and a floating on-page timer

## File layout

- `manifest.json` — MV3, `storage`/`alarms`/`notifications`/`tabs`
  permissions, `*://*.youtube.com/*` host permission
- `background.js` — service worker; timer/limit/streak logic, notifications
- `content.js` / `content-overlay.css` — injects the floating timer and
  warning overlay on youtube.com
- `popup/` — toolbar popup (current status, quick controls)
- `dashboard/stats.html` — full stats dashboard (history, streaks,
  achievements)
- `shared/` — `constants.js` (storage schema/defaults), `utils.js`,
  `theme.css`
- `icons/` — extension icons + `generate-icons.js`/`generate.html` for
  regenerating them

## Install (dev)

1. `chrome://extensions` → enable Developer Mode → **Load unpacked** →
   select this folder.

## Privacy

All tracking data lives in `chrome.storage.local` on your own machine — no
watch-time data, channel names, or usage stats are ever transmitted
anywhere. Only YouTube pages are touched (`host_permissions` scoped to
`*://*.youtube.com/*`).

## License

MIT.
