# Privacy Policy — LoveSpark Sensory Dimmer

**Effective date:** 2026-06-09 · **Applies to version:** 1.0.0

LoveSpark Sensory Dimmer is a free, open-source browser extension that helps reduce sensory overload by dimming pages and lowering their brightness, contrast, and color saturation. This policy explains, in plain language, exactly how the extension handles your data. The short version: it stores your preferences on your own device and sends nothing, anywhere, ever.

## What we store

The extension keeps a small amount of data **locally on your device only**, using your browser's `chrome.storage.local` API. This includes:

- **Your dimming settings** — the brightness, contrast, and color-saturation levels you choose.
- **On/off state** — whether dimming is currently active.
- **Per-site preferences** — if you set different dimming levels for specific sites, those choices are remembered so the right look is restored when you return.
- **Your last-used "one click calm" preset** — so the calming look you prefer is ready instantly.

That is the complete picture. The extension does **not** store your name, email address, browsing history, the contents of the pages you visit, or any other personal or identifying information. The data above never leaves your browser.

## What we transmit

**Zero data is transmitted externally.** The extension contains:

- No analytics.
- No telemetry or usage tracking.
- No remote servers, APIs, or "phone home" calls of any kind.
- No accounts, sign-in, or sync to any cloud service.
- No advertising and no advertising networks.

Everything the extension does happens locally, inside your own browser, on the page you are looking at. Nothing is uploaded, shared, or sold.

## Permissions

The extension requests only the minimum permissions needed to do its single job — dimming the page in front of you. Each one is explained below.

- **`storage`** — Used to save your dimming settings (brightness, contrast, saturation, on/off state, and per-site preferences) on your device so they persist between page loads and across browser restarts. This permission only writes to local storage on your machine; it cannot send data anywhere.
- **`activeTab`** — Used to apply the dimming effect to the page in the tab you are currently looking at, **only when you click the extension**. It grants temporary, one-time access to that single active tab at the moment you invoke the extension — not to your other tabs and not to your browsing in general.
- **`scripting`** — Used to inject the styling that performs the dimming, brightness, contrast, and saturation adjustments into the current page. This is what actually produces the calming effect on screen. It is used solely to apply visual changes to the page you chose to dim.

## Host permissions

**None.** The extension does **not** request broad host permissions such as `<all_urls>` or access to any specific website. Instead, it relies on the `activeTab` permission, which grants access only to the single tab you explicitly act on, and only at the moment you click the extension.

To be explicit about what this access is **not** used for: the extension does **not** read or collect your browsing history, does **not** track which sites you visit, does **not** monitor your activity across pages, and does **not** inject advertisements, trackers, or any third-party code. The only thing it does on a page is apply the visual dimming you requested.

## Third-party services

**None.** The extension uses no third-party services, no external SDKs, no advertising networks, no analytics providers, and no content delivery networks for data. There are no third parties involved in any part of how the extension works, because nothing leaves your device.

## Children's privacy

The extension collects no personal data from anyone, including children under the age of 13. Because there is no data collection, transmission, or tracking of any kind, the extension is safe for users of all ages and complies with children's privacy protections by design.

## Changes to this policy

If this policy is ever updated, the changes will be published in the project's public repository, and the **Effective date** and **version** at the top of this document will be revised. Because the extension is open source, the full history of any change is visible in the repository's commit log. Continued use of the extension after an update reflects acceptance of the revised policy.

## Contact

Questions, concerns, or privacy-related requests can be raised via GitHub issues:

- https://github.com/Joona-t/lovespark-sensory-dimmer/issues

## Open source / verification

You do not have to take our word for any of the claims above — you can verify them yourself. The complete source code of the extension is public and open source (MIT licensed). Anyone can read it to confirm that data is stored only in `chrome.storage.local` and that nothing is transmitted externally:

- https://github.com/Joona-t/lovespark-sensory-dimmer
