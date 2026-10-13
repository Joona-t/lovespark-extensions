# Privacy Policy — LoveSpark Core

_Last updated: 2026-10-08_

LoveSpark Core is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your settings only: whether the extension is enabled, your list of excluded sites (domains you add), the Cursor Pack module's on/off state and selected cursor theme, a settings schema version number, and your chosen popup theme. Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. Nothing is stored in sync storage. You can remove it at any time by uninstalling the extension.

The "Export" button saves these settings as a `lovespark-settings.json` file to your own computer, and "Import" reads such a file back in. Both happen only when you click them, and the file never leaves your device unless you move it yourself.

## What is transmitted

**Nothing.** LoveSpark Core makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Cursor images are built into the extension as inline images and its fonts are packaged locally, so nothing is downloaded from the internet. No data ever leaves your device.

The popup footer contains two plain links (lovespark.love and Ko-fi). They open only if you click them, and nothing is sent with them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your settings (on/off switch, site exclusions, cursor theme, popup theme) locally so they are still there next time. |
| Content script on `<all_urls>` | Applies the custom cursor theme on the pages you visit by adding a small style rule to the page. It reads only the page's hostname, to check it against your site exclusions. It does not read, collect or send page content. |

The extension requests **no host permissions** beyond the content script above, and it does not use cookies, history, tabs or network-request APIs.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/infrastructure/lovespark-core-notion
