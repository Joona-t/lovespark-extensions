# LoveSpark Dopamine Menu — CWS Listing

## Extension name
LoveSpark Dopamine Menu

## Short description
Dopamine menu for ADHD & neurodivergent focus — pick a quick healthy stim, tap done, track your completions. Free, no account.

## Detailed description
**Feeling restless, understimulated, or stuck in a scroll spiral? Open your Dopamine Menu and pick a better hit.**

LoveSpark Dopamine Menu is a tiny toolbar button that opens a curated list of quick, healthy ways to get a dopamine boost — a stretch, a glass of water, a short walk, a song, a few deep breaths. Instead of reaching for the endless feed, you glance at a menu of small, doable options, choose one, and tap it done. Your completions are counted so you can see the healthy choices adding up.

It's built for ADHD and neurodivergent brains that crave stimulation but get overwhelmed by open-ended "just do something productive" advice. A short, concrete menu removes the decision paralysis: you're not inventing an activity, you're picking one off a list.

The whole thing is designed to be gentle and accessible. It ships with the OpenDyslexic font option, a calm retro-pink theme, keyboard navigation, screen-reader labels, and reduced-motion support — no flashing, no guilt, no streak-shaming.

**What it does:**
- Opens a curated menu of quick, healthy dopamine "stims" in one click
- Tap any item to mark it done and log the completion
- Tracks your completion count so progress is visible
- Neurodivergent-first design: OpenDyslexic font, retro-pink theme, high-contrast, reduced-motion friendly
- Fully keyboard-navigable with screen-reader labels
- Works entirely offline — everything stays on your device

**Private and free, by design:**
- No account, no sign-up, no login — ever
- Zero data collection; nothing is transmitted anywhere
- All data lives only in your browser's local storage
- 100% free, open source, and MIT-licensed
- No ads, no trackers, no paid tiers

Keywords this helps you find it by: dopamine menu, ADHD focus tool, neurodivergent self-care, healthy dopamine, anti-doomscroll, mindful browsing, habit nudge, executive function helper. Every one of those describes exactly what the extension already does — nothing more.

Source code is public and auditable at https://github.com/Joona-t/lovespark-dopamine-menu.

## Single-purpose justification
The single purpose of LoveSpark Dopamine Menu is to show the user a curated list of quick, healthy dopamine-boosting activities and let them mark those activities complete. Every feature serves that one purpose: the menu presents the activities, the tap-to-complete action marks one done, the completion counter reflects those same completions, and the theming/accessibility options (OpenDyslexic font, retro-pink theme, reduced motion) only change how that single menu is presented. There is no browsing, blocking, content modification, or unrelated utility bundled in — the extension does one thing, and the local completion count exists solely to reflect that one thing back to the user.

## Per-permission justification
**storage** — Used only to save your list of completed activities and your completion count locally via `chrome.storage.local`, plus your chosen theme and font preference, so the menu and your progress persist between sessions. This is the single feature the permission enables; the data never leaves your device and is never transmitted anywhere.

## Host-permissions justification
No host permissions are requested. LoveSpark Dopamine Menu does not declare `<all_urls>` or any host match pattern, does not read or modify any web page, and does not run content scripts on the sites you visit. It operates entirely within its own popup.

## Privacy disclosure (CWS Section 5)
Paste the following into the CWS privacy form.

**Data collection categories — set every category to "Not collected":**
- Personally identifiable information — Not collected
- Health information — Not collected
- Financial and payment information — Not collected
- Authentication information — Not collected
- Personal communications — Not collected
- Location — Not collected
- Web history — Not collected
- User activity — Not collected
- Website content — Not collected

**Developer certifications (tick all three):**
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Rationale to accompany the form:** This extension stores your completed-activity list, completion count, and display preferences only in `chrome.storage.local` on your own device. It transmits zero data externally, has no servers, no analytics, and no third-party services. There is nothing to sell, transfer, or repurpose.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-dopamine-menu/blob/main/PRIVACY.md

## Reviewer test instructions
This takes about 3 minutes and requires no account, login, or network access.

1. Install the extension and click the LoveSpark Dopamine Menu icon in the Chrome toolbar. The popup opens showing a curated list of quick, healthy dopamine-boosting activities (e.g. stretch, drink water, take a walk, deep breaths).
2. Click (or press Enter on) any activity to mark it done. Confirm the item shows a completed state and the completion counter increments by one.
3. Mark a second and third activity done. Confirm the counter continues to increase accurately with each completion.
4. Close the popup, then reopen it. Confirm your completions and count persisted — this demonstrates local storage via the `storage` permission.
5. Open the theme/font control and switch the theme (retro-pink) or enable the OpenDyslexic font. Confirm the menu re-renders in the new style and the preference persists on reopen.
6. Optional — verify privacy: open Chrome DevTools → Network while interacting with the popup and confirm no outbound network requests are made. All state is written only to `chrome.storage.local`.

Expected result: a single-purpose popup that lists healthy dopamine activities, lets you tap them complete, and counts those completions locally — with no page access, no accounts, and no data leaving the device.
