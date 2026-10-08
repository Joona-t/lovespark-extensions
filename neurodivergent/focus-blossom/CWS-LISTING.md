# Focus Blossom: Site Blocker & Digital Detox — CWS Listing

## Extension name

Focus Blossom: Site Blocker & Digital Detox

*(43 characters)*

## Short description

Block distracting websites and grow a flower garden the longer you resist. A gentle site blocker for focus and digital detox 🌸

*(128 characters)*

## Detailed description

**Every distracting site you block grows a flower. The longer you stay away, the more your garden blooms.** Focus Blossom turns website blocking into something gentle and rewarding instead of another rule you resent — so staying focused feels less like willpower and more like watching something grow.

Add the sites that pull you away — social feeds, video rabbit holes, news loops, shopping tabs — to your personal block list. When you try to open one, Focus Blossom quietly stops the visit. And every stretch of time you resist, your flower garden keeps blooming. It's a calm, visual reward for the focus you're already building.

Focus Blossom is a **site blocker and digital detox tool built neurodivergent-first**. If you have ADHD, struggle with doomscrolling, or just want to reclaim your screen time, punishment-based blockers rarely stick. Positive reinforcement does. Instead of shaming you for a slip, Focus Blossom celebrates the time you stay on track — a small dopamine reward aimed in the right direction.

Accessibility is built in, not bolted on. The interface uses the **OpenDyslexic** font, a soft retro-pink theme, high-contrast colors, full keyboard navigation, and reduced-motion support — designed for the way neurodivergent brains actually work.

**What you can do:**

- 🌸 **Grow a flower garden** — resist your blocked sites and watch your garden bloom over time
- 🚫 **Block distracting websites** — build a personal block list of the sites that derail you
- ⏰ **Stay on track over time** — the longer you go without visiting, the more your garden fills in
- 🔔 **Gentle nudges** — encouraging notifications when a flower blooms or you hit a milestone
- 🎨 **Calming, accessible design** — OpenDyslexic font, retro-pink theme, reduced-motion friendly
- 🔒 **Fully private** — everything lives on your device; nothing is ever sent anywhere

**Free, forever. Open source. Zero data collection.** Focus Blossom is MIT-licensed and 100% open source — you can read every line at the repository below. It stores your block list and garden progress **only** in your browser's local storage (`chrome.storage.local`). It has no accounts, no ads, no trackers, and **transmits zero data externally**. Nothing about your browsing ever leaves your computer.

Plant a little focus. Watch it bloom. 🌸

Source code: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/focus-blossom

## Single-purpose justification

Focus Blossom has one purpose: **to help users block distracting websites and stay focused, using a growing flower garden as positive reinforcement for the time they spend away from those sites.** Every feature serves that single purpose. The block list defines which sites to keep out; the blocking engine enforces it; the flower garden visualizes and rewards the focus that results; the periodic checks advance the garden and reset it on schedule; and the notifications encourage the user with gentle milestone nudges. There is no feature that exists outside this focus-and-detox purpose — no browsing analytics, no unrelated utilities, no data products. The extension does exactly one thing: it helps people resist distraction and rewards them for it.

## Per-permission justification

**storage** — Used to save the user's block list, flower-garden progress, and preferences locally so they persist between sessions. All of this is stored in `chrome.storage.local` on the user's own device; nothing is stored remotely.

**alarms** — Used to schedule the periodic background checks that advance the flower garden as time passes and handle daily/scheduled resets of progress. This lets the garden bloom over time without requiring the popup to stay open.

**notifications** — Used to show gentle, encouraging notifications — for example when a new flower blooms or the user reaches a focus milestone. Notifications are purely for positive reinforcement and contain no personal data.

**declarativeNetRequest** — Used to actually block navigation to the websites on the user's block list. This is the core blocking mechanism: the browser evaluates the block rules internally, so the extension never sees or records which sites the user visits.

## Host-permissions justification

**`<all_urls>`** — Focus Blossom requests broad host access because the user may add **any** website to their personal block list, and the `declarativeNetRequest` blocking rules must be able to match and block a site on whatever domain the user chooses. There is no fixed list of sites we could scope this to in advance — the block list is entirely user-defined.

This permission is **NOT** used to read page content, inject scripts into pages, monitor browsing history, or collect any data. With `declarativeNetRequest`, rule matching happens inside the browser engine — the extension only supplies the block rules and never receives the URLs of pages the user visits. No browsing information is read, stored, or transmitted.

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

**Developer certifications — tick all three:**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/focus-blossom/PRIVACY.md

Focus Blossom collects no user data of any kind. The block list, garden progress, and settings are stored only in `chrome.storage.local` on the user's device and are never transmitted, sold, or shared.

## Reviewer test instructions

This 3-minute walkthrough verifies the full block-and-bloom loop. No account, sign-in, or network access is required.

1. **Open the extension.** Click the Focus Blossom toolbar icon to open the popup. You'll see the Sparky mascot, the retro-pink UI, and your (initially empty) flower garden.
2. **Add a site to the block list.** Enter a distracting site — for example, `example.com` — and add it to your block list. Confirm it appears in the list inside the popup.
3. **Confirm blocking works.** Open a new tab and navigate to `https://example.com`. The extension should stop the visit / show the blocked state instead of loading the site. This is the `declarativeNetRequest` + `<all_urls>` behavior in action.
4. **Confirm resisting grows the garden.** Return to the popup. Because you have a blocked site set up and are staying away from it, the flower garden reflects your focus progress. (Garden growth advances over time via the `alarms`-scheduled checks — the longer a site stays blocked and unvisited, the more it blooms.)
5. **Confirm a notification (optional).** When a flower blooms or a milestone is reached, a gentle encouragement notification may appear — this is the `notifications` permission being used for positive reinforcement only.
6. **Confirm persistence and privacy.** Close and reopen the popup: your block list and garden progress remain (saved in `chrome.storage.local`). No network requests are made — you can verify in DevTools that the extension transmits no data externally.

To remove test data, delete the site from the block list in the popup. All state is local and can be cleared from the extension's settings.
