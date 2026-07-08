# Privacy Policy — LoveSpark Gratitude Journal

**Effective date:** 2026-07-08 · **Applies to version:** 1.0.29

LoveSpark Gratitude Journal is a free, open-source browser extension that lets you write three things you're grateful for each day and watch a little garden grow as your streak builds. Your privacy is not a feature we bolt on — it's the whole design. **Everything you write stays on your own device. Nothing is ever sent anywhere.**

---

## What we store

The extension saves data **only** in your browser's local extension storage (`chrome.storage.local`), which lives on your computer. This includes:

- **Your gratitude entries** — the daily notes you write (the "3 things" and any dates attached to them).
- **Streak and consistency data** — your current streak, longest streak, day counts, and the garden-growth state derived from how consistently you journal.
- **Your settings and preferences** — such as your chosen theme and any display options.

That's it. There are **no accounts**, no sign-up, no email, no profile, and no identifiers. We do not ask for your name, and we cannot see anything you type. Because the data is stored locally, it stays under your control: clearing the extension's data or removing the extension deletes it.

---

## What we transmit

**Zero. Nothing leaves your device.**

- **No servers.** The extension does not have a backend and does not connect to one.
- **No analytics or telemetry.** We do not track usage, clicks, page views, or any behavior.
- **No accounts or sync services.** Your entries are never uploaded, backed up remotely, or synced through us.
- **No advertising.** No ads, no ad networks, no tracking pixels.

There is no data-collection pipeline anywhere in this extension because there is no code that sends data off your machine.

---

## Permissions

The extension requests exactly one permission, and only because a core feature needs it:

- **`storage`** — Used to save your gratitude entries, streaks/consistency data, and settings locally in `chrome.storage.local` so they persist between browser sessions. This permission provides **local storage only**; it does not grant network access and is never used to transmit anything. Without it, your journal and streak would reset every time you closed your browser.

No other permissions are requested.

---

## Host permissions

**None.** The extension declares no host permissions and requests no access to any website.

Because of this, the extension:

- **Does not** read, monitor, or collect your browsing history.
- **Does not** read or modify the content of any web page you visit.
- **Does not** inject ads, trackers, scripts, or any content into websites.
- **Does not** run in the background on the pages you browse.

It only operates within its own extension surface (the popup / journal view).

---

## Third-party services

**None.** The extension bundles no third-party analytics, advertising, crash-reporting, or SDKs of any kind. There are no external libraries phoning home, and no remote code is ever loaded or executed. Everything runs locally from the code shipped in the extension package.

---

## Children's privacy

The extension collects **no personal data from anyone**, including children under the age of 13. Since there is no data collection, no accounts, and no transmission of any information, it is safe for users of all ages and is compliant with children's-privacy expectations by design.

---

## Changes to this policy

If this policy ever changes, the update will be published in the public source repository with a new **Effective date** and version number. Because the repository history is public, any change is transparent and traceable over time. Continued use of the extension after an update means the current published policy applies.

---

## Contact

Questions, concerns, or reports? Please open an issue:

**https://github.com/Joona-t/lovespark-gratitude-journal/issues**

---

## Open source & verification

You don't have to take our word for any of this. LoveSpark Gratitude Journal is fully open source, and anyone can read the complete code to confirm that it stores data only locally and transmits nothing:

**https://github.com/Joona-t/lovespark-gratitude-journal**
