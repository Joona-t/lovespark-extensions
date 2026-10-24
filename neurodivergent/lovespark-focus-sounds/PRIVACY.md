# Privacy Policy — LoveSpark Focus Sounds

_Last updated: 2026-10-08_

LoveSpark Focus Sounds is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your last-used sound and volume, an on/off toggle, your theme choice, and simple session counters (sessions today, total sessions, and the date of the last daily reset). Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Focus Sounds makes no network requests of its own. All sounds are generated locally in the popup with the Web Audio API; no audio files are downloaded. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer contains two ordinary links (lovespark.love and a Ko-fi page). They open in a new tab only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your sound and volume preference, on/off state, theme, and session counters locally so they are still there next time. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-focus-sounds
