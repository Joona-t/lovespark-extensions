# LoveSpark Win Jar — CWS Listing

## Extension name
LoveSpark Win Jar

## Short description
A digital win jar for ADHD brains: log small wins, shake for a random past win when you need a boost. No account, always free.

## Detailed description
**LoveSpark Win Jar is a digital win jar for the moments your brain insists you've done nothing right.**

ADHD and neurodivergent brains are wired to forget their wins. The finished task, the hard email you finally sent, the small brave thing — they evaporate the second they're done, and all that's left is the running list of what's undone. Win Jar catches those victories before they slip away and hands them back to you when you need them most.

It works exactly like the mason jar of paper notes people keep on a shelf — you drop a win in, and later you shake it and pull one back out. Except this one lives in your browser toolbar, so logging a win takes two seconds and never means finding a pen. When self-doubt hits, one click reaches into everything you've ever added and surfaces a real past win at random: proof, in your own words, that you've done hard things before.

There's no streak to break, no productivity score, no guilt. Just a quiet, encouraging place to collect evidence that you're doing better than your brain gives you credit for.

Win Jar is built neurodivergent-first: an OpenDyslexic-friendly, dyslexia-conscious typeface, a calm retro-pink design, full keyboard navigation, reduced-motion support, and screen-reader labels throughout.

**What you can do:**
- **Log a win in seconds** — type any small victory, big or tiny, and drop it in the jar.
- **Shake for a boost** — pull a random past win back out whenever you need encouragement or a dopamine lift.
- **Build a private collection** — every win stays saved between sessions so your jar grows over time.
- **Read it your way** — OpenDyslexic-friendly font, high-contrast retro-pink theme, and accessible controls.
- **Use it distraction-free** — no notifications nag you, no login wall, no upsell.

**Free, open, and private by design:**
- 100% free forever — no ads, no subscriptions, no premium tier.
- Open source and MIT-licensed — read every line of code on GitHub.
- No account and no sign-up — just install and start collecting wins.
- Zero data collection — everything you write is stored locally on your own device and is never transmitted anywhere.

Win Jar is part of the LoveSpark suite of free, privacy-first productivity tools made for neurodivergent coders and anyone whose brain needs a little more encouragement and a lot less pressure. Add it, log your first win, and give future-you something to shake loose on a hard day.

## Single-purpose justification
LoveSpark Win Jar has one single purpose: to let a user record their personal wins and retrieve a random past win for encouragement. Every feature serves that one purpose — the input field exists to add a win to the jar, the saved list exists to preserve those wins between sessions, and the "shake" action exists to pull one of those saved wins back out at random. The theme, font, and accessibility options exist only to make that same core task readable and usable; they add no unrelated capability. The extension does not browse, filter, track, or modify any web page — it is solely a self-contained tool for collecting and revisiting your own wins.

## Per-permission justification
**storage** — Used solely to save the wins you type so your jar persists between browser sessions and so the "shake" feature has past wins to draw from. Data is written to `chrome.storage.local` on your own device only; nothing is stored on or sent to any server. Without this permission the jar would empty every time the popup closed, defeating the extension's single purpose.

## Host-permissions justification
None requested. LoveSpark Win Jar declares no host permissions and no `<all_urls>` or broad host patterns. It never reads, injects into, or interacts with the content of any website or tab. The extension runs entirely within its own popup and needs no access to your browsing.

## Privacy disclosure (CWS Section 5)
Paste the following into the CWS privacy form.

**Data collection categories — all set to "Not collected":**
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

**Privacy policy URL:** https://github.com/Joona-t/lovespark-win-jar/blob/main/PRIVACY.md

Note for reviewers: the wins a user types are stored exclusively in `chrome.storage.local` on the user's own device. The extension makes no network requests and transmits no data off the device.

## Reviewer test instructions
This takes about three minutes and requires no account or setup.

1. **Open the popup.** Click the LoveSpark Win Jar toolbar icon. The popup opens showing the win jar interface with the Sparky mascot, a text input, and an empty (or existing) jar.
2. **Log your first win.** Type a short win such as `Finished reviewing this extension` into the input and submit it (button or Enter). Confirm the win is added to the jar and a count/list updates to reflect it.
3. **Log a second win.** Add another, e.g. `Took a break`. Confirm both wins are now saved in the jar.
4. **Shake for a random win.** Click the "shake" (get a random win) control. Confirm the extension displays one of your previously logged wins, selected at random. Click it a few more times to see it return different saved wins.
5. **Verify persistence (local storage).** Close the popup and reopen it — confirm your logged wins are still there, demonstrating they are saved via `chrome.storage.local`.
6. **Verify no network activity.** Open DevTools → Network with the popup active and repeat steps 2–4. Confirm the extension makes **no outbound network requests**; all data stays local to the device.
7. **(Optional) Verify accessibility.** Navigate the popup with the Tab key to confirm all controls are keyboard-reachable and focus indicators are visible.

Expected result: wins are added, saved locally, and retrieved at random on shake, with zero data leaving the browser.
