# Privacy Policy — Study Bubbles by LoveSpark

**Effective date:** 8 July 2026 · **Applies to version:** 1.0.29

Study Bubbles by LoveSpark is a free, open-source browser extension that lets you highlight text on any page to create local flashcards ("study bubbles") and review them with spaced repetition. Your personal knowledge base lives entirely on your own device.

**Our promise in one sentence: Study Bubbles collects nothing, sends nothing, and shares nothing.** Everything you create stays in your browser's local storage on your computer.

---

## What we store

Study Bubbles saves data **only** in your browser's local extension storage (`chrome.storage.local`), which lives on your device. This includes:

- **Your study bubbles** — the text snippets you highlight and turn into flashcards, along with any front/back content and notes you add.
- **Spaced-repetition scheduling data** — each card's next-review date, review intervals, ease factor, and lapse count, so the algorithm knows what to show you and when.
- **Review history and counters** — how many cards you've reviewed, how you rated each one, and similar progress tallies.
- **Streaks** — your day-to-day study streak count.
- **Settings and preferences** — your chosen theme and any other options you configure in the extension.

That's it. There are no accounts, no logins, no profiles, and no cloud database. If you uninstall the extension or clear its storage, this data is removed from your device.

## What we transmit

**Zero data is transmitted externally.** Study Bubbles has no servers, no backend, and no network calls of its own. Specifically:

- **No analytics.** We do not track how you use the extension.
- **No telemetry.** We do not send crash reports, usage metrics, or diagnostics.
- **No external servers.** Nothing you create or do is uploaded, synced, or shared anywhere.
- **No advertising.** We serve no ads and use no ad networks.

Your study bubbles never leave your browser.

## Permissions

Study Bubbles requests the minimum permissions needed to work, and each is used only for the extension's stated purpose:

- **`storage`** — Used to save your study bubbles, spaced-repetition scheduling, review history, streaks, and settings locally in `chrome.storage.local` so your knowledge base persists between browsing sessions. This permission enables local saving only; it does not grant any network or syncing capability.
- **`activeTab`** — Used to read the text you highlight on the page you're currently viewing, at the moment you choose to create a study bubble. Access is limited to the active tab and only in response to your action. It is not used to monitor, log, or read pages in the background.

## Host permissions

**Study Bubbles requests no host permissions.** It does not declare access to `<all_urls>` or any broad website pattern. Instead, it relies solely on `activeTab`, which grants temporary, one-time access to the current tab only when you invoke the extension.

Because of this, Study Bubbles:

- does **not** collect, store, or transmit your browsing history;
- does **not** read pages you haven't explicitly acted on;
- does **not** run in the background across your tabs;
- does **not** inject ads, trackers, or third-party code into any website.

## Third-party services

**None.** Study Bubbles uses no third-party services, SDKs, analytics providers, advertising networks, or external APIs. No remote code is loaded or executed. All code runs locally from the extension package you installed.

## Children's privacy

Study Bubbles collects **no personal data from anyone**, including children under the age of 13. Because there is no data collection, transmission, or account system of any kind, the extension is safe for users of all ages. It complies with children's privacy protections (such as COPPA) by design — there is simply nothing to collect.

## Changes to this policy

If this privacy policy changes, the updated version will be published in the extension's public source repository, and the **Effective date** and **version** at the top of this document will be updated. Because the repository is public, you can review the full history of any changes at any time.

## Contact

Questions, concerns, or reports? Please open an issue:

**https://github.com/Joona-t/lovespark-extensions/issues**

## Open source / verification

Study Bubbles is fully open source. You don't have to take our word for any of the claims above — you can read every line of the code and verify exactly what the extension does (and does not do):

**https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/study-bubbles**

Privacy-first, local-only, always free. 💗
