The Workflow tool requires manual review before running in this session, so per Rule Zero I'll write the listing directly — this is a fixed-template copywriting deliverable and I have the CWS policy and niche SEO knowledge needed. Here is the exact `CWS-LISTING.md` contents:

# LoveSpark Affirmation Cards — CWS Listing

## Extension name
LoveSpark Affirmation Cards

## Short description
Daily positive affirmations for ADHD brains. Tap for a new card, save favorites, build your deck. Free, private, no account.

## Detailed description
Some days your brain just needs a kind word. **LoveSpark Affirmation Cards** gives you exactly that: a gentle deck of daily affirmations, one tap away, right in your browser.

Open the popup and you get a single, calm affirmation card — no feeds, no streaks to keep, no pressure. Tap to draw a new card whenever you need a reset. When something lands, save it as a favorite and build a personal deck of the words that actually help you.

Built neurodivergent-first, for ADHD and anyone who runs on encouragement rather than nagging. The whole experience is designed to be low-friction and low-stimulation: the OpenDyslexic font for easier reading, a warm retro-pink look, WCAG AA contrast, full keyboard navigation, and reduced-motion support so nothing jumps at you. It's positive self-talk and a moment of mindfulness in the middle of a busy tab session — a small dose of daily motivation and self-esteem without the doomscroll.

Because it's part of the LoveSpark suite, it's genuinely private: everything lives on your own device, nothing is ever sent anywhere, and there's no sign-up. It's free forever, open source, and MIT-licensed — you can read every line at the repo below.

**What you get:**
- A daily affirmation card in a clean, calm popup — kind words when you need them
- Tap for a new card any time you want a fresh one
- Save the affirmations that resonate as favorites
- Build and browse your own deck of saved cards
- Neurodivergent-friendly design: OpenDyslexic font, retro-pink theme, accessible contrast, keyboard navigation, reduced-motion support
- No account, no ads, no tracking — 100% free and open source
- Zero data collection: everything stays on your device

Whether you're managing ADHD, having a hard day, or just want a steady stream of positive affirmations and encouragement while you work, LoveSpark Affirmation Cards is a tiny, warm corner of your browser that's always on your side.

## Single-purpose justification
The single purpose of LoveSpark Affirmation Cards is to show the user encouraging affirmation cards that they can view and save. Every feature serves only that purpose: drawing a card displays an affirmation, tapping draws another affirmation, saving marks the current affirmation as a favorite, and the deck view lists the affirmations the user has saved. There are no unrelated tools, browsing features, or side functions — the extension does one thing, which is deliver affirmation cards and let the user keep the ones they like.

## Per-permission justification
**storage** — Used solely to remember the user's saved favorite cards and their personal deck on their own device between sessions. Without `storage`, favorites would be lost every time the popup closes. It is `chrome.storage.local` only; nothing is written to any remote server.

## Host-permissions justification
This extension requests **no host permissions**. It does not run on, read, or modify any website, tab, or URL — it operates entirely within its own popup. Because it never interacts with page content, no host or `<all_urls>` access is needed or requested.

## Privacy disclosure (CWS Section 5)
Paste the following into the Chrome Web Store privacy tab:

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

**Certifications (all affirmed / TRUE):**
- ✅ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ✅ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-affirmation-cards/PRIVACY.md

**Developer certification checkboxes to tick:**
- ✅ The extension's data usage complies with the Chrome Web Store Developer Program Policies.
- ✅ I have provided an accurate privacy policy and disclosed all data handling above.

(This extension stores favorites only in `chrome.storage.local` on the user's device and transmits zero data externally, so every category is truthfully "Not collected.")

## Reviewer test instructions
Estimated time: ~3 minutes. No account, login, or network setup required.

1. Load the extension (from the Web Store, or unpacked via `chrome://extensions` → **Load unpacked** → select the extension folder).
2. Click the LoveSpark Affirmation Cards toolbar icon to open the popup. Confirm a single affirmation card appears immediately.
3. Tap the card / the "new card" control a few times. Confirm a different affirmation is shown each time — this is the core "tap for a new card" behavior.
4. On a card you like, click the **save / favorite** control. Confirm it registers as saved (e.g., the favorite state toggles).
5. Open the **deck / saved** view. Confirm the affirmation you just saved appears in your deck. Close and reopen the popup and confirm saved cards persist (verifying the `storage` permission's only use).
6. (Privacy verification) Open DevTools → **Network** tab with the popup open and interact with it. Confirm there are **no outbound network requests** — no data leaves the device. Optionally check **Application → Storage → Local Storage / Extension storage** to confirm only local card/favorite data is stored.
7. Confirm the extension never requests access to any website: it runs only in its own popup and declares no host permissions.

Expected result: the extension shows and cycles affirmation cards, saves favorites locally, and makes zero network calls — matching its single stated purpose.
