# Privacy Policy — Pink Anti-Doomscroll

_Last updated: 2026-10-08_

Pink Anti-Doomscroll is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your settings and simple counters, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- Settings: on/off switch (`enabled`), which sites are active (`sites`), nudge mode and its timing presets (`mode`, `continuousScrollMs`, `escalateMs`, `tintOpacity`), sparkle effect toggle (`sparkleEnabled`), snooze end time (`snoozeUntilTs`), and theme (`theme`).
- Counters: how many nudges and pauses happened today and in total (`nudgesToday`, `nudgesTotal`, `pausesToday`, `pausesTotal`), plus the date of the last daily reset (`lastResetDate`).

Scroll tracking (how long and how fast you have been scrolling) stays in memory only and is never written to storage. No page content, URLs or browsing history are stored. You can remove everything at any time by uninstalling the extension.

## What is transmitted

**Nothing.** Pink Anti-Doomscroll makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Fonts and the mascot image are packaged inside the extension. The popup footer contains links to lovespark.love and ko-fi.com that open only if you click them. No data ever leaves your device.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your settings and nudge/pause counters locally so they are still there next time. |
| Content scripts on `x.com`, `twitter.com`, `reddit.com`, `facebook.com` (and their `www.` versions) | Watches your scrolling on these sites and shows the gentle tint, whisper message, gauge and mascot overlay when you have been scrolling continuously. It does not read or collect the content of the pages. |
| Web-accessible resource `media/mascot.png` (same sites) | Lets the overlay display the packaged Sparky mascot image on those pages. |

The extension requests **no host permissions** beyond the content scripts listed above.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-doomscroll
