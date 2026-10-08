# Privacy Policy — LoveSpark Morning Routine

**Effective date:** June 9, 2026
**Version:** 1.0.0

LoveSpark Morning Routine is a free, open-source browser extension that helps you build an ADHD-friendly morning routine — checking off meds, water, breakfast, hygiene, and planning your day, with the checklist resetting each morning. Your privacy is built into how the extension works: everything stays on your own device.

**The short version:** This extension collects nothing, sends nothing, and has no servers. All of your data lives only in your own browser.

---

## What we store

The extension saves a small amount of data **locally on your device** using your browser's `chrome.storage.local` API. This stays in your browser and is never sent anywhere. It includes only what's needed to make the routine work:

- **Your routine items and their checked/unchecked state** — which tasks (meds, water, breakfast, hygiene, plan your day, and any you add) you've completed today.
- **Your daily plan notes** — any text you write when planning your day.
- **Daily reset bookkeeping** — a date marker so the checklist knows when a new day has started and can reset itself.
- **Streak / habit progress** — counts of completed days so you can see your routine habit building over time.
- **Your preferences / settings** — such as the selected theme and any display options.

That's it. There are no accounts, no sign-ups, no profiles, and no identifiers. We never ask for your name, email, location, or any personal information.

## What we transmit

**Zero data is transmitted externally.** Nothing you enter or do in this extension ever leaves your device. Specifically:

- **No servers** — the extension has no backend and makes no network requests.
- **No analytics or telemetry** — we do not track usage, clicks, page views, or behavior.
- **No cloud sync** — your data is not uploaded, backed up remotely, or shared between devices.
- **No remote code** — the extension runs only the code shipped in the package; it never downloads or executes code from the internet.
- **No ads** — there is no advertising and no ad-related tracking of any kind.

If you uninstall the extension, the data stored in `chrome.storage.local` is removed by your browser along with it.

## Permissions

The extension requests the **minimum** permissions required to function:

- **`storage`** — Used solely to save your checklist state, daily plan, streak progress, and settings locally in your browser via `chrome.storage.local`, and to reset the checklist each new day. This is what lets your routine persist between visits and restarts. It is **not** used to collect, share, or transmit any data — storage is entirely on your own device.

No other permissions are requested.

## Host permissions

**None.** This extension requests **no host permissions** and no access to any websites. It cannot read, modify, or monitor the pages you visit, and it does not run on or interact with any web content.

Because there are no host permissions, the extension does **not**:

- collect or read your browsing history,
- track which sites you visit,
- inject ads, trackers, or scripts into web pages,
- or access any data on the sites you use.

The extension operates entirely within its own popup interface.

## Third-party services

**None.** This extension uses no third-party services, SDKs, analytics providers, advertising networks, or external libraries that phone home. There are no embedded trackers and no outside parties with any access to your data.

## Children's privacy

This extension collects **no personal data from anyone**, including children under the age of 13. Because nothing is collected, transmitted, or shared, it is safe for users of all ages. It complies with children's privacy protections (including COPPA principles) by design — there is simply no data to gather.

## Changes to this policy

If this policy ever changes, the updated version will be published in the public source repository, along with an updated effective date and version number. Because the project is open source, the full history of any changes is visible to everyone. Continued use of the extension after an update reflects the current policy as published in the repository.

## Contact

Questions, concerns, or feedback? Please open an issue:

**https://github.com/Joona-t/lovespark-extensions/issues**

## Open source / verification

You don't have to take our word for any of this — **you can verify it yourself.** LoveSpark Morning Routine is fully open source. Anyone can read the complete source code to confirm that data is stored only locally, nothing is transmitted, and no third-party services are used:

**https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-morning-routine**

*LoveSpark — free, open-source, privacy-first tools for neurodivergent minds. No ads. No data collection. Always free.*
