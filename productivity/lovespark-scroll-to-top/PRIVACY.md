# Privacy Policy — LoveSpark Scroll To Top

_Last updated: 2026-10-08_

LoveSpark Scroll To Top is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only your settings and simple local counters, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `isEnabled`: whether the floating button is on or paused
- `threshold`: how far you scroll (in pixels) before the button appears
- `theme`: your chosen popup theme
- `scrollsToday`, `scrollsTotal`, `lastResetDate`: how many times you used the button today and in total, plus the date used to reset the daily count

No page content, URLs, or browsing history are stored. You can remove all of it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Scroll To Top makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer has two ordinary links (lovespark.love and Ko-fi). They open in a new tab only if you click them, and the extension sends no data with them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your on/off setting, scroll threshold, theme and usage counters locally. |
| `activeTab` | Declared but not currently used by any feature. |
| `scripting` | Declared but not currently used by any feature. |

**Content script on all sites (`<all_urls>`):** a small script adds the floating "back to top" button to the pages you visit. It only reads how far down the page you have scrolled (to decide when to show the button) and scrolls the page to the top when you click it. It does not read, collect or send page content. Each click adds one to the local usage counter.

The extension requests **no host permissions** beyond that content script.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-scroll-to-top
