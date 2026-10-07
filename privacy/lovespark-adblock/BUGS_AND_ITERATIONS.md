# Bugs & Iterations

## 2026-10-07: YouTube video ads actually blocked — v1.1.1

**Problem:** Owner wanted to uninstall Adblock Plus. A live A/B run (real Chrome 154, fresh profiles,
`scripts/youtube-ab.mjs`) showed v1.1.0 still let video ads play on **7 of 8** popular videos
(~10 s of ad each) before its skip fallback kicked in.

### ITER-008 (P0): page-world ad-schedule remover (`youtube-main.js`)
**Root cause:** YouTube delivers the ad schedule *inside* the player data (`ytInitialPlayerResponse` and
`/youtubei/v1/player` / `/next` responses: `adPlacements`, `playerAds`, `adSlots`). Network rules can't
touch that, and the isolated-world content script can't see page JS, so ads always loaded.
**Fix:** New MAIN-world `document_start` script (own MIT code, no uBO/ABP code) that removes those keys
via a `ytInitialPlayerResponse`/`ytInitialData` setter, `JSON.parse` and `Response.json()` wrappers
(Proxy, so natives keep their `toString`), a `Map.set` hook that blanks `AD_PLACEMENT_KIND_*`, and drops
Shorts entries flagged `isAd`. Technique cross-checked against the user's installed Adblock Plus 4.46
"ABP filters (compliance)" list, which uses the same four ideas on www.youtube.com. Respects on/off +
allowlist through the `html[data-lovespark-adblock]` flag (missing = on). No new permissions.
**Result:** Live A/B, Chrome 154, 12 popular videos, 25 s each, consent rejected (`work/yt-ab-2026-10-07T01-37-44-961Z.json`):
without extension 10/12 showed ads; **with v1.1.1 0/12 ads, 12/12 played (8.8–24.8 s), 0 stalls, 0 anti-adblock
walls → block rate 10/10 = 100%.** Earlier runs: 20/20 qualified blocked over 2 trials; background-tab run
0/6 ads, 6/6 played. Before (v1.1.0): ads on 7/8.

### BUG-009 (P1): skip fallback dead in background tabs
`youtube-content.js` scheduled scans with `requestAnimationFrame`, which never fires in hidden tabs, so
background music tabs played ads in full. Now `setTimeout(scan, 0)` + a `play` listener; also matches
YouTube's newer `ad-interrupting` class.

### BUG-010 (P2): no embed coverage, no anti-adblock popup handling, thin cosmetic list
Both content scripts now `all_frames: true` (YouTube embeds on other sites). CSS adds the enforcement
popup, feed/search/watch wrappers, Shorts, m.youtube.com and Music placements — all still gated on the flag.

### BUG-011 (P3): dead DNR rules + stale smoke harness
Dropped `get_midroll_info` and `get_video_info?el=adunit` (endpoints retired). `chrome-smoke.mjs` read a
hard-coded `'1.1.0'`; it now reads `manifest.json`. Live harness gotcha: fresh EU profiles get a cookie
consent lightbox that blocks autoplay in *both* arms — the harness now rejects it before measuring.

**Tests:** `npm test` 12 → 16 (pruner keys/nesting/Shorts/odd inputs, hooks on vs off flag, CSS gating).

## 2026-09-10: YouTube + maintained network coverage — v1.1.0

**Root cause:** v1.0.41 shipped only 124 ad-domain rules and had no YouTube content layer. The
existing generator accepted only hostname-only filters, discarded path rules and cosmetic rules,
and emitted new ruleset IDs that `background.js` did not enable. YouTube ads therefore had no
targeted handling, while the broader blocker covered only a small curated host sample.

