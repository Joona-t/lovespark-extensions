# Privacy Policy — Cozy: ADHD & Dyslexia Accessibility Toolkit

_Last updated: 2026-10-08_

Cozy: ADHD & Dyslexia Accessibility Toolkit is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only your settings, kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `globalSettings` — which features are on (typography, colour overlay, reading ruler, bionic reading, focus mode, sensory and distraction controls, text-to-speech, writing aids, reading mode) and their values, plus the active preset.
- `siteSettings` — per-site overrides, keyed by website hostname (only for sites where you set an override).
- `disabledSites` — the list of website hostnames where you turned Cozy off.
- `theme` — the popup colour theme.

No page content, browsing history or text you read or type is stored. **Reset** in the settings page restores your settings, per-site overrides and disabled-site list to defaults (the popup theme choice is kept); uninstalling the extension removes everything. The settings page's **Export** button saves these same settings to a JSON file on your own computer only when you click it; **Import** reads a file you choose.

## What is transmitted

**Nothing.** Cozy makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. All fonts are packaged inside the extension. The internal "TelemetryAgent" only counts settings changes in memory and prints them to the browser's developer console; it never sends them anywhere.

Text-to-speech uses your browser's built-in speech engine (`speechSynthesis`). Cozy does not send the text anywhere itself, but some voices offered by your browser or operating system may be online voices run by that vendor; this is controlled by the voice you pick, not by Cozy.

The footer links (lovespark.love, Ko-fi, the author's site) only open in a new tab when you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your settings, per-site overrides, disabled-site list and theme locally. |
| `scripting` | Injects Cozy's packaged accessibility scripts (typography, ruler, focus mode, text-to-speech, etc.) into the page so the features can work. |
| `tabs` | Reads the current tab's address to show its site name in the popup and honour your per-site on/off choice, detects when a page finishes loading to apply your settings, and sets the "ON" badge on tabs. |
| `activeTab` | Grants access to the tab you are using when you open the popup, so features can be applied to it immediately. |
| Host permission `<all_urls>` | Lets Cozy apply its features on any website you visit. It is used only to change how pages look and read on your device; page content is never collected or sent anywhere. |

**Content scripts:** on all sites (`<all_urls>`), two packaged stylesheets (`sensory-rules.css`, `distraction-rules.css`) are added at page start so sensory and distraction-hiding rules can take effect without flicker. They contain no code and read nothing.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/Accessibility/cozy-toolkit
