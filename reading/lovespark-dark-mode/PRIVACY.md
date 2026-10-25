# Privacy Policy — LoveSpark Dark Mode

_Last updated: 2026-10-08_

LoveSpark Dark Mode is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Your settings and simple local counters, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- Whether dark mode is on, and which mode you picked (dark, bubblegum or hot pink).
- Your list of excluded websites (domain names you chose to skip).
- Counters: number of sites darkened today and in total, "minutes saved" today and in total, and the date of the last daily reset. These are numbers only; the extension does not store which sites you visited or your browsing history.
- Your display theme for the popup.

You can clear all of it from the settings page's reset button, or by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Dark Mode makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. The dark-mode styles and fonts are packaged inside the extension. No data ever leaves your device.

The popup footer contains links to lovespark.love and Ko-fi; these open only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your on/off state, chosen mode, excluded sites, counters and theme locally. |
| `tabs` | Detects when a page finishes loading so dark mode can be applied, sends mode changes to your open tabs, and reads the current tab's address in the popup so you can turn dark mode off for that site. |
| `scripting` | Injects the packaged dark-mode CSS and a small script that switches the dark-mode class on the page. |
| `alarms` | Runs a 5-minute timer that increments the local "minutes saved" counter while dark mode is on. |
| `<all_urls>` (host permission) | Lets the extension apply dark mode to any `http`/`https` website you visit. It only adds styling to the page; it does not read, collect or send page content. |

The extension declares no static content scripts; its CSS and script are injected on demand via `scripting`. The packaged filter stylesheets (`filters/*.css`) are listed as web-accessible resources so they can be applied to pages.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/reading/lovespark-dark-mode
