# Privacy Policy — Aesthetic Pink Retro Cursor Pack by LoveSpark

_Last updated: 2026-10-08_

Aesthetic Pink Retro Cursor Pack by LoveSpark is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your cursor settings: whether custom cursors are on or off (`lovesparkCursorEnabled`), which cursor pack you selected (`lovesparkCursorPack`), and your popup theme (`theme`). Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. No browsing data, page content, or URLs are stored. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** The extension makes no network requests of its own. Cursor images and fonts are packaged inside the extension and loaded from the extension itself (`chrome.runtime.getURL`), not from the internet. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer contains two ordinary links (lovespark.love and Ko-fi) that open in a new tab only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your on/off setting, chosen cursor pack, and popup theme locally so they are still there next time. |
| Content script on `<all_urls>` | Adds a small stylesheet to each page you visit that swaps the mouse cursor for the selected pack. It only injects cursor CSS; it does not read, collect, or send page content. |
| `web_accessible_resources` (`cursors/*`) | Lets web pages display the packaged cursor images referenced by that stylesheet. |

The extension requests **no host permissions** beyond the content script above, and no other permissions.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/themes/lovespark-retro-cursor
