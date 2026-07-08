# Privacy Policy — LoveSpark Calm

**Effective date:** 2026-07-08 · **Applies to:** LoveSpark Calm version 1.0.30

LoveSpark Calm is a free, open-source browser extension that makes web pages sensory-friendly with a single toggle — muting colors, stopping animations, and hiding distractions. It is built privacy-first: everything happens locally in your browser. This policy explains, in plain language, exactly what the extension does and does not do with your information.

**Short version:** LoveSpark Calm collects no personal data, sends nothing anywhere, and has no servers, analytics, accounts, or ads. Your settings live only on your own device.

---

## What we store

LoveSpark Calm stores a small amount of data **locally on your device only**, using the browser's `chrome.storage.local` API. This never leaves your computer. It includes only what is needed to remember how you like the extension to behave:

- **Your on/off state** — whether sensory-friendly mode is currently enabled.
- **Your preferences** — which effects you want applied (e.g. mute colors, stop animations, hide distracting elements) and any related toggle settings.
- **Optional local counters** — lightweight, on-device tallies such as how many times you've enabled calm mode, used only to display your own usage back to you inside the extension. These are anonymous numbers, tied to no identity, and never transmitted.

That's the complete list. LoveSpark Calm does **not** store your browsing history, the pages you visit, your keystrokes, your form inputs, your IP address, or any personally identifiable information.

---

## What we transmit

**Nothing. Zero data is transmitted externally.**

- No analytics.
- No telemetry.
- No tracking or fingerprinting.
- No remote servers, backends, or cloud storage.
- No accounts, logins, or sign-ups.
- No remote code execution — all code ships inside the extension package.

The extension has no network functionality that sends your information anywhere. Everything it does happens entirely on your own machine.

---

## Permissions

LoveSpark Calm requests only the minimum permissions needed for its single purpose — making the current page sensory-friendly. Each is explained below.

- **`storage`** — Used solely to save your settings (on/off state, effect preferences, and any local usage counters) on your own device via `chrome.storage.local`, so your choices persist between sessions. Nothing stored here is ever uploaded.
- **`activeTab`** — Grants temporary access to the tab you're currently looking at, and only when you invoke the extension (for example, by clicking its toolbar button). This is how LoveSpark Calm knows which page to make calmer. It does not provide standing or background access to your tabs, and it does not track which sites you visit.
- **`scripting`** — Allows the extension to apply its sensory-friendly changes — injecting the styles and small scripts that mute colors, stop animations, and hide distracting elements — into the active tab when you enable calm mode. It is used only to render those visual adjustments on the page in front of you, never to read or exfiltrate page content.

Each permission is used exclusively for the stated purpose above and for nothing else.

---

## Host permissions

**LoveSpark Calm requests no host permissions.** It does not declare `<all_urls>` or any broad site-access pattern, and it cannot read or modify pages in the background.

Instead, it relies on `activeTab`, which grants access to a page **only** when you actively invoke the extension on that page, and only for that tab. Concretely, this means LoveSpark Calm does **not**:

- collect, log, or transmit your browsing history or the list of sites you visit,
- monitor pages in the background or across tabs,
- inject advertisements, trackers, affiliate links, or any third-party content,
- alter page content for any purpose other than the visual, sensory-friendly adjustments you asked for.

---

## Third-party services

**None.** LoveSpark Calm uses no third-party services, SDKs, libraries-as-a-service, analytics providers, ad networks, or external APIs. There are no external parties involved in the extension's operation, and therefore no one to share data with — because no data is collected or sent in the first place.

---

## Children's privacy

LoveSpark Calm collects no personal data from anyone, including children under the age of 13. Because the extension gathers no personal information whatsoever, there is nothing to collect from, about, or regarding a child. It is safe for users of all ages.

---

## Changes to this policy

If this policy is ever updated, the changes will be published in the extension's public source repository, and the **Effective date** and **version** line at the top of this document will be updated. Because LoveSpark Calm is open source, every change to this policy is visible in the repository's history for anyone to review:

https://github.com/Joona-t/lovespark-calm

---

## Contact

Questions, concerns, or reports about privacy can be raised publicly via GitHub issues:

https://github.com/Joona-t/lovespark-calm/issues

---

## Open source & verification

LoveSpark Calm is fully open source under the MIT license. You do not have to take these claims on trust — you can verify every statement in this policy by reading the complete source code:

https://github.com/Joona-t/lovespark-calm

There is no hidden or server-side component. What you read in the repository is exactly what runs on your device.
