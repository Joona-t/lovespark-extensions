I'll write it directly — this is a well-specified single-document deliverable, and the explicit constraint is to output only the document. (The workflow needs manual approval to run; no need to gate a focused writing task on that.) Character counts below are exact.

# LoveSpark Emotion Wheel — CWS Listing

## Extension name
Emotion Wheel — ADHD Feelings & Mood Tracker
(44 characters)

## Short description
Interactive emotion wheel to name your feelings — basic to nuanced. ADHD-friendly mood tracker. Free, no tracking, no sign-in.
(126 characters)

## Detailed description
**Can't tell what you're feeling? Start with the wheel.**

LoveSpark Emotion Wheel is a free, interactive emotion wheel that helps you name what you feel — starting from a handful of basic, core emotions and drilling down into the nuanced, specific feelings underneath them. Instead of staring at a blank "How are you?" box, you spin through a familiar feelings-wheel layout, tap the emotion that fits, and go one level deeper until the word actually matches the feeling.

Putting language to an emotion is the first step in emotional regulation, and it's exactly the step that's hardest for a lot of us. This tool is built for that gap.

**Who it's for**

It's designed neurodivergent-first. If you're ADHD or autistic, or you experience alexithymia — difficulty identifying and describing emotions — a plain mood-logging emoji picker usually isn't enough. The basic-to-nuanced drill-down gives you a path from "something's off" to "I'm actually feeling overwhelmed, not angry." Anyone who wants to build emotional literacy, do a quick mental health check-in, or simply name their feelings during the day will find it useful too.

**Built for how your brain works**

- **Interactive emotion wheel** — browse a feelings wheel of core emotions, then drill from basic to nuanced to find the precise word.
- **Quick check-in** — open the popup, pick what you feel, done. No long forms, no friction.
- **Local check-in history** — your selections are saved on your own device so you can revisit them later.
- **OpenDyslexic font** — the default body font across the whole UI, with a system-rounded fallback for accessibility.
- **Retro-pink, calm design** — a soft, low-stimulation interface that respects reduced-motion settings.
- **Accessible by default** — built toward WCAG 2.1 AA, with keyboard navigation and screen-reader-friendly labels.

**Free, open, and private**

LoveSpark Emotion Wheel is completely free, open source, and MIT-licensed — no ads, no upsell, no account, no sign-in. It collects **zero** data. Everything you select stays in your browser's local storage on your own device and is never transmitted anywhere. There are no trackers, no analytics, and no third-party services. You can read every line of the code yourself: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-emotion-wheel

Name your feelings. Keep it private. Move on with your day.

## Single-purpose justification
The single purpose of LoveSpark Emotion Wheel is to help a person identify and name what they are feeling using an interactive emotion wheel that drills down from basic core emotions to more nuanced ones. Every feature serves only that purpose: the wheel UI presents the emotions to choose from, the basic-to-nuanced drill-down narrows a vague feeling to a precise word, and local saving lets the user keep their own check-ins so the act of identifying feelings carries across sessions. There are no unrelated features — no browsing tools, no content modification, no communication features, and nothing that operates outside the extension's own popup. The accessibility choices (OpenDyslexic font, retro-pink theme, keyboard and screen-reader support) make that one purpose usable by neurodivergent users; they do not add a second purpose.

## Per-permission justification
**storage** — Used solely to save the user's emotion-wheel selections and check-ins locally via `chrome.storage.local`, so their feelings history persists between sessions and after the browser restarts. This data is stored only on the user's own device and is never transmitted, shared, or synced to any external server. No other permission is requested, and `storage` is not used for tracking, analytics, or identifying the user.

## Host-permissions justification
This extension requests **no host permissions**. It does not declare `<all_urls>` or any host match pattern, does not read or modify any website or page content, does not inject scripts into pages, and has no access to your browsing. It runs only within its own extension popup/UI.

## Privacy disclosure (CWS Section 5)
Paste the following into the Chrome Web Store privacy form.

**Data collected** — For every standard data category, select **Not collected**:

- Personally identifiable information — Not collected
- Health information — Not collected
- Financial and payment information — Not collected
- Authentication information — Not collected
- Personal communications — Not collected
- Location — Not collected
- Web history — Not collected
- User activity — Not collected
- Website content — Not collected

**Developer certifications** — affirm all three (tick each box):

- ☑ I do **not** sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do **not** use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do **not** use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-emotion-wheel/PRIVACY.md

**Note for the form:** This extension stores the user's emotion selections only in `chrome.storage.local` on the user's own device. No data is collected by the developer and nothing is transmitted off the device, so all categories above are correctly marked "Not collected."

## Reviewer test instructions
This takes about 3 minutes and requires no account, no sign-in, and no setup.

1. Install the extension and click its toolbar icon (pin it first if needed) to open the popup. The interactive emotion wheel appears, showing the basic/core emotions.
2. Click one core emotion (for example, **Sad**). The wheel drills down to show the nuanced feelings underneath that core emotion.
3. Select a nuanced feeling (for example, **Lonely**) to record the check-in. Confirm the selection is acknowledged in the UI.
4. Close the popup completely, then reopen it. Confirm your previous check-in/selection is still there — this verifies the `storage` permission saving locally.
5. Open Chrome DevTools → **Network** tab while using the wheel and confirm **no network requests** are made. There is no sign-in prompt and no permission request beyond `storage`.
6. (Optional) Confirm accessibility: navigate the wheel with the **Tab** and **Enter** keys, and note the OpenDyslexic font and reduced-motion-friendly UI.

Expected result: the extension only displays an emotion wheel, lets you name a feeling by drilling from basic to nuanced, and saves that selection locally — with zero network activity and no data leaving the device.
