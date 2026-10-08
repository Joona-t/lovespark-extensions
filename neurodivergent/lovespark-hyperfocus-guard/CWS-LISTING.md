# LoveSpark Hyperfocus Guard — CWS Listing

## Extension name

LoveSpark Hyperfocus Guard

*(26 characters)*

## Short description

A gentle ADHD focus extension: a time-on-site tracker that nudges you when hyperfocus takes over. No shame, just awareness. Free.

*(129 characters)*

## Detailed description

**Lost three hours on one tab without noticing? That's time blindness — and it's not a character flaw.**

LoveSpark Hyperfocus Guard is a gentle ADHD focus extension that quietly keeps track of how long you've been on the site in front of you. When you've been locked onto one page longer than your chosen threshold, it offers a calm, shame-free nudge: *"Hey — you've been here a while."* That's it. No blocking, no lockouts, no guilt trips. Just the awareness your brain didn't generate on its own.

**Who this is for**

This extension is built for people with ADHD, autistic folks, and anyone whose attention runs deep instead of wide. Hyperfocus is a superpower right up until it eats your afternoon — and time blindness means the internal clock that's supposed to interrupt you never fires. Hyperfocus Guard is the external clock. It's also for anyone fighting doomscrolling, anyone who wants a quiet time-spent-on-website badge, and anyone burned out on aggressive site blockers that treat you like a problem to be managed.

**How it works**

A small badge on the toolbar icon shows your live time-on-site for the current tab. Set the threshold that feels right for you — fifteen minutes, an hour, whatever matches your work. When you cross it, you get one gentle screen-time alert. Switch tabs or sites and the timer follows your attention. No streaks to break, no productivity score to feel bad about.

**Why it's different**

Most time trackers and website time-limit tools demand permission to *read and change all your data on every site you visit.* Hyperfocus Guard does not. It requests no host permissions at all — it never reads page content, never sees what you type, and never touches the websites you visit. It's a deliberately lightweight, privacy-first, non-judgmental tool in a category full of heavyweight blockers and analytics dashboards.

**Features**

- ⏱️ **Live time-on-site badge** — a glanceable timer for the page you're on right now
- 🔔 **Gentle hyperfocus alerts** — one calm nudge when you pass your threshold, never a lockout
- 🎚️ **Configurable threshold** — pick the limit that fits your brain and your work
- 🧠 **Built for time blindness** — an external interrupt for the clock ADHD doesn't keep
- 🚫 **No blocking, no shame** — awareness only; you stay in control of every choice
- 🔒 **Zero data collection** — everything lives in `chrome.storage.local` on your device
- 🌐 **No host permissions** — never reads the pages you visit
- 💗 **Neurodivergent-first design** — OpenDyslexic font, calm retro-pink theme, accessible, reduced-motion aware
- 🆓 **Always free, open source (MIT), no ads, no accounts**

**Privacy in one line:** Hyperfocus Guard stores your settings and timers locally and transmits absolutely nothing, ever. No servers, no analytics, no tracking, no sign-in.

Open source and auditable: https://github.com/Joona-t/lovespark-hyperfocus-guard

LoveSpark builds free, neurodivergent-first browser tools that reduce distraction without shame. Knowledge and focus are rights, not paywalls.

## Single-purpose justification

The single purpose of LoveSpark Hyperfocus Guard is to make the user aware of how long they have spent on the current website, so they can self-interrupt during hyperfocus. Every feature serves only that purpose: the toolbar badge displays the elapsed time-on-site for the active tab; the configurable threshold lets the user define when "too long" begins for them; the gentle alert fires once that threshold is crossed; and local storage simply remembers the threshold setting and the running timers between sessions. There is no blocking, no content modification, no analytics, and no secondary feature — the extension does one thing: surface time-on-site awareness.

## Per-permission justification

**storage** — Used solely to save the user's chosen time threshold and to persist the per-site elapsed-time counters across browser sessions, so the badge and alert keep working after a restart. All data is kept in `chrome.storage.local` on the user's own device and is never transmitted.

**alarms** — Used to schedule the lightweight periodic check that increments the time-on-site counter and determines when the user has crossed their configured threshold. This is what allows the gentle alert to fire at the right moment without continuously polling.

**tabs** — Used only to detect which tab is active and which site is currently in focus, so the time-on-site badge and the threshold timer track the page the user is actually looking at. The extension reads the active tab's identity to attribute time correctly; it does not read page content.

## Host-permissions justification

No host permissions are requested. Hyperfocus Guard does not declare `<all_urls>` or any host-match pattern, so it cannot read, inject into, or modify the content of any website you visit. It measures only *which* site is active and for *how long* — never *what* is on the page. This minimal footprint is intentional: a time-awareness tool does not need access to your browsing data, so it doesn't ask for it.

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

*(The extension stores only the user's threshold setting and local time counters in `chrome.storage.local`; nothing is sent off the device, so no data-collection category applies.)*

**Developer certification checkboxes — tick all three:**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:**
https://github.com/Joona-t/lovespark-hyperfocus-guard/blob/main/PRIVACY.md

## Reviewer test instructions

This takes about three minutes. The extension needs no account, no sign-in, and no special site permissions.

1. **Install the extension.** Note that no host-permission warning appears at install — Hyperfocus Guard requests only storage, alarms, and tabs.
2. **Open the popup.** Click the toolbar icon. You'll see the LoveSpark interface (Sparky mascot, retro-pink theme) with the current time-on-site and a threshold setting.
3. **Set a short threshold for testing.** Change the threshold to its lowest value (e.g., 1 minute) and save, so you don't have to wait long to see the alert.
4. **Browse normally.** Open any website (for example, `https://example.com`) and leave that tab focused. Watch the toolbar badge — it begins counting the elapsed time-on-site for that tab.
5. **Switch tabs and back.** Open a second site in a new tab, then return. Confirm the badge tracks the tab you're actually viewing.
6. **Wait for the threshold to elapse.** Once you pass the 1-minute test threshold on a single site, a single gentle alert appears letting you know you've been there a while. Confirm it does **not** block, close, or modify the page — it is awareness only.
7. **Confirm no network activity (optional).** Open DevTools → Network on the extension's background/service worker and verify the extension makes no external requests. All state stays in `chrome.storage.local`.

Expected result: a live time-on-site badge, a configurable threshold, and one non-blocking nudge when it's crossed — with zero data leaving the device.
