# Privacy Policy — LoveSpark Page Ruler

_Last updated: 2026-10-08_

LoveSpark Page Ruler is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your ruler settings (on/off state, ruler height, opacity and colour), your chosen theme, and a simple count of how many times you turned the ruler on (today and all-time, plus the date used to reset the daily count). Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can remove it at any time by uninstalling the extension.

The extension does not record which pages you use the ruler on, what you read, or where your cursor goes. The ruler only follows your cursor's vertical position on the page while it is active; nothing about it is saved.

## What is transmitted

**Nothing.** LoveSpark Page Ruler makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer contains two ordinary links (lovespark.love and Ko-fi) that open in a new tab only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your ruler settings, theme and on/off count locally so they are still there next time. |
| `activeTab` | Gives the extension temporary access to the tab you are looking at, only after you use the popup, so it can show the ruler there. |
| `scripting` | Injects the ruler script into that active tab when you turn the ruler on or press the activate button. |

The extension requests **no host permissions** and declares **no automatic content scripts**: the ruler is only added to the current tab when you ask for it from the popup, and it only draws a coloured bar over the page. It does not read or change the page's content.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/reading/lovespark-page-ruler
