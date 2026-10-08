# Privacy Policy — Porn Blocker Rewire Brain 🧠

**Effective date:** 2026-06-09 · **Applies to version:** 2.4.5

Porn Blocker Rewire Brain is a free, open-source browser extension built by LoveSpark. It is designed from the ground up to protect your privacy: everything it does happens entirely inside your own browser. **It collects no personal data, sends nothing to any server, and has no accounts, no analytics, and no ads.**

This policy explains, in plain language, exactly what the extension stores and what it does — and does not — do with your information.

---

## What we store

Everything the extension saves is kept **locally on your own device**, inside your browser's private extension storage (`chrome.storage.local`). It never leaves your computer. This local data may include:

- **Your blocklist** — the sites, keywords, or categories you choose to block.
- **Your settings and preferences** — for example your selected theme, the page you choose to be redirected to, notification toggles, and other on/off options you set.
- **Your streak data** — your current streak, your longest streak, and the dates used to calculate them.
- **Your counters** — local tallies such as how many blocks have occurred or daily/weekly totals, used to show your progress.

That's it. There is no profile, no login, no identifier, and no record of the specific pages you visit. The data exists only so the extension can remember your choices and show you your progress the next time you open it. If you uninstall the extension or clear your browser data, this information is permanently deleted from your device.

---

## What we transmit

**Zero data is transmitted externally. None.**

- No analytics.
- No telemetry or usage tracking.
- No crash reporting.
- No external servers, APIs, or cloud sync of any kind.
- No selling, sharing, or transfer of data to anyone — because no data ever leaves your device in the first place.

Nothing you do in this extension is sent anywhere. There is no "phone home." All processing happens locally in your browser.

---

## Permissions

The extension requests only the permissions it genuinely needs to do its single job — helping you block distracting content and build streaks. Each one is explained below.

- **`storage`** — Saves your blocklist, settings, streaks, and counters locally on your device so they persist between sessions. This is the only place your data lives.
- **`declarativeNetRequest`** — Lets your browser block requests to the sites on *your* blocklist using rules the browser itself enforces. The extension never sees the contents of your traffic; it simply hands the browser a set of block rules to apply.
- **`declarativeNetRequestWithHostAccess`** — Allows those same blocking rules to apply across the sites you've chosen to block, regardless of which site they're on. Used purely to make your block rules effective everywhere they need to be.
- **`tabs`** — Lets the extension redirect a blocked tab to your chosen "instead of this" page (for example a motivational page) and detect when a blocked site is opened so it can act. It is not used to log, store, or transmit your browsing history.
- **`alarms`** — Schedules time-based actions inside your browser, such as resetting daily counters, advancing your streak at the right time, or triggering reminders you've enabled. No external scheduling service is involved.
- **`notifications`** — Shows you local browser notifications, such as streak milestones or reminders you've turned on. Notifications are generated entirely on your device.

---

## Host permissions

The extension declares **`<all_urls>`** host access. This is required so that your blocking rules and redirect behavior can work on **any** site you decide to block — the extension cannot know in advance which sites you'll add to your blocklist, so it must be able to act across the web.

**What this broad access is NOT used for:**

- It is **not** used to read, record, or store your browsing history.
- It is **not** used to monitor, log, or transmit which pages you visit.
- It is **not** used to inject ads, trackers, analytics, or any third-party code.
- It is **not** used to read or collect page content, form data, passwords, or anything you type.

The access exists for exactly one reason: to apply *your own* block-and-redirect rules wherever you need them. Nothing observed in the course of doing that is ever stored or sent anywhere.

---

## Third-party services

**None.** This extension uses no third-party services, SDKs, libraries-as-a-service, trackers, advertising networks, or external APIs. There are no outside parties involved in any part of how it works.

---

## Children's privacy

This extension collects **no personal data from anyone**, including children under 13. Because there is no data collection, no accounts, and no transmission of any information, it is safe for users of all ages. We do not knowingly — or unknowingly — gather personal information from children, because we gather no personal information at all.

---

## Changes to this policy

If this policy ever changes, the updated version will be published in the public source repository, and the **Effective date** and **version** at the top of this document will be updated. Because the extension and its policy are open source, the full history of any changes is visible to everyone:

https://github.com/Joona-t/porn-blocker-rewire-brain-3

---

## Contact

Questions, concerns, or privacy reports? Please open an issue:

https://github.com/Joona-t/porn-blocker-rewire-brain-3/issues

---

## Open source / verification

You don't have to take our word for any of this. **Porn Blocker Rewire Brain is fully open source.** Every claim in this policy can be independently verified by reading the source code:

https://github.com/Joona-t/porn-blocker-rewire-brain-3

If you find anything that contradicts this policy, please report it via the issues link above.
