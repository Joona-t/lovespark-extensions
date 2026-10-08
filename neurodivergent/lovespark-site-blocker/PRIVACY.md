# Privacy Policy — LoveSpark Site Blocker

**Effective date:** This policy applies to LoveSpark Site Blocker version 1.0.1 and later.

LoveSpark Site Blocker is a free, open-source, privacy-first browser extension. It is built on a simple promise: **your data never leaves your browser.** There are no servers, no accounts, no analytics, and no tracking of any kind.

---

## What we store

LoveSpark Site Blocker stores a small amount of data **locally on your own device**, using the browser's `chrome.storage.local` API. This data never leaves your computer. It includes only what the extension needs to do its job:

- **Your blocklist** — the list of sites you choose to block during focus time.
- **Your settings and preferences** — for example, your focus-time configuration, redirect behavior, and any options you toggle in the extension.
- **Local activity counters and streaks** (if enabled by a feature) — simple on-device tallies, such as how many times a distracting site was blocked, used only to display your progress back to you inside the extension.

That's it. The extension does not store your browsing history, the contents of pages you visit, your keystrokes, your IP address, or any personally identifying information.

You can clear all of this data at any time by removing the extension or clearing its storage in your browser.

---

## What we transmit

**Zero data is transmitted externally.**

- No data is ever sent to LoveSpark, the developer, or any third party.
- There are **no analytics**, no telemetry, no usage tracking, and no crash reporting.
- There are **no remote servers** — the extension has no backend to send data to.
- The extension does **not** load or execute any remote code.
- The extension serves **no ads** and contains no advertising or marketing trackers.

Everything the extension does happens entirely on your device, inside your browser.

---

## Permissions

LoveSpark Site Blocker requests only the minimum permissions required for its single purpose — blocking distracting sites during focus time. Each one is explained below.

- **`storage`** — Used to save your blocklist, settings, and on-device counters locally via `chrome.storage.local`, so your preferences persist between browsing sessions. This data stays on your device and is never transmitted.

- **`declarativeNetRequest`** — Used to block and gently redirect requests to the sites on your blocklist. This is the modern, privacy-preserving blocking API: you provide the rules (your blocklist), and **the browser itself enforces them**. The extension does **not** read, intercept, or receive the contents of your network requests or the pages you visit — it only tells the browser which of your chosen sites to redirect.

---

## Host permissions

LoveSpark Site Blocker requests **no host permissions**. It does not declare access to `<all_urls>` or any specific websites.

Because blocking is handled through the `declarativeNetRequest` API, the extension does **not** need — and does **not** have — the ability to read your browsing history, inspect the content of pages you visit, monitor what you do on any website, or inject ads, trackers, or any other code into the pages you load.

---

## Third-party services

**None.** LoveSpark Site Blocker uses no third-party services, SDKs, libraries-as-a-service, analytics providers, advertising networks, or external APIs. There are no third parties to share data with, because no data ever leaves your device.

---

## Children's privacy

LoveSpark Site Blocker collects **no personal data from anyone**, including children under the age of 13. Because the extension stores nothing externally and transmits no data, it is safe for users of all ages.

---

## Changes to this policy

If this policy ever changes, the updated version will be published in the public source repository alongside the extension, with the effective date and version updated accordingly. Because the extension is open source, any change to its data practices is also visible in the code history. Continued use of the extension after an update constitutes acceptance of the revised policy.

---

## Contact

Questions, concerns, or privacy reports are welcome. Please open an issue at:

**https://github.com/Joona-t/lovespark-extensions/issues**

---

## Open source / verification

You don't have to take our word for any of the claims above — you can verify them yourself. LoveSpark Site Blocker is fully open source under the MIT license. The complete source code, including the manifest and all permission usage, is available for inspection at:

**https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-site-blocker**
