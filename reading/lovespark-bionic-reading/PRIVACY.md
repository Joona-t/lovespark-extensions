# Privacy Policy — LoveSpark Bionic Reading

_Last updated: 2026-10-08_

LoveSpark Bionic Reading is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only your settings and simple counters: whether the extension is enabled, your chosen bold ratio, your popup theme, and how many pages you have styled today and in total (plus the date used to reset the daily count). Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. The text of the pages you read is never stored. You can remove everything at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Bionic Reading makes no network requests of its own. The bolding happens entirely inside the page in your browser. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer has two links (lovespark.love and the author's Ko-fi page). They only open in a new tab if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your on/off setting, bold ratio, theme and page counters locally so they are still there next time. |
| `activeTab` | Gives the extension temporary access to the current tab only when you click the extension and press the activate button, so it can apply bionic reading to that page. |
| `scripting` | Injects the bionic-reading script into the current tab when you activate it from the popup (or switch the toggle off, so the bolding can be removed from that tab). |

The extension requests **no host permissions** and declares **no automatic content scripts**: it only touches the current tab after you act from the popup, and it does not read or send the page's content anywhere.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/reading/lovespark-bionic-reading
