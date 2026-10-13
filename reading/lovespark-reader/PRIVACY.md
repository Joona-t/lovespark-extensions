# Privacy Policy — LoveSpark Reader

_Last updated: 2026-10-08_

LoveSpark Reader is a free, open-source LoveSpark browser extension that applies a pink colour filter to the web pages you visit. It is built to be private by design.

## What is stored

Your settings only: whether the filter is on (`enabled`), which colour mode you picked (`mode`: sakura, hot pink or starlight), the list of website hostnames you chose to turn the filter off for (`disabledSites`), and the popup theme (`theme`). Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. Nothing is synced. You can remove it at any time by uninstalling the extension.

The extension does not record the pages you visit. The only hostnames it saves are the ones you add yourself with the "Disable on this site" button.

## What is transmitted

**Nothing.** LoveSpark Reader makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. All fonts and styles are packaged inside the extension. No data ever leaves your device.

The popup footer has two links (lovespark.love and Ko-fi). They open in a new tab only when you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your on/off setting, colour mode, popup theme, and your list of sites where the filter is turned off, so they are still there next time. |

The extension requests **no host permissions**. It runs **content scripts** on `http://` and `https://` pages. These add the pink filter stylesheets, plus extra stylesheets for YouTube, Google, Reddit, Twitter/X and GitHub. A small script puts a CSS class on the page to switch the colour mode, and tells the popup the current site's hostname so the "Disable on this site" button works. These scripts change only how pages look. They do not read, collect or send page content.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/reading/lovespark-reader
