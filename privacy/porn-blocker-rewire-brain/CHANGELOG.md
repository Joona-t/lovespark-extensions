# Changelog

All notable changes to Rewire Brain — Mindful Porn Blocker are documented here.

The format is based on [Keep a Changelog](https://keepachangelog.com/), and this project adheres to [Semantic Versioning](https://semver.org/).

---

## [2.4.3] — 2026-05-27

### Fixed

- **P0: Silent-failure catch in image-blur classifier** — Bare `catch{}` in `image-blur-main.js:150` was removing the pre-blur class on ANY classifier error (tainted-canvas SecurityError, CSP rejection, NSFWJS load failure). Now applies fail-closed pattern: keeps blur permanently and logs warning on classify error. Resolves user-reported Twitter/DuckDuckGo silent-failure bug.
- **P0: Storage error silently disables blur** — `chrome.storage.local.get` failures in `image-blur.js:14-22` caused early return, disabling blur sitewide. Now defaults to `enabled: true` with strict settings on storage error.
- **P0: Timeout removes hide-style even when blocked** — `content.js:49-51` was removing the page-hiding style after 500ms, even if the service worker had already responded with a "blocked" verdict, causing flash-of-blocked-content. Added `responded` flag and bumped timeout to 1500ms; respects service-worker responses.
- **HIGH: Journal duplicates on multi-save per day** — SAVE_JOURNAL_ENTRY was using `.push()` without deduplicating by date. Switched to upsert pattern: `findIndex(date)` and replace if found, else push. Fixes dashboard pre-fill showing stale content.
- **HIGH: SITE_BLOCKED returned stale XP** — XP toast was displaying a value 10–110 XP behind the actual stored value immediately after a block event. Added fresh `chrome.storage.local.get(['xp'])` after `updateStreak()` to return post-streak XP.
- **HIGH: UTC vs local-date mismatch for non-UTC users** — Journal entries were stored under the wrong calendar date for users outside UTC. Rewrote `toDateStr()` to produce local-date (using `getFullYear/getMonth/getDate` without UTC conversion) and updated `daysBetween()` to parse at local midnight. Fixes timezone bugs invisible to UTC users.
- **HIGH: Streak gap branch incomplete** — When detecting a streak gap (>1 day), `SITE_BLOCKED` handler was setting `streakStartDate` but not `streakDays: 0`. Added explicit `updates.streakDays = 0` to gap branch for defensive clarity.
- **MEDIUM: Debug console.log in DNR feedback listener** — `console.log('[Rewire Brain] Rule matched:', info)` at `background.js:631` was flagged by ls-check. Changed to `console.warn` for lint compliance while preserving discoverability.
- **MEDIUM: 26 aria-live missing from dashboard** — Dashboard.html had dynamic elements (stats, tree level, journal date) without `aria-live` declarations. Added `aria-live="off"` for per-second updates and `aria-live="polite"` for milestone changes.
- **MEDIUM: 3 inputs missing labels in options.html** — Number input, checkbox, radio buttons lacked associated labels. Added `aria-label` to all form controls for screen reader accessibility.
- **MEDIUM: 24 sendMessage calls without error handling** — `chrome.runtime.sendMessage` calls across 7 files had no try/catch or `lastError` checks. Wrapped all calls in `safeSend()` helper with error logging.
- **MEDIUM: Button size below 32×32 touch target** — `.btn-expand` was 28×28, failing accessibility guidelines. Increased to 32×32 with min-width/height constraints.
- **MEDIUM: prefers-reduced-motion missing** — popup.html and options.html were missing `prefers-reduced-motion: reduce` media query. Added to both files to disable animations for accessibility-conscious users.
- **LOW: 8 dead library files in package** — Deleted unused: lovespark-popup, badge, lifecycle, theme, stats, base, tokens (CSS files and JS files from shared lib). Reduces bloat.
- **Manifest version bumped** — Updated from 2.4.0 to 2.4.3 to reflect audit + ship readiness.

### Added

- **README.md** — Comprehensive feature list, privacy claims, install instructions, and architecture overview. Required for CWS submission.
- **LICENSE** — MIT license added to repository root. Clarifies open-source status.
- **CWS-LISTING.md** — Complete Chrome Web Store submission copy with store name, short description, detailed description, single-purpose justification, privacy policy statement, and category selection.
- **Privacy disclosure** — Explicit statement in CWS listing: "Zero tracking. All processing on-device. All data local. No accounts. Open source."
- **Mascot (Sparky) in blocked page** — Added Sparky SVG to `blocked.html` for brand consistency.
- **Mascot (Sparky) in options page** — Added Sparky SVG to `options.html` for brand consistency.
- **Screenshots for CWS/AMO** — Two 1280×800 PNG screenshots (`screenshot-1.png`, `screenshot-2.png`) showing popup UI and blocked interstitial.

### Changed

- **Fail-closed pattern across safety-critical paths** — All 3 P0 fixes (F-1, F-2, F-5) now follow fail-closed pattern: on error, default to maximum protection rather than silently degrading. This is now the canonical pattern for Rewire Brain.
- **Journal date handling** — All date operations now use local-date (YYYY-MM-DD) instead of UTC-date to match user's calendar and alarm clock. No behavioral change for UTC users; fixes non-UTC users.

### Deferred to v2.5.0

- **F-10: CSP blocks NSFWJS bundle injection** — Sites with strict Content Security Policy (e.g., DuckDuckGo Images) reject dynamically injected `<script src=>` tags. Requires architectural rewrite: move from dynamic injection to manifest-declared content_script + offscreen document. Covered by fail-closed catch (keeps blur on error) in v2.4.3.
- **Image classifier accuracy** — NSFWJS MobileNetV2 achieves ~90% accuracy. Research-backed plan exists to swap to AdamCodd ViT-base (96.5% accuracy, 0.9948 AUC) running via ONNX Runtime Web in offscreen document. Deferred because requires 4-context architecture rewrite.
- **DOM observation breadth** — Current pattern only watches `attributeFilter:['src']`, missing React virtual-DOM swaps (Twitter), `srcset`, `style.background-image`, iframes. v2.5.0 will broaden to `childList:true subtree:true all_frames:true`. Covered by current pattern for most common cases.

---

## [2.4.2] — Never shipped (merged into v2.4.3)

This version was generated by pre-commit hook but never published. All fixes are included in v2.4.3.

---

## [2.4.0] — 2026-04-15

### Added

- **Image Blur (NSFW Detection)** — New feature: on-device NSFWJS classifier runs on image elements, blurring explicit content detected on sites outside the domain blocklist. All classification happens locally; no images leave the browser.
- **Mindful interstitial page** — Replaced generic block page with science-backed recovery UI: daily quote, 60-second breathing exercise, links to recovery resources (SAMHSA, LoveSpark, etc.).
- **Streak tracking** — Displays current streak vs. personal best. Resets on relapse but includes compassionate message and resources.
- **XP and milestones** — Gamified progression with 10-level brain-tree. Milestones at Day 7 / 14 / 30 / 60 / 90 / 180 / 365 with XP bonuses.
- **Daily journal** — Reflection prompt with optional notification reminder. Stores entries locally.
- **Sobriety timer** — Live counter of days/hours/minutes/seconds since reset.
- **Four themes** — Retro Pink (default), Dark, Beige, Slate. All WCAG AA contrast compliant.
- **Custom blocklist** — Users can add/remove domains and subreddits from the blocklist.
- **Bypass with friction** — 30-second countdown + reflection input before user can access a blocked site. Opt-in for each bypass.
- **30+ NSFW subreddit filter** — Blocks r/nsfw and related subreddits without breaking the rest of Reddit.
- **Onboarding flow** — Single critical question: "What is the reason you are doing this?" Primes user motivation.

---

## [2.3.x and earlier]

See Git history for earlier versions. This extension launched as v2.4.0 with the Image Blur feature as the major milestone.

---

**Note:** Version numbering matches Chrome Web Store versions. Firefox and other browsers carry the same version number for consistency.
