# Privacy Policy — LoveSpark Focus Highlight

_Last updated: 2026-10-08_

LoveSpark Focus Highlight is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your settings and simple usage counters: whether focus highlighting is on (`isEnabled`), the dim intensity you chose (`dimOpacity`), your popup theme (`theme`), and how many times you activated highlighting today and in total (`pagesHighlightedToday`, `pagesHighlightedTotal`, with `lastResetDate` for the daily reset). The counters are numbers only — no page addresses, titles or page content are recorded. Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Focus Highlight makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device. The popup footer has two plain links (lovespark.love and Ko-fi) that open only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your on/off setting, dim intensity, theme and highlight counters locally so they are still there next time. |
| `activeTab` | Gives the extension temporary access to the tab you are on, only after you use the popup, so it can turn the spotlight on in that tab. |
| `scripting` | Injects the extension's own packaged script (`content.js`) into the active tab when you switch highlighting on or press "Activate on this page". That script dims the page and leaves a clear spotlight around the paragraph under your mouse. It does not read, save or send page content. |

The extension requests **no host permissions** and declares **no automatic content scripts**: it only touches the tab you are on, and only when you act from the popup.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/reading/lovespark-focus-highlight
