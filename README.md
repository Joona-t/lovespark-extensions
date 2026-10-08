# LoveSpark Extensions

Every LoveSpark browser extension in one repo. Free, open source (MIT), privacy-first: no ads, no data collection, no remote code.

116 extensions. Each folder is a complete, independently loadable extension (`manifest.json` at its root) with its own `PRIVACY.md`, `BUGS_AND_ITERATIONS.md` and store listing docs.

## Working in this repo

- Load one extension: `chrome://extensions` → Developer mode → **Load unpacked** → pick its folder.
- Quality gate for the extension(s) you touched: `git config core.hooksPath .githooks` once per clone; the pre-commit hook then runs `ls-check` on every staged extension folder.
- Store zips: `scripts/build-zips.sh <folder>` (from the LoveSpark scripts repo).
- History: every imported extension keeps its full commit history — `git log -- <folder>`.

## Accessibility

| Extension | Version | Folder | Came from |
|---|---|---|---|
| [Cozy: ADHD & Dyslexia Accessibility Toolkit](Accessibility/cozy-toolkit/) | 1.1.37 | `Accessibility/cozy-toolkit` | [cozy-toolkit](https://github.com/Joona-t/lovespark-extensions/tree/main/Accessibility/cozy-toolkit) |

## Games

| Extension | Version | Folder | Came from |
|---|---|---|---|
| [Dreamy Garden 🐛](Games/dreamy-garden/) | 1.0.31 | `Games/dreamy-garden` | [dreamy-garden](https://github.com/Joona-t/lovespark-extensions/tree/main/Games/dreamy-garden) |
| [LoveSpark Chess Coach](Games/lovespark-chess-coach/) | 1.0.2 | `Games/lovespark-chess-coach` | local-only until now |
| [LoveSpark Color Match](Games/lovespark-color-match/) | 1.0.30 | `Games/lovespark-color-match` | [lovespark-color-match](https://github.com/Joona-t/lovespark-extensions/tree/main/Games/lovespark-color-match) |
| [Flappy Waifu 💖](Games/lovespark-flappy-waifu/) | 1.0.41 | `Games/lovespark-flappy-waifu` | [Flappy-Waifu](https://github.com/Joona-t/lovespark-extensions/tree/main/Games/lovespark-flappy-waifu) |
| [LoveSpark Reaction Time](Games/lovespark-reaction-time/) | 1.0.30 | `Games/lovespark-reaction-time` | [lovespark-reaction-time](https://github.com/Joona-t/lovespark-extensions/tree/main/Games/lovespark-reaction-time) |
| [LoveSpark Word Scramble](Games/lovespark-word-scramble/) | 1.0.30 | `Games/lovespark-word-scramble` | [lovespark-word-scramble](https://github.com/Joona-t/lovespark-extensions/tree/main/Games/lovespark-word-scramble) |
| [LoveSpark Zen Garden](Games/lovespark-zen-garden/) | 1.0.31 | `Games/lovespark-zen-garden` | [lovespark-zen-garden](https://github.com/Joona-t/lovespark-extensions/tree/main/Games/lovespark-zen-garden) |

## _archive

| Extension | Version | Folder | Came from |
|---|---|---|---|
| [LoveSpark Fidget Clicker](_archive/lovespark-fidget-clicker/) | 1.0.0 | `_archive/lovespark-fidget-clicker` | local-only until now |
| [LoveSpark Quick Save](_archive/lovespark-quick-save/) | 1.0.0 | `_archive/lovespark-quick-save` | local-only until now |
| [LoveSpark Tab Counter](_archive/lovespark-tab-counter/) | 1.0.0 | `_archive/lovespark-tab-counter` | local-only until now |

## full-power

| Extension | Version | Folder | Came from |
|---|---|---|---|
| [LoveSpark Cookie Annihilator (Full Power)](full-power/lovespark-cookie-nuke/) | 1.0.11 | `full-power/lovespark-cookie-nuke` | [lovespark-cookie-nuke](https://github.com/Joona-t/lovespark-extensions/tree/main/full-power/lovespark-cookie-nuke) |
| [LoveSpark Popup Fortress (Full Power)](full-power/lovespark-popup-fortress/) | 1.0.12 | `full-power/lovespark-popup-fortress` | [lovespark-popup-fortress](https://github.com/Joona-t/lovespark-extensions/tree/main/full-power/lovespark-popup-fortress) |
| [LoveSpark YouTube Shield (Full Power)](full-power/lovespark-yt-shield/) | 1.0.30 | `full-power/lovespark-yt-shield` | [lovespark-yt-shield](https://github.com/Joona-t/lovespark-extensions/tree/main/full-power/lovespark-yt-shield) |

## infrastructure

| Extension | Version | Folder | Came from |
|---|---|---|---|
| [LoveSpark Bridge](infrastructure/lovespark-bridge/) | 1.0.28 | `infrastructure/lovespark-bridge` | [lovespark-bridge](https://github.com/Joona-t/lovespark-extensions/tree/main/infrastructure/lovespark-bridge) |
| [lovespark-browse](infrastructure/lovespark-browse/) | — | `infrastructure/lovespark-browse` | local-only until now |
| [LoveSpark Core](infrastructure/lovespark-core-notion/) | 0.1.37 | `infrastructure/lovespark-core-notion` | [lovespark-core-notion](https://github.com/Joona-t/lovespark-extensions/tree/main/infrastructure/lovespark-core-notion) |
| [LoveSpark CWS Filler](infrastructure/lovespark-cws-filler/) | 0.1.1 | `infrastructure/lovespark-cws-filler` | local-only until now |
| [LoveSpark Dashboard](infrastructure/lovespark-dashboard/) | 1.0.31 | `infrastructure/lovespark-dashboard` | [lovespark-extension-dashboard](https://github.com/Joona-t/lovespark-extensions/tree/main/infrastructure/lovespark-dashboard) |
| [lovespark-shared-lib](infrastructure/lovespark-shared-lib/) | — | `infrastructure/lovespark-shared-lib` | [lovespark-shared-lib](https://github.com/Joona-t/lovespark-extensions/tree/main/infrastructure/lovespark-shared-lib) |

## neurodivergent

| Extension | Version | Folder | Came from |
|---|---|---|---|
| [Anti Brainrot for YouTube — Block Shorts & Feed](neurodivergent/anti-brainrot/) | 1.0.43 | `neurodivergent/anti-brainrot` | [Anti-Brainrot](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/anti-brainrot) |
| [Dopamine Control](neurodivergent/dopamine-control/) | 1.0.1 | `neurodivergent/dopamine-control` | [Dopamine-Control](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/dopamine-control) |
| [Focus Blossom: Site Blocker & Digital Detox](neurodivergent/focus-blossom/) | 1.0.48 | `neurodivergent/focus-blossom` | [focus-blossom](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/focus-blossom) |
| [LoveSpark Affirmation Cards](neurodivergent/lovespark-affirmation-cards/) | 1.0.34 | `neurodivergent/lovespark-affirmation-cards` | [lovespark-affirmation-cards](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-affirmation-cards) |
| [LoveSpark Body Double](neurodivergent/lovespark-body-double/) | 1.0.37 | `neurodivergent/lovespark-body-double` | [lovespark-body-double](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-body-double) |
| [LoveSpark Brain Dump](neurodivergent/lovespark-brain-dump/) | 1.0.36 | `neurodivergent/lovespark-brain-dump` | [lovespark-brain-dump](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-brain-dump) |
| [LoveSpark Breathe](neurodivergent/lovespark-breathe/) | 1.0.27 | `neurodivergent/lovespark-breathe` | [lovespark-breathe-ext](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-breathe) |
| [LoveSpark Calm](neurodivergent/lovespark-calm/) | 1.0.33 | `neurodivergent/lovespark-calm` | [lovespark-calm](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-calm) |
| [LoveSpark Calm Down Kit](neurodivergent/lovespark-calm-down-kit/) | 1.0.4 | `neurodivergent/lovespark-calm-down-kit` | local-only until now |
| [LoveSpark Context Switch](neurodivergent/lovespark-context-switch/) | 1.0.33 | `neurodivergent/lovespark-context-switch` | [lovespark-context-switch](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-context-switch) |
| [LoveSpark Decision Helper](neurodivergent/lovespark-decision-helper/) | 1.0.2 | `neurodivergent/lovespark-decision-helper` | local-only until now |
| [LoveSpark Desk Stretch](neurodivergent/lovespark-desk-stretch/) | 1.0.1 | `neurodivergent/lovespark-desk-stretch` | local-only until now |
| [Pink Anti-Doomscroll](neurodivergent/lovespark-doomscroll/) | 0.1.39 | `neurodivergent/lovespark-doomscroll` | [lovespark-anti-doomscroll](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-doomscroll) |
| [LoveSpark Dopamine Menu](neurodivergent/lovespark-dopamine-menu/) | 1.0.32 | `neurodivergent/lovespark-dopamine-menu` | [lovespark-dopamine-menu](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-dopamine-menu) |
| [LoveSpark Emotion Wheel](neurodivergent/lovespark-emotion-wheel/) | 1.0.3 | `neurodivergent/lovespark-emotion-wheel` | local-only until now |
| [LoveSpark Energy Meter](neurodivergent/lovespark-energy-meter/) | 1.0.32 | `neurodivergent/lovespark-energy-meter` | [lovespark-energy-meter](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-energy-meter) |
| [LoveSpark Executive Function Checklist](neurodivergent/lovespark-exec-function-checklist/) | 1.0.2 | `neurodivergent/lovespark-exec-function-checklist` | local-only until now |
| [Pomodoro Focus Timer & ADHD Study Tool by LoveSpark](neurodivergent/lovespark-focus/) | 1.1.45 | `neurodivergent/lovespark-focus` | [Pomodoro-Focus-Timer-ADHD-Study-Tool-by-LoveSpark](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-focus) |
| [LoveSpark Focus Pro](neurodivergent/lovespark-focus-pro/) | 1.0.1 | `neurodivergent/lovespark-focus-pro` | local-only until now |
| [LoveSpark Focus Sounds](neurodivergent/lovespark-focus-sounds/) | 1.0.1 | `neurodivergent/lovespark-focus-sounds` | local-only until now |
| [LoveSpark Gentle Timer](neurodivergent/lovespark-gentle-timer/) | 1.0.28 | `neurodivergent/lovespark-gentle-timer` | [lovespark-gentle-timer](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-gentle-timer) |
| [LoveSpark Gratitude Journal](neurodivergent/lovespark-gratitude-journal/) | 1.0.32 | `neurodivergent/lovespark-gratitude-journal` | [lovespark-gratitude-journal](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-gratitude-journal) |
| [LoveSpark Habit Garden](neurodivergent/lovespark-habit-garden/) | 1.0.36 | `neurodivergent/lovespark-habit-garden` | [lovespark-habit-garden](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-habit-garden) |
| [LoveSpark Hub](neurodivergent/lovespark-hub/) | 1.0.33 | `neurodivergent/lovespark-hub` | [lovespark-hub](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-hub) |
| [LoveSpark Hyperfocus Guard](neurodivergent/lovespark-hyperfocus-guard/) | 1.0.2 | `neurodivergent/lovespark-hyperfocus-guard` | local-only until now |
| [LoveSpark Imposter Shield](neurodivergent/lovespark-imposter-shield/) | 1.0.1 | `neurodivergent/lovespark-imposter-shield` | local-only until now |
| [LoveSpark Input Guard](neurodivergent/lovespark-input-guard/) | 1.0.2 | `neurodivergent/lovespark-input-guard` | local-only until now |
| [LoveSpark Med Reminder](neurodivergent/lovespark-med-reminder/) | 1.0.1 | `neurodivergent/lovespark-med-reminder` | local-only until now |
| [LoveSpark Med Tracker](neurodivergent/lovespark-med-tracker/) | 1.0.38 | `neurodivergent/lovespark-med-tracker` | [lovespark-med-tracker](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-med-tracker) |
| [LoveSpark Mood Bloom](neurodivergent/lovespark-mood-bloom/) | 1.0.33 | `neurodivergent/lovespark-mood-bloom` | [lovespark-mood-bloom](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-mood-bloom) |
| [LoveSpark Morning Routine](neurodivergent/lovespark-morning-routine/) | 1.0.2 | `neurodivergent/lovespark-morning-routine` | local-only until now |
| [LoveSpark Noise Level](neurodivergent/lovespark-noise-level/) | 1.0.2 | `neurodivergent/lovespark-noise-level` | local-only until now |
| [LoveSpark Pomodoro Rose](neurodivergent/lovespark-pomodoro-rose/) | 1.0.1 | `neurodivergent/lovespark-pomodoro-rose` | local-only until now |
| [LoveSpark Read Aloud](neurodivergent/lovespark-read-aloud/) | 1.0.33 | `neurodivergent/lovespark-read-aloud` | [lovespark-read-aloud](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-read-aloud) |
| [LoveSpark Reward Spinner](neurodivergent/lovespark-reward-spinner/) | 1.0.32 | `neurodivergent/lovespark-reward-spinner` | [lovespark-reward-spinner](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-reward-spinner) |
| [LoveSpark RSD Shield](neurodivergent/lovespark-rsd-shield/) | 1.0.1 | `neurodivergent/lovespark-rsd-shield` | local-only until now |
| [LoveSpark Sensory Dimmer](neurodivergent/lovespark-sensory-dimmer/) | 1.0.2 | `neurodivergent/lovespark-sensory-dimmer` | local-only until now |
| [LoveSpark Site Blocker](neurodivergent/lovespark-site-blocker/) | 1.0.5 | `neurodivergent/lovespark-site-blocker` | local-only until now |
| [LoveSpark Social Battery](neurodivergent/lovespark-social-battery/) | 1.0.2 | `neurodivergent/lovespark-social-battery` | local-only until now |
| [LoveSpark Stim Board](neurodivergent/lovespark-stim-board/) | 1.0.29 | `neurodivergent/lovespark-stim-board` | [lovespark-stim-board](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-stim-board) |
| [LoveSpark Stretch Reminder](neurodivergent/lovespark-stretch-reminder/) | 1.0.2 | `neurodivergent/lovespark-stretch-reminder` | local-only until now |
| [LoveSpark Tab Garden](neurodivergent/lovespark-tab-garden/) | 1.0.27 | `neurodivergent/lovespark-tab-garden` | [lovespark-tab-garden](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-tab-garden) |
| [LoveSpark Task Anchor](neurodivergent/lovespark-task-anchor/) | 1.0.15 | `neurodivergent/lovespark-task-anchor` | [lovespark-task-anchor](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-task-anchor) |
| [LoveSpark Task Starter](neurodivergent/lovespark-task-starter/) | 1.0.5 | `neurodivergent/lovespark-task-starter` | local-only until now |
| [LoveSpark Time Blindness Clock](neurodivergent/lovespark-time-blindness-clock/) | 1.0.4 | `neurodivergent/lovespark-time-blindness-clock` | local-only until now |
| [LoveSpark Water Tracker](neurodivergent/lovespark-water-tracker/) | 1.0.3 | `neurodivergent/lovespark-water-tracker` | local-only until now |
| [LoveSpark Win Jar](neurodivergent/lovespark-win-jar/) | 1.0.34 | `neurodivergent/lovespark-win-jar` | [lovespark-win-jar](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-win-jar) |
| [LoveSpark Wind Down](neurodivergent/lovespark-wind-down/) | 1.0.1 | `neurodivergent/lovespark-wind-down` | local-only until now |
| [LoveSpark Working Memory Pad](neurodivergent/lovespark-working-memory-pad/) | 1.0.2 | `neurodivergent/lovespark-working-memory-pad` | local-only until now |
| [Neurodivergent Reader by LoveSpark](neurodivergent/neurodivergent-reader/) | 1.0.34 | `neurodivergent/neurodivergent-reader` | [neurodivergent-reader](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/neurodivergent-reader) |
| [Sensory Shield by LoveSpark](neurodivergent/sensory-shield/) | 1.0.40 | `neurodivergent/sensory-shield` | [sensory-shield](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/sensory-shield) |
| [Study Bubbles by LoveSpark](neurodivergent/study-bubbles/) | 1.0.33 | `neurodivergent/study-bubbles` | [study-bubbles](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/study-bubbles) |
| [Time-Softener by LoveSpark](neurodivergent/time-softener/) | 1.0.31 | `neurodivergent/time-softener` | [time-softener](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/time-softener) |

## privacy

| Extension | Version | Folder | Came from |
|---|---|---|---|
| [I Don't Want Cookies](privacy/i-dont-want-cookies/) | 1.0.38 | `privacy/i-dont-want-cookies` | [I-Dont-Want-Cookies](https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/i-dont-want-cookies) |
| [Pink Ad Blocker — Block Ads & Trackers](privacy/lovespark-adblock/) | 1.1.2 | `privacy/lovespark-adblock` | [LoveSpark-AdBlock](https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-adblock) |
| [LoveSpark Download Guard](privacy/lovespark-download-guard/) | 1.0.2 | `privacy/lovespark-download-guard` | local-only until now |
| [LoveSpark Email Guard](privacy/lovespark-email-guard/) | 1.0.34 | `privacy/lovespark-email-guard` | [lovespark-email-guard](https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-email-guard) |
| [LoveSpark Fingerprint Shield](privacy/lovespark-fingerprint-shield/) | 1.0.36 | `privacy/lovespark-fingerprint-shield` | [lovespark-fingerprint-shield](https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-fingerprint-shield) |
| [LoveSpark History Cleaner](privacy/lovespark-history-cleaner/) | 1.0.4 | `privacy/lovespark-history-cleaner` | local-only until now |
| [LoveSpark Metadata Scrubber](privacy/lovespark-metadata-scrubber/) | 1.0.34 | `privacy/lovespark-metadata-scrubber` | [lovespark-metadata-scrubber](https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-metadata-scrubber) |
| [LoveSpark Noise Blocker](privacy/lovespark-noise-blocker/) | 1.0.2 | `privacy/lovespark-noise-blocker` | local-only until now |
| [LoveSpark Password Check](privacy/lovespark-password-check/) | 1.0.3 | `privacy/lovespark-password-check` | local-only until now |
| [LoveSpark Popup Blocker](privacy/lovespark-popup-blocker/) | 1.0.38 | `privacy/lovespark-popup-blocker` | [lovespark-popup-blocker](https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-popup-blocker) |
| [LoveSpark Reddit Ad Blocker](privacy/lovespark-reddit-promoted-block/) | 1.0.30 | `privacy/lovespark-reddit-promoted-block` | [reddit-promoted-blocker-lovespark](https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-reddit-promoted-block) |
| [LoveSpark Referrer Shield](privacy/lovespark-referrer-shield/) | 1.0.34 | `privacy/lovespark-referrer-shield` | [lovespark-referrer-shield](https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-referrer-shield) |
| [lovespark-test-ext](privacy/lovespark-test-ext/) | — | `privacy/lovespark-test-ext` | local-only until now |
| [LoveSpark Twitch AdBlock](privacy/lovespark-twitch-adblock/) | 1.0.34 | `privacy/lovespark-twitch-adblock` | [lovespark-twitch-adblock](https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-twitch-adblock) |
| [LoveSpark UTM Stripper](privacy/lovespark-utm-stripper/) | 1.0.2 | `privacy/lovespark-utm-stripper` | local-only until now |
| [Porn Blocker Rewire Brain 🧠](privacy/porn-blocker-rewire-brain/) | 2.4.6 | `privacy/porn-blocker-rewire-brain` | [porn-blocker-rewire-brain](https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/porn-blocker-rewire-brain) |

## productivity

| Extension | Version | Folder | Came from |
|---|---|---|---|
| [Are You Cooked?](productivity/are-you-cooked/) | 2.1.36 | `productivity/are-you-cooked` | [are-you-cooked](https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/are-you-cooked) |
| [LoveSpark Clipboard Notes](productivity/lovespark-clipboard-notes/) | 1.0.3 | `productivity/lovespark-clipboard-notes` | local-only until now |
| [LoveSpark Color Picker](productivity/lovespark-color-picker/) | 1.0.2 | `productivity/lovespark-color-picker` | local-only until now |
| [LoveSpark Daily Checklist](productivity/lovespark-daily-checklist/) | 1.0.2 | `productivity/lovespark-daily-checklist` | local-only until now |
| [LoveSpark Link Saver](productivity/lovespark-link-saver/) | 1.0.2 | `productivity/lovespark-link-saver` | local-only until now |
| [LoveSpark Notes](productivity/lovespark-notes/) | 1.0.42 | `productivity/lovespark-notes` | [lovespark-notes](https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-notes) |
| [LoveSpark Notes](productivity/lovespark-notes-app/) | 1.0.42 | `productivity/lovespark-notes-app` | [lovespark-notes-app](https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-notes-app) |
| [LoveSpark Panic Button](productivity/lovespark-panic-button/) | 1.0.2 | `productivity/lovespark-panic-button` | local-only until now |
| [LoveSpark Planner](productivity/lovespark-planner/) | 1.0.3 | `productivity/lovespark-planner` | local-only until now |
| [LoveSpark Quick Timer](productivity/lovespark-quick-timer/) | 1.0.2 | `productivity/lovespark-quick-timer` | local-only until now |
| [LoveSpark Scroll To Top](productivity/lovespark-scroll-to-top/) | 1.0.2 | `productivity/lovespark-scroll-to-top` | local-only until now |
| [LoveSpark Site Notes](productivity/lovespark-site-notes/) | 1.1.0 | `productivity/lovespark-site-notes` | local-only until now |
| [YouTube Sponsor Skip](productivity/lovespark-sponsor-skip/) | 2.0.36 | `productivity/lovespark-sponsor-skip` | [lovespark-sponsor-skip](https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-sponsor-skip) |
| [LoveSpark Word Count](productivity/lovespark-word-count/) | 1.0.2 | `productivity/lovespark-word-count` | local-only until now |
| [LoveSpark — YouTube Ad Comfort Mode](productivity/lovespark-youtube-ad-comfort-mode/) | 1.0.30 | `productivity/lovespark-youtube-ad-comfort-mode` | [lovespark-youtube-ad-comfort-mode](https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-youtube-ad-comfort-mode) |
| [LoveSpark YT Digest](productivity/lovespark-yt-digest/) | 1.0.2 | `productivity/lovespark-yt-digest` | local-only until now |

## reading

| Extension | Version | Folder | Came from |
|---|---|---|---|
| [LoveSpark Auto TOC](reading/lovespark-auto-toc/) | 1.0.2 | `reading/lovespark-auto-toc` | local-only until now |
| [LoveSpark Bionic Reading](reading/lovespark-bionic-reading/) | 1.0.1 | `reading/lovespark-bionic-reading` | local-only until now |
| [LoveSpark Dark Mode](reading/lovespark-dark-mode/) | 2.0.37 | `reading/lovespark-dark-mode` | [lovespark-dark-mode](https://github.com/Joona-t/lovespark-extensions/tree/main/reading/lovespark-dark-mode) |
| [LoveSpark Focus Highlight](reading/lovespark-focus-highlight/) | 1.0.1 | `reading/lovespark-focus-highlight` | local-only until now |
| [LoveSpark Page Ruler](reading/lovespark-page-ruler/) | 1.0.2 | `reading/lovespark-page-ruler` | local-only until now |
| [LoveSpark Reader](reading/lovespark-reader/) | 1.1.35 | `reading/lovespark-reader` | [lovespark-reader](https://github.com/Joona-t/lovespark-extensions/tree/main/reading/lovespark-reader) |
| [LoveSpark Reading Progress](reading/lovespark-reading-progress/) | 1.0.30 | `reading/lovespark-reading-progress` | [lovespark-reading-progress](https://github.com/Joona-t/lovespark-extensions/tree/main/reading/lovespark-reading-progress) |
| [Aaron — Public Knowledge Unblocker](reading/public-knowledge-unblocker/) | 1.0.26 | `reading/public-knowledge-unblocker` | [Aaron-Public-Knowledge-Unblocker](https://github.com/Joona-t/lovespark-extensions/tree/main/reading/public-knowledge-unblocker) |

## themes

| Extension | Version | Folder | Came from |
|---|---|---|---|
| [LoveSpark Minimal Scroll](themes/lovespark-minimal-scroll/) | 1.0.30 | `themes/lovespark-minimal-scroll` | [lovespark-minimal-scroll](https://github.com/Joona-t/lovespark-extensions/tree/main/themes/lovespark-minimal-scroll) |
| [Aesthetic Pink Retro Cursor Pack by LoveSpark](themes/lovespark-retro-cursor/) | 1.1.37 | `themes/lovespark-retro-cursor` | [LoveSpark-Retro-Cursor](https://github.com/Joona-t/lovespark-extensions/tree/main/themes/lovespark-retro-cursor) |
| [LoveSpark Syntax Art](themes/lovespark-syntax-art-ext/) | 1.0.36 | `themes/lovespark-syntax-art-ext` | [lovespark-syntax-art-ext](https://github.com/Joona-t/lovespark-extensions/tree/main/themes/lovespark-syntax-art-ext) |

## Moved here on 2026-10-08

These extensions used to live in separate repos (now archived, read-only). See `docs/monorepo/` for how and why.
