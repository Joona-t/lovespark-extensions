# Privacy Policy — I Don't Want Cookies

_Last updated: 2026-10-08_

I Don't Want Cookies is a free, open-source LoveSpark browser extension that hides cookie-consent banners and can optionally click "reject" for you. It is built to be private by design.

## What is stored

Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- Your settings: whether the extension is on, whether auto-decline is on, dark mode, and your chosen theme.
- Your whitelist: the site domains (for example `example.com`) on which you chose to let banners show.
- Counters: how many banners were hidden today and in total, the date of the last daily reset, and a per-domain count of hidden banners (a map of domain name to number).

The extension does not store page content, browsing history beyond those per-domain banner counts, cookies, or any personal information. You can clear the counters with "Reset stats" in Settings, and remove everything by uninstalling the extension. Exporting stats (CSV) or the whitelist (JSON) from Settings creates a file on your own device only.

## What is transmitted

**Nothing.** I Don't Want Cookies makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Fonts are bundled inside the extension. All banner detection and hiding happens locally in the page; when auto-decline is on, the extension clicks the site's own reject button, which is the same as you clicking it. No data ever leaves your device.

The popup footer contains links to lovespark.love and ko-fi.com; these open only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your settings, whitelist and banner counters locally. |
| `alarms` | Runs an hourly check that resets the "hidden today" counter when the date changes. |
| Host access: `<all_urls>` | Lets the content scripts run on the sites you visit so they can find and hide cookie banners (and click reject when auto-decline is on). It also lets the popup read the current tab's domain so you can whitelist that site. |

**Content scripts** run on all sites (`<all_urls>`): a stylesheet injected at page start that hides known cookie-banner elements, and a script that detects remaining banners, hides them, optionally clicks the reject button, and reports the site's domain and number of hidden banners to the extension's own background script for the local counters. It does not read or send page content, form data or cookies anywhere.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/i-dont-want-cookies
