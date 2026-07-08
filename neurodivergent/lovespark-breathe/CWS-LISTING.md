# LoveSpark Breathe — CWS Listing

## Extension name

LoveSpark Breathe

## Short description

Breathing exercises, grounding techniques & comment dimming — emotional regulation for ADHD brains. Free, private, no ads.

## Detailed description

**LoveSpark Breathe helps you regulate your emotional state before you react.** When a comment thread spikes your heart rate, when frustration hijacks your focus, or when your ADHD brain is running too hot to think — Breathe gives you a fast, private way to come back down.

Open the popup and you get guided **breathing exercises** with a visual pacer that carries you through inhale, hold, and exhale — no counting in your head, no guesswork. Need something for the body instead of the breath? The built-in **grounding techniques** (like 5-4-3-2-1 sensory grounding) walk you step by step back into the present moment.

And because so much dysregulation starts in a comment section, Breathe includes **comment dimming**: on your command, it softens the comment area of the page you're on so the pile-on, the outrage bait, and the doomscroll fuel fade into the background while you finish what you actually came to do.

**Built neurodivergent-first.** LoveSpark Breathe is made by and for neurodivergent coders and thinkers. It uses the accessible OpenDyslexic-friendly, retro-pink LoveSpark design system, respects `prefers-reduced-motion`, meets WCAG 2.1 AA contrast, and is fully keyboard navigable. Sparky, the LoveSpark wolf, is right there with you.

**Free, open, and private by design.** No ads. No accounts. No trackers. Everything you do stays on your own device in `chrome.storage.local` — zero data is ever transmitted anywhere. LoveSpark Breathe is MIT-licensed and fully open source, so you can read every line yourself.

What you get:

- 🌬️ **Guided breathing exercises** with a calming visual pacer for inhale / hold / exhale
- 🌱 **Grounding techniques** (including 5-4-3-2-1 sensory grounding) for fast emotional regulation
- 🌫️ **Comment dimming** to quiet reactive, dysregulating comment sections on demand
- 🧠 **ADHD- and neurodivergent-first design** — accessible fonts, reduced-motion support, high contrast
- 💾 **Local-only storage** — preferences and streaks saved on your device, never uploaded
- 🚫 **No ads, no data collection, no accounts** — ever
- 🐺 **Sparky the mascot** and the warm, retro-pink LoveSpark look
- 🔓 **100% free and open source (MIT)**

Whether you call it emotional regulation, self-regulation, mindful browsing, a nervous-system reset, or just "help me not send that reply" — LoveSpark Breathe is the calm button your browser was missing.

## Single-purpose justification

LoveSpark Breathe has one purpose: **to help you emotionally self-regulate while you browse.** Every feature serves that single goal. The breathing exercises and grounding techniques are two complementary tools for calming an activated nervous system and returning to focus. Comment dimming addresses the most common on-page trigger for dysregulation — reactive, outrage-driven comment sections — by letting you quiet them so you don't spiral in the first place. Reduce the trigger, then regulate the response: the features are two sides of the same single purpose, not a bundle of unrelated utilities.

## Per-permission justification

**storage** — Used to save your settings locally via `chrome.storage.local`: your chosen breathing patterns, grounding-technique preferences, session streaks, and whether comment dimming is enabled. This is the only way the extension remembers your preferences between sessions. Nothing stored here ever leaves your device.

**activeTab** — Used so that when you explicitly invoke the extension on a page (by clicking the toolbar icon or toggling comment dimming), it can apply the comment-dimming overlay to the tab you are actively looking at. Access is granted only on your gesture and only for that one tab — the extension never silently reaches into pages in the background.

**tabs** — Used to detect which tab is currently active so the comment-dimming behavior and any on-page breathing prompt are applied to the page you are actually viewing, and re-applied correctly when you switch tabs. It is used solely to target your active page; it is never used to record a browsing history, and page content is not read or transmitted.

## Host-permissions justification

LoveSpark Breathe requests **no host permissions.** It deliberately avoids `<all_urls>` and any broad host pattern. Comment dimming works through the on-gesture `activeTab` model — access is granted only to the specific tab you act on, only when you act — so no standing, site-wide access is needed or requested.

## Privacy disclosure (CWS Section 5)

Paste the following into the CWS privacy form.

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

**Privacy policy URL:** https://github.com/Joona-t/lovespark-breathe/blob/main/PRIVACY.md

LoveSpark Breathe stores all data locally in `chrome.storage.local` and transmits nothing externally. There is no server, no analytics, and no third-party service.

## Reviewer test instructions

Total time: ~3 minutes.

1. **Install and pin.** After installing, click the puzzle-piece icon in the Chrome toolbar and pin **LoveSpark Breathe** so its icon (Sparky the wolf) is visible.
2. **Open the popup (~15s).** Click the icon. The popup opens showing the Sparky mascot, the retro-pink LoveSpark UI, and options for breathing exercises and grounding techniques.
3. **Run a breathing exercise (~30s).** Start a breathing exercise (e.g. a box-breathing pattern). Confirm the visual pacer animates through inhale → hold → exhale to guide your breath.
4. **Try a grounding technique (~30s).** Open a grounding technique (e.g. 5-4-3-2-1 sensory grounding) and confirm it presents step-by-step prompts.
5. **Test comment dimming (~45s).** Open any page with a comment section (a news article or social feed). With that tab active, click the LoveSpark Breathe icon and toggle **comment dimming on**. Confirm the comment area softens/dims on that page. Toggle it off to confirm it restores.
6. **Confirm local persistence (~15s).** Close and reopen the popup. Your settings (chosen pattern, dimming toggle) persist — they are saved to `chrome.storage.local`.
7. **Confirm zero network activity (~30s).** Open DevTools → Network, then repeat any of the above. Confirm the extension makes **no external network requests** — no data leaves the device.

The full source is available for verification at https://github.com/Joona-t/lovespark-breathe.
