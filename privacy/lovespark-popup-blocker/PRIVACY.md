# Privacy Policy — LoveSpark Popup Blocker

_Last updated: 2026-10-08_

LoveSpark Popup Blocker is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only a few settings and counters, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- whether blocking is turned on or off (`isEnabled`)
- your chosen popup theme (`theme`)
- simple counts of blocked popups, skipped YouTube ads and hidden ads, today and in total, plus the date the daily counts were last reset

The extension does **not** store the addresses of blocked popups, your browsing history, or anything from the pages you visit. When a popup is blocked, its address is passed internally to the extension's background script only so the counter can go up; it is not saved and never leaves your device. You can remove all stored data at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Popup Blocker makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Fonts are bundled inside the extension. No data ever leaves your device.

To block popups, the extension replaces the page's own `window.open`, `window.focus` and link `.click()` functions inside each tab, and decides locally whether to let a popup through. Its ad-blocking rules work by stopping known ad and popup network requests from loading. All of this happens inside your browser; nothing is sent anywhere.

The popup footer has links to lovespark.love and Ko-fi. They open only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the on/off setting, your theme and the blocked-popup / skipped-ad counters locally. |
| `declarativeNetRequest` | Applies the bundled block list (`rules.json`, 125 rules) that stops known popup and ad networks from loading. The on/off switch turns this list on or off. Matching happens inside the browser; the extension never sees the requests. |
| Host permission `<all_urls>` | Lets the block list and the popup-blocking scripts work on every site you visit. It is not used to read, collect or send page content. |

**Content scripts.** On every site, the extension adds a stylesheet that hides common ad containers, plus scripts that catch unwanted popups, popunders and fake link clicks. On YouTube only (`*.youtube.com`), it also adds a stylesheet and a script that skip video ads and hide ad slots. These scripts only read the page locally to do this. They report nothing except "a popup was blocked" or "an ad was skipped" to the extension's own background script, so the counters update.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-popup-blocker
