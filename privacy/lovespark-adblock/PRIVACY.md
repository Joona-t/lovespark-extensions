# Privacy Policy — Pink Ad Blocker (by LoveSpark)

_Last updated: 2026-09-10_

**Pink Ad Blocker — Block Ads & Trackers** is built privacy-first. It collects **zero** personal
data and transmits **nothing** off your device. There are no accounts, no analytics, no tracking,
no remote code, and no paid API.

## What is stored (locally only)

Everything is kept in `chrome.storage.local` on your own machine and never leaves it:

| Data | Why |
|------|-----|
| `isEnabled`, `filterIntensity` | Remember whether blocking is on and which tier (Light / Medium / Strong) you chose. |
| `whitelistedDomains` | The list of sites you chose to allow ads on. |
| `adsBlockedToday`, `adsBlockedTotal`, `lastResetDate` | Local counters for the in-popup "blocked" stats. Plain numbers — not browsing history. |
| `theme` | Your selected UI theme (Retro Pink / Dark / Beige / Slate). |

These values are settings and counters. **No URLs, page contents, or browsing history are ever
stored or sent anywhere.**

## What is NOT collected or transmitted

- No browsing history, no visited URLs, no page content.
- No personal or device identifiers.
- No telemetry, no analytics, no crash reporting.
- Nothing is sent to LoveSpark or any third party. There is no server.

## Permissions — what each is used for

| Permission | Use | What it is NOT used for |
|------------|-----|-------------------------|
| `declarativeNetRequest` | Apply the bundled static block rulesets (ads, trackers, optional annoyances) at the network layer, on-device. | It does not read request contents and cannot send data anywhere. |
| `declarativeNetRequestFeedback` | Read matched-rule **counts** (Chrome's `getMatchedRules`) to show the "blocked today / total" numbers in the popup. | It is not used to log which sites you visit; only an aggregate count is read, and it stays local. |
| `storage` | Persist the settings and local counters listed above. | Not used for any remote sync or data collection. |
| `alarms` | Schedule the daily counter reset and a 1-minute stats refresh. | Nothing network-related. |
| `activeTab` | When you open the popup, read the **current tab's domain** so you can toggle the per-site whitelist. | Does not grant access to other tabs and is not used to track browsing. |

**Site access:** bundled content scripts run only on `youtube.com` and `youtube-nocookie.com`. One removes ad
entries from YouTube's player data inside the page before ads load; the other hides
ad placements and skips an in-player ad if one still appears. They read the local
enabled/allowlist settings and inspects only YouTube's live page DOM; it does not store or transmit page
content. There is no `<all_urls>` access. Network blocking is performed by bundled static DNR rules.

## Third-party services

None. The extension makes no network requests of its own.

## Children's privacy

The extension collects no data from anyone, including children under 13.

## Open source / verification

The full source is public — you can verify every claim above:
<https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-adblock>

## Contact

Questions or concerns: open an issue at
<https://github.com/Joona-t/lovespark-extensions/issues>.
