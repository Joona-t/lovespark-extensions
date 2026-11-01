# Privacy Policy — LoveSpark Popup Fortress (Full Power)

_Last updated: 2026-10-08_

LoveSpark Popup Fortress (Full Power) is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

A small set of settings and counters, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `popupsBlockedToday` and `popupsBlockedTotal` — how many popups were blocked (numbers only; no URLs or site names are recorded)
- `lastResetDate` — the date the daily counter was last reset
- `isEnabled` — the on/off state of the Fortress toggle
- `theme` — your chosen popup theme

No browsing history, page content, or personal information is stored. You can remove everything at any time by uninstalling the extension.

## What is transmitted

**Nothing.** Popup Fortress makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device.

All blocking happens locally in your browser: a built-in list of popup/ad network domains is blocked by the browser's `declarativeNetRequest` engine, and a page script overrides `window.open`, `location.assign` / `location.replace`, synthetic link clicks and injected meta-refresh tags so they only work after a real click or key press. These checks run inside the page and are not reported anywhere. The fonts used by the popup are bundled with the extension. The popup footer contains links to lovespark.love and Ko-fi that only open if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the blocked-popup counters, the on/off toggle and your theme locally. |
| `alarms` | Runs an hourly check that resets the "blocked today" counter when the date changes. |
| `declarativeNetRequest` | Applies the bundled rule list (`rules.json`) that blocks scripts and frames from known popup/popunder ad networks. Matching is done by the browser; the extension does not see or log the requests. |
| Host access: `<all_urls>` | Lets the blocking rules and the content scripts below work on every site you visit, since popups can appear anywhere. It is not used to read, collect or send page content. |
| Content scripts on `<all_urls>` | `inject.js` (runs in the page) blocks popups and redirects that happen without a real user gesture; `content-styles.css` hides common popup overlays, exit-intent modals and push-notification prompts. |

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/full-power/lovespark-popup-fortress
