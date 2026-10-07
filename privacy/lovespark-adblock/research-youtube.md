# Research: YouTube ad blocking (goal: uninstall Adblock Plus)

**Verdict: NO. v1.1.0 does not block YouTube ads well enough to replace Adblock Plus.** Of 7 ad surfaces, it prevents 0 video ads (it only skips them after they start), partly hides 2 (feed/search/sidebar/masthead, overlays), and does nothing for 4 (Shorts, anti-adblock popup, m./music. page ads, embeds on other sites). Breakdown: 3 high, 6 medium, 6 low CONFIRMED gaps. `npm test` 12/12 tests mocks and says nothing about real ad blocking. Ad-exposure rate on live YouTube has not been measured (the harness in §5 measures it).

Branch `audit-improvements-2026-06-21`, manifest 1.1.0. Audit date 2026-10-06. This pass was read-only: only this file and `plan-youtube.md` were written.

---

## 1. Current state (what ships today)

| Layer | File | What it does |
|---|---|---|
| Network (DNR) | `rules-youtube.json` (6 block rules, always on in ads tier) | `get_midroll_info`, `get_video_info?*el=adunit`, `youtubei/v1/player/ad_break`, `api/stats/ads`, `ptracking`, `pagead/` |
| Cosmetic | `youtube-content.css` (13 selectors) | Hides desktop `ytd-*` ad renderers, `#masthead-ad`, `#player-ads`, `.ytp-ad-overlay-container`, `.ytp-ad-player-overlay`, gated on `html[data-lovespark-adblock="on"]` |
| Reactive skip | `youtube-logic.js` + `youtube-content.js` (ISOLATED world, `document_start`) | Waits for `.ad-showing`, then clicks Skip or seeks the ad to `duration` |

Playback safety is fine: no rule touches `googlevideo.com` or `/youtubei/v1/player`, and the smoke test confirms `videoplayback` matches no rule. The whitelist and on/off switch are consistent across DNR and the page layer.

## 2. Confirmed findings

### High

**[high] Video ads are never prevented, only skipped after they start** — `manifest.json` content_scripts (no `"world"` key); `youtube-logic.js:27-43`
Evidence: `return root.querySelector('.html5-video-player.ad-showing, #movie_player.ad-showing');` → `button.click()` / `video.currentTime = video.duration;`. A grep for `adPlacements|playerAds|adSlots|ytInitialPlayerResponse|JSON.parse|fetch` in `youtube-*.js` finds nothing. `tests/adblock.test.mjs:140` asserts that no rule touches `/youtubei/v1/player`. The ad schedule arrives inline in `ytInitialPlayerResponse` and in the `/youtubei/v1/player` JSON. DNR can block, redirect or change headers, but it cannot rewrite a response body, so the ad loads, flashes and plays audio, and only then gets skipped.
Fix: add a bundled MAIN-world `document_start` script that removes `adPlacements`, `playerAds`, `adSlots` and `adBreakHeartbeatParams` before the player reads them (plan step 2).

**[high] The skip check uses requestAnimationFrame, which Chrome pauses in background tabs** — `youtube-content.js:24-27`
Evidence: `if (scanFrame || !active) return; scanFrame = requestAnimationFrame(scan);`. Hidden tabs get no rAF callbacks, so `scanFrame` stays non-zero and every later `queueScan` returns early. Background-tab music listening, the main ABP-replacement use case, plays ads in full.
Fix: schedule with `setTimeout(scan, 0)` and coalesce with a boolean.

**[high] Nothing handles the anti-adblock popup** — `youtube-content.css:1-15`
Evidence: there is no selector for `ytd-enforcement-message-view-model`, `tp-yt-paper-dialog` or `tp-yt-iron-overlay-backdrop`, and nothing resumes playback after the popup pauses it. Whether the current skip-plus-telemetry-block combination triggers the popup is [unverified].
Fix: prune before playback so no skip happens, hide the popup and backdrop as a fallback, and call `video.play()` if the popup paused the video.

### Medium

**[medium] Shorts, m.youtube.com and music.youtube.com page ads are not in the CSS** — `youtube-content.css:1-13`. All 13 selectors are desktop `ytd-*`, ids or `ytp-*` classes, with no `ytm-*`, `ytmusic-*` or reel selector. Whether Shorts and Music players set `.ad-showing` is [unverified].

**[medium] Embedded players get no page layer** — `manifest.json` content_scripts. The youtube-nocookie matches exist, but there is no `"all_frames": true`, so `/embed/` iframes on third-party sites get no CSS and no skip.

**[medium] The skip fallback is fragile** — `youtube-logic.js:34,39-41`. `button.click()` from the ISOLATED world fires an untrusted event. The seek has no mute, no `playbackRate` change and no duration sanity check, so on a stitched (SSAI) stream `currentTime = duration` would jump to the end of the real video. Whether YouTube ignores untrusted clicks is [unverified].

