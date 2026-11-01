# Privacy Policy — LoveSpark Chess Coach

_Last updated: 2026-10-08_

LoveSpark Chess Coach is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

A small set of settings and counters, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- your chosen theme (`theme`)
- whether you last used FEN or PGN input (`lastInputMode`)
- how many analyses you ran today and in total (`analysesToday`, `analysesTotal`), plus the date of the last daily reset (`lastResetDate`)

The FEN or PGN positions you paste are analyzed in memory and are **not** saved. You can remove the stored data at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Chess Coach makes no network requests of its own. Chess analysis runs entirely on your device, in a background worker loaded from the extension's own packaged files (bundled chess.js and Betafish engine). Fonts are bundled with the extension too. No analytics, no tracking, no ads, no accounts, no cloud engine, and no remote code. No data ever leaves your device.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your theme, last input mode (FEN/PGN), and analysis counters locally so they are still there next time. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/Games/lovespark-chess-coach
