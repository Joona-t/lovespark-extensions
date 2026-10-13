# Privacy Policy — LoveSpark Auto TOC

_Last updated: 2026-10-08_

LoveSpark Auto TOC is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only your settings and simple counters: whether the extension is enabled (`isEnabled`), which side the table of contents appears on (`tocPosition`), your chosen popup theme (`theme`), and how many tables of contents were generated today and in total (`tocsGeneratedToday`, `tocsGeneratedTotal`, `lastResetDate`). Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. The headings read from a page are used only to build the sidebar on that page and are never stored. You can remove all stored data at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Auto TOC makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device. The popup footer contains plain links (lovespark.love, Ko-fi, and a bug-report email link) that only open if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your settings (on/off, sidebar position, theme) and the local TOC counters so they are still there next time. |
| `activeTab` | When you click "Generate TOC" in the popup, grants temporary access to the current tab only, so the extension can read that page's headings. |
| `scripting` | Injects the extension's own packaged `content.js` into the current tab on your click, to build the table-of-contents sidebar from the page's headings. |

The extension requests **no host permissions** and declares **no automatic content scripts**: it only touches the tab you are on, and only when you ask it to generate a table of contents.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/reading/lovespark-auto-toc
