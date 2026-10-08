# Privacy Policy — LoveSpark Hub

**Effective date:** July 8, 2026 · **Applies to version:** 1.0.29

LoveSpark Hub is a free, open-source browser extension that replaces your new-tab page with an ADHD command center — a daily planner, focus mode, break reminders, and Sparky. This policy explains, in plain language, exactly what the extension does and does not do with your information.

**The short version:** LoveSpark Hub keeps everything on your own device. It has no servers, no accounts, no analytics, and no ads. Nothing you type or track ever leaves your browser.

---

## What we store

Everything LoveSpark Hub saves is written to your browser's local extension storage (`chrome.storage.local`) on your own device. This includes only the data you create by using the extension, such as:

- **Your planner content** — the tasks, notes, and daily plans you add.
- **Your settings and preferences** — theme choice, focus-mode configuration, break-reminder timing and intervals, and other UI options.
- **Focus and streak data** — counters, session history, and streaks that let the extension show your progress over time.
- **Sparky's state** — any local state needed to keep your companion and its interactions consistent between sessions.

This data exists only to make the extension work for you. It stays on your device, is not synced to any LoveSpark server, and is removed if you uninstall the extension or clear its storage through your browser.

---

## What we transmit

**Nothing. Zero data is transmitted externally.**

- No data is sent to LoveSpark, the developer, or any third party.
- There are **no analytics, no telemetry, and no tracking** of any kind.
- There are **no external servers** — the extension has nothing to phone home to.
- No advertising networks, and no remote code is loaded or executed.

All processing happens locally, inside your browser.

---

## Permissions

LoveSpark Hub requests the minimum permissions needed for its stated purpose. Each one is explained below.

- **`storage`** — Used to save your planner entries, settings, focus/streak counters, and Sparky's state locally in `chrome.storage.local` so they persist between sessions and browser restarts. This permission only reads and writes data on your own device; it is never used to transmit anything.
- **`alarms`** — Used to schedule the extension's timers, most importantly your **break reminders** and focus-mode intervals. It lets the extension wake up at the right moment to notify you, without needing to keep code constantly running. It does not access any of your data and sends nothing externally.

---

## Host permissions

**LoveSpark Hub requests no host permissions.**

The extension declares **no** `host_permissions` and no broad site access (such as `<all_urls>`). Because of this, it:

- **Cannot** read, monitor, or collect your browsing history.
- **Cannot** read or modify the content of the websites you visit.
- **Cannot** inject ads, trackers, or any other code into web pages.

LoveSpark Hub operates entirely within its own new-tab and extension surfaces.

---

## Third-party services

**None.**

LoveSpark Hub uses no third-party services, SDKs, analytics providers, advertising networks, or external APIs. There are no external dependencies that receive your data, because your data never leaves your device.

---

## Children's privacy

LoveSpark Hub collects **no personal data from anyone**, including children under the age of 13. Because the extension stores everything locally and transmits nothing, there is no personal information to collect, share, or sell. The extension is safe for users of all ages.

---

## Changes to this policy

If this policy ever changes, the updated version will be published in the extension's public source repository, and the **effective date** and **version** at the top of this document will be updated. Because the repository is public, you can review the full history of any changes at any time.

---

## Contact

Questions, concerns, or reports can be filed publicly on GitHub:

**https://github.com/Joona-t/lovespark-extensions/issues**

---

## Open source / verification

LoveSpark Hub is fully open source. You do not have to take our word for any of the claims above — you can read every line of the code and confirm exactly what the extension does and does not do:

**https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-hub**
