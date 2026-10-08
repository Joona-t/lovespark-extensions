# LoveSpark Morning Routine — CWS Listing

## Extension name

LoveSpark Morning Routine

*(25 characters — within the 45-character limit.)*

## Short description

An ADHD morning routine checklist: meds, water, breakfast, hygiene, day-plan. Auto-resets daily. Free, private habit builder.

*(125 characters — within the 132-character limit. Primary keywords woven in: "ADHD morning routine," "checklist," "habit builder," "daily.")*

## Detailed description

**Start every day with a clear, gentle plan — not a blank screen.**

LoveSpark Morning Routine is a simple ADHD morning routine checklist that lives in your browser. It gives you the same five anchor steps every single morning — take your meds, drink water, eat breakfast, do your hygiene, and plan your day — then quietly resets overnight so a fresh, un-ticked list is waiting for you the next time you open it. No streak guilt, no setup, no decisions before coffee. Just check the boxes and go.

It's built for the way neurodivergent brains actually work. ADHD makes mornings hard: object permanence is unreliable, working memory drops the ball, and "remember to take your meds" evaporates the moment you sit down. A visible, repeatable checklist offloads that mental load onto the screen instead of your overloaded executive function. The medication reminder step alone is the difference between a steady day and a foggy one — and because the list looks identical every morning, the routine becomes automatic.

This is part of the LoveSpark suite — free, open-source productivity tools made neurodivergent-first. The interface uses the **OpenDyslexic** font by default, a retro-pink accessible theme, clear contrast, full keyboard navigation, and reduced-motion support, so the checklist is calm to look at and easy to use every day.

**Your data never leaves your device.** Everything is stored locally in your browser. There is no account to create, nothing to log in to, no tracking, no ads, and zero data sent anywhere. It's MIT-licensed and fully open source, so you can read every line of code yourself.

**What you get:**

- **Five fixed morning anchors** — meds, water, breakfast, hygiene, and "plan your day," the daily routine planner steps that matter most.
- **One-tap check-off** — tick each item as you complete it; progress is saved instantly.
- **Automatic daily reset** — the checklist clears overnight so each morning starts fresh, building the habit through repetition.
- **Medication reminder built in** — the meds step makes the most important task impossible to forget.
- **Neurodivergent-first design** — OpenDyslexic font, accessible retro-pink theme, high contrast, keyboard-friendly, reduced-motion aware.
- **Completely private** — local-only storage, no account, no sign-up, no data collection of any kind.
- **Always free, open source, no ads** — MIT-licensed, no paywall, no upsell.

If you've been searching for an ADHD habit tracker, a morning routine extension, or a daily checklist that respects your privacy and your brain, this is the lightweight one that just works. Open your browser, check your list, start your day.

## Single-purpose justification

The single purpose of LoveSpark Morning Routine is to help the user complete a fixed daily morning routine by presenting a checklist that automatically resets each day. Every feature serves only this purpose: the five checklist items (meds, water, breakfast, hygiene, plan your day) define the routine; the one-tap check-off lets the user mark steps complete; saving progress locally preserves the user's place within the current day; and the automatic daily reset clears the list overnight so the routine can be repeated tomorrow. There are no unrelated tools, no secondary modes, and no features outside this one job — the entire extension exists to render and manage a single resetting morning checklist.

## Per-permission justification

**storage** — The extension requests the `storage` permission solely to save the state of the morning checklist on the user's own device using `chrome.storage.local`. This records which items have been checked off today and the date of the current routine, which is what enables the two core behaviors: remembering completed steps if the user reopens the checklist during the same day, and detecting a new day so the list can automatically reset to a fresh, un-ticked state. No data stored under this permission ever leaves the device.

## Host-permissions justification

LoveSpark Morning Routine requests **no host permissions**. It does not declare `<all_urls>` or any host match pattern, does not read or modify the content of any website, and does not access browsing activity or page data. The extension operates entirely within its own UI and local storage, so no host access is required.

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

**Developer certifications — tick all three:**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:**
`https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-morning-routine/PRIVACY.md`

*Rationale (for the developer, not pasted into the form): the extension stores only the checklist's checked/unchecked state and the current date locally via `chrome.storage.local`. Nothing is transmitted off the device, so no data-collection category applies and all three non-sale / single-purpose / non-creditworthiness certifications are truthfully satisfied.*

## Reviewer test instructions

This extension has one feature — a daily-resetting morning checklist — and needs no account, no login, and no special setup. The full behavior can be verified in about three minutes:

1. **Install and open.** Install the extension and click its toolbar icon to open the popup. You will see the LoveSpark Morning Routine checklist with five fixed items: take meds, drink water, eat breakfast, hygiene, and plan your day, rendered in the OpenDyslexic font on the retro-pink theme.
2. **Check off an item.** Click (or press Enter on) the "take meds" item. It should mark as completed immediately. Tab through the remaining items with the keyboard to confirm full keyboard navigation and visible focus indicators.
3. **Confirm progress is saved locally.** Close the popup, then reopen it. The "take meds" item should still be checked — confirming progress persists within the same day via local storage only.
4. **Confirm no network activity.** Open DevTools (right-click the popup → Inspect) and view the Network tab while interacting with the checklist. No outbound requests are made; nothing is transmitted off the device.
5. **Verify the daily reset (optional).** The list automatically resets to a fresh, un-ticked state when the date changes. To verify without waiting overnight, advance the system date by one day and reopen the popup — all items will be cleared for the new day. (Inspecting `chrome.storage.local` shows only the stored date and the checked-item state — no personal data.)

Expected result: a single morning checklist that saves your check-offs locally for the current day and clears itself for a fresh start the next day, with zero data leaving the device.
