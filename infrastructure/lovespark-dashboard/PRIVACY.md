# Privacy Policy — LoveSpark Dashboard

_Last updated: 2026-10-08_

LoveSpark Dashboard is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

**Nothing.** LoveSpark Dashboard does not save any data. It does not use `chrome.storage`, `localStorage`, `sessionStorage` or IndexedDB. Your search text and selected category exist only while the dashboard tab is open.

To show the dashboard, it reads the list of extensions installed in your browser (name, version, description, icon, enabled state) through the browser's `management` API. That list is only displayed on your screen; it is never saved or sent anywhere.

## What is transmitted

**Nothing.** LoveSpark Dashboard makes no network requests of its own. Its fonts and images are packaged inside the extension, and extension icons are loaded from your browser's own local icon store. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

## Permissions

| Permission | Why it is needed |
|---|---|
| `management` | Lists the extensions installed in your browser so the dashboard can show them, lets you turn an extension on or off with its toggle, and refreshes the list when an extension is installed, removed, enabled or disabled. |
| `tabs` | When you click the toolbar button, finds an already-open dashboard tab and switches to it, or opens a new dashboard tab if none is open. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/infrastructure/lovespark-dashboard
