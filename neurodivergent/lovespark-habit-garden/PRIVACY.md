# Privacy Policy — LoveSpark Habit Garden

**Effective date:** Applies to LoveSpark Habit Garden version 1.0.28 and later.

LoveSpark Habit Garden is a free, open-source browser extension that helps you grow a virtual garden by building habits — tracking streaks and watching plants bloom. It is built for ADHD brains, with no account and no tracking. This policy explains exactly what the extension does and does not do with your information. The short version: **everything stays on your own device, and nothing is ever sent anywhere.**

## What we store

All data is stored **locally on your device** using the browser's `chrome.storage.local` API. This includes:

- **Your habits** — the habits you create and choose to track.
- **Streak and progress data** — current and longest streaks, completion history, and the day-to-day records used to keep streaks accurate across resets.
- **Garden state** — which plants you have grown, their growth/bloom stages, and any garden layout tied to your habits.
- **Counters and statistics** — totals such as habits completed, used to display your progress.
- **Settings and preferences** — your chosen theme, reminder timing, and other extension options.

This data lives only in your browser profile. It is never uploaded, synced to us, or shared. If you uninstall the extension or clear your browser data, this information is permanently removed.

## What we transmit

**Zero.** LoveSpark Habit Garden transmits **no data** to any external server, ever.

- No analytics.
- No telemetry.
- No tracking pixels or beacons.
- No remote servers, accounts, or cloud sync operated by us.
- No remote code execution.
- No advertising.

There is no network code that sends your habits, streaks, garden, or any other information off your device.

## Permissions

The extension requests only the minimum permissions needed for its single purpose — helping you build habits and grow your garden:

- **`storage`** — Used to save your habits, streaks, garden state, counters, and settings locally via `chrome.storage.local` so your progress persists between browser sessions. It is **not** used to transmit anything externally.
- **`alarms`** — Used to schedule local reminders and to handle time-based logic such as daily streak resets and rollovers. Alarms run entirely within your browser; they trigger no network activity and send no data anywhere.

## Host permissions

**None.** LoveSpark Habit Garden requests **no host permissions** and **no access to any website**. It does not read, monitor, or modify the pages you visit.

Because it has no website access, the extension **cannot and does not**:

- collect your browsing history,
- read page content or form data,
- inject ads, trackers, or scripts into any site,
- observe which sites you visit.

The extension operates only within its own popup and local storage.

## Third-party services

**None.** LoveSpark Habit Garden uses no third-party services, SDKs, analytics providers, advertising networks, or external APIs. There are no embedded third parties of any kind.

## Children's privacy

LoveSpark Habit Garden collects **no personal data from anyone**, including children under the age of 13. Because all data stays on the device and nothing is ever transmitted, the extension is safe for users of all ages and complies with children's privacy protections by collecting nothing at all.

## Changes to this policy

If this policy changes, the updated version will be published in the project's public repository alongside the extension's source code. The **Effective date / version** line above indicates which version of the extension the current policy applies to. Material changes will be reflected in the repository's commit history, which anyone can review.

## Contact

Questions, concerns, or reports can be filed via GitHub issues:
https://github.com/Joona-t/lovespark-extensions/issues

## Open source / verification

LoveSpark Habit Garden is fully open source. You do not have to take our word for any of the claims above — you can read and verify the entire source code yourself:
https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-habit-garden

Every claim in this policy — local-only storage, zero data transmission, no third parties, no tracking — is verifiable in the published source.
