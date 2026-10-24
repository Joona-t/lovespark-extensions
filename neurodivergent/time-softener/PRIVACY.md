# Privacy Policy — Time-Softener by LoveSpark

_Last updated: 2026-10-08_

Time-Softener by LoveSpark is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- Your settings: whether the extension is enabled, your list of sites that get a pause screen (domain names only, such as `reddit.com`), the pause length, the cooldown length, and your popup theme.
- Two counters: how many pauses you went through today and in total.
- A per-site cooldown timestamp (`ts_cooldown_<hostname>`) for listed sites only, recording when the pause screen was last dismissed there so it is not shown again until the cooldown ends.

No browsing history, page content, or URLs of pages you visit are stored. You can remove all of this at any time by uninstalling the extension.

## What is transmitted

**Nothing.** Time-Softener makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Fonts and the mascot image come packaged with the extension. No data ever leaves your device.

The popup footer has links to lovespark.love and Ko-fi. They open only when you click them, and they send no data from the extension.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your settings, site list, pause counters and per-site cooldowns locally. |
| `tabs` | Declared in the manifest, but no feature currently uses it. |
| Content script on `<all_urls>` | On each page it checks the page's hostname against your site list, all on your device. If the site is on your list, it shows the pause overlay. On every other site it does nothing. It never reads or sends page content. |
| `web_accessible_resources` (`mascot.png`) | Lets the pause overlay show the Sparky mascot image from inside the extension package. |

The extension requests **no host permissions** beyond the content script described above.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/time-softener
