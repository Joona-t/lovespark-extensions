# Privacy Policy — LoveSpark Planner

**Effective date:** 2026-06-09 · **Applies to version:** 1.0.2

LoveSpark Planner is a free, open-source browser extension that helps you plan your day with a todo list and calendar, plus focus integration. It is built privacy-first: everything you create stays on your own device. This policy explains, in plain language, exactly what the extension does and does not do with your information.

**The short version:** LoveSpark Planner stores your data only in your browser's local storage (`chrome.storage.local`). It sends **zero** data to us or to anyone else. There are no servers, no analytics, no telemetry, no accounts, no ads, and no tracking of any kind.

---

## What we store

All data is kept **locally in your browser** using `chrome.storage.local`. Nothing is ever uploaded. Depending on the features you use, this local data may include:

- **Tasks / todos** — the items you add, their text, completion status, due dates, ordering, and any priorities or tags you assign.
- **Calendar events** — events and entries you create, including their dates, times, and descriptions.
- **Focus integration data** — links or state used to connect tasks to focus sessions (for example, which task you chose to focus on).
- **Reminders / scheduled alerts** — the timing information needed to notify you about a task or event.
- **Settings and preferences** — your chosen theme, layout, default views, and other configuration options.
- **Local progress data** — counters, streaks, or day-planning state used to display your activity within the extension.

This data exists only so the extension can show you your plan and remember it between sessions. It stays on the device where you created it and is removed if you uninstall the extension or clear its storage.

## What we transmit

**Nothing.** LoveSpark Planner transmits **zero** data externally.

- No data is sent to LoveSpark or its developer.
- There are **no analytics** and **no telemetry**.
- There are **no remote servers**, no cloud sync, and no external API calls.
- No personal information, browsing activity, or usage statistics ever leave your device.

Your plan is yours alone, and it never travels anywhere.

## Permissions

LoveSpark Planner requests only the minimum permissions required for its single purpose — planning your day — and uses each one solely for that purpose:

- **`storage`** — Used to save and retrieve your tasks, calendar events, focus integration state, and settings in `chrome.storage.local` so your plan persists between browser sessions. This is local storage only; it is never used to transmit anything.
- **`unlimitedStorage`** — Removes the small default storage quota so that an active planner (many tasks and calendar events accumulated over weeks and months) is never silently truncated or blocked from saving. All of this storage remains local to your device.
- **`alarms`** — Used to schedule time-based reminders for your tasks and calendar events and to trigger routine in-extension events (such as a daily reset of your day view). Alarms run locally in your browser and are never used to contact any server.

## Host permissions

LoveSpark Planner requests **no host permissions**. It does not request access to any websites and does not run on the pages you visit.

Because it has no host access, the extension **cannot and does not**:

- read, collect, or track your browsing history or the URLs you visit;
- read or modify the content of web pages;
- inject ads, trackers, scripts, or any other content into websites.

The extension operates entirely within its own interface.

## Third-party services

**None.** LoveSpark Planner uses no third-party services, SDKs, analytics providers, advertising networks, or external libraries that phone home. There are no embedded trackers and no remote code execution. The extension runs only the code that ships inside it.

## Children's privacy

LoveSpark Planner collects **no personal data from anyone**, including children under the age of 13. Because nothing is collected or transmitted, there is no personal information to gather, store remotely, or share. The extension is safe for users of all ages.

## Changes to this policy

If this policy ever changes, the updated version will be published in the public source repository, and the **effective date** and **version** at the top of this document will be updated. Because the policy lives alongside the code, you can always review the current version — and its full history — here:

<https://github.com/Joona-t/lovespark-planner/blob/main/PRIVACY.md>

## Contact

Questions, concerns, or privacy reports are welcome. Please open an issue:

<https://github.com/Joona-t/lovespark-planner/issues>

## Open source / verification

LoveSpark Planner is fully open source. You do not have to take these claims on trust — you can read every line of the code yourself and confirm that the extension stores data only in `chrome.storage.local`, requests no host permissions, and makes no network requests:

<https://github.com/Joona-t/lovespark-planner>
