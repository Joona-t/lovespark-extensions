# Privacy Policy — Rewire Brain

**Effective date:** 2026-05-27
**Extension:** Rewire Brain — Mindful Porn Blocker (Chrome / Firefox)
**Publisher:** Joona Tyrninoksa — LoveSpark suite
**Source code:** https://github.com/Joona-t/porn-blocker-rewire-brain

---

## Summary

**Rewire Brain collects zero user data.**

No analytics. No telemetry. No accounts. No subscription. No external API
calls. No tracking pixels. No data transmitted outside your browser. Ever.

The full source code is public — verify every claim below by reading the
code yourself.

---

## What data the extension stores LOCALLY

All extension state is stored using `chrome.storage.local`, which is local
to your machine and is **never** synced to Google or any other service.

| Stored locally | Purpose | Example |
|----------------|---------|---------|
| Settings (image blur on/off, sensitivity, theme) | User preferences | `imageBlurEnabled: true` |
| Streak data (start date, day count, XP, level) | Show your progress | `streakDays: 14` |
| Custom blocklist additions (domains, subreddits) | User-added blocks | `userDomains: ["example.com"]` |
| Journal entries (one per day, your text) | Daily reflection | `[{date, text}]` |
| Lifetime counters (blocks, breathing exercises, etc.) | Stats display | `imagesBlurredCount: 247` |
| Onboarding answer ("Why are you doing this?") | Motivation display in dashboard | `userReason: "..."` |

You can view this data anytime by opening Chrome DevTools → Application →
Storage → Extensions → Rewire Brain. You can wipe all data anytime via
the extension's "Reset all stats" button in Settings.

---

## What data the extension does NOT collect or transmit

The extension makes **zero outbound network requests** for any data. There
is no server-side component, no API, no analytics SDK, no error reporter,
no telemetry framework. Every piece of code that runs is bundled in the
extension package and runs locally in your browser.

Specifically:

- ❌ No personally identifiable information collected
- ❌ No health information collected
- ❌ No financial information collected
- ❌ No authentication information collected
- ❌ No personal communications collected
- ❌ No location data collected
- ❌ No browsing history collected
- ❌ No clicks, keystrokes, or other user activity tracked
- ❌ No website content read or transmitted (beyond what's needed to
       classify images on-device — see below)

---

## How the on-device NSFW image classifier works

When the "Image Blur" feature is enabled, the extension uses a bundled
TensorFlow.js MobileNetV2 model to classify images that appear on web pages
you visit. This classifier runs **entirely in your browser** — no images,
URLs, or classification results are ever transmitted externally.

How to verify: open Chrome DevTools → Network tab → enable the extension
→ browse anywhere. You will see ZERO outbound requests originating from
the extension to any external server.

The classifier model files are bundled in the extension at
`lib/nsfwjs/` — they are loaded from the extension's own local assets,
not from a CDN.

---

## How URL-level blocking works

The extension uses Chrome's `declarativeNetRequest` API to block 125+
adult websites and 30+ NSFW subreddits. This is a Chrome browser API —
the browser enforces the blocks directly using static rules defined in
the extension's `rules.json` file.

The extension does **not** see, log, or transmit the URLs you visit.
The blocking happens at the browser's network layer, transparent to the
extension code.

---

## Permissions explained

The extension requests the following Chrome permissions. Each is used
solely for the single purpose stated below; none are used to collect or
transmit user data.

| Permission | Use |
|-----------|------|
| `storage` | Store settings, streak count, journal entries locally |
| `declarativeNetRequest` | Block 125+ adult sites via Chrome's network-layer API |
| `declarativeNetRequestWithHostAccess` | Allow user-added custom domains to be blocked |
| `tabs` | Open the dashboard / onboarding page in a new tab |
| `alarms` | Run the hourly streak update + optional journal reminder |
| `notifications` | Fire the optional daily journal reminder notification |

### Host permissions: `<all_urls>`

The extension requests access to all URLs **solely** to enable the
on-device image classifier to inspect images on any page (image search,
social media, blogs, etc.). The classifier runs in your browser — no page
data is read or transmitted.

The extension does NOT use `<all_urls>` to:
- Read page text or DOM content (beyond `<img>` elements)
- Track navigation between pages
- Inject tracking scripts
- Send any data externally
- Modify page content other than adding CSS classes to blur explicit images

---

## Third-party services

**None.** The extension communicates with zero third-party services.

The bundled TensorFlow.js / NSFWJS library is open-source software licensed
under MIT, included in the extension package — not loaded from a CDN, not
tracked, not analytics-instrumented. See `lib/nsfwjs/LICENSE` for the
library's own license.

---

## Children's privacy

The extension is not directed at children under 13 and does not knowingly
collect data from anyone, including children. (See "What data the extension
does NOT collect" above.) Parents/guardians may install Rewire Brain on a
child's device to filter adult content — the extension's blocking is
local-only and does not transmit any usage data.

---

## Changes to this policy

If this privacy policy changes, the updated version will be committed to
the public GitHub repository at:

https://github.com/Joona-t/porn-blocker-rewire-brain/blob/main/PRIVACY.md

The `Effective date` at the top of this document will be updated. Git
history at the same URL provides a full audit trail of every change.

---

## Contact

- GitHub issues: https://github.com/Joona-t/porn-blocker-rewire-brain/issues
- Email: https://github.com/Joona-t/lovespark-extensions/issues
- LoveSpark home: https://lovespark.love

---

## Verification

Every claim in this document is verifiable by reading the extension's
source code at https://github.com/Joona-t/porn-blocker-rewire-brain. The
extension is MIT licensed and contains no obfuscated or minified
business logic (only the open-source TensorFlow.js library, which is
itself MIT licensed and bundled unmodified).

If you find any discrepancy between this policy and actual behavior,
please open a GitHub issue — it will be treated as a critical bug.
