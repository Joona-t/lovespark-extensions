# LoveSpark Calm Down Kit — CWS Listing

## Extension name

LoveSpark Calm Down Kit

*(23 characters — well under the 45-character limit. Branded, exact, and search-friendly. The high-volume "Calm Down" intent plus the "ADHD" and "DBT skills" terms are carried by the short and detailed descriptions below, where CWS weights them for ranking.)*

## Short description

Rate your intensity and get a matched calm-down technique. ADHD-adapted DBT skills for emotional regulation. Free, no tracking.

*(127 characters. Primary keywords woven naturally: "calm-down," "ADHD-adapted," "DBT skills," "emotional regulation.")*

## Detailed description

**When the feelings spike, you don't need a 12-step worksheet. You need one thing that helps — right now.**

LoveSpark Calm Down Kit is an ADHD emotional regulation toolkit that lives in your browser. When you feel overwhelmed, anxious, or emotionally flooded, you open the kit, rate how intense the feeling is, and it hands you a single calming technique matched to that intensity. No scrolling a wall of advice. No deciding which of forty exercises to try while you're already dysregulated. Rate it, get your technique, do the technique.

The techniques are DBT-inspired and ADHD-adapted — drawn from the distress tolerance and emotion regulation skills used in Dialectical Behavior Therapy, then rewritten to be short, concrete, and doable when your working memory is offline. Low-intensity moments get gentle grounding techniques and mindfulness prompts. High-intensity moments get fast self-soothe and distress tolerance skills designed to bring you down from the spike. The matching is the whole point: the right tool for *this* feeling, not a generic "just breathe."

**Built for neurodivergent brains.** This is a LoveSpark extension, so accessibility isn't an afterthought — it's the foundation. The interface uses the OpenDyslexic font by default, respects your system's reduced-motion setting, supports full keyboard navigation, and keeps each screen to one clear action so it works even when you're at capacity. Calm, retro-pink, low-friction.

**Who it helps:** people with ADHD who experience emotional dysregulation, anyone who wants quick grounding techniques and anxiety relief in Chrome, and folks looking for DBT-style coping tools without a clinic login or a subscription.

- **Intensity rating** — a simple scale to name how big the feeling is before you act on it
- **Matched technique** — one calming technique chosen to fit the intensity you reported
- **DBT-inspired, ADHD-adapted library** — distress tolerance, grounding, and self-soothe skills, written short and plain
- **Lives in your toolbar** — open it the moment you need it, close it when you're steadier
- **OpenDyslexic font + reduced-motion + keyboard navigation** — accessible by default
- **Remembers your preferences locally** so the kit feels like yours each time you open it

**Free, forever. Open source. Zero data collection.** LoveSpark Calm Down Kit is MIT-licensed and fully open source — you can read every line at the repository linked below. It stores your preferences only in your browser's local storage (`chrome.storage.local`) and transmits absolutely nothing externally. There are no accounts, no ads, no trackers, no analytics, and no paid tiers. Your emotional state is yours alone.

A mindfulness browser extension that respects your privacy, your wallet, and your wiring.

Source code & privacy policy: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-calm-down-kit

## Single-purpose justification

The single purpose of LoveSpark Calm Down Kit is to help the user calm down in the moment by rating their emotional intensity and receiving one matched coping technique. Every feature serves that purpose and nothing else: the intensity rating exists so the kit can select an appropriate technique; the technique library exists to supply that single matched response; and local preference storage exists only so the kit reliably presents the user's chosen settings when they reopen it during distress. There are no unrelated tools, no browsing modifications, and no secondary functions — the extension does one job, emotional self-regulation in the browser, and does it in a single focused flow.

## Per-permission justification

**storage** — Used solely to save the user's own settings and preferences (such as the selected theme and accessibility options) in `chrome.storage.local` so the kit presents them consistently each time it is opened. This keeps the experience low-friction for a user who may be reaching for the kit while already dysregulated. All stored data stays on the user's device; nothing written to storage is transmitted, shared, or synced to any external server.

## Host-permissions justification

No host permissions are requested. LoveSpark Calm Down Kit does not access, read, or modify the content of any website. It operates entirely within its own popup interface and has no need for access to your browsing, tabs, or page data.

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

**Required certifications (tick all three):**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-calm-down-kit/PRIVACY.md

*Note for the form: this extension stores only the user's own preferences in `chrome.storage.local` on their device and transmits no data off the device, so no data-collection categories apply.*

## Reviewer test instructions

This extension needs no account, no setup, and no network access. The full flow can be verified in about three minutes.

1. **Install and open** — Install the extension and click its toolbar icon to open the popup. You'll see the LoveSpark Calm Down Kit interface (retro-pink, OpenDyslexic font, Sparky mascot).
2. **Rate an intensity** — Select an emotional intensity level on the rating control (e.g., a low or mild level).
3. **Receive a matched technique** — Confirm the kit responds by presenting a single calming technique appropriate to that intensity (a short DBT-inspired / grounding instruction).
4. **Try a different intensity** — Go back and select a higher intensity level. Confirm the technique shown changes to one suited to a stronger feeling (e.g., a distress-tolerance / self-soothe skill). This demonstrates the core "rate, then match" behavior.
5. **Verify local persistence** — Change a setting if one is available (for example, the theme), then close and reopen the popup. Confirm your preference was remembered — this is the only use of the `storage` permission.
6. **Confirm zero network activity** — Open Chrome DevTools → Network tab on the extension popup and repeat steps 2–4. Confirm that no external network requests are made. The extension reads no web pages, requests no host permissions, and sends no data anywhere.

Expected result: rating an intensity always produces one matched calming technique, preferences persist locally, and no data leaves the device.
