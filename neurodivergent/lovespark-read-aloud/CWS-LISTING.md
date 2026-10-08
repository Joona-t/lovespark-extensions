# LoveSpark Read Aloud — CWS Listing

## Extension name

LoveSpark Read Aloud: Text to Speech

## Short description

Free text to speech that reads any webpage aloud — sentence highlighting, ADHD speed presets, reading-position memory. No tracking.

## Detailed description

**LoveSpark Read Aloud turns any webpage into audio.** Click once and your browser reads the page out loud, highlighting each sentence as it goes so your eyes and ears stay in sync. It's a free, open-source text-to-speech reader built for people who find walls of text exhausting — and for anyone who'd rather listen to articles than stare at them.

This is a genuinely free text to speech tool. No account, no trial, no "best voices" hidden behind a paywall, no ads. It uses the voices already built into your browser, so nothing you read ever leaves your computer.

**Who it helps**

LoveSpark Read Aloud is built neurodivergent-first. If you have dyslexia, ADHD, low vision, or you just process information better by ear, a read-aloud extension removes the friction between you and the words. Sentence-by-sentence highlighting keeps your place. ADHD speed presets let you find the pace that holds your attention instead of fighting it. Reading-position memory means you can close a tab, come back later, and pick up exactly where the narration left off.

It's also a quiet productivity tool: queue up a long article and listen while you cook, walk, or rest your eyes between tasks.

**Accessibility is the point, not an afterthought.** The interface uses the OpenDyslexic font by default, retro-pink high-contrast theming, full keyboard navigation, and reduced-motion support — the same design ethos across the whole LoveSpark suite.

**What you get**

- 🔊 **One-click read aloud** — listen to any article, blog post, or webpage as text to speech
- ✨ **Sentence highlighting** — the current sentence is highlighted as it's spoken, so you never lose your place
- ⚡ **ADHD speed presets** — quick pace presets plus fine speed control to match your focus
- 📍 **Reading-position memory** — resume where you left off, even after closing the tab
- 🗣️ **Built-in browser voices** — choose from the text-to-speech voices already on your device
- 🅰️ **OpenDyslexic font + accessible UI** — dyslexia- and ADHD-friendly by design
- 🆓 **Always free & open source** — MIT licensed, code public on GitHub
- 🔒 **Zero tracking** — settings stay in local storage; nothing is ever sent anywhere

**Free text to speech, a real dyslexia reading tool, and an ADHD reading helper in one** — LoveSpark Read Aloud is a privacy-first read-aloud extension that acts like a lightweight screen reader for web pages without the cost, the ads, or the data collection. Open the page, press play, and listen.

Open source and auditable: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-read-aloud

## Single-purpose justification

LoveSpark Read Aloud has one purpose: **read the text of the webpage you're viewing aloud using text-to-speech.** Every feature serves that single purpose. Sentence highlighting shows which words are currently being spoken; ADHD speed presets adjust the pace of that same speech; voice selection chooses which built-in voice does the reading; and reading-position memory lets you resume the same narration where it stopped. There are no unrelated capabilities — no note-taking, no browsing tools, no content blocking, no data dashboards. The extension reads pages aloud, and nothing else.

## Per-permission justification

**storage** — Used to save your preferences (chosen voice, speed preset, theme) and your reading position so narration can resume where you left off. All of this is written to `chrome.storage.local` on your own device; it is the mechanism behind the "reading-position memory" feature and persistent settings.

**activeTab** — Used to read the page you explicitly choose to listen to. When you click the extension to start reading, `activeTab` grants temporary access to that one tab so the extension can extract its visible text and speak it. It is gesture-gated and grants no standing access to your browsing.

**tabs** — Used to keep narration tied to the correct tab — to know which tab is currently being read, to stop reading when you switch away or close it, and to store/restore the per-tab reading position so resume works on the right page.

**scripting** — Used to inject the content script that reads the visible text of the active tab and draws the sentence-highlight overlay in sync with the speech. This injection happens only on the tab you choose to read and is what makes one-click read-aloud and live sentence highlighting possible.

## Host-permissions justification

No host permissions are requested. LoveSpark Read Aloud does not declare `<all_urls>` or any broad host pattern. Instead it relies on `activeTab`, which grants access to a single page only after you click to start reading — a deliberately more privacy-respecting design. The extension therefore has no standing access to any website and cannot read pages in the background; it only ever touches the one tab you actively ask it to read.

## Privacy disclosure (CWS Section 5)

**Data collection categories — set every category to "Not collected":**

- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected** (page text is read aloud on-device in real time and is never stored or transmitted)

**Certification checkboxes to tick:**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:**

https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-read-aloud/PRIVACY.md

All settings are stored locally via `chrome.storage.local` on the user's device. The extension transmits zero data externally and contacts no remote servers; text-to-speech is produced by the browser's built-in voices.

## Reviewer test instructions

This takes about three minutes. No account or setup is required.

1. **Install and pin** the extension. Click the puzzle-piece icon and pin "LoveSpark Read Aloud" so the toolbar icon is visible.
2. **Open any article** with body text — for example, a Wikipedia article or a news story.
3. **Start reading.** Click the LoveSpark Read Aloud toolbar icon and press **Play**. Your browser's text-to-speech voice will begin reading the page aloud, and the **current sentence will be highlighted** on the page as it is spoken. (Ensure system volume is up and the page is in a supported language.)
4. **Test the ADHD speed presets.** Change the speed/preset control and confirm the narration pace updates immediately while it continues reading.
5. **Test reading-position memory.** Let it read a few sentences, then **close the tab**. Re-open the same article and press Play again — narration resumes from where it left off rather than restarting at the top.
6. **Verify the privacy posture.** Open DevTools → Network with the page selected and start reading again: there are **no external network requests** for speech or content. The extension uses the browser's built-in voices and stores settings only in `chrome.storage.local`. It requests no host permissions and only accesses a tab after you click to read it (`activeTab`).

Expected result: any webpage can be read aloud with synced sentence highlighting, speed is adjustable on the fly, reading position persists across sessions, and no data leaves the device.
