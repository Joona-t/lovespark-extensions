# Privacy Policy — LoveSpark Wind Down

_Last updated: 2026-10-08_

LoveSpark Wind Down is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your bedtime (hour and minute), your wind-down window length, whether wind down is switched on, your chosen theme, a daily and all-time reminder counter, and the date of the last daily counter reset. Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Wind Down makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup footer contains ordinary links to lovespark.love and ko-fi.com; these open only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your bedtime, wind-down settings, on/off state, theme and reminder counters locally so they are still there next time. |
| `alarms` | Runs a check every 5 minutes to update the toolbar badge countdown to your bedtime. |
| `activeTab` | Lets the extension apply (or remove) the warm screen tint on the tab you are currently using, after you open the extension on it. |
| `scripting` | Injects a single CSS filter (sepia + brightness) on the page to warm the screen as bedtime approaches, and clears it when you switch wind down off. It does not read page content. |

The extension requests **no host permissions** and declares **no content scripts**: it cannot read the web pages you visit. Its only change to a page is the warm color filter described above.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-wind-down
