# Privacy Policy — Neurodivergent Reader by LoveSpark

**Effective date:** 2026-06-09 · **Applies to version:** 1.0.31

Neurodivergent Reader by LoveSpark helps you read more comfortably — dyslexia-friendly fonts, reading rulers, paragraph focus, and distraction removal — for ADHD and dyslexia. Your privacy is not a feature we bolt on; it is the architecture. **Everything the extension does happens locally, inside your own browser.** Nothing about you ever leaves your device.

## What we store

The extension keeps a small amount of data in your browser's local storage (`chrome.storage.local`). This data stays on your computer, in your browser profile. It is never uploaded anywhere.

What's stored is limited to the things the extension needs to remember your reading preferences between sessions, for example:

- **Your reading settings** — which dyslexia font you've chosen, font size and spacing, whether the reading ruler is on, the ruler's color/height/opacity, whether paragraph focus is enabled, and which distraction-removal options are turned on.
- **Your on/off state** — whether the extension's reading aids are currently active, and any per-feature toggles.
- **Optional local counters / streaks** — if a build of the extension shows you usage figures (such as pages improved or a focus streak), those numbers are computed and stored locally only, purely so the UI can display them back to you.

That's it. The extension does **not** store the contents of the pages you read, your browsing history, your keystrokes, your account details, or any personally identifying information.

## What we transmit

**Zero data is transmitted externally. Ever.**

- No analytics.
- No telemetry.
- No tracking, fingerprinting, or usage reporting.
- No servers — there is no LoveSpark backend for this extension to talk to.
- No accounts, no sign-in, no sync to a cloud.

The extension has no network code that sends your data anywhere. Your settings and any local counters live and die in your own browser profile.

## Permissions

Manifest V3 requires an extension to declare the browser capabilities it uses. Here is every permission this extension requests and exactly why — each one serves only the reading-aid purpose above.

- **`activeTab`** — Lets the extension act on **the current tab, only when you invoke it** (by clicking the toolbar button or using the extension). This is how your reading aids get applied to the page you're actually looking at, without the extension having standing access to every site you visit.
- **`scripting`** — Lets the extension inject the styles and scripts that render the reading aids into the page: applying the dyslexia font, drawing the reading ruler, dimming everything except the focused paragraph, and hiding distracting page elements. It is used solely to display these reading aids — never to read or exfiltrate page content.
- **`storage`** — Lets the extension save your preferences (above) in `chrome.storage.local` so your chosen font, ruler, and focus settings persist the next time you open a page. Local storage only; nothing is written to any remote store.
- **`tabs`** — Lets the extension apply and re-apply your chosen reading settings to the correct tab as you switch between or reload tabs, so your reading aids behave consistently. It is **not** used to build a history of the sites you visit, and the extension does not log, store, or transmit tab URLs or titles.

## Host permissions

**This extension requests no host permissions** (its manifest declares none). It does not ask for broad, standing access to "all websites."

Because it relies on `activeTab` instead, the extension only touches a page when **you** explicitly invoke it on the tab you're viewing — and even then, only to render the reading aids described above. To be explicit about what this access is **not** used for:

- It does **not** collect or transmit your browsing history.
- It does **not** read page content for any purpose other than locally rendering the reading aids you turned on.
- It does **not** inject ads, trackers, affiliate links, or any third-party code.

## Third-party services

**None.** This extension uses no third-party services, SDKs, analytics providers, advertising networks, or external APIs. There are no outside parties to share data with, because no data leaves your device in the first place.

## Children's privacy

This extension collects **no personal data from anyone**, including children under 13. There are no accounts, forms, or trackers, and nothing is transmitted off your device. It is safe for users of all ages.

## Changes to this policy

If this policy changes, the updated version will be published in the extension's public source repository, and the **Effective date** and **version** line at the top will be updated. Because the repository is public, you can review the full history of any change at any time:

https://github.com/Joona-t/neurodivergent-reader

## Contact

Questions, concerns, or privacy reports are welcome. Please open an issue here:

https://github.com/Joona-t/neurodivergent-reader/issues

## Open source / verification

You don't have to take our word for any of the above. Neurodivergent Reader by LoveSpark is open source — every claim in this policy can be verified by reading the code:

https://github.com/Joona-t/neurodivergent-reader

LoveSpark builds free, open-source, privacy-first tools for neurodivergent users. No ads. No data collection. No remote code. Always free.
