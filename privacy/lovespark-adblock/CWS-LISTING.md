# Chrome Web Store Listing — Pink Ad Blocker

> SEO copy from the 2026-06-28 audit. The name deliberately uses the generic two-word
> **"Ad Blocker"** and the phrase **"Block Ads"** — never the **"AdBlock" / "Adblock Plus"**
> trademark tokens, which CWS penalizes under its IP / impersonation policies.

## Name (≤45 chars)

```
Pink Ad Blocker — Block Ads & Trackers
```
(38 characters. Keyword-led — "Ad Blocker" in the leading slot the store weights most —
qualified by the "Pink" differentiator, with the second high-volume term "Block Ads" + the
extension's actual default-on feature "Trackers" in the tail.)

### Ranked alternatives (if the above is taken / for A/B testing)
1. `Ad Blocker: Block Ads, Pop-ups & Trackers` (41) — max keyword density, no differentiator.
2. `Pink Ad Blocker — Block Ads & Pop-ups` (37) — swaps Trackers for the "pop-up blocker" query.
3. `Pink Ad Blocker by LoveSpark` (28) — cleanest brand form; leaves keyword headroom unused.
4. `Ad Blocker — Block Ads, Pop-ups & Trackers` (42) — generic keyword-maximal, no brand.

## Short description (≤132 chars)

```
Cute pink ad blocker that blocks ads, pop-ups & trackers. Faster, cleaner browsing — no data collection, always free.
```
(117 characters.)

## Long description (SEO-optimized)

```
Pink Ad Blocker is a cute, fast, privacy-first ad blocker that blocks ads, pop-ups, and trackers
so the web loads cleaner and quieter — wrapped in a retro-pink design you'll actually enjoy opening.

WHY YOU'LL LOVE IT
• Broad ad coverage — bundled community rules block common banners, video-ad endpoints, and pop-ups;
  a YouTube-specific layer removes video ads from YouTube's player data before they load, hides sponsored placements, and skips any in-player ad that still appears.
• Stop trackers — third-party trackers are blocked by default for more private browsing.
• Faster, lighter pages — fewer requests means pages load quicker and use less data.
• Three intensity tiers — Light (ads only), Medium (ads + trackers, default), Strong (+ annoyances
  like cookie banners and overlays). Pick how aggressive you want to be.
• Capacity-aware coverage — a guaranteed core is always enabled, with more bundled community rules
  activated automatically when your browser reports room for them.
• Per-site whitelist — love a site? Allow its ads in one click; everything else stays blocked.
• Live block counter — see how many ads and trackers you've blocked today and all-time.
• 4 themes + Sparky — Retro Pink, Dark, Beige, and Slate, with an accessible, OpenDyslexic-friendly
  design and full keyboard navigation.

PRIVACY YOU CAN VERIFY
• 100% local. Request blocking and the YouTube page helper run on your device.
• Zero data collection. No accounts, no analytics, no tracking, nothing transmitted — ever.
• No broad all-sites access. The page helper is limited to YouTube and never transmits content.
• Free and open source (MIT). Read the code: github.com/Joona-t/lovespark-adblock

Block ads, block pop-ups, block trackers, and reclaim a faster, cleaner, more private web —
the cute way. Part of the LoveSpark suite of retro-pink tools for focused, neurodivergent-friendly
browsing.
```

**Primary keywords woven in:** ad blocker, block ads, pop-up blocker / block pop-ups,
tracker blocker / block trackers, ad block (two words), no ads / ad-free, privacy / privacy-first,
no data collection, free / open source, faster browsing / cleaner web, anti-tracking,
lightweight / Manifest V3, pink / cute / aesthetic / retro.

## Single-purpose justification (CWS §2.B)

> Pink Ad Blocker has one purpose: block unwanted ads, pop-ups, and trackers for a faster, cleaner,
> more private browsing experience. Every feature serves that single purpose — network rules block ad
> and tracker requests, the YouTube scripts remove video and sponsored ads on YouTube,
> the intensity tiers choose how much to block, the per-site whitelist lets the user exempt chosen
> sites from blocking, and the block counter reports how much was blocked. There is no unrelated
> functionality.

## Per-permission justification

- **declarativeNetRequest** — Applies the bundled static block rulesets (ads, trackers, and an
  optional annoyances ruleset) at the network layer, entirely on-device. This is the core blocking
  mechanism.
- **declarativeNetRequestFeedback** — Reads matched-rule **counts** (`getMatchedRules`) solely to
  display the in-popup "blocked today / total" statistics. No per-request data leaves the device.
- **storage** — Persists the user's settings (enabled state, intensity tier, theme) and per-site
  whitelist plus local block counters in `chrome.storage.local`.
- **alarms** — Schedules the daily reset of the "blocked today" counter and a 1-minute refresh of
  the stats shown in the popup.
- **activeTab** — When the user opens the popup, reads the **current tab's domain** so the per-site
  whitelist toggle can target the site the user is on. Granted only on user gesture; no access to
  other tabs.

## Site-access justification

The extension declares **no `<all_urls>` access**. Bundled content scripts run only on
`youtube.com` and `youtube-nocookie.com`: one removes ad entries from YouTube's player data inside the
page before ads load, the other hides sponsored placements and skips an in-player ad if one still appears. It does not store or transmit page content. Network blocking
elsewhere is performed by bundled static `declarativeNetRequest` rulesets, and the current site's
domain is obtained via the gesture-scoped `activeTab` permission only.

## Privacy disclosure (CWS §5 — paste these answers)

- **Does this item collect or use user data?** It does not collect any of the listed data types.
- Personally identifiable information — **No**
- Health information — **No**
- Financial / payment information — **No**
- Authentication information — **No**
- Personal communications — **No**
- Location — **No**
- Web history — **No**
- User activity — **No**
- Website content — **No**
- Certifications (check all three):
  - ✅ I do not sell or transfer user data to third parties, outside of the approved use cases.
  - ✅ I do not use or transfer user data for purposes unrelated to my item's single purpose.
  - ✅ I do not use or transfer user data to determine creditworthiness or for lending purposes.
- **Privacy policy URL:** https://github.com/Joona-t/lovespark-adblock/blob/main/PRIVACY.md

## Reviewer test instructions (3-minute walkthrough)

1. Install the extension. The toolbar icon (pink shield) appears; on Chrome a per-tab block count
   shows on the badge.
2. Open any ad-heavy news site — ads and trackers are blocked by the default Medium tier.
3. Click the toolbar icon to open the popup: see the on/off toggle, the "blocked today / total"
   counters, and the current site with an "Allow" (whitelist) button.
4. Click **Allow** for the current site, reload — ads load on that site only; remove it to re-block.
5. Open **Settings** (gear in the popup) to switch intensity tier (Light / Medium / Strong), manage
   the whitelist (add / import / export), export stats CSV, and change theme.
6. Verify in DevTools that the extension makes **no outbound network requests** of its own.
7. On YouTube, play a few popular music videos: no pre-roll/mid-roll video ad plays, and sponsored
   feed/player placements are hidden, while ordinary playback, seeking, audio, captions, and navigation
   remain usable. Turn the extension off in the popup and reload: YouTube ads return.
