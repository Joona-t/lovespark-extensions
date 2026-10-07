# Pink Ad Blocker — by LoveSpark 💕🛡️

> Store name: **Pink Ad Blocker — Block Ads &amp; Trackers** — uses the generic two-word "Ad Blocker" to avoid the "AdBlock"/"Adblock Plus" trademark per Chrome Web Store policy.

A free, open-source, privacy-first ad &amp; tracker blocker for Chrome and Firefox — part of the
[LoveSpark Suite](https://lovespark.love) of retro-pink productivity tools built for neurodivergent users.

- **No data collection. No analytics. Always free.**
- 100% local: request blocking and the YouTube page helper run on-device. Nothing is ever transmitted.
- No remote code, no paid API, no account.

## Features

- **Network-level blocking** of ad &amp; tracker requests via static DNR rulesets.
- **YouTube coverage** — blocks ad-only player endpoints, hides sponsored placements, and skips a detected
  in-player ad as a fallback without muting or seeking ordinary video.
- **Three intensity tiers** — Light (ads), Medium (ads + trackers, default), Strong (+ annoyances).
- **Per-site whitelist** — allow everything on sites you choose (uses a DNR `allowAllRequests` rule so 3rd-party
  frames on the page are exempt too).
- **Live counters** — blocked-today / blocked-total, plus Chrome's per-page badge count.
- **4 themes** (Retro Pink, Dark, Beige, Slate), Sparky mascot, OpenDyslexic-friendly design system.
- Accessible: WCAG 2.1 AA targets, `role="dialog"` popup, full keyboard nav, `prefers-reduced-motion`.

## Privacy

This extension stores a handful of counters and your whitelist in `chrome.storage.local` and nothing else.
**Zero data leaves your device.** See [PRIVACY.md](PRIVACY.md) (when published) and the source here for verification.

## Permissions

| Permission | Why |
|------------|-----|
| `declarativeNetRequest` | Apply the bundled block rulesets. |
| `declarativeNetRequestFeedback` | Read matched-rule counts to show the in-popup "blocked" stats. |
| `storage` | Persist counters, theme, enabled state, and your whitelist locally. |
| `alarms` | Daily counter reset + periodic stats poll. |
| `activeTab` | Read the current tab's domain (when you open the popup) so the "Allow this site" button works. No `<all_urls>`. |

The manifest also runs a local content script only on `youtube.com` and `youtube-nocookie.com`. It observes
YouTube's ad UI so cosmetic placements can be hidden and a detected in-player ad can be skipped; it does not
read or transmit page content.

## Filter coverage

The package bundles all 111,419 network rules that the conservative converter can safely map from the
current EasyList, EasyPrivacy, and Fanboy subscriptions. A 29,500-rule generated core stays inside the
browser-guaranteed allowance; additional 2,500-rule chunks are enabled only when the browser reports
capacity, with ads prioritized before tracking and annoyances. `rules-metadata.json` records source URLs,
collection time, hashes, emitted counts, and skipped syntax. The installed extension never fetches lists.

## YouTube behavior and limits

- `rules-youtube.json` **blocks requests** only for ad-specific YouTube endpoints. It deliberately does
  not block `googlevideo.com` or the general player API because those also carry legitimate playback.
- `youtube-content.css` **hides** known sponsored/player ad elements.
- `youtube-content.js` **skips** an ad only after YouTube marks the player `ad-showing`; this is a
  fallback, not proof that the ad request was blocked.
- This release is not Adblock Plus parity: it has no general-purpose cosmetic/scriptlet engine, and
  filter subscriptions update at build/release time rather than inside the installed extension.
- Closing those two gaps would require broad all-sites page access plus a maintained scriptlet/update
  engine. Version 1.1.0 deliberately does not add that materially larger permission and security surface.

## Install or reload locally

1. Open `chrome://extensions`, enable **Developer mode**, and choose **Load unpacked**.
2. Select this `lovespark-adblock` folder. If it is already loaded unpacked, click its **Reload** button.
3. Reload any YouTube tabs that were open before the extension reload.

The packaged Chrome build was also loaded automatically in official Chrome for Testing 153 with a
disposable profile. That acceptance run verifies DNR schema loading, browser-reported capacity planning,
real blocked requests, global disable, allowlisting, and YouTube page-script activation without touching
the user's regular Chrome profile. An account/region-specific live YouTube ad sample still requires manual
observation; an automated sample that receives no ad is not universal blocking proof.

## Build

```bash
# Produce store zips (Chrome + Firefox, AMO-validated):
../../../scripts/build-zips.sh "$PWD"

# Browser acceptance with an official Chrome for Testing / Chromium binary:
LOVESPARK_CHROME_BIN=/path/to/chrome node scripts/chrome-smoke.mjs
```

## License

[MIT](LICENSE) © 2026 Joona Tyrninoksa · [github.com/Joona-t](https://github.com/Joona-t)
