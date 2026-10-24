# Privacy Policy — LoveSpark Color Picker

_Last updated: 2026-10-08_

LoveSpark Color Picker is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

- Your last 10 picked colors (`colorHistory`: hex, RGB and HSL values plus the time each was picked). You can wipe it with the **Clear** button in the popup.
- Pick counters (`picksToday`, `picksTotal`) and the date of the last daily reset (`lastResetDate`).
- Your settings: the on/off toggle (`isEnabled`) and the popup theme (`theme`).

Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. Nothing is synced. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Color Picker makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

When you click **Copy** or a history swatch, the color value is written to your system clipboard at your request. The popup footer contains links to lovespark.love and Ko-fi; these only open if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your color history, pick counters and settings locally so they are still there next time. |
| `activeTab` | Grants temporary access to the tab you are on, only after you click **Pick Color**, so the color picker can run there. |
| `scripting` | Injects a small function into that active tab which opens the browser's built-in EyeDropper tool and returns the single color you click. It reads nothing else from the page. |

The extension requests **no host permissions** and declares **no content scripts**. It only touches a page when you press **Pick Color**, and only to read the one color you select.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-color-picker
