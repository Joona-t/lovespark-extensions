# Porn Blocker Rewire Brain 🧠 — CWS Listing

## Extension name

Porn Blocker Rewire Brain 🧠

## Short description

Block porn & adult sites, build a NoFap streak, and rewire your brain. Free, private, local-only website blocker — zero data collected.

## Detailed description

**Take back your focus.** Porn Blocker Rewire Brain is a free, mindful website blocker that helps you cut out adult content, break the dopamine loop, and redirect your energy toward what actually matters. Add the sites you want gone, and the extension quietly keeps them out of your day.

This is a NoFap-friendly tool built for recovery, focus, and intentional browsing. Instead of shaming you, it works like a calm accountability partner: every blocked site is a small win, and your streak counter turns those wins into momentum you can see.

**Who it helps.** Anyone trying to quit porn, reset an overstimulated reward system, or simply browse with more intention — students, remote workers, people in recovery, and anyone doing the slow work of rewiring an old habit. If aggressive paywalls, sketchy data practices, and easy-to-bypass blockers have let you down before, this is the free, transparent alternative.

**Built neurodivergent-first.** Porn Blocker Rewire Brain is part of the LoveSpark suite, designed for neurodivergent brains by a neurodivergent developer. The interface uses the OpenDyslexic font for readability, a calm retro-pink theme, accessible contrast, full keyboard navigation, and reduced-motion support. Clear, friendly, and never overwhelming.

**Free, open, and private — for real.**
- **Always free.** No trials, no paywalls, no "premium streak" locked behind a subscription.
- **Open source (MIT).** Read every line on GitHub and verify exactly what it does.
- **Zero data collection.** Everything — your block list, your streak, your settings — lives only in `chrome.storage.local` on your own device. Nothing is ever transmitted, sold, or shared.

**Features:**
- 🚫 **Custom site blocking** — add any porn, adult, or distracting site to your personal block list and have requests to it blocked automatically.
- 🔥 **Streak tracker** — build and visualize a daily clean streak that grows the longer you stay on track.
- 🧭 **Mindful redirect** — when you try to open a blocked site, you're gently sent somewhere better instead, redirecting the impulse toward your goals.
- 🔔 **Encouraging notifications** — optional streak milestone and reminder notifications to keep your momentum going.
- ♿ **Accessibility built in** — OpenDyslexic font, high-contrast retro-pink theme, keyboard-friendly, reduced-motion aware.
- 🔒 **Local-only & private** — no accounts, no tracking, no external servers.

Block adult content, reset your dopamine, and rewire your brain — one streak at a time. Free forever, open source, and yours alone.

## Single-purpose justification

The single purpose of Porn Blocker Rewire Brain is to **block user-specified adult and distracting websites and help the user sustain abstinence from them**. Every feature serves that one purpose: the block list and request blocking enforce the user's chosen sites; the mindful redirect handles attempts to reach a blocked site by steering the user away; the streak tracker measures and motivates continued success at avoiding that content; the daily checks keep the streak and block rules current; and the optional notifications reinforce the same abstinence goal with encouragement. There are no unrelated tools, no general browsing utilities, and no features outside the scope of blocking adult content and supporting the user's commitment to stay away from it.

## Per-permission justification

**storage** — Used to save the user's block list, streak count, and preferences in `chrome.storage.local` so blocking and streak tracking persist between sessions. No data is stored remotely.

**declarativeNetRequest** — Used to block network requests to the sites on the user's block list. This is the core blocking mechanism that prevents blocked adult/distracting sites from loading.

**declarativeNetRequestWithHostAccess** — Used to apply the user's blocking rules to whatever domains they add to their block list, since blocked sites can be any host the user chooses. It enables the blocking rules to match across the user's custom domains.

**tabs** — Used to detect when a tab navigates to a blocked site and to perform the mindful redirect, sending that tab to an encouraging page instead of the blocked content.

**alarms** — Used to schedule periodic daily checks that maintain the streak counter (e.g., daily reset/rollover) and keep blocking state accurate without running a constant background process.

**notifications** — Used to display optional streak-milestone and reminder notifications that encourage the user to maintain their progress. Notifications are tied solely to the user's blocking and streak activity.

## Host-permissions justification

The extension requests `<all_urls>` because the user can add **any** website to their personal block list — there is no fixed set of domains to declare in advance. Broad host access is required so that `declarativeNetRequestWithHostAccess` can apply the user's blocking rules to whatever sites they choose, and so the `tabs`-based redirect can intercept navigation to those user-blocked sites on any domain. This permission is **NOT** used to read, collect, monitor, or transmit page content or browsing history; it is **NOT** used for analytics, advertising, or tracking; and no information about the sites you visit ever leaves your device. Its only function is to enforce the block list and redirect you away from the sites you yourself have chosen to block.

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

**Developer certifications (tick all three):**
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/porn-blocker-rewire-brain-3/blob/main/PRIVACY.md

This extension stores all data (block list, streak, settings) exclusively in `chrome.storage.local` on the user's own device and transmits zero data externally.

## Reviewer test instructions

This 3-minute walkthrough verifies the extension's single purpose — blocking user-chosen sites and tracking a streak — with no external network activity.

1. **Install and open** the extension by clicking its toolbar icon. The popup opens showing the LoveSpark interface (OpenDyslexic font, retro-pink theme) with a streak counter and a block-list area.
2. **Add a site to the block list.** In the popup, add a test domain (for example, `example.com`) to the block list and save/confirm. This writes the entry to `chrome.storage.local` only.
3. **Verify blocking.** In a new tab, navigate to the blocked domain (`http://example.com`). The request is blocked and you are taken to the extension's mindful redirect page instead of the site loading normally.
4. **Verify the streak.** Reopen the popup and confirm the streak counter is present and reflects the current day. (The streak rolls over on the daily `alarms` check; no action loads remote data.)
5. **Verify notifications (optional).** If notification permission is granted, confirm any streak/encouragement notification matches blocking activity only.
6. **Confirm zero data transmission.** Open DevTools → Network with the popup and a blocked-navigation attempt active; observe that no requests are sent to any external/analytics server. All behavior is local. Source is fully auditable at the repository linked above.
