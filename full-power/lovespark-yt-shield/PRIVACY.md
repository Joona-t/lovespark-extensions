# Privacy Policy — LoveSpark YouTube Shield (Full Power)

_Last updated: 2026-10-08_

LoveSpark YouTube Shield (Full Power) is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only a few small values, all kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `adsNeutralizedToday` and `adsNeutralizedTotal`: counts of ads the extension skipped (numbers only, no video titles, URLs or history).
- `lastResetDate`: the date the daily counter was last reset.
- `isEnabled`: whether the shield is switched on or paused.
- `theme`: your chosen popup theme.

Nothing is synced across devices. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark YouTube Shield makes no network requests of its own. No analytics, no tracking, no accounts, and no remote code. No data ever leaves your device.

To remove ads, the extension works locally on YouTube pages:

- It wraps the page's own `fetch()` and `XMLHttpRequest` calls to YouTube's `/youtubei/v1/player` and `/youtubei/v1/next` endpoints, and deletes ad-related fields from the responses before the YouTube player reads them. The requests themselves are YouTube's own; the extension does not add to, copy or send them anywhere.
- It blocks known ad and ad-tracking URLs (for example `doubleclick.net`, `googlesyndication.com`, and ad-related YouTube/googlevideo paths) using the browser's built-in `declarativeNetRequest` rules, which are bundled in the extension.

The popup footer contains links to lovespark.love and Ko-fi. These open only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the ad counters, the on/off setting and your theme locally. |
| `alarms` | Runs an hourly check that resets the "today" counter when the date changes. |
| `declarativeNetRequest` | Applies the bundled block list (`rules.json`) so known ad-serving URLs never load. |
| Host access to `*://*.youtube.com/*` | Lets the content scripts run on YouTube to strip ad data from player responses and skip any ad that still appears. |
| Host access to `*://*.googlevideo.com/*` | Declared for YouTube's video servers, where some of the bundled block rules target ad-related paths. No script runs on googlevideo.com and no data from it is read or stored. |
| Content scripts on `*://*.youtube.com/*` | `inject.js` removes ad fields from YouTube's player data; `content.js` mutes and clicks "Skip" on any ad that slips through and reports the count to the extension. |

The extension has no access to any site other than YouTube and googlevideo.com.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/full-power/lovespark-yt-shield
