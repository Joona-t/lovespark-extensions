# Pink Ad Blocker — by LoveSpark 💕🛡️

> Store name: **Pink Ad Blocker — Block Ads &amp; Trackers** — uses the generic two-word "Ad Blocker" to avoid the "AdBlock"/"Adblock Plus" trademark per Chrome Web Store policy.

A free, open-source, privacy-first ad &amp; tracker blocker for Chrome and Firefox — part of the
[LoveSpark Suite](https://lovespark.love) of retro-pink productivity tools built for neurodivergent users.

- **No ads. No data collection. Always free. MIT licensed.**
- 100% local: all blocking runs on-device via Manifest V3 `declarativeNetRequest`. Nothing is ever transmitted.
- No remote code, no paid API, no account.

## Features

- **Network-level blocking** of ad &amp; tracker requests via static DNR rulesets.
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

## Filter coverage

The blocklist is a curated set of high-traffic ad &amp; tracker domains. A build-time pipeline
(`scripts/build-rules.mjs`, see [ATTRIBUTION.md](ATTRIBUTION.md)) can expand it from community
filter lists (EasyList / EasyPrivacy) into bundled static DNR rules — no runtime fetch, MV3-compliant.

## Build

```bash
# Produce store zips (Chrome + Firefox, AMO-validated):
../../scripts/build-zips.sh .
```

## License

[MIT](LICENSE) © 2026 Joona Tyrninoksa · [github.com/Joona-t](https://github.com/Joona-t)
