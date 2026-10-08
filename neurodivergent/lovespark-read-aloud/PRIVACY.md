# Privacy Policy — LoveSpark Read Aloud

**Effective date:** 2026-06-09 · **Applies to version:** 1.0.28

LoveSpark Read Aloud is a free, open-source browser extension that reads any webpage aloud. This policy explains, in plain language, exactly what the extension stores, what it does not do, and why each permission exists. The short version: **everything stays on your device, and nothing is ever sent anywhere.**

---

## What we store

LoveSpark Read Aloud keeps a small amount of data **locally on your own computer**, using the browser's `chrome.storage.local` mechanism. This data never leaves your device. It exists only so the extension remembers your preferences between sessions.

Specifically, the extension may store:

- **Your reading settings** — the chosen voice, speaking rate/speed, and pitch.
- **ADHD speed presets** — which speed preset you have selected or customized.
- **Sentence highlighting preference** — whether sentence-by-sentence highlighting is turned on.
- **Reading position memory** — the last point you were reading on a page, so you can resume where you left off.
- **General preferences** — interface options such as your selected theme, plus any simple local counters the extension uses to display your own usage at a glance.

That is the complete list. There are no accounts, no profiles, no identifiers, and no hidden data files. You can clear all of it at any time by removing the extension or clearing the browser's local storage for it.

---

## What we transmit

**Zero data is transmitted externally. None. Ever.**

- No analytics.
- No telemetry.
- No tracking pixels or beacons.
- No remote servers — we don't operate any.
- No data is sold, shared, or sent to anyone.

Text-to-speech is performed by your browser's own built-in speech engine on your device. The extension reads the page text locally and speaks it locally. Nothing about what you read, where you browse, or how you use the extension is uploaded anywhere.

---

## Permissions

The extension requests the minimum permissions needed to function. Each one maps directly to the extension's single purpose — reading webpages aloud:

- **`storage`** — Used solely to save your preferences locally (voice, speed, pitch, highlighting toggle, reading position, theme) via `chrome.storage.local` so they persist between sessions. This data stays on your device.
- **`activeTab`** — Grants temporary access to the page in the tab you are currently on, **only when you activate the extension**. This lets it read that page's text so it can be spoken aloud. It does not grant standing access to any other tab or to your browsing in general.
- **`tabs`** — Used to identify the active tab you are reading and to keep reading position and playback associated with the correct page. It is not used to build a history of the sites you visit.
- **`scripting`** — Used to inject the small content script that extracts the readable text from the current page and highlights each sentence as it is spoken. The script runs locally and only performs reading-related tasks.

None of these permissions are used to collect, profile, or transmit information about you.

---

## Host permissions

**LoveSpark Read Aloud declares no host permissions.** It does not request broad access to all websites.

Instead, it relies on `activeTab`, which gives it access to a page **only at the moment you choose to use the extension on that page** — and nothing more. Because there is no broad host access:

- It does **not** read or record your browsing history.
- It does **not** monitor pages in the background.
- It does **not** inject ads, trackers, or any third-party content into the pages you visit.

The extension touches a page only to read its text aloud, and only when you ask it to.

---

## Third-party services

**None.** LoveSpark Read Aloud uses no third-party services, SDKs, analytics providers, advertising networks, or external APIs. Speech is generated entirely by your browser's built-in capabilities on your own device.

---

## Children's privacy

LoveSpark Read Aloud collects **no personal data from anyone**, including children under the age of 13. Because nothing is collected, profiled, or transmitted, the extension is safe for users of all ages.

---

## Changes to this policy

If this policy ever changes, the updated version will be published in the public source repository, and the effective date and version line at the top of this document will be updated. Because the extension is open source, every change to this policy is part of the public version history and can be reviewed by anyone.

---

## Contact

Questions, concerns, or reports can be filed via GitHub issues:
**https://github.com/Joona-t/lovespark-extensions/issues**

---

## Open source / verification

You do not have to take our word for any of this. LoveSpark Read Aloud is fully open source, and you (or anyone) can read the complete source code to verify exactly what it does:
**https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-read-aloud**

The code is the proof: it stores data only in `chrome.storage.local`, transmits nothing externally, uses no third-party services, and runs no remote code.
