# Privacy Policy — LoveSpark Minimal Scroll

_Last updated: 2026-10-08_

LoveSpark Minimal Scroll is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only your settings and simple counters: whether the extension is on or off (`isEnabled`), a list of site hostnames where you have turned it off (`disabledSites`), a count of how many times the thin scrollbar style was applied today and in total (`scrollToday`, `scrollTotal`, plus `lastResetDate` for the daily reset), and your popup theme choice (`theme`). Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. Nothing is stored in sync storage. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Minimal Scroll makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device. The popup loads only fonts and files packaged inside the extension. The popup footer has two plain links (lovespark.love and Ko-fi) that open in a new tab only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your on/off setting, per-site exceptions, theme and the local style counters so they are still there next time. |
| `activeTab` | Gives the extension temporary access to the tab you are viewing when you click its toolbar button, so it can apply the thin scrollbar style there. |
| `scripting` | Inserts and removes the thin scrollbar CSS (`chrome.scripting.insertCSS` / `removeCSS`) on the page. It only adds styling; it does not read page content. |

The extension requests **no host permissions** and declares **no content scripts**. It reads a tab's address only to check its hostname against your list of disabled sites; that hostname is never saved unless you add it to that list, and is never sent anywhere.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/themes/lovespark-minimal-scroll
