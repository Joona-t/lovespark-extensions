# Privacy Policy — LoveSpark Breathe

**Effective date:** 2026-07-08 · **Applies to version:** 1.0.23

LoveSpark Breathe is a free, open-source browser extension that offers breathing exercises, grounding techniques, and comment dimming to support emotional regulation for ADHD brains. Your privacy is not a feature we sell — it is the foundation the extension is built on. **LoveSpark Breathe collects no personal data, sends nothing to any server, and has no ads, analytics, or trackers of any kind.** Everything the extension remembers stays on your own device.

## What we store

The extension keeps a small amount of data **locally on your device only**, using the browser's `chrome.storage.local` API. This may include:

- **Your settings and preferences** — chosen breathing patterns and pacing, session length, grounding-technique choices, whether comment dimming is enabled, theme/appearance options, and reduced-motion preferences.
- **Session counters** — how many breathing or grounding sessions you have completed, used to show your own progress back to you.
- **Streaks** — day-to-day usage streaks so you can see your consistency.

This data never leaves your browser. It exists only so the extension can remember your choices and show you your own progress. You can erase all of it at any time by clearing the extension's storage or removing the extension.

## What we transmit

**Zero data is transmitted externally.** LoveSpark Breathe:

- Sends **no** data to us, to any LoveSpark server, or to any third party.
- Contains **no** analytics, telemetry, crash reporting, or usage tracking.
- Makes **no** network requests to external servers for its features.
- Runs **no** remote code — all logic ships inside the extension and is auditable.

There is no account, no login, and no sync to a cloud service. Nothing about you is ever collected or uploaded.

## Permissions

The extension requests the minimum permissions needed for its stated purpose, and nothing more. Here is exactly why each one exists:

- **`storage`** — Used to save your settings, counters, and streaks locally in `chrome.storage.local` so the extension remembers your preferences and progress between sessions. This permission does not enable any external transmission; it is device-local storage only.
- **`activeTab`** — Grants temporary access to the tab you are currently viewing, and **only** when you actively invoke the extension (for example, to apply comment dimming to the page in front of you). Access is scoped to that single tab, for that single interaction, and does not persist in the background.
- **`tabs`** — Used to identify the currently active tab so that comment dimming and on-page features are applied to the correct page. It is **not** used to read, log, or transmit your browsing history, URLs, or the contents of pages you visit.

## Host permissions

**LoveSpark Breathe declares no host permissions.** It does not request standing access to any website or to `<all_urls>`. Because it relies on `activeTab`, the extension can only act on a page when you explicitly trigger it, and only for that page in that moment.

This means the extension does **not**:

- Collect, store, or transmit your browsing history.
- Read page content in the background or across sites.
- Inject ads, trackers, or any third-party code into the pages you visit.

## Third-party services

**None.** LoveSpark Breathe uses no third-party services, SDKs, libraries-as-a-service, content delivery networks, fonts, or analytics providers that receive your data. There are no external dependencies that see any information about you.

## Children's privacy

LoveSpark Breathe collects **no personal data from anyone**, including children under the age of 13. Because nothing is ever collected or transmitted, the extension is safe for users of all ages and complies with children's privacy protections by design.

## Changes to this policy

If this policy ever changes, the updated version will be published in the extension's public repository, and the **effective date** and **version** at the top of this document will be updated. Because the extension is open source, every change is transparent and part of the public commit history. Continued use of the extension after an update constitutes acceptance of the revised policy.

## Contact

Questions, concerns, or reports? Please open an issue here:

**https://github.com/Joona-t/lovespark-extensions/issues**

## Open source / verification

You do not have to take our word for any of the claims above — you can verify them yourself. LoveSpark Breathe is fully open source, and the complete source code is available for inspection:

**https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-breathe**

Anyone can read the code to confirm that data is stored only in `chrome.storage.local`, that no external network requests are made, and that no data is ever collected or transmitted.
