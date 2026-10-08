# Privacy Policy — LoveSpark Word Count

_Last updated: 2026-10-08_

LoveSpark Word Count is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only a few counters and preferences: how many times you counted a selection today and in total (`countsToday`, `countsTotal`), the date of the last daily reset (`lastResetDate`), whether the extension is on or off (`isEnabled`), and your chosen theme (`theme`). Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can remove it at any time by uninstalling the extension.

The text you select is **never stored**. When you open the popup, the selected text is read once, counted (words, characters, estimated read time) in memory, and discarded.

## What is transmitted

**Nothing.** LoveSpark Word Count makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer contains two ordinary links (lovespark.love and Ko-fi) that open in a new tab only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the counters, on/off setting and theme locally so they are still there next time. |
| `activeTab` | Grants temporary access to the tab you are on only when you open the popup, so the extension can read your current text selection. |
| `scripting` | Runs a one-line function in the active tab (`window.getSelection().toString()`) when you open the popup or press "Refresh Count", to get the selected text for counting. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit, except for reading the current selection in the active tab at the moment you open the popup.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-word-count
