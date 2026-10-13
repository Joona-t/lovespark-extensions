# Privacy Policy — LoveSpark Referrer Shield

_Last updated: 2026-10-08_

LoveSpark Referrer Shield is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your shield settings and a small amount of display state: the selected mode (`strip`, `origin` or `off`), the list of domains you have whitelisted, a day-streak counter with the date it was last checked and the date the shield was turned on, and your theme preference. Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Referrer Shield makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Fonts are bundled inside the extension. No data ever leaves your device.

The extension only changes headers on requests your browser was already making: depending on the mode, it removes the `Referer` header from third-party requests, or sets a `Referrer-Policy: origin` response header on pages and frames. This happens locally inside the browser via `declarativeNetRequest` rules; the extension never sees or records the requests themselves.

The popup footer contains two plain links (lovespark.love and Ko-fi) that only open if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `declarativeNetRequest` | Installs the header rules for the selected mode: remove the `Referer` header on third-party requests ("Strip all"), or set `Referrer-Policy: origin` on pages and frames ("Origin only"). Whitelisted domains are excluded from these rules. |
| `storage` | Saves your mode, whitelist, streak counter and theme locally so they are still there next time. |
| `alarms` | Runs an hourly check that advances the local day-streak counter while the shield is on. |
| `<all_urls>` (host permission) | Lets the header rules apply to requests on any website, so referrer protection works everywhere you browse. It is not used to read or change page content. |

The extension runs **no content scripts**: it cannot read or change the content of the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-referrer-shield
