# LoveSpark Tab Garden — CWS Listing

## Extension name

LoveSpark Tab Garden

## Short description

Turn tabs into plants: an automatic tab manager that archives unused tabs to your garden. Declutter, refocus, restore anytime.

## Detailed description

**Your tabs are plants. Tend them, and let the ones you're not using rest.**

LoveSpark Tab Garden is a gentle, automatic tab manager for people who open a dozen tabs "just for a second" and never close them. Instead of nagging you or slamming tabs shut, it quietly archives the tabs you haven't touched into a calm, visual garden — and lets you bring any of them back whenever you want by "watering" them.

If a wall of open tabs makes your browser (and your brain) feel cluttered, Tab Garden gives you a clean workspace without the anxiety of losing anything. Nothing is deleted. Archived tabs move to your garden, where they wait patiently until you need them again.

**Who it's for.** Tab Garden is built neurodivergent-first — for coders, students, and anyone with ADHD, autism, or executive-function challenges who finds tab overload draining. The interface uses the OpenDyslexic-friendly, high-contrast, retro-pink LoveSpark design, honors `prefers-reduced-motion`, is fully keyboard-navigable, and meets WCAG contrast standards. Sparky the wolf keeps you company along the way. The "garden" framing turns a stressful chore (closing tabs) into a low-pressure, forgiving ritual: unused tabs simply go dormant, and restoring them is one friendly click.

**It's free, open source, and private by design.** Tab Garden is MIT-licensed and its full source is public. It stores everything on your own device in local browser storage and transmits **zero** data anywhere — no accounts, no sign-in, no analytics, no ads, no tracking. There is no server to send your tabs to, because there is no server.

**What you get:**

- 🌱 **Automatic tab archiving** — tabs you haven't used are gently moved to your garden after a period of inactivity, so your tab bar stays uncluttered.
- 💧 **Restore by watering** — bring any archived tab back to life with a single click; nothing is ever lost.
- 🪴 **A calm visual garden** — see your dormant tabs as plants instead of a stressful list, and reopen exactly the one you need.
- ⏰ **Set-and-forget scheduling** — Tab Garden checks tab activity in the background on a light schedule; no persistent background page draining your battery.
- 🎨 **Neurodivergent-first design** — OpenDyslexic-friendly type, retro-pink theme, reduced-motion support, keyboard navigation, and the Sparky mascot.
- 🔒 **Private and local** — everything stays in `chrome.storage.local`; nothing leaves your machine, ever.
- 🆓 **Free and open source forever** — MIT-licensed, no paywall, no upsells.

Reduce tab clutter, reclaim focus, and give your open tabs a place to rest. Plant, tend, restore.

## Single-purpose justification

Tab Garden has one purpose: to help you manage your browser tabs by automatically archiving unused tabs and letting you restore them on demand. Every feature serves that single purpose. Reading your open tabs is how it identifies which are unused; the background schedule is how it decides when a tab has gone idle long enough to archive; local storage is where the archived "garden" of tabs is kept so you can bring them back; and the popup interface is simply the surface for viewing that garden and watering (restoring) tabs. There are no unrelated capabilities — no browsing enhancements, content injection, ad blocking, or side features. The extension does exactly one thing: tidy your tabs and let you recover them.

## Per-permission justification

**storage** — Used to save your garden locally: the list of archived tabs (their titles and URLs) plus your preferences, via `chrome.storage.local`. This is what lets a tab you archived still be there — and restorable — the next time you open your browser. No data stored here is transmitted off your device.

**tabs** — Used to read the title and URL of your open tabs so Tab Garden can tell which ones are being used and which have gone idle, to close a tab when it is archived to the garden, and to reopen (restore) an archived tab when you water it. This is the core mechanism of archiving and restoring; the extension acts on tab metadata, not page contents.

**alarms** — Used to schedule a lightweight, periodic check of tab activity so idle tabs can be gently archived after a period of inactivity. Using `alarms` lets Tab Garden run this check on a timer without keeping a persistent background page open, which keeps it efficient and battery-friendly.

## Host-permissions justification

Tab Garden requests **no host permissions**. It does not read, inject into, or modify the content of any web page. It works only with tab metadata (titles and URLs) exposed through the `tabs` permission, which is sufficient to archive and restore tabs. Because it never needs to access page content, no broad host patterns such as `<all_urls>` are requested.

## Privacy disclosure (CWS Section 5)

**Data collection — all categories set to "Not collected":**

- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

Tab Garden stores archived tab titles/URLs and preferences only in `chrome.storage.local` on the user's own device. It transmits no data off the device to any server or third party, so no data is "collected" as defined by the Chrome Web Store.

**Developer certifications — tick all three:**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-tab-garden/blob/main/PRIVACY.md

## Reviewer test instructions

Total time: ~3 minutes. No account, sign-in, or setup required.

1. **Install and open (20s).** Install the extension and pin it. Click the Tab Garden toolbar icon — the popup opens showing the Sparky mascot and your (initially empty) garden in the retro-pink LoveSpark UI.
2. **Create some tabs to work with (20s).** Open 3–4 new tabs to different sites (e.g. example.com, wikipedia.org, github.com) and leave them in the background without clicking them.
3. **Trigger archiving (40s).** Open the extension's settings/popup and set the inactivity threshold to its shortest available value (or use any "archive now"/manual control if present). Wait for the idle-check to run. The background tabs you haven't touched are moved out of the tab bar and appear as plants in the garden.
4. **Confirm the garden (20s).** Open the popup and verify the archived tabs are listed as plants, each showing its page title so you can identify it. The tab you are actively using is not archived.
5. **Restore by watering (30s).** Click the water action on one archived plant. Confirm that tab reopens in the browser exactly where it left off and is removed from the garden — nothing is lost.
6. **Verify privacy (30s).** Open DevTools → Network on the extension's popup/background and confirm there are no outbound network requests. All data (the garden and settings) is held in `chrome.storage.local`; no host permissions are requested and no page content is accessed.

Full source for verification: https://github.com/Joona-t/lovespark-tab-garden
