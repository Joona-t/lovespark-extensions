# Privacy Policy — LoveSpark Body Double

**Effective date:** July 8, 2026
**Applies to version:** 1.0.31

LoveSpark Body Double is a free, open-source browser extension that acts as a virtual focus companion — Sparky sits with you while you work, offering ADHD body doubling, a focus timer, gentle encouragement, and session tracking. This policy explains, in plain language, exactly what the extension does and does not do with your data.

**The short version:** Everything stays on your device. The extension collects no personal data, sends nothing to any server, uses no analytics or trackers, and has no account system. You can verify every word of this by reading the source code (linked at the bottom).

---

## What we store

The extension stores a small amount of data **locally on your own device only**, using the browser's `chrome.storage.local` API. This never leaves your computer. It includes:

- **Your settings and preferences** — such as your chosen focus/session duration, timer configuration, and any encouragement or companion options you set.
- **Timer and session state** — the current or most recent focus session so the timer can keep working and resume correctly.
- **Session tracking data** — counts of focus sessions you've completed and related progress used to show your activity over time.
- **Streaks and counters** — day streaks and tallies that reflect your ongoing use, kept so the extension can display your progress.

That's it. All of this is ordinary usage data that the extension needs to function, and all of it lives solely in your browser's local storage. You can clear it at any time by removing the extension or clearing its data through your browser.

---

## What we transmit

**Zero data is transmitted externally.** Specifically:

- **No servers.** The extension does not talk to any backend, API, or remote service of ours.
- **No analytics.** There is no usage analytics, tracking, or measurement of any kind.
- **No telemetry.** Nothing about your sessions, settings, streaks, or behavior is reported anywhere.
- **No accounts, no sign-in, no sync uploads.** There is nothing to log into and nothing to upload.
- **No remote code.** The extension runs only the code that ships inside it; it does not fetch or execute code from the internet.
- **No ads.** The extension serves no advertising and works with no ad networks.

Your data stays on your device, full stop.

---

## Permissions

The extension requests the minimum permissions needed to do its one job — being a local focus companion. Each is explained below.

- **`storage`** — Used to save your settings, timer/session state, session counts, and streaks locally in your browser (`chrome.storage.local`) so they persist between sessions and browser restarts. This permission is used only for local storage on your device; it is never used to send data anywhere.
- **`alarms`** — Used to power the focus/body-doubling timer. Browser alarms let the timer keep accurate time and notify you when a focus session ends, even if the popup is closed. This permission is used only to run the extension's own timer; it is not used to track you or contact any external service.

---

## Host permissions

**None.** The extension requests **no host permissions** and **no access to any website**. It does not run on, read, or modify the pages you visit.

Because it has no access to your web pages or browsing:

- It does **not** collect or read your browsing history.
- It does **not** read, monitor, or record the content of any website you visit.
- It does **not** inject ads, trackers, scripts, or any content into web pages.

The extension operates entirely within its own popup and background timer — nothing else.

---

## Third-party services

**None.** The extension uses no third-party services, no third-party SDKs, no external analytics, no crash reporting, no advertising networks, and no content delivery networks. There are no external dependencies that receive any of your data.

---

## Children's privacy

The extension collects **no personal data from anyone**, including children under the age of 13. Because nothing is collected, transmitted, or shared, there is no personal information at risk for users of any age. LoveSpark Body Double is safe for all ages.

---

## Changes to this policy

If this policy ever changes, the updated version will be published in the extension's public repository, and the **effective date** and **version** at the top of this document will be updated. Because the repository is public and open source, any change to this policy is fully visible in the project's version history. Continued use of the extension after an update reflects acceptance of the revised policy.

---

## Contact

Questions, concerns, or reports? Please open an issue on GitHub:

**https://github.com/Joona-t/lovespark-extensions/issues**

---

## Open source / verification

You don't have to take our word for any of this. LoveSpark Body Double is fully open source, and every claim in this policy can be verified by reading the code:

**https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-body-double**

There are no hidden network calls, no obfuscated code, and no remote endpoints — what you read in the source is exactly what runs on your device.
