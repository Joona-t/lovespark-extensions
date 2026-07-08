# Study Bubbles by LoveSpark

Highlight text on any webpage to make a flashcard with spaced repetition
(SM-2). Grow a private, local knowledge base — free & open source.

## What it does

- **Highlight to capture** — select text on any page and turn it into a
  study bubble in one step
- **Spaced repetition (SM-2)** — bubbles are scheduled so you review each
  one just before you'd forget it
- **A knowledge base that's yours** — all bubbles live in one searchable
  personal library
- **100% local** — everything is stored only in `chrome.storage.local`;
  nothing ever leaves the device

## Why

Study Bubbles is built neurodivergent-first for students, self-learners,
coders, and researchers who read a lot online but struggle to retain it —
especially where ADHD, dyslexia, or executive-function overload makes
traditional flashcard apps feel like a chore. The interface uses the
OpenDyslexic-friendly, calm, high-contrast LoveSpark theme with keyboard
navigation and reduced-motion support.

## Privacy

- 100% free, MIT-licensed, open source
- Zero data collection — nothing is ever transmitted off the device
- Settings and bubbles live only in `chrome.storage.local`; no accounts,
  no sign-in, no ads
- See [PRIVACY.md](PRIVACY.md) for the full disclosure

## Install

Load unpacked in Chrome/Edge (`chrome://extensions` → Developer mode → Load
unpacked) or via `about:debugging` in Firefox, pointing at this directory.
Store listings are in progress — see [SUBMIT.md](SUBMIT.md).

## Development

- `manifest.json` — MV3 manifest, `storage` + `activeTab` permissions
- `popup/` — popup UI (study/review, all bubbles, add manually)
- `content/` — content script that captures highlighted text
- `background.js` — service worker
- `lib/` — shared LoveSpark component library (theme, fonts, footer — see
  `Extensions/infrastructure/lovespark-shared-lib`)

See [BUGS_AND_ITERATIONS.md](BUGS_AND_ITERATIONS.md) for the fix/iteration log.

Part of the [LoveSpark](https://lovespark.love) suite — free, open-source
tools for neurodivergent coders.
