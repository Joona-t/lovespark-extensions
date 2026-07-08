# Study Bubbles by LoveSpark — CWS Listing

## Extension name
Study Bubbles by LoveSpark

## Short description
Highlight text to make flashcards with spaced repetition. Grow a private, local knowledge base — free & open source.

## Detailed description
**Turn anything you read into flashcards you'll actually remember.**

Study Bubbles lets you highlight any text on any webpage and instantly turn it into a study bubble — a local flashcard scheduled with spaced repetition. Instead of re-reading and forgetting, you capture the sentence, definition, quote, or fact the moment you meet it, and Study Bubbles brings it back at the right time to lock it into long-term memory.

Your bubbles collect into a personal knowledge base that grows with you. Everything you save lives on your own device — nothing is uploaded, tracked, or sold. It's a quiet, focused study companion, not another feed fighting for your attention.

**Who it's for**

Study Bubbles is built neurodivergent-first, by a neurodivergent developer. If you're a student, self-learner, coder, or researcher who reads a lot online but struggles to retain it — and especially if ADHD, dyslexia, or executive-function overload makes traditional flashcard apps feel like a chore — this is made for you. The interface uses the OpenDyslexic font, a calm retro-pink theme, high-contrast accessible colors, keyboard navigation, and reduced-motion support, so studying feels gentle instead of overwhelming.

**Why people use it**

- **Highlight to capture** — select text on any page and make a study bubble in one step, without breaking your reading flow.
- **Spaced repetition built in** — each bubble is scheduled so you review it just before you'd forget, the proven way to remember more with less time.
- **A knowledge base that's yours** — every flashcard is saved together into a searchable personal library you can review anytime.
- **100% local** — all your bubbles are stored only in your browser's local storage. Zero data leaves your device.
- **Accessibility-first** — OpenDyslexic typeface, WCAG-conscious contrast, full keyboard access, and reduced-motion friendly.
- **Free and open source** — MIT licensed, no ads, no accounts, no subscriptions, no paywall. Inspect the code anytime.

Study Bubbles does one thing well: it helps you remember what you read. Highlight, review, remember — and keep your data entirely your own.

Open source and auditable at https://github.com/Joona-t/study-bubbles

## Single-purpose justification
Study Bubbles has a single purpose: to let users turn highlighted webpage text into locally-stored flashcards and review them with spaced repetition. Every feature serves that one purpose — highlighting captures the study material, the flashcard/knowledge-base view organizes it, and the spaced-repetition scheduler decides when each item is shown again for review. There is no unrelated functionality: no browsing analytics, no content injection beyond the study interface, and no feature that exists outside the create-and-review-flashcards loop. The accessibility and theming choices (OpenDyslexic font, retro-pink, high contrast) are presentation of that same single feature, not additional capabilities.

## Per-permission justification
**storage** — Study Bubbles uses `storage` to save each flashcard (the highlighted text, any note or answer you add, and its spaced-repetition schedule) to `chrome.storage.local`. This is the only place your knowledge base is kept; the permission is required so your study bubbles persist between sessions and browser restarts. No storage is used to transmit or sync data anywhere off your device.

**activeTab** — Study Bubbles uses `activeTab` so that, when you highlight text and invoke the extension, it can read your current selection on the active tab and turn it into a study bubble. This access is granted only in response to your explicit action and only for the tab you are actively using. It is used solely to capture the text you chose to save — never to monitor pages in the background or read tabs you have not acted on.

## Host-permissions justification
Study Bubbles requests no host permissions. It does not declare `<all_urls>` or any broad host-match pattern, and it cannot read or modify pages in the background. Access to page content happens only through the `activeTab` permission at the moment you invoke the extension on the current tab, which keeps the extension's footprint minimal and privacy-preserving.

## Privacy disclosure (CWS Section 5)

**What user data do you collect or transmit?** — For every category below, select **Not collected**:

- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

All flashcards and settings are stored locally in `chrome.storage.local` and are never transmitted off the user's device, so no data is collected in the CWS sense.

**Developer certifications — tick all three (all are true):**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/study-bubbles/blob/main/PRIVACY.md

## Reviewer test instructions
Total time ≈ 3 minutes. No account, sign-in, or network connection is needed — the extension works fully offline.

1. **Install and pin** the extension, then open any article or text-heavy webpage (e.g. a Wikipedia article).
2. **Highlight a passage** — select a sentence or phrase with your cursor.
3. **Create a study bubble** — click the Study Bubbles toolbar icon (or use its highlight-to-save action) to turn the selection into a flashcard. Confirm the selected text is captured.
4. **Open the popup** — click the Study Bubbles icon to view your knowledge base. Confirm the new bubble appears in the list with the text you highlighted.
5. **Review with spaced repetition** — start a review, mark the card (e.g. remembered / forgot), and confirm the card's next-review scheduling updates accordingly.
6. **Verify it is local and private** — with your browser's DevTools Network tab open, repeat steps 2–5 and confirm the extension makes no outbound network requests. Close and reopen the browser and confirm your saved bubbles persist (data lives only in `chrome.storage.local`).

Expected result: highlighted text becomes a locally-stored flashcard, appears in the knowledge base, is scheduled for spaced-repetition review, and no data leaves the device.
