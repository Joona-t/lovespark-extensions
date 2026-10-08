# Sensory Shield by LoveSpark — CWS Listing

## Extension name

Sensory Shield by LoveSpark

## Short description

Reduce motion, tint screens, hide GIFs, and add a focus ruler for calmer, sensory-friendly browsing. Free & private.

## Detailed description

The modern web is loud. Autoplaying animations, flashing banners, looping GIFs, and harsh bright backgrounds can turn a simple browsing session into a wall of sensory noise. **Sensory Shield** turns the volume down.

Sensory Shield is a lightweight browser tool that calms overstimulating web pages so you can read, work, and focus in comfort. Reduce distracting motion, soften glaring screens with a gentle tint, hide animated GIFs, and follow your place on the page with a focus ruler — all from one small popup, on any website.

It's built neurodivergent-first. If you have ADHD, autism, sensory processing sensitivity, migraine or light sensitivity, vestibular issues triggered by motion, or you simply find the web exhausting, Sensory Shield gives you back control over how pages look and move. The interface uses the OpenDyslexic-friendly, high-contrast, retro-pink LoveSpark design so the tool itself is as easy on the senses as the pages it calms.

**What Sensory Shield does:**

- **Reduce motion** — quiet autoplaying animations, transitions, and constant movement that pull your attention away
- **Tint screens** — lay a soft, adjustable color overlay over bright pages to ease glare and light sensitivity
- **Hide GIFs** — stop looping animated images from flashing and repeating in your peripheral vision
- **Focus ruler** — a horizontal reading guide that helps you track your place and read one line at a time
- **Simple controls** — flip each shield on or off from a small popup; your choices are remembered next time

**Free, open, and private by design:**

- 100% free and MIT-licensed open source — inspect every line at the repository linked below
- Zero data collection. Nothing about you or your browsing is ever transmitted anywhere
- Your settings live only in your browser's local storage — no accounts, no sign-in, no tracking, no ads

Sensory Shield exists to make the internet a calmer, kinder place to be. Made with love for anyone whose brain deserves a break.

## Single-purpose justification

Sensory Shield has one purpose: **to reduce sensory overload while browsing by giving the user visual-comfort controls over any web page.** Every feature serves that single purpose — reducing motion quiets overstimulating animation, screen tinting eases glare and light sensitivity, hiding GIFs removes repetitive flashing movement, and the focus ruler reduces visual clutter so the user can track one line of text at a time. Each is a different lever on the same goal (a calmer, more comfortable page), and the settings storage simply remembers which levers the user has chosen. There is no unrelated functionality bundled in.

## Per-permission justification

**storage** — Sensory Shield uses `chrome.storage.local` to remember the user's own comfort preferences (which shields are enabled, the chosen tint color and intensity, and focus-ruler state) so those settings persist between page loads and browser sessions. This is the only thing stored, it stays on the user's device, and it is never transmitted.

## Host-permissions justification

**`<all_urls>`** — Sensory Shield's whole purpose is to calm *whatever page the user is currently on*, and sensory-overload triggers (motion, glare, looping GIFs) appear on every kind of site. The extension therefore needs to apply its visual adjustments — motion reduction, the color tint overlay, GIF hiding, and the focus ruler — across all sites the user visits, which requires broad host access. This permission is **NOT** used to read, collect, log, or transmit page content, form data, credentials, or browsing history. It is used solely to render the user's chosen visual-comfort adjustments locally in the page; no page data ever leaves the browser.

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

`https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/sensory-shield/PRIVACY.md`

Sensory Shield stores only the user's own preferences in `chrome.storage.local` on their device and transmits zero data externally.

## Reviewer test instructions

Estimated time: ~3 minutes. No account, sign-in, or setup is required.

1. Install the extension. Open any content-heavy site with animation and imagery — e.g. a news homepage or `https://giphy.com` — in a normal (non-incognito) tab.
2. Click the **Sensory Shield** icon in the toolbar to open the popup. You'll see the LoveSpark UI (Sparky mascot, retro-pink theme) with a toggle for each shield.
3. Toggle **Reduce motion** on. Return to the page and confirm autoplaying animations/transitions are quieted.
4. Toggle **Hide GIFs** on. Confirm animated/looping images on the page are no longer shown or animating.
5. Enable **Tint screen** and adjust the color/intensity control. Confirm a soft color overlay is applied over the page to reduce glare.
6. Enable the **Focus ruler**. Confirm a horizontal reading guide appears over the page to help track a line of text.
7. Reload the tab and reopen the popup. Confirm your toggles are remembered (proving settings persist via local storage only — no network calls are made).

Optional verification: open DevTools → Network while toggling shields; you will see **no external requests** — the extension performs all work locally and collects/transmits no data.
