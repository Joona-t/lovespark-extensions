# Privacy Policy — LoveSpark UTM Stripper

_Last updated: 2026-10-08_

LoveSpark UTM Stripper is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only a few small settings and counters, all kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `isEnabled` — whether stripping is on or paused.
- `strippedToday`, `strippedTotal`, `lastResetDate` — how many tracking parameters have been removed today and in total, plus the date used to reset the daily count.
- `theme` — your chosen popup theme.

The extension does **not** store the URLs you visit or any browsing history. URLs are checked in memory at the moment of navigation and then discarded. You can remove all stored data at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark UTM Stripper makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Tracking parameters (such as `utm_*`, `fbclid`, `gclid`, `msclkid`) are removed locally in your browser; when a parameter is removed, the tab is simply sent to the cleaned version of the same address you were already going to. Fonts and images are packaged inside the extension. The popup footer contains two ordinary links (lovespark.love and Ko-fi) that only open if you click them. No data ever leaves your device.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the on/off setting, the stripped-parameter counters and your theme locally so they are still there next time. |
| `webNavigation` | Watches top-level page navigations (`webNavigation.onBeforeNavigate`) so the extension can see a URL that contains tracking parameters and redirect the tab to the cleaned URL. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the content of the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-utm-stripper