**Fix:** Bundled all 111,419 safely convertible network rules from current EasyList, EasyPrivacy,
and Fanboy subscriptions, with source hashes/counts in `rules-metadata.json`. A 29,500-rule core is
always available; 34 disabled supplemental chunks are enabled only within the browser-reported static
capacity and enabled-ruleset limit. Rewrote the conservative DNR
converter to retain compatible path, resource-type, party, domain, and exception filters; and wired
all generated rulesets into every enable/intensity path. Added a YouTube-only content layer that
hides known sponsored renderers and, only while YouTube marks the player `ad-showing`, clicks Skip
or seeks that ad to its end. Ordinary Googlevideo media is deliberately not blocked. Global disable
and site allowlisting turn the page layer off as well as the DNR rules. Raised Firefox's minimum to
113, where MV3 DNR is available.

**Evidence (2026-09-10):** `npm test` (12/12), JS/JSON parse checks, package integrity checks, and the
Firefox AMO validator passed. The packaged Chrome ZIP loaded in official Chrome for Testing 153.0.8010.36
with an isolated temporary profile. Chrome accepted all 41 static rulesets and reported 300,494 additional
static-rule capacity. Medium enabled the ads/tracking supplements; Strong also enabled all annoyance
supplements, with 41 total rulesets (below Chrome's 50-enabled ceiling). Browser `testMatchOutcome`
matched the YouTube ad endpoint, YouTube ad telemetry, a general ad, and a general tracker while leaving
an ordinary script and a representative `googlevideo.com/videoplayback` request unmatched.

The same run exercised real HTTP requests between mapped `.test` origins: the ordinary script loaded,
the ad-shaped script was stopped before the fixture server received it, allowlisting made both load, and
global disable made both load. The exact Kyoto YouTube watch page loaded and the YouTube content layer
activated; ad-service requests were observed as blocked and Googlevideo requests were not DNR-blocked.
Playback progress is **not** claimed: the disposable browser's media requests failed with DNS/HTTP 403,
and a control with LoveSpark fully disabled also failed to play. No served in-player ad was observed, so
account/region-specific live-ad blocking remains a manual validation item rather than a universal pass.

**Deliberate residual gap:** this remains below Adblock Plus-style general cosmetic/scriptlet and live
subscription-update coverage. Adding those capabilities would require broad all-sites page access and a
maintained scriptlet/update engine, a materially larger permission/security surface not silently added in
this release.

**Files:** `background.js`, `manifest.json`, `rules-*.json`, `rules-metadata.json`,
`youtube-content.{js,css}`, `youtube-logic.js`, `scripts/build-rules.mjs`, tests/docs
**Version:** 1.1.0

## 2026-06-28: Dynamic audit + SEO rename → v1.0.40

Dynamic multi-agent audit (3 disjoint code auditors + SEO/naming agent → skeptic verification;
16 findings confirmed, 3 debunked, 2 left uncertain). Renamed for the store and shipped the
confirmed fixes.

**SEO / trademark rename:** "LoveSpark AdBlock" → **"Pink Ad Blocker — Block Ads & Trackers"**
(38/45 chars). Root reason: "AdBlock"/"Adblock Plus" are registered trademarks (getadblock.com,
eyeo) and CWS penalizes their use under its IP/impersonation policy. The new name uses the generic
two-word "Ad Blocker", leads with the highest-intent keyword, and keeps "Trackers" (the default-on
feature). Updated `extName` + SEO `extDescription` across all 55 locales, `action.default_title`,
popup/settings titles + in-UI logos, and the public README. Added CWS-LISTING.md, PRIVACY.md,
SUBMIT.md (rule #14 package).

**Confirmed fixes (16):**
- **[HIGH] Daily reset never ran on SW cold-start / GET_STATS** — "Blocked Today" could accumulate
  onto a stale prior-day count. Added `await checkDailyReset()` to onInstalled, onStartup, and the
  GET_STATS handler before polling. (background.js)
- **[HIGH] Firefox init abort** — `declarativeNetRequest.setExtensionActionOptions` is Chromium-only
  and threw synchronously in onInstalled/onStartup, aborting blocking + whitelist setup on Firefox.
  Extracted a guarded, feature-detected `enableBadgeCount()` helper used at both lifecycle sites.
  (background.js)
- **[MEDIUM] Frozen "0" stats on Firefox** — no `getMatchedRules` there. GET_STATS now returns a
  `statsSupported` flag and the popup shows "—" with an explanatory title instead of a frozen 0.
- **[LOW] Dev-only double-count window** — persist `_statsMode:'debug'` so a SW restart can't reopen
  a poll-vs-debug overlap. (background.js)
- **[HIGH] WCAG AA contrast** — popup status text, cute message, and stat numbers/labels failed AA
  on the retro/beige light glass; moved to the theme's primary text token, restoring the pink accent
  only on the dark themes where it passes. (popup.css)
- **[HIGH] settings.html never loaded lovespark-base.css** — lost the 32px touch-target floor for all
  controls. Added the link.
- **[HIGH] Intensity radios had no visible keyboard focus** (0×0 inputs) — added a
  `:focus-visible + .opt-card` ring. (settings.css)
- **[MEDIUM] Header logo contrast** — beige/slate header band is a mid-tone where neither white nor
  dark text clears AA; gave those themes an explicitly darker header with white logo text. (popup.css)
- **[MEDIUM] Toggles announced as "checkbox"** — added `role="switch"` + synced `aria-checked` in
  popup + settings (HTML + JS).
- **[MEDIUM] Whitelist button state not exposed** — added `aria-pressed` + a stateful `aria-label`.
- **[LOW] Decorative star ::before painted over content** — `z-index: 0` → `-1` (popup + settings).
- **[LOW] Whitelist remove "✕" below 32px touch target** — added min size + flex centering.
- **[LOW] Double live-region announcement** — removed redundant `aria-live`/`role=status` from the
  two stat counters (the shield status already announces).
- Also cleared low-opacity text (footer brand + logo sub) flagged by A11Y-KI004.

**Notes / deferred:**
- Finding #11 (remove the unused `lovespark-theme.js` include) was **reverted** — the lib doesn't
  self-init (no runtime conflict) and the project's `ls-check` BRAND-LIB-WIRED gate requires it
  wired. Kept the include.
- The installed `ls-check` binary is a **stale pip copy** missing the LS-1 fix (treat `activeTab` as
  satisfying an active-tab `tabs.query`); it false-flagged PERM-MISSING `tabs`. The canonical
  `scripts/ls-check.py` passes clean (37 pass, 0 fail). Did NOT add the broader `tabs` permission —
  `activeTab` is correct for a privacy-first extension.
- Deferred (separate concerns): `gecko.strict_min_version` is `109.0` but `declarativeNetRequest`
  needs Firefox 113+ (core blocking won't work on FF 109–112 — flagged for a follow-up bump);
  SVG-pack cursor… N/A; concurrent SET_INTENSITY serialization (uncertain, no confirmed wrong state);
  store screenshots still to be generated via `marketing-asset-generator.py`.

**Files:** background.js, popup.html, popup.js, popup.css, settings.html, settings.js, settings.css,
manifest.json, _locales/*/messages.json (55), README.md, CWS-LISTING.md, PRIVACY.md, SUBMIT.md
**Version:** 1.0.41

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css,settings.css
**Commit:** 07dfe7d

## : |2026-03-10|||fix: counter stuck at 0 in packed extensions (CWS Red Potassium)

**Problem:** |2026-03-10|||fix: counter stuck at 0 in packed extensions (CWS Red Potassium)
**Details:** Root cause: pollMatchedRules() read result.matchedRules but the Chrome
API returns result.rulesMatchedInfo. Property was always undefined, so
writeStats() was never called. Invisible in dev because onRuleMatchedDebug
bypasses polling in unpacked mode.
**Files:** background.js,lib/lovespark-base.css,lib/lovespark-footer.css,manifest.json,settings.js
**Commit:** 97961ec

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** b5e959a

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css,settings.css
**Commit:** f429679

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits


## 2026-06-21: Audit & improvement pass (v1.0.39) — popup crash, stats, permissions, blocklist pipeline

Full adversarial audit (research.md / plan.md). 42 verified findings fixed across P0–P3.

### BUG-001 (P0, CRITICAL): popup never initialized — shipped crash
**Problem:** The popup loaded but counters never populated, live updates were dead, and the footer was missing in v1.0.38.
**Root cause:** `popup.js` referenced `getElementById('settings-btn')` and called `.addEventListener` on it (line 181), but `popup.html` only has `board-btn` — so `settingsBtn` was `null` and the call threw a `TypeError` at module top level, aborting the rest of the script (`storage.onChanged` listener, `init()`, footer render). Likely co-caused the historical "counter stuck at 0" symptom.
**Fix:** Removed the dead `settingsBtn` ref + listener (`board-btn` already opens options). Hardened `sendMsg` with try/catch.

### ITER-002 (P1): stats accuracy — idempotent poll cursor + coalescing
**Problem:** `pollMatchedRules` advanced `_lastPollTs` to `Date.now()` AFTER the await (dropping matches in the read→write gap) and `GET_STATS` re-polled with no in-flight guard (racing the 1-min alarm → double counting).
**Fix:** Count only matches with `timeStamp > cursor`, advance the cursor to the max matched timestamp (idempotent), coalesce concurrent polls via an in-flight promise, reset `_lastPollTs` on `RESET_STATS`. Documented the counter as a best-effort lower bound (retention-window limit); the badge is authoritative.

### ITER-003 (P1): local daily reset
`todayStr()` used `toISOString()` (UTC) so "today" rolled over at UTC midnight. Now computes the local calendar date.

### ITER-004 (P1): whitelist correctness + validation
**Problem:** Domains were written to storage before the DNR sync and passed unvalidated to `updateDynamicRules` (one bad entry rejected the whole batch, silently). The `allow` rule keyed on `initiatorDomains` also missed 3rd-party iframe requests on a whitelisted page.
**Fix:** Validate/normalize domains (regex), sync-then-persist so storage matches applied rules and errors surface to the UI, and switch to `allowAllRequests` on `requestDomains` (main_frame/sub_frame) for a true per-site exemption. `MV3-DEBUG-GUARD` resolved (try/catch instead of an `if` guard).

### ITER-005 (P1): permission minimization
Dropped `host_permissions: ["<all_urls>"]` (unnecessary for block-only DNR) and added `activeTab` so the popup can still read the current tab's domain. Made the source manifest AMO-clean: `gecko.data_collection_permissions.required: ["none"]` (AMO-001) and a `background.scripts` Firefox fallback (AMO-002). Patched `ls-check` PERM-MISSING so `activeTab`/host perms satisfy `chrome.tabs.*` (was steering extensions toward the broad `tabs` perm).

### ITER-006 (P3): accessibility & polish
Wired `lovespark-base.css` (focus indicators + touch targets) into popup.html; added `role="dialog"`/`aria-labelledby`/`aria-describedby`, `aria-expanded` toggling on the theme dropdown, `aria-label`s on emoji/icon buttons and intensity radios, moved `aria-live` onto the live counters, added the Sparky mascot to settings.html (rule #3), fixed paused-status + whitelist-active contrast, rendered the real version in the settings footer (was hardcoded v1.0.0), pointed dead suite links at lovespark.love, removed dead `escHtml`. Added `README.md` + `LICENSE` (MIT).

### ITER-007 (P2): blocklist — expansion + build pipeline
Added confirmed-missing high-value hosts (GPT loaders `googletagservices.com`/`securepubads.g.doubleclick.net`, `criteo.net`, `teads.tv`; trackers TikTok/AdRoll/DoubleVerify/IAS/Tealium/Adobe DTM/Permutive/Lotame/Pardot/Marketo/Bizible). Added a DEV-ONLY build-time pipeline (`scripts/build-rules.mjs` + `package.json`, `@ghostery/adblocker` MPL devDependency, `ATTRIBUTION.md`) that compiles EasyList/EasyPrivacy/AdGuard into bundled static DNR rulesets split under the 30k cap — no runtime fetch, no remote code, MIT-clean (build tool never shipped via `.zipignore`). Conversion verified by unit test; run `npm run build:rules` locally + device-verify before regenerating the full blocklist.
