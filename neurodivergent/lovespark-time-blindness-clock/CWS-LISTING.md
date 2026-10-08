# LoveSpark Time Blindness Clock — CWS Listing

## Extension name

LoveSpark Time Blindness Clock

## Short description

A big visual clock that makes time real for ADHD time blindness — see countdowns to lunch, end of work, and bedtime. Free.

## Detailed description

**Time blindness is real. This clock makes time visible again.**

If you have ADHD, you already know the feeling: you sit down "for a minute," look up, and two hours are gone. Time blindness — the difficulty sensing how much time has passed or how much is left — is one of the most under-served core symptoms of ADHD. The clinical advice is simple but rarely built into the tools we use all day: *make time visible*. LoveSpark Time Blindness Clock does exactly that.

It puts a big, always-readable clock in front of you, plus named countdowns to the moments that actually structure your day — lunch, the end of your workday, and bedtime. Instead of an abstract number you have to do mental math on, you see *"2h 14m until end of work."* Time stops being invisible and becomes something you can feel.

**Who it helps:** people with ADHD and other forms of neurodivergence who lose track of time, time-blind hyperfocusers who forget to eat or stop, anyone who wants a calmer, more concrete sense of where they are in the day.

**Built neurodivergent-first.** This is a LoveSpark extension, which means accessibility isn't an afterthought. The default typeface is **OpenDyslexic** (with a clean system fallback), the palette is a gentle retro-pink, motion respects your `prefers-reduced-motion` setting, and every control is keyboard-navigable with proper contrast and screen-reader labels.

**What you get:**

- 🕐 **A big, high-visibility clock** — large, legible digits designed to be read at a glance.
- 🍴 **Named time-until markers** — set your lunch, end-of-work, and bedtime, and see live countdowns to each.
- 🧠 **Time made concrete** — "how long until…" framing built specifically to counter ADHD time blindness.
- ♿ **Accessible by design** — OpenDyslexic font, reduced-motion support, full keyboard navigation, WCAG-minded contrast.
- 🎨 **Calm retro-pink theme** — easy on the eyes, no clutter, no noise.
- 🔒 **Zero tracking** — your marker times stay on your own device, full stop.

**Free, forever, and open source.** LoveSpark tools are MIT-licensed and built for the community — no ads, no accounts, no upsells, no premium tier. The full source is public so anyone can verify exactly what it does: https://github.com/Joona-t/lovespark-time-blindness-clock

**Your data never leaves your computer.** The extension stores only your own settings — the marker times and display preferences you choose — using Chrome's local storage. It collects nothing, sends nothing to any server, and has no analytics. There is literally nothing to leak.

Keywords this helps you find it by: adhd time blindness, visual clock extension, time blindness clock, adhd time management, time awareness, big clock, countdown to end of day, adhd focus clock, time until bedtime, neurodivergent productivity.

## Single-purpose justification

The single purpose of LoveSpark Time Blindness Clock is to **make the passage and structure of time perceptible to people with ADHD time blindness**. Every feature serves that one purpose: the large, always-readable clock makes the current time impossible to miss; the named time-until markers (lunch, end of work, bedtime) translate abstract clock readings into concrete "how much time is left" countdowns; the OpenDyslexic font, retro-pink theme, and reduced-motion behavior exist solely to make that time information legible and calm for neurodivergent users. There is no second, unrelated function — no browsing tools, no blocking, no data features. The extension does one thing: it shows you where you are in your day so time stops being invisible.

## Per-permission justification

**`storage`** — Used only to save the settings you choose: your lunch, end-of-work, and bedtime marker times, and your display preferences (such as theme and font). These are written to `chrome.storage.local` so your clock and countdowns persist between sessions instead of resetting every time you open the extension. The permission is not used to read browsing data, track activity, or transmit anything externally; it stores your own configuration on your own device and nothing more.

## Host-permissions justification

No host permissions are requested. The extension does not declare `<all_urls>` or any host pattern, does not read or modify the content of any website, and does not access your browsing activity. It only displays a clock and the countdowns you configure, so it needs no access to the sites you visit.

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

**Certifications to confirm (tick each checkbox):**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:**
https://github.com/Joona-t/lovespark-time-blindness-clock/blob/main/PRIVACY.md

*Note: this extension stores the user's own marker times and display preferences locally via `chrome.storage.local` only. No data is collected, sold, transferred, or transmitted off the device, so all categories above are correctly marked "Not collected."*

## Reviewer test instructions

Total time: ~3 minutes. No account, sign-in, or external service is required.

1. **Open the clock (0:20).** Click the LoveSpark Time Blindness Clock icon in the Chrome toolbar. A large, high-visibility clock appears showing the current local time. Confirm the digits are big and readable and that the interface uses the OpenDyslexic font / retro-pink theme.
2. **Find the time-until markers (0:30).** Note the labeled countdown markers for **lunch**, **end of work**, and **bedtime**. Each shows the time remaining until that moment (for example, "3h 05m until bedtime").
3. **Set a marker time (0:40).** Open the extension's settings/markers controls and change one marker — for example, set "end of work" to a time about 10 minutes from now. Save. Confirm the corresponding countdown immediately updates to roughly "0h 10m," proving the markers respond to your input.
4. **Confirm local persistence (0:40).** Close the popup and reopen it (or reload the extension). Your edited marker time is still there, demonstrating that settings are saved with the `storage` permission to `chrome.storage.local`.
5. **Verify no network or host access (0:30).** Open DevTools → Network with the extension active, or inspect the service worker: observe that the extension makes no outbound network requests and does not read page content. It declares no host permissions and only the `storage` permission. There is no tracking, telemetry, or external transmission of any kind.
6. **Check accessibility (0:20).** Tab through the controls with the keyboard to confirm focusable, labeled elements and visible focus indicators, consistent with the extension's neurodivergent-first, accessible design.

Expected result: a big visible clock plus named countdowns to lunch, end of work, and bedtime, with all settings stored locally and zero data leaving the device.
