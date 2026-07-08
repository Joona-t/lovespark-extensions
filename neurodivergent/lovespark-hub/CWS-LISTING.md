# LoveSpark Hub — CWS Listing

## Extension name
LoveSpark Hub — ADHD Focus New Tab

*(34 characters, within the 45-character limit.)*

## Short description
ADHD command center in every new tab: daily planner, focus mode, and gentle break reminders. Free, open source, zero tracking.

*(124 characters. Keywords woven in: ADHD, new tab, daily planner, focus mode, break reminders.)*

## Detailed description
**LoveSpark Hub turns every new tab into a calm ADHD command center.** Instead of a blank page or a doomscroll trap, you open a browser tab and land on a space built to help you start, focus, and rest — with Sparky, your friendly companion, cheering you on.

LoveSpark Hub is made neurodivergent-first. If you have ADHD, executive-dysfunction days, or just a scattered brain, the busywork of "what was I doing?" adds up fast. The Hub keeps your plan, your focus timer, and your break reminders one keystroke away, so the next step is always in front of you.

**What you get on every new tab:**

- **Daily planner** — jot down today's tasks and check them off. Your plan is right there each time you open a tab, so nothing slips.
- **Focus mode** — a simple, low-friction way to commit to one thing and quiet the noise while you work.
- **Break reminders** — gentle nudges to step away, stretch, and reset before burnout, powered by lightweight scheduled alarms.
- **Sparky** — the LoveSpark mascot, a warm bit of encouragement instead of a guilt-tripping productivity dashboard.
- **New-tab home base** — replaces the empty new-tab page with something that helps you start, not stall.

**Built for how neurodivergent brains actually work:**

- **Accessible by design** — OpenDyslexic-friendly typography, high-contrast retro-pink theming, keyboard-navigable controls, and reduced-motion support.
- **No pressure, no shame** — encouragement over streak-guilt. The Hub is a helper, not a taskmaster.
- **Distraction-reducing** — the tool you see most (the new tab) becomes a prompt toward your work, not away from it.

**Free, open, and private — always:**

- **100% free** and **MIT licensed** — no ads, no upsells, no premium tier.
- **Open source** — read every line at https://github.com/Joona-t/lovespark-hub
- **Zero data collection** — everything you type stays on your device in local browser storage. Nothing is ever sent to us or anyone else. There are no accounts, no trackers, and no analytics.

LoveSpark Hub is part of the LoveSpark suite of free, privacy-first tools for neurodivergent coders and anyone who wants a kinder, calmer browser.

## Single-purpose justification
LoveSpark Hub has one purpose: **to replace the browser's new-tab page with a personal ADHD focus dashboard that helps the user plan their day, focus, and take healthy breaks.** Every feature serves that single purpose. The daily planner gives the user their to-do list at the moment they open a tab; focus mode helps them commit to one task; break reminders protect them from burnout during that focus; and Sparky provides the encouragement that makes the dashboard approachable. These are not independent tools bolted together — they are the coordinated parts of one focus-and-planning surface that lives on the new-tab page.

## Per-permission justification
**storage** — Used to save the user's daily plan, tasks, focus-mode settings, break-reminder preferences, and theme choice locally via `chrome.storage.local`, so their planner and settings persist across tabs, sessions, and browser restarts. No storage data ever leaves the device.

**alarms** — Used to schedule the gentle break reminders (and focus-mode timing). The `alarms` API lets the extension fire a reminder at the chosen interval reliably without keeping a page open or running a constant timer, which is the standard, battery-friendly way to schedule these nudges in Manifest V3.

## Host-permissions justification
LoveSpark Hub requests **no host permissions**. It does not read, modify, or access the content of any website you visit. The extension operates entirely on its own new-tab page and local storage, so there is no need for access to page hosts, `<all_urls>`, or any URL patterns.

## Privacy disclosure (CWS Section 5)
**Data collection categories — set every category to "Not collected":**

- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

**Developer disclosure certifications — tick all three:**

- ☑ I do **not** sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do **not** use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do **not** use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-hub/blob/main/PRIVACY.md

*(Note: LoveSpark Hub stores the user's planner, settings, and preferences only in `chrome.storage.local` on the user's own device and transmits nothing externally, so no data-collection category applies.)*

## Reviewer test instructions
This takes about 3 minutes. No account, login, or setup is required.

1. **Install and open a new tab.** After installing, press **Ctrl/Cmd+T** (or click the new-tab "+" button). LoveSpark Hub replaces the new-tab page — you'll see the Hub with the Sparky mascot and the retro-pink theme.
2. **Add a task to the daily planner.** Type a task (e.g. "Write the report") into the planner and add it. It appears in your task list. Add a second task to confirm the list grows.
3. **Check off a task.** Mark the first task complete and confirm it updates in place.
4. **Start focus mode.** Activate focus mode from the Hub and confirm the interface shifts into its focused/committed state.
5. **Verify break reminders.** Open the break-reminder setting and confirm you can enable it / choose an interval. (Reminders are scheduled via the `alarms` API and fire at the set interval; you can set a short interval to observe a notification/nudge.)
6. **Confirm local persistence.** Open another new tab (or restart the browser) and confirm your tasks and settings are still there — proving data is saved locally in `chrome.storage.local`.
7. **Confirm zero network activity.** Open DevTools → **Network** on the new-tab page and interact with the planner and focus mode. You will see **no external requests** — nothing is transmitted off the device. All source code is public at https://github.com/Joona-t/lovespark-hub for verification.
