# LoveSpark Context Switch — CWS Listing

## Extension name
LoveSpark Context Switch

## Short description
Log every task switch and see your daily context-switching count. An ADHD-friendly focus tracker for task-switching awareness.

## Detailed description
**LoveSpark Context Switch helps you notice how often you jump between tasks — so your ADHD brain can build real awareness of its task-switching patterns.**

Every time you drop one thing to start another, that's a context switch. It costs focus, momentum, and working memory — and most of us never realize how many times a day it happens. LoveSpark Context Switch turns that invisible habit into a simple number you can watch.

Open the popup and tap the button whenever you catch yourself switching tasks. The extension keeps a running count for today, so you can see your context-switching rhythm at a glance. The count resets each day automatically, giving you a fresh baseline every morning and a gentle, judgment-free way to spot the days when your attention is getting pulled in too many directions.

There's nothing to configure and nothing to learn. It's a single tap, a single number, and a growing sense of awareness — the first step toward protecting your deep-focus time.

**Built neurodivergent-first.** LoveSpark Context Switch is designed for ADHD and neurodivergent minds. It uses the OpenDyslexic-friendly, high-contrast, retro-pink LoveSpark design so the interface stays calm, readable, and easy to act on when your focus is already stretched thin. Reduced-motion and keyboard navigation are respected throughout.

**Private by design.** Your switch counts live only on your own device in local browser storage. Nothing is ever uploaded, synced to a server, or shared with anyone. There are no accounts, no sign-ups, and no tracking.

**Free and open source, forever.** LoveSpark Context Switch is MIT-licensed and fully open source. There are no ads, no upsells, and no paid tiers. You can read every line of code and verify exactly what it does.

Features:
- One-tap logging of each task switch from the toolbar popup
- Live daily context-switch count so you can see your task-switching patterns
- Automatic daily reset for a clean baseline each day
- ADHD- and neurodivergent-friendly, accessible interface (OpenDyslexic-friendly type, high contrast, reduced-motion aware, keyboard navigable)
- 100% local storage — zero data ever leaves your device
- No account, no sign-up, no ads
- Free, open source, and MIT-licensed

If you've ever wondered why a "quick" work session left you exhausted with little to show, LoveSpark Context Switch gives you the data to find out — one honest tap at a time.

## Single-purpose justification
LoveSpark Context Switch has one single purpose: to let you log task switches and see how many context switches you make each day, so you can become aware of your task-switching patterns. Every part of the extension serves that one purpose — the popup exists to record a switch, the daily counter exists to reflect those switches back to you, and the automatic daily reset exists to keep each day's count meaningful. There are no unrelated features, no browsing tools, and no secondary functions bolted on; the entire extension is a focused self-awareness counter for context switching.

## Per-permission justification
**storage** — The `storage` permission is used solely to save your context-switch count for the current day (and the date it belongs to) in local browser storage, so the number persists when you close and reopen the popup and resets correctly on a new day. This is the only feature the permission supports; no data stored via this permission ever leaves your device.

## Host-permissions justification
LoveSpark Context Switch requests no host permissions. It does not read, access, or modify the content of any website, and it does not observe your browsing. It never needs `<all_urls>` or any site-specific host access because logging a task switch and displaying a daily count happen entirely within the extension's own popup.

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

**Developer certifications — tick all three checkboxes:**
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:**
https://github.com/Joona-t/lovespark-context-switch/blob/main/PRIVACY.md

*Note: LoveSpark Context Switch stores only your daily context-switch count in `chrome.storage.local` on your own device. It transmits zero data externally, uses no remote servers, and has no accounts — so every data-collection category is truthfully "Not collected."*

## Reviewer test instructions
This takes about 3 minutes and requires no account, no setup, and no special sites.

1. Install the extension and click the LoveSpark Context Switch icon in the Chrome toolbar to open its popup. You should see the Sparky mascot, the retro-pink LoveSpark interface, and today's context-switch count displayed as a number (starting at 0).
2. Click the "log a switch" / context-switch button in the popup once. Confirm the daily count increases by one (0 → 1).
3. Click the button a few more times and confirm the count keeps incrementing accurately (e.g., up to 4 or 5).
4. Close the popup, then reopen it by clicking the toolbar icon again. Confirm the count you reached is still shown — this verifies the `storage` permission is persisting the value locally.
5. (Optional) To verify the daily-reset behavior, note that the count is stored against today's date; on a new calendar day the count starts fresh at 0 while remaining fully local.
6. Confirm no permission prompts for host access appear, no network requests are made, and no data-entry or sign-in is ever requested — the extension works entirely offline using local storage only.

Expected result: tapping the button logs a context switch, the daily count updates and persists locally, and nothing is transmitted off the device.
