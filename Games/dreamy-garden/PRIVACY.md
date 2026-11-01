# Privacy Policy — Dreamy Garden

_Last updated: 2026-10-08_

Dreamy Garden is a free, open-source LoveSpark browser extension: a small garden game that can replace your new tab page. It is built to be private by design.

## What is stored

- Whether the game is shown on your new tab page (`gameOnNewTab`) and your chosen popup theme (`theme`), kept in your browser's own extension storage (`chrome.storage.local`).
- Your best game score (`dg_best`), kept in the new tab page's `localStorage`.

All of this stays on your device. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** Dreamy Garden makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. All fonts and scripts are packaged inside the extension. No data ever leaves your device.

The popup footer contains two ordinary links (lovespark.love and Ko-fi). They open only if you click them, and nothing is sent by the extension when you do.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your new-tab game on/off setting and your popup theme locally so they are still there next time. |
| New tab override (`chrome_url_overrides`) | Shows the Dreamy Garden game (or a paused screen, if you turned it off) when you open a new tab. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/Games/dreamy-garden
