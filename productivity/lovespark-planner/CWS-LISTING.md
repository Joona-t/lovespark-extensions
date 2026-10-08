# LoveSpark Planner — CWS Listing

## Extension name

LoveSpark Planner – ADHD Todo & Calendar

*(40 characters, within the 45-character limit)*

## Short description

ADHD-friendly daily planner: todo list + calendar with focus integration. Plan your day. Free, private, no account, no tracking.

*(128 characters, within the 132-character limit)*

## Detailed description

**A daily planner built for ADHD and neurodivergent brains — not against them.**

LoveSpark Planner combines a simple todo list and a calendar in one quiet, distraction-light surface, so you can finally plan your day without fighting your own tools. Capture what you need to do, drop it onto a day, and watch your plan stay exactly where you left it. No setup ritual, no overwhelming dashboard, no twelve-step onboarding — just open it and start.

This is a focus planner extension for people who bounce off heavy productivity suites. If generic todo apps feel cluttered, gated behind sign-ups, or built for project managers instead of humans, this neurodivergent planner is the calmer alternative. The todo list and the calendar live side by side, so "what do I need to do" and "when am I doing it" are answered in the same glance — the core of any *plan my day* workflow when you have ADHD.

It's also genuinely private. LoveSpark Planner is a free todo list with no account and no sign-in. Everything you write stays on your own device in local browser storage. There is no server, no sync to the cloud, and nothing transmitted anywhere — a private, offline planner in the truest sense. You can use it on a plane, in airplane mode, or with the network unplugged, and it works exactly the same.

**Who it helps**

- People with ADHD or executive-function challenges who need an *ADHD todo list* that doesn't bury the next action.
- Neurodivergent students, makers, and remote workers who want a daily planner Chrome extension that opens fast and asks for nothing.
- Anyone who wants a todo list calendar extension that is free, private, and account-free.

**Features**

- ✅ **Todo list** — quick task capture with a clean, low-noise interface.
- 🗓️ **Calendar** — see your tasks placed in time across the day and week.
- 🔁 **Recurring tasks** — set it once and let it come back on schedule.
- ⏰ **Time-aware planning** — your day rolls over automatically and due items surface when they're relevant.
- 🎯 **Focus integration** — designed to sit alongside your focus routine so planning and doing reinforce each other.
- 🧠 **Neurodivergent-first design** — built by a neurodivergent developer, for brains like ours.
- 🔤 **OpenDyslexic font + accessible retro-pink themes** — readable by default, with high-contrast, WCAG-aware theming and reduced-motion support.
- 💾 **Unlimited local history** — keep months or years of tasks and events without hitting a storage cap.
- 🔒 **100% local & offline** — zero data collection, zero tracking, no telemetry, ever.
- 🆓 **Free and open source (MIT)** — inspect every line at https://github.com/Joona-t/lovespark-planner.

LoveSpark Planner is part of the LoveSpark suite of free, open-source, privacy-first tools for neurodivergent coders. No ads. No data collection. Always free.

## Single-purpose justification

LoveSpark Planner has one purpose: **to help you plan your day by capturing tasks and organizing them on a calendar.** Every feature serves that single purpose. The todo list is where you capture what needs doing; the calendar is where you place those tasks in time; recurring tasks and time-based rollover keep that plan accurate as days pass; and the focus-friendly design, OpenDyslexic typography, and accessible theming exist solely to make this one planning surface usable for neurodivergent people who would otherwise abandon a cluttered tool. There is no second, unrelated function — no browsing utility, no content injected into other websites, no analytics, no data export to outside services. The extension does exactly one thing, personal day planning, and stores the result locally on the user's own device.

## Per-permission justification

**storage** — The `storage` permission lets LoveSpark Planner save your tasks, calendar events, recurring rules, and theme preferences to `chrome.storage.local` on your own device. This is the feature that makes your plan persist: close the browser, reopen it, and your todo list and calendar are exactly as you left them. Nothing written through this permission ever leaves your machine.

**unlimitedStorage** — The `unlimitedStorage` permission removes the default local-storage quota so a planner you use every day never has to silently drop your data. Daily planning accumulates months or years of completed tasks, notes, and recurring calendar events; rather than capping that history or forcing you to delete old entries, we request `unlimitedStorage` so your full planning record stays intact locally. It only raises local storage limits — it grants no network access and no sync capability.

**alarms** — The `alarms` permission powers the time-based parts of planning: rolling the day over at midnight so "today" is always correct, regenerating recurring tasks on schedule, and surfacing due items at the right time. `alarms` lets these time triggers fire reliably even after the background service worker has gone idle. It is used only for the planner's own scheduling logic — never to track behavior.

## Host-permissions justification

LoveSpark Planner requests **no host permissions** and **no access to any website**. It does not read, modify, or inject content into any page you visit, and it makes no cross-origin or network requests of any kind. The extension operates entirely within its own UI and local storage, which is why no `host_permissions` (and certainly no broad pattern like `<all_urls>`) are declared in the manifest.

## Privacy disclosure (CWS Section 5)

**Data collection — set every category to "Not collected":**

- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

**Data use certifications — affirm all three (check each box):**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Developer certification (check both):**

- ☑ I certify that the data usage disclosed above is complete and accurate, and complies with the Chrome Web Store Developer Program Policies.
- ☑ This item handles user data in accordance with the linked privacy policy.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-planner/blob/main/PRIVACY.md

*Note for reviewers: LoveSpark Planner stores all data in `chrome.storage.local` on the user's device and transmits zero data externally. No remote endpoints, telemetry, or analytics exist anywhere in the source.*

## Reviewer test instructions

This takes about 3 minutes and requires no account, no login, and no network connection.

1. **Install and open.** After installing, click the LoveSpark Planner icon in the Chrome toolbar to open the planner. (Optional: pin it via the puzzle-piece menu first.)
2. **Add a task.** In the todo list, type a task such as "Email professor" and add it. Confirm it appears in the list immediately.
3. **Complete a task.** Mark that task done and confirm it visibly updates (checked/struck-through), demonstrating the core todo behavior.
4. **Add a calendar entry.** Switch to the calendar view and add a task or event to today's date. Confirm it shows up on the correct day.
5. **Add a recurring task (optional).** Create a task set to recur, then confirm the recurrence option is saved.
6. **Verify persistence.** Close the planner and the browser, reopen Chrome, and open LoveSpark Planner again. Confirm your task, completion state, and calendar entry are all still there — this verifies local `storage` / `unlimitedStorage`.
7. **Switch theme & check accessibility.** Open the theme dropdown (top-right) and change the theme; confirm the OpenDyslexic font and accessible contrast render correctly.
8. **Confirm no network activity.** Open DevTools → Network, then add and complete a task. Observe that **no outbound requests are made** — all behavior is local. The extension declares no host permissions, so it cannot and does not touch any website you visit.

Expected result: tasks and calendar entries are created, completed, and persisted entirely on-device, with no sign-in prompt and no network traffic.
