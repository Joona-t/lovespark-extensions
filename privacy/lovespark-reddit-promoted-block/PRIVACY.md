# Privacy Policy — LoveSpark Reddit Ad Blocker

_Last updated: 2026-10-08_

LoveSpark Reddit Ad Blocker is a free, open-source LoveSpark browser extension that hides promoted posts and sidebar ads on Reddit. It is built to be private by design.

## What is stored

Only a few small values, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `hiddenToday`, `hiddenTotal`, `lastResetDate` — how many promoted posts/ads were hidden today and in total, plus the date used to reset the daily count. These are plain numbers and a date; no post content, URLs, subreddit names or browsing history are recorded.
- `theme` — your chosen popup theme.

You can remove all of it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Reddit Ad Blocker makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Ads are hidden locally in the page with CSS (`display: none`); nothing about the pages you visit is sent anywhere. All fonts are bundled with the extension. The popup footer contains two ordinary links (lovespark.love and Ko-fi) that open only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the hidden-ads counters and your popup theme locally so they are still there next time. |
| Content script on `https://www.reddit.com/*`, `https://old.reddit.com/*`, `https://reddit.com/*`, `https://sh.reddit.com/*`, `https://new.reddit.com/*` | Runs on Reddit pages only, to find promoted posts and sidebar ads in the page and hide them. It reads the page's structure locally to do this and does not send anything off your device. |

The extension requests **no host permissions** beyond its Reddit content script, and does not run on any other website.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-reddit-promoted-block
