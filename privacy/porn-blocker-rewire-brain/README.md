# 🌸 Rewire Brain — Mindful Porn Blocker

Free, open-source Chrome extension that blocks 125+ adult sites **and** classifies images on-device to blur anything explicit that slips through the URL filter — all without sending data anywhere. Part of the [LoveSpark](https://lovespark.love) suite.

> "You have power over your mind — not outside events. Realize this, and you will find strength." — Marcus Aurelius

## Why this exists

Most porn blockers are dark-pattern-laden subscriptions that ship your browsing data to third parties. Rewire Brain does the opposite:

- **125+ adult domains blocked** via Chrome's `declarativeNetRequest` (no DNS hijack)
- **30+ NSFW subreddits filtered** (without breaking the rest of Reddit)
- **On-device NSFW image classification** — no images leave your machine
- **Friction-based bypass** — countdown + reflection prompt before the bypass works
- **Streak + XP system** with neuroscience-backed milestones (Day 7 / 14 / 30 / 60 / 90 / 180 / 365)
- **Daily journal** with optional reminder
- **Sobriety timer** — live ticking days/hours/minutes/seconds, I-Am-Sober style
- **Brain-tree growth visualization** that levels up with your journey
- **Onboarding** asks the one question that matters: *"What is the reason you are doing this?"*

## Privacy

- **Zero tracking.** No analytics, no telemetry, no ping-home.
- **All processing on-device.** The NSFW classifier runs in your browser, not a server.
- **All data local.** Streak, journal, settings — all in `chrome.storage.local`.
- **No accounts.** Not now, not ever.
- **Open source.** Read the code yourself.

## Features

| Feature | What it does |
|---------|-------------|
| Domain blocklist | Blocks the top 125+ adult tube/cam/booru sites at the network layer |
| Subreddit filter | Blocks 30+ NSFW subreddits without affecting the rest of Reddit |
| Custom blocklist | Add your own domains and subreddits |
| Image blur | On-device ML detects NSFW images on any site and blurs them permanently (no reveal) |
| Mindful interstitial | Quote + breathing exercise + science-backed resources when you hit a blocked site |
| Bypass with friction | 30-second countdown + reflection input before bypass works |
| Streak tracking | Compares against your best streak; restarts on relapse |
| Daily journal | Reflect on your day; optional reminder notification |
| Sobriety timer | Live counter of days/hours/minutes/seconds since you last reset |
| Brain-tree visualization | A stylized tree that grows as you progress through 10 levels |
| 4 themes | Retro Pink (default), Dark, Beige, Slate |

## Install

1. Download the latest `*-chrome.zip` from the [LoveSpark Portfolio](https://lovespark.love).
2. Unzip.
3. Visit `chrome://extensions`, enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the unzipped folder.

A polished version will be on the Chrome Web Store soon.

## Built with

- Manifest V3
- `declarativeNetRequest` for network-level blocking
- Vanilla JS (no framework, no build step)
- OpenDyslexic + Comfortaa typography (bundled, no CDN)
- ONNX Runtime Web (v2.5.0+) for on-device ML
- AdamCodd ViT-base NSFW classifier (lazy-loaded from Hugging Face)

## Roadmap

See [`ROADMAP.md`](./ROADMAP.md) for the full backlog. Highlights:

- **v2.5.0** — ViT-base classifier replacing NSFWJS (97% accuracy vs 90%)
- **v2.6.0** — Video-frame classification, ensemble with stable-diffusion variant for AI-generated content
- **v3.0.0** — Optional Mindful Recovery community

## Contributing

This is a personal project but issues and PRs are welcome. Please:

- Open an issue first to discuss
- Follow the `BUGS_AND_ITERATIONS.md` log format
- No `Co-Authored-By` lines (sole-authored by Joona)
- Keep the privacy-first ethos intact

## License

[MIT](./LICENSE) — by Joona Tyrninoksa. Free forever, no strings.

## Credits

- [Sparky](./mascot.png) — the LoveSpark mascot
- Stoic / mindfulness / philosophical / neuroscience quote authors (see `quotes.js`)
- Andrew Huberman, Anna Lembke — neuroscience research that grounds the milestone system
- [NSFWJS](https://github.com/infinitered/nsfwjs) by Infinite Red (used in v2.4.0; superseded by AdamCodd ViT-base in v2.5.0)
- The recovery community at r/NoFap, Fight the New Drug, Fortify

---

🌸 **Knowledge access is a right, not a paywall. — LoveSpark**
