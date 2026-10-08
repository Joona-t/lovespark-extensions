# Neurodivergent Reader by LoveSpark — CWS Listing

## Extension name

Neurodivergent Reader by LoveSpark

## Short description

Improve reading focus with dyslexia fonts, reading rulers, paragraph focus & distraction removal. Built for ADHD & dyslexia.

## Detailed description

Reading on the web is exhausting when the words blur together, your eyes lose their place, and the page is buried under ads and sidebars. Neurodivergent Reader turns any page into a calm, readable space — so you can focus on what you're actually reading.

Built neurodivergent-first, it bundles the reading aids people normally pay for into one free, open-source tool. Switch any page to a dyslexia-friendly font like OpenDyslexic, glide a reading ruler down the lines to keep your place, dim everything except the paragraph you're on, and strip away the clutter that breaks your concentration.

It's a genuinely free, private alternative to paid reading helpers like Helperbird — no trial, no Pro upsell, no account. Everything runs locally in your browser. Your preferences are saved only on your own device with `chrome.storage.local`, and nothing you read or do is ever sent anywhere.

**What you get:**

- **Dyslexia fonts (including OpenDyslexic)** — re-render page text in a font designed to reduce letter-flipping and crowding, for easier, less tiring reading.
- **Reading ruler / focus line** — a horizontal guide that follows your reading position so your eyes never lose the line.
- **Paragraph focus** — dims everything except the paragraph you're reading, giving ADHD and easily-distracted readers a single, quiet point of attention.
- **Distraction-free reading** — hide ads, sidebars, popups, and visual noise to clear the page down to the text that matters.
- **Your settings, remembered** — pick the font, ruler, focus, spacing, and colors that work for you; they're saved locally and re-applied as you read.

**Who it helps:** readers with dyslexia, ADHD, and other neurodivergent reading styles — and honestly anyone who reads a lot online and wants a distraction-free, focus-friendly page. If you've searched for a dyslexia font Chrome extension, a reading ruler, a focus line reader, or a dyslexia reader that respects your privacy, this is built for you.

**The LoveSpark promise:** free forever, MIT-licensed, and fully open source — you can read every line of the code at https://github.com/Joona-t/neurodivergent-reader. No ads. No tracking. No data collection. Just reading made easier.

## Single-purpose justification

The single purpose of Neurodivergent Reader is to make text easier and more comfortable to read on the page the user is currently viewing. Every feature serves that one goal: dyslexia-friendly fonts change how the page's text is rendered so it's easier to decode; the reading ruler and paragraph focus help the reader hold their place and direct attention to one line or paragraph at a time; distraction removal clears competing visual noise so the reader's focus stays on the text; and saved preferences simply remember the reading setup the user has chosen so it applies consistently. There are no unrelated features — the extension does one thing, improve on-page reading, and each capability is a different facet of that single reading-comfort purpose.

## Per-permission justification

**activeTab** — Grants temporary access to the current tab only when the user explicitly invokes the extension (opening the popup or toggling a reading aid). This is what lets the extension apply the chosen reading aids to the page the user is actively reading. It does not run in the background and does not access other tabs or sites.

**scripting** — Required to inject the content script and CSS that actually render the reading features on the active page: swapping in the dyslexia/OpenDyslexic font, drawing the reading ruler / focus line, dimming non-focused paragraphs, and hiding distracting page elements. Without scripting, the extension cannot modify the page to make it more readable.

**storage** — Uses `chrome.storage.local` to remember the user's reading preferences (chosen font, ruler on/off, paragraph-focus settings, spacing and color choices) between sessions, so they don't have to reconfigure on every page. This data is stored only on the user's own device and is never transmitted.

**tabs** — Used to detect when the active tab navigates to a new page or the user switches tabs, so the reading settings re-apply automatically as the user reads across pages without having to click the extension again. It is used only to keep the reading aids consistent — never to build a browsing history, track which sites are visited, or profile activity.

## Host-permissions justification

This extension requests **no host permissions** and **no broad host patterns** — there is no `<all_urls>` or any site-wide access. The reading features are applied only on demand, through `activeTab` plus `scripting`, on the specific tab the user has explicitly invoked the extension on. This is a deliberate minimal-permission, privacy-first design choice: the extension never gains standing access to every site you visit, and it cannot read or act on pages you haven't chosen to apply it to.

## Privacy disclosure (CWS Section 5)

**Data collection — every category is "Not collected":**

- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

**Developer certifications (all true — tick each box):**

- ✅ I do **not** sell or transfer user data to third parties, outside of the approved use cases.
- ✅ I do **not** use or transfer user data for purposes that are unrelated to my item's single purpose.
- ✅ I do **not** use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/neurodivergent-reader/blob/main/PRIVACY.md

Reading preferences are stored only locally via `chrome.storage.local` and are never transmitted off the device. The extension makes no external network requests.

## Reviewer test instructions

This takes about 3 minutes and requires no account or setup.

1. Install the extension and open any long, text-heavy page (a news article, blog post, or Wikipedia article works well).
2. Click the Neurodivergent Reader toolbar icon to open the popup.
3. **Dyslexia font:** Toggle the dyslexia / OpenDyslexic font on. The article's body text re-renders in the dyslexia-friendly font. Toggle it off to confirm it reverts.
4. **Reading ruler / focus line:** Enable the reading ruler, then move your cursor down the page — a horizontal guide line follows your reading position.
5. **Paragraph focus:** Enable paragraph focus. Everything except the paragraph you're reading dims, leaving one clear focal paragraph.
6. **Distraction removal:** Enable distraction-free reading. Ads, sidebars, and other clutter on the page are hidden, leaving the core text.
7. **Persistence (local storage):** Change any preference (e.g., turn the ruler on), then reload the page. The setting re-applies automatically, confirming preferences are saved locally via `chrome.storage.local`.
8. **(Optional privacy check):** Open DevTools → Network and interact with the extension. You'll see no outbound network requests — nothing is transmitted externally.
