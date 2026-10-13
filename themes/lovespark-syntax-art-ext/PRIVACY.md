# Privacy Policy — LoveSpark Syntax Art

_Last updated: 2026-10-08_

LoveSpark Syntax Art is a free, open-source LoveSpark browser extension that turns an image you right-click into colourful "syntax art" made of code characters. It is built to be private by design.

## What is stored

Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- Your settings: the code-art colour theme (`codeTheme`), art width (`artWidth`), font size (`fontSize`), and the popup's display theme (`theme`).
- Simple counters: how many images you converted today and in total (`convertedToday`, `convertedTotal`, `lastResetDate`).
- The most recent conversion result (`resultHtml`) or error message (`resultError`), kept only long enough for the result tab to read it. The result page deletes them right after loading.

The image itself is never stored. You can remove everything at any time by uninstalling the extension. If you click "Save HTML" on the result page, the art is saved to your own computer as a `syntax-art.html` file; that file is created on your device and is not uploaded anywhere.

## What is transmitted

**No data about you is sent anywhere.** The extension has no analytics, tracking, ads, accounts or remote code, and it does not send your settings, counters or results to any server.

The one network request it makes: when you choose "Convert to Syntax Art" on an image, the extension loads that image from its own address (the same image URL the web page already shows) so it can read the pixels on a local canvas. That is a normal image download from the website hosting the image, just as your browser makes when it shows the page. The extension sends nothing to that server beyond a standard image request. All conversion happens on your device.

## Permissions

| Permission | Why it is needed |
|---|---|
| `contextMenus` | Adds the "Convert to Syntax Art" item to the right-click menu on images. |
| `offscreen` | Opens a hidden extension page with a canvas, where the image is decoded and converted to syntax art locally. |
| `storage` | Saves your settings, conversion counters, and the latest result locally so the result tab can show it. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit. It only receives the address of an image when you pick its right-click menu item.

## Third-party services

None. All fonts are packaged with the extension. The popup footer has optional links to lovespark.love and Ko-fi, which open only if you click them.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/themes/lovespark-syntax-art-ext
