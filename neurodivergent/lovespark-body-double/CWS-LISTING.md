# LoveSpark Body Double — CWS Listing

## Extension name

LoveSpark Body Double

## Short description

ADHD body doubling in your browser. A virtual focus buddy with a focus timer, gentle encouragement, and session tracking. Free.

## Detailed description

**LoveSpark Body Double puts a focus companion right in your browser.** Meet Sparky — a virtual body double who sits with you while you work, so starting and staying on task feels less lonely and a lot more doable.

Body doubling is a proven ADHD focus strategy: having someone present while you work makes it easier to begin a task, stay with it, and finish. LoveSpark Body Double brings that quiet, supportive presence into a browser popup. Open it, start a session, and Sparky is there with you — no video calls, no coworking subscriptions, no scheduling another person.

**Who it helps.** Built neurodivergent-first, for people with ADHD, autistic folks, anyone who struggles with task initiation, and anyone who simply focuses better knowing someone is "there." If open-ended work time slips away from you, a focus companion and a running focus timer give the session a shape.

**How it works.** Start a focus session and the timer runs alongside you. Sparky offers gentle, low-pressure encouragement as you go, and each completed session is tracked so you can see your focus add up over time. When you're done, you close it — that's the whole loop. Calm, simple, repeatable.

**Accessibility is the point, not an afterthought.** The interface uses the OpenDyslexic-friendly, retro-pink LoveSpark look with high-contrast text, clear focus indicators, full keyboard navigation, and reduced-motion support. It's designed to be readable and calm rather than busy or demanding.

**Free, open, and private.** LoveSpark Body Double is completely free, MIT-licensed, and open source. It stores everything locally in your browser and transmits **zero** data anywhere. There are no accounts, no sign-ups, no ads, and no trackers.

Features:

- 🐺 **Sparky, your focus companion** — a friendly virtual body double present in the popup while you work
- ⏱️ **Body-doubling focus timer** — start a session and keep a visible sense of time on task
- 💬 **Gentle encouragement** — supportive, low-pressure messages instead of nagging
- 📊 **Session tracking** — completed focus sessions are saved locally so your effort adds up
- 🧠 **Neurodivergent-first design** — ADHD-friendly task initiation, OpenDyslexic-friendly type, calm retro-pink UI
- ♿ **Accessible** — high contrast, keyboard navigation, visible focus, reduced-motion support
- 🔒 **Private by design** — local storage only, zero external data transmission
- 🆓 **Free & open source** — MIT licensed, no account, no ads, no paid tiers

If you've ever wished someone would just sit with you so you could finally start, that's what this is.

## Single-purpose justification

The single purpose of LoveSpark Body Double is to provide an on-screen body-doubling focus companion that helps the user start and sustain focused work sessions. Every feature serves that one purpose: the companion (Sparky) supplies the felt presence that makes body doubling work, the focus timer gives a session its shape and start/stop boundaries, the encouragement messages sustain motivation during the session, and session tracking records completed sessions so the user can see their focus effort. There are no features outside this scope — no browsing tools, no content blocking, no external integrations — so the extension does exactly one thing.

## Per-permission justification

**storage** — Used to save the user's focus session data (such as completed sessions and preferences) locally via `chrome.storage.local` so the session-tracking feature can persist between browser sessions. This data never leaves the device.

**alarms** — Used to drive the focus timer reliably. `chrome.alarms` lets the timer keep accurate time and fire the end-of-session event even when the popup is closed or the service worker is idle, which is essential for the body-doubling session timer to work.

## Host-permissions justification

No host permissions are requested. LoveSpark Body Double does not read, modify, or access the content of any website, and it does not require access to any URLs or host patterns. It operates entirely within its own popup UI.

## Privacy disclosure (CWS Section 5)

**Data collection — mark every category as "Not collected":**

- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

**Data-use certifications (tick all three):**

- ☑ I do not sell or transfer user data to third parties, apart from the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-body-double/PRIVACY.md

Note for reviewer: this extension stores data only in `chrome.storage.local` on the user's own device and transmits no data externally. No remote servers, analytics, or third-party services are contacted.

## Reviewer test instructions

Total time: about 3 minutes. No account, login, or setup is required.

1. **Install and open** — Load the extension and click the LoveSpark Body Double toolbar icon. The popup opens showing Sparky (the mascot) and the focus-session controls.
2. **Start a focus session** — Click the start button. Confirm the focus timer begins counting and Sparky is present as your body-double companion.
3. **Check encouragement** — While the session runs, confirm a gentle encouragement message is shown to the user (messages are static/local text; nothing is fetched from a network).
4. **Stop / complete the session** — End the session using the stop/finish control. Confirm the timer stops.
5. **Verify session tracking** — Confirm the completed session is reflected in the session count/stats shown in the popup.
6. **Confirm persistence is local** — Close and reopen the popup; the tracked session data should still be present, demonstrating it is saved via `chrome.storage.local`.
7. **Confirm no network / no host access** — Open DevTools for the extension and observe that no external network requests are made during any of the above steps. The extension declares only `storage` and `alarms` permissions and no host permissions, so it never reads page content.

Expected result: a self-contained focus companion with a working timer, encouragement, and locally-stored session tracking — with zero external data transmission.
