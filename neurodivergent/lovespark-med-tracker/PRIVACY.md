# Privacy Policy — LoveSpark Med Tracker

**Effective date:** 2026-07-08 · **Applies to:** LoveSpark Med Tracker version 1.0.35 and later

LoveSpark Med Tracker is a privacy-first browser extension. It exists to help you log your medication doses with one click and remind you when a dose is due — nothing more. This policy explains, in plain language, exactly what the extension stores, what it does not do, and why each permission it requests exists. The short version: **everything stays on your own device, and nothing is ever sent anywhere.**

## What we store

All data lives **only** in your browser's local extension storage (`chrome.storage.local`) on your own device. It never leaves your computer. Depending on how you use the extension, this may include:

- **Your medications** — the names, dosages, and any labels you enter for the medications you want to track.
- **Reminder schedules** — the times and intervals you set for when doses are due.
- **Dose logs** — a record of the doses you mark as taken (which medication, and the date/time you logged it), so you can answer "did I take my meds?"
- **Streaks and counters** — derived tallies (e.g. consecutive on-time days, doses logged today) computed from your own dose logs.
- **Settings and preferences** — your chosen theme, notification preferences, and other UI options.

This information is created by you, for you. There are no accounts, no sign-in, and no user profiles. If you uninstall the extension or clear its storage, this data is permanently removed from your device.

## What we transmit

**Zero data is transmitted externally.** LoveSpark Med Tracker:

- Sends **no** data to any server — there is no LoveSpark server, and no third-party server, involved at any point.
- Contains **no** analytics, telemetry, tracking pixels, or usage reporting.
- Runs **no** remote code and loads **no** remote resources.
- Serves **no** ads.

The extension functions entirely offline. It does not make network requests to store, sync, or report anything.

## Permissions

The extension requests only the minimum permissions needed for its single purpose — medication tracking and reminders — and uses each one solely for that purpose:

- **`storage`** — Saves your medications, schedules, dose logs, streaks, and settings locally in your browser so they persist between sessions. This is the only place your data is kept, and it stays on your device.
- **`alarms`** — Schedules the reminders you configure, so the extension can wake at the right time to prompt you about a due dose. Alarms are used only for your medication reminders; they trigger nothing that leaves your device.
- **`notifications`** — Displays the actual reminder notification ("time to take your medication") when a scheduled alarm fires. Notifications are generated locally from your own schedule and contain only the information you entered.

## Host permissions

**None.** LoveSpark Med Tracker requests **no host permissions** and **no access to any website**. It cannot read, monitor, or modify the pages you visit.

Because it has no host access, the extension does **not**:

- Collect or track your browsing history or the URLs you visit.
- Read, alter, or inject content into any web page.
- Insert ads, trackers, or any third-party code into your browsing.

The extension operates entirely within its own popup and background logic and never touches your web activity.

## Third-party services

**None.** LoveSpark Med Tracker uses no third-party services, SDKs, libraries-as-a-service, cloud storage, or external APIs. There are no third parties with whom data could be shared, because no data ever leaves your device.

## Children's privacy

LoveSpark Med Tracker collects **no personal data from anyone**, including children under the age of 13. Because all information stays local to your device and nothing is ever transmitted, the extension is safe for users of all ages. We do not, and cannot, knowingly collect data from children — or from anyone.

## Changes to this policy

If this policy is ever updated, the revised version will be published in the extension's public source repository, and the effective date and version at the top of this document will be updated. Because the extension is open source, the full history of any change is publicly viewable in the repository's commit log:

<https://github.com/Joona-t/lovespark-med-tracker>

## Contact

Questions, concerns, or reports about privacy can be raised via GitHub issues:

<https://github.com/Joona-t/lovespark-med-tracker/issues>

## Open source / verification

You don't have to take our word for any of the claims above. LoveSpark Med Tracker is fully open source, and anyone can read the complete source code to verify that data stays local and nothing is transmitted:

<https://github.com/Joona-t/lovespark-med-tracker>