**[medium] The MAIN world cannot read chrome.storage** (design constraint for the fix) — `youtube-content.js:54-59`. Settings come from an async `chrome.storage.local.get` in the ISOLATED world, and MAIN-world scripts have no extension APIs. The plan's answer is a DOM dataset flag; see Risk R4 for the trade-off.

**[medium] No fast fix channel (MV3 plus CWS policy)** — architecture. Every pruner fix needs a full CWS review. A remotely updated data-only key list is allowed by policy, but it would be a network request, which conflicts with LoveSpark's zero-transmission rule. Default: bundled data plus quick patch releases (owner decision, recorded in the plan).

**[medium] The smoke harness cannot load the extension on the only installed browser** — `scripts/chrome-smoke.mjs:11,266-273`. It uses `--load-extension`, which branded Chrome 137+ ignores. A local run failed with "LoveSpark service worker did not appear". A probe with `--remote-debugging-pipe --enable-unsafe-extension-debugging` plus CDP `Extensions.loadUnpacked` on Chrome 154.0.8037.98 returned an extension id and started the `background.js` service worker (probe: `<scratchpad>/1b412721-dc54-4183-91c2-b664440c2a03/scratchpad/pipe-probe.mjs`).

### Low

- **[low] 2-3 of the 6 DNR rules are dead or duplicates** — `rules-youtube.json` ids 1, 2 (and 3). `get_midroll_info` and `get_video_info` are endpoints retired around 2021. `pagead/`, `get_video_info` and `ad_break` already appear in `rules-easylist.json`, and `api/stats/ads` in `rules-easyprivacy-extra-19/-20`. Whether `ad_break` is still requested is [unverified].
- **[low] The YouTube check in the smoke test never measures ads** — `chrome-smoke.mjs:217,242,256,346`. The loop breaks on `!before.adShowing` (it waits until the ads finish). `ok` checks only `currentTime` progress. `adRequestCount` is never asserted, and the check runs only when `LOVESPARK_YOUTUBE_URL` is set.
- **[low] Hard-coded version** — `chrome-smoke.mjs:46,306`: `if (version === '1.1.0')` and `assert.equal(evidence.version, '1.1.0')`. These break on the 1.1.1 bump.
- **[low] The MutationObserver watches the whole document** — `youtube-content.js:37`: `{ childList: true, subtree: true, attributes: true, attributeFilter: ['class'] }`. Work is coalesced, so the cost is moderate.
- **[low] Lifecycle loose ends** — `youtube-content.js:30,33,62`. `start()` does not re-check `active`, the `readystatechange` listener is not removed in `stop()`, and `refresh()` in `onChanged` has no `.catch` (it throws "Extension context invalidated" after an update).
- **[low] Firefox MAIN-world support** — `manifest.json` gecko `strict_min_version: "113.0"`. MAIN-world `content_scripts` support in Firefox is believed to arrive around 128 [unverified exact version].

## 3. SOTA techniques (how working MV3 blockers do it)

1. **Strip ad fields from the player JSON in the page world before the player reads them.** This is what uBO and uBOL do, as declarative filters (behaviour only; we do not copy any code):
   - `set ytInitialPlayerResponse.adPlacements/playerAds/adSlots → undefined`
   - `json-prune` of `adPlacements playerAds adSlots` and the `playerResponse.*` variants on `JSON.parse`
   - `json-prune-fetch-response` / `json-prune-xhr-response` for `/player`, `get_watch` and `/playlist`
   - Shorts: drop reel entries where `command.reelWatchEndpoint.adClientParams.isAd` is true
   - Sources: https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/filters.txt , https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/quick-fixes.txt
2. **Chrome MV3 `content_scripts[].world: "MAIN"` (Chrome 111+)** shares the page's JS environment, which makes this possible with no remote code and no new permission. https://developer.chrome.com/docs/extensions/reference/manifest/content-scripts , https://developer.chrome.com/docs/extensions/mv3/content_scripts , https://chromium.googlesource.com/chromium/src/+/main/chrome/common/extensions/api/scripting.idl
3. **Cosmetic fallback for wrappers and the enforcement dialog**, e.g. `ytd-rich-item-renderer:has(ytd-ad-slot-renderer)` and `tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)`. https://userstyles.world/style/12481/remove-youtube-ad-block-message-see-notes
4. **Embed coverage** through all-frames injection. https://greasyfork.org/en/scripts/477725-youtube-iframe-adblocker
5. The landscape and the arms race: https://adguard.com/index.php/be/blog/adguard-browser-extension-mv3-release.html , https://adguard.com/en/blog/youtube-missing-comments-descriptions.html , https://bgr.com/tech/youtube-slowing-down-load-times-for-users-with-ad-blockers/ , https://www.superchargebrowser.com/library/best-youtube-ad-blockers-chrome-2026.md , https://addons.mozilla.org/sl/firefox/addon/adprune/

## 4. Risks

