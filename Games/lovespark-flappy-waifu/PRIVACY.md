# Privacy Policy — Flappy Waifu 💖

_Last updated: 2026-10-08_

Flappy Waifu is a free, open-source LoveSpark browser game extension. It is built to be private by design.

## What is stored

Your game progress and preferences: best score, game totals (games played, total score, pipes passed, near-misses, graze counts), best combo, highest medal, hearts, daily-challenge progress, daily streak data, last-played date, background-music on/off and volume, theme and dark-mode setting. Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. As a fallback when extension storage is unavailable, the game keeps only your best score in the page's `localStorage` (key `flappyWaifuBest`), also on your device. You can erase the extension-storage data with the reset button in Settings, or remove everything by uninstalling the extension.

## What is transmitted

**Nothing.** Flappy Waifu makes no network requests of its own. The game loads its sound effects, music and sprite only from files packaged inside the extension. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer contains links to lovespark.love and ko-fi.com; these open only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your scores, stats, streaks and settings (theme, music) locally so they are still there next time. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/Games/lovespark-flappy-waifu
