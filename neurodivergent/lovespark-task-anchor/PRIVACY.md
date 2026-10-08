# Privacy Policy — LoveSpark Task Anchor

**Effective date:** 2026-07-08 · **Applies to version:** 1.0.15

LoveSpark Task Anchor is built privacy-first. It runs entirely on your device. It does not have a server, does not collect personal data, and does not transmit anything you do to anyone. This policy explains exactly what that means.

## What we store

LoveSpark Task Anchor stores a small amount of data **locally on your own computer**, inside your browser's `chrome.storage.local` area. This stays on your device and is never sent anywhere. It includes only what the extension needs to do its one job — keeping your current task pinned across tabs:

- **Your current pinned task** — the text of the task you choose to anchor.
- **Task state** — whether a task is currently pinned and any recent/previous task text the extension keeps so your anchor persists across tabs, windows, and browser restarts.
- **Your preferences/settings** — for example display and reminder options you choose, and the chosen theme.

That's it. The extension does not store your browsing history, the contents of the pages you visit, your identity, your location, or any analytics about how you use it. There are no hidden counters, profiles, or fingerprints.

You remain in control: clearing the extension's data (or removing the extension) deletes everything it has stored.

## What we transmit

**Zero data is transmitted externally.** None. Specifically:

- **No servers** — the extension has no backend and makes no network calls to send your data anywhere.
- **No analytics, no telemetry** — we do not track usage, clicks, sessions, or events.
- **No accounts, no sync to us** — there is nothing to log into and nothing uploaded to a cloud we control.
- **No selling or sharing** — because nothing leaves your device, there is nothing to sell or share.

Everything the extension does happens locally in your browser.

## Permissions

LoveSpark Task Anchor requests the minimum permissions needed for its single purpose. Here is each one and why it exists:

- **`storage`** — used to save your pinned task and your settings locally via `chrome.storage.local`, so your anchored task persists across tabs, windows, and browser restarts. This permission only reads and writes the extension's own local storage on your device. It is **not** used to collect, sync, or transmit any data off your machine.

No other API permissions are requested.

## Host permissions

LoveSpark Task Anchor declares a content script that runs on all pages (`<all_urls>`) so it can display your pinned task as a small banner reminder on the page you're viewing. This is the mechanism behind the "persistent across tabs" feature — without it, the banner could only appear inside the extension's own popup, not on the pages you're actually working in.

The content script's access is narrow and one-directional:

- It **inserts** a self-contained banner element (your pinned task text plus Done/dismiss buttons) into the page. It does **not** read the page's existing content, forms, DOM data, or your activity on the page — the only thing it reads from the page itself is the URL scheme (`location.protocol`), used solely to skip internal browser pages (`chrome://`, `about:`, etc.) where injection isn't allowed.
- It does **not** collect or track your browsing history.
- It does **not** read the data, forms, or contents of the sites you open.
- It does **not** inject ads, trackers, analytics, or any remote/third-party code into web pages — the only thing it injects is the extension's own banner UI, built from the task text you typed into the popup.
- Nothing observed or injected on a page is ever transmitted anywhere; it stays local to your browser, same as everything else in this policy.

## Third-party services

**None.** LoveSpark Task Anchor uses no third-party services, no external SDKs, no advertising networks, no analytics providers, and no remote code. It does not load or execute any code from outside the extension package.

## Children's privacy

LoveSpark Task Anchor collects **no personal data from anyone**, including children under the age of 13. Because nothing is collected or transmitted, the extension is safe for users of all ages and complies with children's privacy protections by design.

## Changes to this policy

If this policy ever changes, the updated version will be published in the public source repository, with the effective date and version updated at the top of this document. Because the extension is open source, every change to this policy is visible in the repository's history:

- https://github.com/Joona-t/lovespark-task-anchor

## Contact

Questions, concerns, or privacy reports are welcome. Please open an issue here:

- https://github.com/Joona-t/lovespark-task-anchor/issues

## Open source / verification

You do not have to take our word for any of this. LoveSpark Task Anchor is fully open source, and every claim in this policy can be verified by reading the code:

- https://github.com/Joona-t/lovespark-task-anchor

LoveSpark extensions are free, open-source, ad-free, and privacy-first — local storage only, zero external data transmission.
