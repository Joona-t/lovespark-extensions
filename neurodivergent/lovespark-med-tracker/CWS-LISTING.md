# LoveSpark Med Tracker — CWS Listing

## Extension name

LoveSpark Med Tracker — Pill Reminder

## Short description

Free, private medication tracker & pill reminder. One-click dose logging so you never wonder "did I take my meds?" again. 💊💕

## Detailed description

**Did I already take my meds today?** If that question loops in your head, LoveSpark Med Tracker is built for you. It turns medication tracking into a single click and keeps a clear, at-a-glance record of every dose you've logged — right in your browser, with zero fuss and zero accounts.

LoveSpark Med Tracker is a privacy-first medication tracker and pill reminder for people who live in their browser. Add your medications, and log a dose the moment you take it with one click. The extension remembers so you don't have to — no more double-dosing, no more skipped meds, no more standing in the kitchen trying to reconstruct your morning.

It's designed neurodivergent-first. If you have ADHD, memory fog, executive-dysfunction days, or you're simply juggling too much, the interface stays calm, uncluttered, and forgiving. Set reminder times and the extension will nudge you with a gentle desktop notification when a dose is due — so the reminder does the remembering.

**Accessibility is not an afterthought.** The UI ships with the OpenDyslexic-friendly, high-contrast LoveSpark look, respects your reduced-motion setting, and is fully keyboard-navigable with visible focus indicators, so it works the way your brain and body actually work.

Best of all, it's genuinely free and genuinely private. LoveSpark Med Tracker is open source under the MIT license, collects **zero** data, and never transmits anything anywhere. Everything you log lives only on your own device.

**Features:**

- 💊 **One-click dose logging** — tap once the moment you take a med; the extension timestamps it for you
- ✅ **"Did I take it?" at a glance** — instantly see today's logged doses so you never second-guess again
- ⏰ **Dose reminders** — set the times you take each medication and get a nudge when one is due
- 🔔 **Gentle desktop notifications** — a calm reminder appears when it's time, then gets out of your way
- 📋 **Your medication list** — keep the meds you track in one simple, editable place
- 🧠 **Neurodivergent-first design** — low-friction, low-clutter, forgiving of missed and irregular days
- ♿ **Accessible by default** — OpenDyslexic-friendly type, high contrast, keyboard navigation, reduced-motion support
- 🔒 **100% private** — stored only in your browser's local storage; nothing is ever sent off your device
- 🆓 **Free & open source** — MIT licensed, no ads, no accounts, no tracking, ever

LoveSpark Med Tracker is part of the LoveSpark suite — free, open-source, retro-pink productivity tools built for neurodivergent coders and anyone who wants calm, private software that just helps.

## Single-purpose justification

The single purpose of LoveSpark Med Tracker is to help a person track their medication doses. Every feature serves that one purpose: the medication list defines what is being tracked, one-click dose logging records that a dose was taken, the local history answers "did I take it?", and the reminder alarms plus desktop notifications prompt the user when a scheduled dose is due. There are no unrelated features — no browsing tools, no content injection, no data export to third parties. The extension does one thing: it is a private medication tracker and dose reminder.

## Per-permission justification

**storage** — Used to save the user's medication list, dose logs, and reminder settings locally via `chrome.storage.local`. This is what lets the extension answer "did I take my meds today?" across browser sessions. No data is stored anywhere except the user's own device.

**alarms** — Used to schedule medication reminders at the dose times the user configures. The `alarms` API lets the extension wake at the right moment to prompt the user even when the popup isn't open, which is essential to a reliable pill reminder.

**notifications** — Used to display a gentle desktop notification when a scheduled dose is due, so the reminder reaches the user without them having to keep the popup open. Notifications are only shown for the user's own configured dose times.

## Host-permissions justification

LoveSpark Med Tracker requests **no host permissions**. It does not read, modify, or access the content of any website, and it has no access to your browsing activity or the pages you visit. The extension operates entirely within its own popup and local storage; there is no reason for it to touch web pages, so it doesn't request permission to.

## Privacy disclosure (CWS Section 5)

**Data collection categories — set each to "Not collected":**

- Personally identifiable information — **Not collected**
- Health information — **Not collected** (medication data is stored only in the user's local browser storage and is never transmitted, sold, or shared)
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

**Data-use certifications (all true for this extension):**

- ✔️ I do **not** sell or transfer user data to third parties, outside of the approved use cases.
- ✔️ I do **not** use or transfer user data for purposes that are unrelated to my item's single purpose.
- ✔️ I do **not** use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-med-tracker/PRIVACY.md

**Developer certification checkboxes to tick:**

- ✔️ This item complies with the Developer Program Policies.
- ✔️ The privacy practices disclosed above are accurate and complete.

## Reviewer test instructions

Estimated time: ~3 minutes. No account, sign-in, or network access is required — all behavior is local.

1. **Install and open** the extension, then click the LoveSpark Med Tracker toolbar icon to open the popup. Confirm the popup renders (mascot, title, and a medication area).
2. **Add a medication** — use the add/"+" control to create a med (e.g. "Test Med"). Confirm it appears in the medication list.
3. **Log a dose** — click the one-click log/"Take" control for that medication. Confirm a dose is recorded with a timestamp and today's logged-dose view updates immediately (this is the "did I take it?" record).
4. **Verify persistence** — close the popup and reopen it. Confirm the medication and the logged dose are still shown, proving data is saved to `chrome.storage.local`.
5. **Set a reminder** — set a reminder time for the medication a minute or two ahead (this uses the `alarms` permission to schedule it). Confirm the reminder time is saved.
6. **Verify the notification** — when the scheduled time arrives, confirm a desktop notification appears prompting you that a dose is due (this uses the `notifications` permission). Allowing browser notifications may be required.
7. **Confirm no network / no host access** — open DevTools → Network while using the extension and confirm no external requests are made, and note the extension declares no host permissions and never touches web page content.
