# Privacy Policy — Sensory Shield by LoveSpark

**Effective date:** July 8, 2026 · **Applies to:** Sensory Shield by LoveSpark, version 1.0.36

Sensory Shield is a free, open-source browser extension that makes the web calmer and easier on your senses — reducing motion, tinting screens, hiding GIFs, showing a focus ruler, and more. Your privacy is not a feature we bolt on; it is the default. **Sensory Shield collects no personal data, sends nothing to any server, and works entirely on your own device.**

---

## What we store

Everything Sensory Shield remembers is kept **locally on your device** using the browser's built-in `chrome.storage.local` API. Nothing ever leaves your computer. This local data consists only of:

- **Your settings and preferences** — for example: whether motion reduction is on, your screen-tint color and intensity, whether GIFs and animated images are hidden, your focus-ruler size/color/behavior, and the on/off state of any other calming features you've enabled.
- **Per-site or global choices** — if you turn a feature on or off for a specific website, that choice is saved locally so the page looks the way you left it next time.
- **Any local counters or streaks the extension may show you** — if a feature displays a count (e.g. how many animations it calmed), that number lives only in your browser's local storage and is never uploaded or shared.

That's it. There are no accounts, no sign-in, no profiles, and no identifiers of any kind. This data stays on your device and is removed if you uninstall the extension or clear its storage.

## What we transmit

**Zero.** Sensory Shield does not transmit any data to anyone, ever.

- **No servers** — the extension has no backend and makes no network requests to any LoveSpark server (there isn't one).
- **No analytics** — no usage tracking, no page-view logging, no event beacons.
- **No telemetry** — no crash reports, diagnostics, or "anonymous statistics."
- **No ads** — no ad networks, no ad requests, no advertising identifiers.
- **No remote code** — the extension runs only the code shipped inside it; it never downloads or executes code from the internet.

Nothing you do, see, or configure is sent off your device.

## Permissions

Sensory Shield requests the minimum permissions needed to do its job. Here is every permission it declares and exactly why:

- **`storage`** — Used solely to save your settings and preferences (see *What we store* above) on your own device via `chrome.storage.local`, so your calming choices persist between browsing sessions. This permission does not grant access to any remote storage or the internet, and it is never used to collect or send data anywhere.

## Host permissions

Sensory Shield requests **`<all_urls>`** (access to all websites). This broad access exists for one reason: Sensory Shield's whole purpose is to make **any** page calmer, so it needs to be able to apply its visual accessibility adjustments — reducing motion, tinting the screen, hiding GIFs, drawing the focus ruler — on whatever site you happen to be viewing. Sensory shielding that only worked on some sites wouldn't help.

Just as importantly, here is what this access is **NOT** used for:

- It is **not** used to read, record, or collect your browsing history.
- It is **not** used to capture the content of the pages you visit, your form inputs, your passwords, or anything you type.
- It is **not** used to inject ads, trackers, affiliate links, or any third-party code.
- It is **not** used to transmit anything about the pages you visit anywhere.

The page access is used only, and entirely, to adjust how pages *look* on your screen — locally, in real time, on your device.

## Third-party services

**None.** Sensory Shield uses no third-party services, SDKs, analytics providers, ad networks, or external APIs. There are no outside parties involved in any part of how the extension works.

## Children's privacy

Sensory Shield collects **no personal data from anyone**, including children under the age of 13. Because nothing is collected, stored remotely, or transmitted, the extension is safe for users of all ages. We do not knowingly — or unknowingly — gather information about any user, child or adult.

## Changes to this policy

If this privacy policy ever changes, the update will be published in the extension's public source repository, and the **Effective date** and **version** at the top of this document will be revised. Because the extension is open source, every change to this policy is visible in the repository's history:

https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/sensory-shield

## Contact

Questions, concerns, or privacy reports are welcome. Please open an issue here:

https://github.com/Joona-t/lovespark-extensions/issues

## Open source / verification

You don't have to take our word for any of this. Sensory Shield is **fully open source**, and every claim in this policy can be verified by reading the code yourself:

https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/sensory-shield

Made with love by LoveSpark — free, private, and built for calmer browsing.