- **R1 Anti-adblock arms race.** YouTube changes field names and adds countermeasures (enforcement popup, slowdowns, and hidden comments/descriptions reported Feb 2026 [unverified]). With no fast channel, expect gaps of days between a YouTube change and our fix. Mitigation: a fixed key list in one data constant, a fixture test, a counter for how often the fallback fires, and quick patch releases.
- **R2 SSAI (ads stitched into the stream).** No client-side pruning can defeat it. YouTube is testing it on a small cohort (scale [unverified]): https://www.techradar.com/pro/youtubes-server-side-ad-insertion-complicates-ad-blocking-efforts , https://www.techradar.com/computing/software/youtube-could-soon-make-it-impossible-to-use-ad-blockers-on-its-videos-heres-how . Mitigation: keep the `.ad-showing` mute/fast-forward fallback with a duration guard, and set expectations in the README ("uBOL-level, not guaranteed").
- **R3 CWS policy.** Low risk. uBOL, AdGuard MV3 and Ghostery are listed and block YouTube ads, and the policy text does not mention YouTube: https://developer.chrome.com/docs/webstore/program-policies/policies . A MAIN-world entry needs no new permission. Copy must present this as part of the single "block ads" purpose and must not claim to "evade YouTube detection" or to be "Premium-equivalent". Informal Google scrutiny is [unverified].
- **R4 Whitelist race.** The dataset flag set by the ISOLATED script is only available after an async storage read, so the very first inline `ytInitialPlayerResponse` on a whitelisted or paused page may still be pruned. Accepted for v1.1.1, because the owner's goal is blocking. Dynamic `chrome.scripting.registerContentScripts` would fix the race but needs the `scripting` permission plus host_permissions; it is deferred.
- **R5 GPL licensing.** uBO, uBOL and uAssets are GPLv3 (mirror: https://github.com/socialvalue/uBlock). We write our own MIT `youtube-main.js` from the documented behaviour, without opening uBO scriptlet source, and add an "independent implementation" note to `ATTRIBUTION.md`. JSON field names are facts about YouTube's API and are not copyrightable. `ATTRIBUTION.md:10-21` already credits EasyList, EasyPrivacy and Fanboy.
- **R6 Breakage.** A bad prune could break playback. Mitigation: wrap every hook in try/catch and return the original value on any error, match URLs strictly, and assert the fixture output with deepEqual.

## 5. Verification strategy

1. **Offline unit tests (part of `npm test`).** A pure `youtube-prune.js` loaded with `vm.runInNewContext`, the same way `tests/adblock.test.mjs:156` loads `youtube-logic.js`, tested against hand-written synthetic fixtures (preroll, midroll+slots, noads, wrapped `[{playerResponse}]`, Shorts reel). Assert that ad keys are removed at the top level and under `.playerResponse`, that `streamingData`, `videoDetails` and `playabilityStatus` are untouched, that pruning is idempotent, that null, strings and frozen objects are safe, and that unrelated JSON passes through unchanged.
2. **Live A/B harness (`npm run test:youtube`, needs network, not part of `npm test`).**
   - Setup: pipe-transport CDP on the installed Chrome 154, `Extensions.loadUnpacked`, a fresh profile for each trial, and a non-headless UA override.
   - Arm A has no extension; arm B has the extension.
   - Measured per trial: `adShowingMs`, the ad fields before and after pruning, ad request counts, the enforcement wall and content progress.
   - URL qualification: keep only URLs where A shows ads in at least 2 of 3 runs.
   - **Pass bar to uninstall ABP:** block rate ≥95% over ≥10 URLs × 3 trials, 0 breakage, 0 enforcement walls, plus one background-tab trial.
3. **Manual owner check (5 minutes).** Turn ABP off, then try a watch page, Shorts, music.youtube.com in a background tab, and one embed.

## Debunked

- "`manifest.json` gecko strict_min_version is 109.0" — wrong. It is `113.0`; 109.0 is only the default that `build-zips.sh` applies when the key is missing. The real point still holds: 113 is below the MAIN-world minimum.
- "ATTRIBUTION.md may not credit EasyList" — resolved. `ATTRIBUTION.md:10-21` credits EasyList, EasyPrivacy and Fanboy (GPL-3.0 / CC BY-SA).
- Line-cite drift (not defects): smoke loop `chrome-smoke.mjs:192` (cited 217), version assert at `:306` (cited 286), launcher at `:266-273`.

## Uncertain [unverified]

- [unverified] Hiding only the inner `ytd-ad-slot-renderer` leaves blank grid tiles, and the current renderer names (`ytd-merch-shelf-renderer`, `ytd-statement-banner-renderer`, `ytd-companion-slot-renderer`, `ytd-player-legacy-desktop-watch-ads-renderer`, `engagement-panel-ads`) need checking on a live page.
- [unverified] Hiding `.ytp-ad-player-overlay` (`youtube-content.css:13`) also hides the manual Skip button on some layouts.
- [unverified] Whether the current skip-after-start behaviour triggers the enforcement popup.
- [unverified] Whether YouTube serves fewer ads to headless or cookieless clients (the A/B baseline arm controls for this).
- [unverified] Exact Firefox version that supports `content_scripts` `world: "MAIN"` (believed 128).
- [unverified] Current scale of the SSAI test, and whether `ad_break` is still requested.
