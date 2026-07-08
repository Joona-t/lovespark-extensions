# Privacy Policy — LoveSpark Tab Garden

**Effective date:** 2026-07-08 · **Applies to version:** 1.0.25

LoveSpark Tab Garden is a free, open-source browser extension. It is built privacy-first: everything it does happens **locally, inside your own browser**. It has no accounts, no servers, and no tracking. This policy explains — in plain language — exactly what the extension stores, what it never does, and why each permission exists.

---

## What we store

All data lives **only** on your device, in your browser's `chrome.storage.local`. Nothing is ever uploaded. Specifically, the extension keeps:

- **Your settings** — preferences such as how long a tab may sit unused before it is gently archived, notification/reminder options, theme, and any other options you choose in the extension.
- **Your garden (archived tabs)** — for each tab that gets archived, a small local record so you can restore it later. This typically includes the page **title**, its **URL**, and the **time it was archived**. This is the data that lets you "water" a tab back to life.
- **Counters and streaks** — simple local tallies used to show your progress (for example, how many tabs you've archived or restored, and any streaks). These are numbers stored on your device for display in the extension.

That's it. This data never leaves your browser, and you can clear it at any time by removing the extension or clearing its storage.

---

## What we transmit

**Zero.** The extension transmits **no data whatsoever** to any external destination.

- No analytics.
- No telemetry.
- No tracking pixels or beacons.
- No remote servers, APIs, or databases.
- No cloud sync, no accounts, no logins.
- No remote code is downloaded or executed.
- No advertising, and no data is ever sold or shared — because none is ever collected off your device.

Your tabs, your garden, and your settings stay on your machine, full stop.

---

## Permissions

The extension requests only the permissions it genuinely needs. Each one serves the single purpose of archiving and restoring your tabs.

- **`storage`** — Saves your settings, your archived-tab garden, and your counters/streaks locally in `chrome.storage.local`. This is what lets your garden and preferences persist between browser sessions. It is used **only** for local storage; it is never used to transmit anything.
- **`tabs`** — Lets the extension see your currently open tabs so it can identify ones that have gone unused, gently archive them, and restore ("water") them back when you ask. Tab titles and URLs are read for this purpose and stored **only locally** as your garden records — they are never sent anywhere.
- **`alarms`** — Schedules periodic, low-frequency background checks so the extension can notice when a tab has been unused long enough to archive, without you having to trigger it manually. It is a local timer only; it contacts no network.

---

## Host permissions

**None.** LoveSpark Tab Garden declares **no host permissions** and requests no access to the content of the websites you visit.

To be explicit about what this means: the extension does **not** read, inject into, or modify web page content; it does **not** collect your browsing history; and it does **not** insert ads, trackers, or scripts into any site. It works only with your browser's tab list (via the `tabs` permission), not with the pages themselves.

---

## Third-party services

**None.** The extension uses no third-party services, SDKs, analytics providers, ad networks, or external libraries that phone home. There are no external dependencies that receive your data, because no data is ever sent anywhere.

---

## Children's privacy

LoveSpark Tab Garden collects **no personal data from anyone**, including children under the age of 13. Because nothing is collected, transmitted, or shared, the extension is safe for users of all ages and complies with children's privacy protections by design.

---

## Changes to this policy

If this policy ever changes, the updated version will be published in the project's public repository, and the **effective date** and **version** at the top of this document will be updated. Because the extension is open source, the full history of any changes is publicly visible in the repository's commit log:

<https://github.com/Joona-t/lovespark-tab-garden>

---

## Contact

Questions, concerns, or privacy reports are welcome. Please open an issue here:

<https://github.com/Joona-t/lovespark-tab-garden/issues>

---

## Open source / verification

You do not have to take our word for any of the claims above — you can verify them yourself. LoveSpark Tab Garden is fully open source under the MIT license. Read the complete source code, inspect every permission, and confirm that no data ever leaves your device:

<https://github.com/Joona-t/lovespark-tab-garden>
