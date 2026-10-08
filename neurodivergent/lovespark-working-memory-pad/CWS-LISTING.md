# LoveSpark Working Memory Pad — CWS Listing

## Extension name

LoveSpark Working Memory Pad

*(28 characters)*

## Short description

Pin up to 3 quick notes for ADHD working memory — phone numbers, instructions, anything you'll forget. Always visible, always free.

*(131 characters — weaves "ADHD," "working memory," and "quick notes")*

## Detailed description

**Your working memory has a limit. This is a tool that respects it.**

LoveSpark Working Memory Pad is a dead-simple ADHD chrome extension that holds the handful of things your brain refuses to keep in the foreground — a phone number someone just read aloud, the three steps a support agent told you to follow, the idea that will vanish the second you switch tabs. Open the popup and they're right there. Every time.

Most quick notes and sticky notes extensions try to do everything: infinite notes, folders, sync accounts, rich text, web overlays. For a lot of neurodivergent brains, that's the opposite of helpful — another inbox to manage, another place to drown. This one does the opposite on purpose.

**You get exactly 3 note slots. That's the feature, not the limitation.** Three is a working-memory prosthetic, not a second to-do list. When all three are full, you're forced to decide what actually matters and let the rest go — which is the whole point. It's a brain dump pad sized to the thing your brain is actually missing in the moment.

**Who it's for**
- People with ADHD who lose a number or instruction in the two seconds it takes to find a pen
- Anyone juggling a phone call and a screen who needs to remember phone numbers *right now*
- Neurodivergent folks who want a scratchpad extension without the overwhelm of a full note app
- Students, support reps, developers — anyone who needs a always-on-top thought to survive a tab switch

**Built neurodivergent-first**
- **OpenDyslexic font** by default, with a clean system fallback — easier to read for dyslexic and ADHD users
- **Retro-pink, high-contrast, accessible** UI that meets WCAG 2.1 AA
- **Keyboard friendly** with visible focus states and full screen-reader labelling
- **Reduced-motion aware** — no surprise animation if you've asked your system to calm things down

**Features**
- Pin up to 3 quick notes, always visible when you open the popup
- Notes persist between sessions — close the browser, they're still there
- One-tap edit and clear per note
- Zero setup, zero login, zero learning curve
- Tiny footprint, opens instantly

**Free, open, and private — for real**
- 100% free, forever. No ads, no upsell, no "premium" gate on the basics.
- Open source under the MIT license — read every line at https://github.com/Joona-t/lovespark-working-memory-pad
- Your notes live **only** in your browser's local storage. Nothing is ever uploaded, synced, sold, or transmitted anywhere. No account, no servers, no tracking.

If you've been let down by sticky notes extensions that paywall the basics or lose your notes to a sync failure, this is the zero-friction, local-only answer: a working memory pad that just holds your three things and gets out of the way.

Part of the LoveSpark suite — free, open-source, neurodivergent-first browser tools.

## Single-purpose justification

The single purpose of LoveSpark Working Memory Pad is to let the user keep up to three short personal notes pinned and immediately visible in the extension popup, as a working-memory aid. Every feature serves only that purpose: the three editable note slots are the notes; saving to local storage is what makes the notes persist between sessions so they remain available; the edit and clear controls are how the user maintains those same notes; and the OpenDyslexic/accessibility styling exists solely to make those three notes readable. There is no second feature — no web-page interaction, no browsing tools, no syncing, no content beyond the user's own short notes — so the extension does one narrowly defined thing and nothing else.

## Per-permission justification

**storage** — This permission is used to save the user's up-to-three notes in `chrome.storage.local` so they remain pinned and visible the next time the popup is opened, including after the browser is closed and reopened. Without it, every note would be lost the moment the popup closed, defeating the extension's only purpose as a working-memory aid. The stored data is exclusively the user's own note text and never leaves the device.

## Host-permissions justification

No host permissions are requested. LoveSpark Working Memory Pad does not declare `<all_urls>`, any host-match pattern, or any host access at all. It operates entirely within its own popup UI and its own local storage; it does not read, inject into, modify, or monitor any web page, tab content, or browsing activity. Because the extension never touches the pages you visit, there is no feature that would require host access.

## Privacy disclosure (CWS Section 5)

**Data collected — set every category to "Not collected":**

| Data type | Selection |
|---|---|
| Personally identifiable information | **Not collected** |
| Health information | **Not collected** |
| Financial and payment information | **Not collected** |
| Authentication information | **Not collected** |
| Personal communications | **Not collected** |
| Location | **Not collected** |
| Web history | **Not collected** |
| User activity | **Not collected** |
| Website content | **Not collected** |

Rationale: the extension stores the user's note text only in `chrome.storage.local` on the user's own device. No data is transmitted to the developer or any third party, so no data is "collected" under the Chrome Web Store definition.

**Privacy policy URL (paste into Section 5):**
`https://github.com/Joona-t/lovespark-working-memory-pad/blob/main/PRIVACY.md`

**Developer certification checkboxes — tick all three:**
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

## Reviewer test instructions

Total time: about 3 minutes. No account, sign-in, or test data required.

1. **Install and open (≈20s).** Install the extension, then click its toolbar icon to open the popup. You will see the LoveSpark Working Memory Pad with the Sparky mascot and exactly three note slots — no login screen, no onboarding.
2. **Add a note (≈20s).** Click into the first note slot and type a phone number, e.g. `555-0142`. The text is saved locally as you type.
3. **Add the other two (≈30s).** Type into the second and third slots (e.g. `Step 1: refresh, Step 2: retry` and `Call back at 3pm`). Confirm all three are visible at once.
4. **Verify persistence across popup close (≈20s).** Click anywhere outside the popup to close it, then reopen the popup from the toolbar. All three notes should reappear exactly as entered — this is the core working-memory feature.
5. **Verify persistence across browser restart (≈30s).** Fully quit and relaunch Chrome, then reopen the popup. The three notes should still be present, confirming they are stored in `chrome.storage.local`.
6. **Edit and clear (≈20s).** Change the text in one slot to confirm editing works, then clear a slot to confirm a note can be removed.
7. **Confirm scope and no network (≈20s).** Open any normal web page and note that the extension does not inject anything, add overlays, or alter the page — it only acts inside its own popup. Optionally open DevTools → Network while editing notes to confirm no outbound requests are made; all storage is local.

Expected result: three short notes can be pinned, edited, cleared, and survive both popup-close and full browser restart, with zero network activity and zero interaction with web page content — matching the single declared purpose and the `storage`-only permission.
