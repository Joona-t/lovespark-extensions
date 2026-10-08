# LoveSpark Gratitude Journal — CWS Listing

## Extension name

LoveSpark Gratitude Journal

*(27 characters — within the 45-character limit.)*

## Short description

Daily gratitude journal for ADHD brains: jot 3 things you're grateful for, grow a garden, build a mindful habit. Free & private.

*(128 characters — within the 132-character limit. Weaves in "gratitude journal," "ADHD," and "mindful habit" naturally.)*

## Detailed description

**Three things. One minute a day. A garden that grows with you.**

LoveSpark Gratitude Journal is a tiny, friction-free gratitude journal that lives in your browser toolbar. Each day it asks one simple thing: write down three things you're grateful for. That's it. No essays, no streak-shaming, no login screen — just a quick moment of reflection that fits into a busy, distractible day.

**Built for ADHD and neurodivergent brains.** Long-form journaling apps ask for more attention than a scattered day can spare, so they get abandoned by day three. This extension does the opposite. It keeps the ask small (three short lines), keeps the reward visible (a little garden that grows as you keep showing up), and keeps the whole thing one click away. Micro-gratitude that's actually doable is gratitude that actually sticks.

**Watch your consistency grow.** Every day you complete your three entries, your garden grows a little more. It's a gentle, visual way to see your habit taking root over time — momentum you can look at instead of a number that punishes you for a missed day.

**Accessible by design.** Like every LoveSpark tool, the Gratitude Journal is built neurodivergent-first: it uses a calm retro-pink interface with clear, readable typography, clear focus indicators for keyboard navigation, strong color contrast, and reduced-motion support for anyone who prefers a quieter screen.

**Private and free, forever.** Your reflections are personal, so they stay on your device. Everything you write is saved only in your browser's local storage — nothing is ever uploaded, shared, sold, or tracked. There are no accounts, no ads, and no analytics. The extension is free and open source under the MIT license, so anyone can read exactly how it works.

**Features:**
- Write 3 things you're grateful for each day — quick, low-friction micro-gratitude
- A garden that grows as your daily-gratitude habit builds consistency
- Designed for ADHD and neurodivergent focus: small ask, visible reward, one click away
- Retro-pink theme, readable typography, high-contrast, keyboard-navigable, reduced-motion friendly
- 100% local storage — your entries never leave your device
- No account, no sign-up, no ads, no tracking
- Free and open source (MIT) — inspect the code anytime

Open your toolbar, name your three good things, and watch your garden — and your gratitude habit — grow.

## Single-purpose justification

The single purpose of LoveSpark Gratitude Journal is to help the user record a short daily gratitude entry (three things they are grateful for) and see their consistency reflected in a growing garden. Every feature serves that one purpose: the three-line entry form is the act of journaling; the growing-garden visual is feedback that reinforces the daily journaling habit; the local-storage persistence exists solely to remember the user's own past entries so the journal is continuous day to day; and the accessible, neurodivergent-friendly design (retro-pink theme, readable typography, keyboard and reduced-motion support) exists only to make that same daily journaling act easy to complete. There are no unrelated capabilities — no browsing, blocking, content injection, or communication features — so the extension does exactly one thing and nothing else.

## Per-permission justification

**storage** — This permission is used to save the user's daily gratitude entries and their garden/consistency progress on their own device via `chrome.storage.local`. It is required so that a journal written today is still there tomorrow, allowing the daily habit and the growing-garden visual to persist between sessions. No data stored under this permission is transmitted anywhere; it stays in the user's local browser profile.

## Host-permissions justification

No host permissions are requested. LoveSpark Gratitude Journal does not read, modify, or access the content of any website. It operates entirely within its own toolbar popup, so it has no need for host access to any page or domain.

## Privacy disclosure (CWS Section 5)

**Data collection — set every category to "Not collected":**
- Personally identifiable information (name, address, email, age, ID) — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity (clicks, mouse position, keystroke logging, etc.) — **Not collected**
- Website content (text, images, sound, files) — **Not collected**

The gratitude entries the user writes are stored **only** locally in `chrome.storage.local` on the user's own device. They are never transmitted to the developer or any third party, so no data leaves the browser and nothing is "collected" in the CWS sense.

**Certification checkboxes to tick (all true for this extension):**
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL (paste into Section 5):**
`https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-gratitude-journal/PRIVACY.md`

## Reviewer test instructions

Total time: about 3 minutes. No account, sign-up, or network access is required.

1. **Install and open.** Load the extension and click the LoveSpark Gratitude Journal icon in the Chrome toolbar. The popup opens showing three entry fields (prompts for the three things you're grateful for) and a garden illustration.
2. **Write today's entry.** Type a short phrase into each of the three fields — for example, "coffee," "sunshine," "finished a task" — and save/submit the entry as prompted.
3. **Confirm the garden responds.** After completing the three entries for the day, observe that the garden updates to reflect the completed day / added consistency. This is the core reward loop.
4. **Confirm persistence.** Close the popup, then click the toolbar icon again to reopen it. Your saved entries and garden progress are still present, demonstrating that data is stored locally and persists between sessions.
5. **Confirm it's fully local (optional but recommended).** Open Chrome DevTools on the popup and check the **Network** tab while creating and saving an entry — you will see no outbound network requests. Under **Application → Storage**, the entry data appears only in the extension's local storage; nothing is sent externally.
6. **Confirm no login and no host access.** At no point are you asked to create an account or sign in, and the extension never requests access to or reads any website you visit — it works entirely within its own popup.

Expected result: a user can record three daily gratitude items, watch a garden grow with continued use, and have those items remembered locally — with zero data leaving the device and no special website access required.
