# LoveSpark Mood Bloom — CWS Listing

## Extension name

LoveSpark Mood Bloom — Mood Tracker

*(35 characters. Alternate, brand-only: "LoveSpark Mood Bloom" — 20 characters.)*

## Short description

Mood tracker that grows a flower garden. ADHD-friendly emoji check-ins with daily reminders. No account, no tracking, always free.

*(130 characters. Primary keywords woven in: "mood tracker," "ADHD-friendly," "emoji check-ins," "daily reminders.")*

## Detailed description

**Track your mood in seconds. Watch a garden bloom from your feelings.**

LoveSpark Mood Bloom is a gentle, ADHD-friendly mood tracker that turns your daily check-ins into a growing flower garden. Instead of typing long journal entries, you tap an emoji that matches how you feel — and over time, your logged moods bloom into a personal garden you can watch grow. It's a mood journal that rewards showing up, not writing paragraphs.

Most mood tracking apps ask too much: accounts, sign-ups, endless forms, and reminders that feel like nagging. Mood Bloom is built for people who bounce off that friction — especially neurodivergent folks and anyone with ADHD. The check-in takes seconds. The emoji picker is big, colorful, and low-effort. The daily reminder is a soft nudge, not a guilt trip. And the flowering garden gives you a visible, satisfying record of consistency without any pressure.

Because it's part of the LoveSpark suite, Mood Bloom is designed accessibility-first: it uses the OpenDyslexic-friendly, high-contrast retro-pink interface, respects reduced-motion preferences, and works fully with the keyboard. It's a calm little corner of your browser that helps you notice patterns in how you feel — without turning self-care into another chore.

Everything lives on your own device. Mood Bloom stores your check-ins only in your browser's local storage. There is no account, no cloud, no analytics, and nothing is ever transmitted anywhere. It is free, open source (MIT licensed), and will always stay that way.

**What you get:**

- 🌱 **Quick daily mood check-ins** — log how you feel in a couple of taps
- 😊 **ADHD-friendly emoji picker** — big, clear, low-friction, no typing required
- 🌸 **A garden that blooms over time** — your logged moods grow into flowers you can watch flourish
- ⏰ **Gentle daily reminders** — an optional soft nudge so check-ins become a habit
- 📈 **See your patterns** — a visible history of your moods, right in your browser
- ♿ **Accessible by design** — OpenDyslexic-friendly, high-contrast, keyboard navigable, reduced-motion aware
- 🔒 **Zero data collection** — everything stays in local storage on your device
- 💗 **Free & open source forever** — MIT licensed, no ads, no upsells, no account

Whether you're building a mindfulness habit, keeping a lightweight mood diary, managing ups and downs, or just want a friendly reason to check in with yourself each day, LoveSpark Mood Bloom makes emotional self-tracking simple, private, and a little bit joyful.

## Single-purpose justification

Mood Bloom has one purpose: to let you log your daily mood and see it visualized as a growing flower garden over time. Every feature serves that single purpose — the emoji picker is how you record a mood, local storage is how those moods are saved so the garden persists between visits, the daily reminder exists solely to prompt the mood check-in, and the blooming garden is the visualization of the moods you've logged. There are no features unrelated to daily mood tracking; the extension does not browse, block, modify web pages, or do anything beyond capturing a mood check-in and displaying its history as a garden.

## Per-permission justification

**storage** — Mood Bloom uses `chrome.storage.local` to save your mood check-ins and the state of your flower garden on your own device, so your history persists between sessions and your garden keeps growing over time. This is the only place your data is stored; nothing is written to any remote server.

**alarms** — The `alarms` permission is used solely to schedule the optional gentle daily reminder that nudges you to complete your mood check-in. It powers a single local notification/prompt on a daily cadence and is not used for any background network activity, tracking, or other purpose.

## Host-permissions justification

Mood Bloom requests no host permissions. It does not read, access, or modify the content of any website you visit, and it does not request access to any URLs or web page data. The extension operates entirely within its own popup interface and local storage.

## Privacy disclosure (CWS Section 5)

**Data collection categories — paste "Not collected" for every category:**

- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

Mood Bloom does not collect, transmit, or share any user data. Mood check-ins and garden state are stored exclusively in `chrome.storage.local` on the user's own device and never leave the browser.

**Certification checkboxes to tick (all three apply and are true for this extension):**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:**
https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-mood-bloom/PRIVACY.md

## Reviewer test instructions

No account, sign-in, or setup is required. The full extension can be verified in about three minutes:

1. **Install and open.** Click the LoveSpark Mood Bloom toolbar icon to open the popup. You'll see the retro-pink interface with the Sparky mascot and an empty (or seedling) garden.
2. **Log a mood.** Tap any emoji in the mood picker to record a check-in. Confirm the selection is saved and the garden view updates to reflect the new entry (a new bloom or growth appears).
3. **Confirm persistence.** Close the popup and reopen it. Your logged mood and garden state should still be there — this data is read from `chrome.storage.local`, demonstrating the `storage` permission in use.
4. **Check the reminder setting.** Locate the daily reminder toggle/option. Enabling it schedules a local daily reminder via the `alarms` permission. (You do not need to wait for the alarm to fire; the option simply schedules a local prompt.)
5. **Verify no external activity.** Open DevTools → Network while interacting with the popup. Confirm there are **no outbound network requests** — the extension makes no server calls and transmits no data. It also requests no host permissions and never reads page content.
6. **Optional accessibility check.** Navigate the popup with the keyboard (Tab / Enter) and confirm visible focus indicators, high contrast, and that motion respects `prefers-reduced-motion`.

Source is fully open for verification: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-mood-bloom
