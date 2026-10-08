# Privacy Policy — Focus Blossom: Site Blocker & Digital Detox

**Effective date:** 2026-07-08 · **Applies to version:** 1.0.44

Focus Blossom is a free, open-source browser extension that helps you block distracting sites and grow a flower garden as a reward for staying focused. Your privacy is not a feature we bolt on — it is the foundation. This policy explains, in plain language, exactly what the extension does and does not do with your information.

**The short version:** Focus Blossom stores everything locally on your own device and sends nothing anywhere. There are no servers, no accounts, no analytics, and no tracking.

---

## What we store

Focus Blossom keeps a small amount of data **only in your browser's local storage** (`chrome.storage.local`), on your own device. This includes:

- **Your block list** — the websites you have chosen to block.
- **Your settings and preferences** — such as your selected theme, notification preferences, schedule/blocking options, and any toggles you configure.
- **Your garden state** — which flowers have grown and how much they have bloomed, so your garden persists between sessions.
- **Your streaks and counters** — how long you've resisted, how many times you've stayed focused, and related progress numbers that power the bloom mechanic.
- **Timestamps** needed to calculate streaks, reset daily counters, and schedule encouragement.

This data exists so the extension can remember your choices and show your progress. It never leaves your device. Uninstalling the extension removes it, and you can clear it at any time through your browser.

---

## What we transmit

**Zero.** Focus Blossom transmits **no data whatsoever** to us or to anyone else.

- No analytics.
- No telemetry or usage tracking.
- No remote servers or cloud sync — we don't operate any backend at all.
- No accounts, logins, or user profiles.
- No remote code execution.
- No advertising.

Nothing you do in Focus Blossom is sent over the network. Everything happens locally in your browser.

---

## Permissions

Focus Blossom requests only the permissions it genuinely needs, and each is used solely for the extension's stated purpose — blocking distracting sites and growing your garden.

- **`storage`** — Saves your block list, settings, garden state, streaks, and counters locally in your browser so they persist between sessions. This is the only place your data lives.
- **`declarativeNetRequest`** — Performs the actual site blocking. Your browser applies blocking rules based on the list of sites you chose, without the extension ever reading, logging, or seeing the content of your traffic. The extension only tells the browser *which* sites to block; the browser enforces it.
- **`alarms`** — Schedules time-based logic such as resetting daily counters and streaks and timing gentle reminders. It does not access any of your data or activity.
- **`notifications`** — Displays local encouragement and reminder notifications (for example, celebrating a streak or nudging you back to focus). Notifications are generated entirely on your device.

---

## Host permissions

Focus Blossom requests **`<all_urls>`** (broad host access). Here is exactly why, and — just as importantly — what it is **not** used for.

**Why it is needed:** A site blocker must be able to block *any* website you choose to add to your list. Because you could block a site on any domain, the extension needs permission that covers all URLs so the blocking rules can apply wherever you decide.

**What it is NOT used for:**

- It is **not** used to read, collect, log, or store your browsing history.
- It is **not** used to monitor which pages you visit or what you do on them.
- It is **not** used to read, modify, or transmit the content of any page.
- It is **not** used to inject ads, trackers, analytics, or any remote code.
- It is **not** used to send anything, anywhere.

The broad permission enables one thing only: blocking the sites you asked to block.

---

## Third-party services

**None.** Focus Blossom uses no third-party services, SDKs, analytics providers, advertising networks, or external APIs. There is nothing external for your data to flow to, because your data never flows anywhere.

---

## Children's privacy

Focus Blossom collects **no personal data from anyone**, including children under the age of 13. Because the extension stores everything locally and transmits nothing, there is no personal information to collect, share, or sell. It is safe for users of all ages.

---

## Changes to this policy

If this policy ever changes, the updated version will be published in the extension's public repository, and the effective date and version above will be updated. Because Focus Blossom is open source, the full history of any changes is publicly visible in the repository's commit history. Continued use of the extension after an update constitutes acceptance of the revised policy.

---

## Contact

Questions, concerns, or reports? Please open an issue:

**https://github.com/Joona-t/focus-blossom/issues**

---

## Open source & verification

You don't have to take our word for any of this. Focus Blossom is fully open source, and you can read every line of code to verify these claims yourself:

**https://github.com/Joona-t/focus-blossom**

Everything described in this policy — local-only storage, zero transmission, no third parties — is verifiable directly from the source.
