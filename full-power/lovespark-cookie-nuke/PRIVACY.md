# Privacy Policy — LoveSpark Cookie Annihilator (Full Power)

_Last updated: 2026-10-08_

LoveSpark Cookie Annihilator (Full Power) is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

A small set of settings and counters, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `isEnabled` — whether the annihilator is switched on or paused
- `bannersNukedToday` / `bannersNukedTotal` — how many cookie banners were handled today and in total (numbers only; no site names or URLs are recorded)
- `lastResetDate` — the date used to reset the daily counter
- `theme` — your chosen popup theme

Nothing about the pages you visit is stored. You can remove all of it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** The extension makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

The popup's fonts are bundled inside the extension and load locally. The popup footer contains two ordinary links (lovespark.love and Ko-fi) that open only if you click them.

The extension blocks requests from web pages to known cookie-consent services (see `declarativeNetRequest` below). That blocking is done locally by the browser; the extension does not see, log, or send those requests anywhere.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the on/off switch, banner counters and theme locally so they are still there next time. |
| `alarms` | Runs an hourly check that resets the "nuked today" counter when the date changes. |
| `declarativeNetRequest` | Applies a bundled, static list of 40 block rules (`rules.json`) that stop pages from loading scripts, frames and requests from known cookie-consent platforms (e.g. Cookiebot, OneTrust, TrustArc). Rules are matched locally by the browser. |
| Host permission `<all_urls>` | Lets the block rules and the content scripts below work on whichever site shows a cookie banner. It is not used to read, collect or transmit page content. |
| Content scripts on `<all_urls>` | `content-styles.css` hides known cookie banners; `content.js` finds consent banners on the page, clicks a "reject"/"necessary only" button (or unticks optional cookie toggles and saves, or hides the banner), restores page scrolling, and tells the extension's own background worker to add one to the local counter. No page content leaves the page. |

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/full-power/lovespark-cookie-nuke
