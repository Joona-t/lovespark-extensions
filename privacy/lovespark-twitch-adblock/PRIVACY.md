# Privacy Policy — LoveSpark Twitch AdBlock

_Last updated: 2026-10-08_

LoveSpark Twitch AdBlock is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only a few counters and preferences, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- Ad statistics: ads muted today, ads muted in total, total time saved (seconds), and the date the daily counter was last reset.
- Whether ad blocking is switched on or off.
- Your display preferences (theme and dark mode).

No browsing history, channel names, URLs, or video content is stored. You can clear the statistics with the "Reset" button in Settings, export them yourself as a CSV file (created locally, never uploaded), or remove everything by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Twitch AdBlock makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

To block ads, the extension wraps Twitch's own `fetch` calls (on the page and in its video Web Workers) and removes ad segments from the video playlists Twitch already downloads. This filtering happens entirely inside your browser; nothing is sent anywhere. Fonts are bundled with the extension, not loaded from any external service. The popup footer has links to lovespark.love and Ko-fi, which only open if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the ad counters, the on/off switch, and your theme settings locally. |
| `alarms` | Runs an hourly check that resets the "ads muted today" counter at the start of a new day. |
| Content scripts on `*://*.twitch.tv/*` | Removes ad segments from Twitch video playlists, hides ad overlays, mutes the player during any ad that still plays, and counts blocked ads. They run only on Twitch. |

The extension requests **no host permissions**, and its content scripts run only on Twitch pages. It cannot read or change any other website.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-twitch-adblock
