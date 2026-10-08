# LoveSpark Read Aloud: Text to Speech

Free text to speech that reads any webpage aloud — sentence highlighting, ADHD speed presets, reading-position memory. No tracking.

Part of the [LoveSpark suite](https://lovespark.love) — free, open-source, privacy-first browser extensions for neurodivergent users.

## What it does

LoveSpark Read Aloud turns any webpage into audio. Click once and your browser reads the page out loud, highlighting each sentence as it goes so your eyes and ears stay in sync. It's a free, open-source text-to-speech reader built for people who find walls of text exhausting — and for anyone who'd rather listen to articles than stare at them.

It uses the text-to-speech voices already built into your browser, so nothing you read ever leaves your computer. No account, no trial, no "best voices" hidden behind a paywall, no ads.

**Who it helps:** built neurodivergent-first. If you have dyslexia, ADHD, low vision, or you just process information better by ear, a read-aloud extension removes the friction between you and the words. Sentence-by-sentence highlighting keeps your place; ADHD speed presets let you find the pace that holds your attention; reading-position memory means you can close a tab, come back later, and pick up exactly where the narration left off.

## Features

- 🔊 **One-click read aloud** — listen to any article, blog post, or webpage as text to speech
- ✨ **Sentence highlighting** — the current sentence is highlighted as it's spoken
- ⚡ **ADHD speed presets** — quick pace presets plus fine speed control
- 📍 **Reading-position memory** — resume where you left off, even after closing the tab
- 🗣️ **Built-in browser voices** — no external TTS service
- 🅰️ **OpenDyslexic font + accessible UI** — dyslexia- and ADHD-friendly by design
- 🆓 **Always free & open source** — MIT licensed
- 🔒 **Zero tracking** — settings stay in local storage; nothing is ever sent anywhere

## Privacy

All settings are stored locally via `chrome.storage.local`. The extension transmits zero data externally and contacts no remote servers; speech is produced entirely by the browser's built-in voices. See [PRIVACY.md](PRIVACY.md) for the full policy.

## Permissions

- `storage` — save preferences and reading position locally
- `activeTab` — read the page you explicitly choose to listen to (gesture-gated, no standing access)
- `tabs` — track which tab is being read so narration stops/resumes correctly
- `scripting` — inject the content script that extracts text and draws the sentence-highlight overlay

No host permissions (`<all_urls>` or similar) are requested. See [CWS-LISTING.md](CWS-LISTING.md) for the full per-permission justification.

## Install

Load unpacked from this repo via `chrome://extensions` (Developer Mode → Load unpacked), or install from the Chrome Web Store / Firefox Add-ons once published.

## Development

- Manifest V3, vanilla JS, no frameworks
- Shared LoveSpark theme/lib in `lib/`
- See `BUGS_AND_ITERATIONS.md` for the build/fix history

## License

MIT — see [LICENSE](LICENSE).
