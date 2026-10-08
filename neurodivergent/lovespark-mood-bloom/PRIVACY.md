# Privacy Policy — LoveSpark Mood Bloom

**Effective date:** 2026-07-08 · **Applies to:** LoveSpark Mood Bloom v1.0.30

LoveSpark Mood Bloom is a free, open-source browser extension for logging your daily mood and watching a virtual garden grow over time. Your privacy is not a feature we sell — it is the default. This extension stores everything on your own device and sends **nothing** anywhere. This policy explains exactly what that means.

---

## What we store

All data lives **only** in your browser's local extension storage (`chrome.storage.local`) on your own device. Specifically, the extension keeps:

- **Mood check-ins** — the mood/emoji you pick for a given day and its date, so your history is preserved and your garden reflects it.
- **Garden / bloom state** — which flowers have grown and their progress over time, derived from your check-ins.
- **Streaks and counters** — e.g. your current and longest check-in streaks and total number of check-ins, so the extension can show your progress.
- **Preferences and settings** — your chosen theme and any reminder/check-in settings you configure.

That's it. No names, no email, no account, no login. There is nothing to sign up for and no profile. This data never leaves your device, and you can wipe it at any time by removing the extension or clearing its storage in your browser.

---

## What we transmit

**Zero.** No data of any kind is transmitted, uploaded, or shared externally.

- **No servers.** The extension has no backend and makes no network requests to send your data anywhere.
- **No analytics.** We do not use Google Analytics or any other analytics service.
- **No telemetry.** We do not collect usage metrics, crash reports, or diagnostics.
- **No tracking.** We do not track you across sites, sessions, or devices.
- **No ads.** The extension serves no advertising and contains no ad or tracking code.
- **No remote code.** All code that runs ships inside the extension package and is reviewable; nothing is fetched or executed from a remote source.

---

## Permissions

The extension declares only the minimum permissions it needs. Each one exists solely to make Mood Bloom work as described:

- **`storage`** — Saves your mood check-ins, garden/bloom state, streaks, counters, and settings locally in your browser so they persist between sessions. This is local storage only; it is never used to send data off your device.
- **`alarms`** — Schedules a lightweight local timer used for daily check-in reminders and for rolling your streak/day over correctly. It fires entirely within your browser and transmits nothing.

The extension requests **no** other permissions — no `tabs`, no `history`, no `cookies`, no `notifications` beyond what these features require, and no access to the content of the pages you visit.

---

## Host permissions

**None.** LoveSpark Mood Bloom requests no host permissions and no access to any website. It does not read, modify, or inject anything into the pages you browse.

Because it holds no host access, the extension **cannot** and **does not**:

- read or collect your browsing history or the URLs you visit,
- read the content of any web page,
- inject ads, trackers, scripts, or any other code into websites,
- monitor your activity across sites.

Mood Bloom operates entirely within its own popup and local storage.

---

## Third-party services

**None.** The extension uses no third-party SDKs, no external APIs, no cloud services, no fonts or scripts loaded from remote servers, and no payment or advertising networks. There is no third party to share data with, because no data ever leaves your device.

---

## Children's privacy

LoveSpark Mood Bloom collects **no** personal data from anyone — including children under the age of 13. Because nothing is collected, stored off-device, or transmitted, the extension is safe for users of all ages and complies with children's privacy protections by design.

---

## Changes to this policy

If this policy ever changes, the update will be published in the extension's public source repository, and the version number and effective date at the top of this document will be updated. Because the repository is public and version-controlled, the full history of this policy is always available for you to review:

<https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-mood-bloom>

---

## Contact

Questions, concerns, or reports? Open an issue on GitHub:

<https://github.com/Joona-t/lovespark-extensions/issues>

---

## Open source / verification

You don't have to take our word for any of this. LoveSpark Mood Bloom is fully open source (MIT licensed). Every claim in this policy — local-only storage, zero transmission, no third parties, no tracking — can be independently verified by reading the source code:

<https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-mood-bloom>
