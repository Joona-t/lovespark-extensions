# Privacy Policy — LoveSpark Hyperfocus Guard

**Effective date:** 2026-06-09 · **Version:** 1.0.0

LoveSpark Hyperfocus Guard is built privacy-first. It runs entirely on your own device. It does not have user accounts, does not send your data anywhere, and is free and open source. This policy explains exactly what that means.

## What we store

The extension keeps a small amount of data **locally on your device only**, using the browser's `chrome.storage.local` API. This includes:

- **Your settings** — for example your time-on-site threshold (when an alert should fire), whether alerts are enabled, and any theme or display preferences you choose.
- **Time-on-site counters** — how long the currently active site has been in focus, used to drive the badge timer and to decide when to gently alert you. These are working counters for the awareness feature, not a permanent browsing log.
- **Lightweight feature state** — any small bits the extension needs to function correctly between events (such as the timestamp it started counting the current site).

This data never leaves your browser. You can clear it at any time by removing the extension or clearing the extension's storage in your browser settings.

## What we transmit

**Zero.** No data is transmitted off your device — ever.

- No analytics.
- No telemetry.
- No external servers or APIs.
- No tracking of any kind.

There is no backend. The extension has nothing to send and nowhere to send it.

## Permissions

The extension requests only the permissions it needs to do its one job — making you aware of how long you've spent on a single site. Each is explained below.

- **`storage`** — Saves your settings (such as your threshold and alert preferences) and the time-on-site counters locally via `chrome.storage.local`, so your configuration persists between sessions. Used only for local storage; nothing is uploaded.
- **`alarms`** — Schedules lightweight periodic checks so the extension can update the time-on-site badge and gently alert you once your configured threshold is reached, without continuously running in the background.
- **`tabs`** — Detects which tab is currently active and when you switch sites, so it can measure how long you've been on the current site and reset the timer when you move on. It reads only what it needs to know which site is active for timing; it does not read, store, or transmit the content of your pages.

## Host permissions

**None.** This extension requests no host permissions and no broad site access. It does **not** read the content of the web pages you visit, does **not** build a browsing history, and does **not** inject ads, trackers, or any other code into the pages you view. It only needs to know which site is currently active in order to time it.

## Third-party services

**None.** The extension uses no third-party services, SDKs, libraries-as-a-service, advertising networks, or analytics providers. It runs no remote code.

## Children's privacy

The extension collects no personal data from anyone, including children under 13. Because nothing is collected and nothing is transmitted, it is safe for users of all ages.

## Changes to this policy

If this policy ever changes, the updated version will be published in the public source repository, with the version and effective date updated at the top of this document. Because the extension and its policy are open source, any change is publicly visible in the repository's history:

https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-hyperfocus-guard

## Contact

Questions, concerns, or reports? Please open an issue:

https://github.com/Joona-t/lovespark-extensions/issues

## Open source / verification

You do not have to take our word for any of this. LoveSpark Hyperfocus Guard is fully open source, and you can read the complete source code to verify exactly what it stores, what permissions it uses, and that it transmits nothing:

https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-hyperfocus-guard
