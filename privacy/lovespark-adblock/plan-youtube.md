# Plan: YouTube ad blocking good enough to drop Adblock Plus (v1.1.1)

Based on `research-youtube.md`. Simplest approach (D.O.T.S.): one small MIT script that runs in the page itself and removes the ad schedule before YouTube's player reads it. The existing skip code stays as a fallback, plus more CSS and a real measurement. **No new permissions.**

## Design (one screen)

```
document_start
 ├─ ISOLATED: youtube-content.js  → reads chrome.storage → sets html[data-lovespark-adblock="on|off"]
 └─ MAIN:     youtube-prune.js (pure: prunePlayerResponse, pruneReelEntries, AD_KEYS)
              youtube-main.js  (hooks: ytInitialPlayerResponse setter, JSON.parse,
                                 fetch + XHR for /youtubei/v1/(player|next|reel|get_watch))
              each hook: if dataset flag === 'off' → pass through; try{prune}catch{return original}
```

- Ad keys removed (one constant): `adPlacements`, `playerAds`, `adSlots`, `adBreakHeartbeatParams`, at the top level and under `playerResponse` and `[].playerResponse`.
- Shorts: drop entries where `command.reelWatchEndpoint.adClientParams.isAd` is true.
- A missing flag counts as "on", so blocking is the default. Race with the whitelist: see research R4; accepted for now.
- Both worlds get `all_frames: true` so YouTube embeds on other sites are covered.
- The MAIN world gets its state only from the DOM dataset flag. It never touches chrome.* and never transmits anything.

## Owner decisions (defaults chosen, change if you disagree)

- [ ] D1: No remote key list; fixes ship as patch releases. Default: **bundled only** (zero transmission).
- [ ] D2: The whitelist race (first load of a whitelisted YouTube page may still be pruned). Default: **accept**; `scripting` permission deferred.
- [ ] D3: Firefox `strict_min_version` → `128.0` [unverified exact version; confirm with amo-validate and the MDN compat table].

## TODO

### 0. Prep
- [ ] Open the atlas page for lovespark-adblock and commit or stash the current uncommitted v1.1.0 work on `audit-improvements-2026-06-21` first, so this change has a clean diff.
- [ ] Read `~/.claude/docs/memory/known-issues.md` (KI rules).

### 1. Pure pruner + unit tests (write the tests first)
- [ ] `tests/fixtures/yt-player-preroll.json`, `yt-player-midroll-slots.json`, `yt-player-noads.json`, `yt-next-wrapped.json`, `yt-reel-ad.json`: small synthetic fixtures, hand-written, with no real tokens or metadata.
- [ ] `youtube-prune.js`: our own MIT implementation. Exposes `AD_KEYS`, `prunePlayerResponse(obj) → removedKeys[]`, `pruneReelEntries(obj)` and `looksLikePlayerJson(obj)`. No DOM access, never throws.
- [ ] Tests in `tests/adblock.test.mjs` (loaded via `vm.runInNewContext`):
  - ad keys removed at the top level, under `.playerResponse` and under `[].playerResponse`
  - `streamingData`, `videoDetails` and `playabilityStatus` deep-equal to the input
  - idempotent; null, strings, arrays and frozen objects are safe
  - the noads fixture and unrelated `{"a":1}` come back unchanged
  - Shorts ad entries dropped, normal reels kept

### 2. MAIN-world hooks
- [ ] `youtube-main.js`:
  - setter trap on `window.ytInitialPlayerResponse` (and `ytInitialData` for reels)
  - `JSON.parse` wrapper that prunes only when `looksLikePlayerJson`
  - `fetch` wrapper for URLs matching `/\/youtubei\/v1\/(player|next|reel\/|get_watch)/`: clone, prune, rebuild the `Response`
  - XHR: override `response`/`responseText` for the same URLs
  - every hook: dataset flag check plus try/catch fallback to the original
- [ ] Test: the `JSON.parse` wrap in a vm context prunes a fixture string and leaves other JSON alone.

### 3. Manifest
- [ ] Add a second content_scripts entry: `{"matches": [same 4 YouTube patterns], "js": ["youtube-prune.js","youtube-main.js"], "run_at": "document_start", "world": "MAIN", "all_frames": true}`.
- [ ] Add `"all_frames": true` to the existing ISOLATED entry.
- [ ] Gecko `strict_min_version` → `128.0` (D3).
- [ ] Confirm no permission or host_permissions change (`git diff manifest.json`).

### 4. Fallback skip fixes (`youtube-content.js` / `youtube-logic.js`)
- [ ] Replace rAF with `setTimeout(scan, 0)` and a boolean coalescing flag, so it works in background tabs.
- [ ] On `.ad-showing`: mute and set `playbackRate=16`, then click or seek. Seek only if `duration < 180` **and** `.ytp-ad-module` is present (SSAI guard). Restore the user's prior mute and rate when the ad clears.
- [ ] Narrow the MutationObserver to `#movie_player` class changes, re-attached on `yt-navigate-finish`.
- [ ] `start()`: return early if `!active`. Remove the `readystatechange` listener in `stop()`. Add `.catch(() => {})` to `refresh()` in the onChanged handler.
- [ ] Tests: background-safe scheduling (no rAF), no seek when duration ≥180s, mute is restored.

### 5. Cosmetic CSS (`youtube-content.css`, keep the `html[data-lovespark-adblock="on"]` guard)
- [ ] Wrappers:
  - `ytd-rich-item-renderer:has(ytd-ad-slot-renderer)`
  - `ytd-rich-section-renderer:has(ytd-statement-banner-renderer)`
  - `ytd-search-pyv-renderer`
- [ ] Missing desktop renderers:
  - `ytd-merch-shelf-renderer`
  - `ytd-companion-slot-renderer`
  - `ytd-player-legacy-desktop-watch-ads-renderer`
  - `ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]`
  - `ytd-ads-engagement-panel-content-renderer`
  - `ytd-statement-banner-renderer`
- [ ] Enforcement popup: `tp-yt-paper-dialog:has(ytd-enforcement-message-view-model)`, `ytd-enforcement-message-view-model`, `tp-yt-iron-overlay-backdrop` (the backdrop only while the dialog is present, if `:has` on `body` allows it). JS: if the popup is found, call `video.play()` and count a "wall" event.
- [ ] Shorts: `ytd-reel-video-renderer:has(ytd-ad-slot-renderer)`, `ytd-reel-video-renderer:has(.ytd-ad-slot-renderer)`.
- [ ] Mobile: `ytm-promoted-sparkles-web-renderer`, `ad-slot-renderer`, `ytm-companion-ad-renderer`.
- [ ] Music: `ytmusic-mealbar-promo-renderer`, `ytmusic-statement-banner-renderer`.
- [ ] Change `.ytp-ad-player-overlay` to `.ytp-ad-player-overlay:not(:has(.ytp-skip-ad-button, .ytp-ad-skip-button-modern))`, so the manual Skip button stays visible.
- [ ] Selector test: parse the CSS and assert every rule is guarded and that the key selectors are present.

### 6. DNR cleanup (`rules-youtube.json`)
- [ ] Delete id 1 (`get_midroll_info`) and id 2 (`get_video_info?*el=adunit`); both endpoints are dead.
- [ ] Keep ids 3-6. Update test `:140` and any rule-count assertions.
- [ ] Update the README "YouTube behavior and limits": network rules cannot remove inline ads; the page-world pruner does; SSAI cannot be blocked; aim is uBOL-level blocking with no guarantee.

### 7. Live verification harness
- [ ] `scripts/chrome-smoke.mjs`: switch to pipe transport (`--remote-debugging-pipe --enable-unsafe-extension-debugging`, CDP `Extensions.loadUnpacked`, flat sessions). Read the expected version from manifest.json instead of hard-coding `'1.1.0'` (lines 46 and 306).
- [ ] `scripts/youtube-ab.mjs` plus `"test:youtube"` in package.json, as specified in research §5.2:
  - arms A (no extension) and B (extension), fresh profiles, non-headless UA
  - metrics: `adShowingMs`, ad fields before and after pruning, wall, progress
  - one background-tab trial
- [ ] `tests/fixtures/yt-candidate-urls.txt`: about 15 popular monetized watch URLs, qualified by arm A.
- [ ] Run it. Pass bar: ≥95% block rate, 0 breakage, 0 walls over ≥10 URLs × 3 trials. Save the JSON to `work/yt-ab-<date>.json`.

### 8. Ship
- [ ] `manifest.json` version → `1.1.1`.
- [ ] `BUGS_AND_ITERATIONS.md`: ITER entry for the MAIN-world pruner and BUG entries (rAF in background tabs, no embeds, no enforcement handling, dead rules, smoke harness on Chrome 137+), each with date, problem, root cause and fix. Include the A/B numbers.
- [ ] `ATTRIBUTION.md`: "youtube-main.js / youtube-prune.js are an independent MIT implementation; no uBO/uBOL code used."
- [ ] `CWS-LISTING.md` / `PRIVACY.md`: describe YouTube ad removal as part of the single ad-blocking purpose, say that the page-world script stays local, and add no "evade detection" wording. The permission list is unchanged.
- [ ] `npm test` all green (cite the count), then `ls-check .`.
- [ ] `"~/Claude x LoveSpark/scripts/build-zips.sh"` → chrome and firefox zips. The firefox zip must pass `amo-validate.py` (with `world: MAIN` and min version 128).
- [ ] Commit on the branch (no Co-Authored-By) and push.
- [ ] Owner check: disable ABP, then try watch, Shorts, Music in a background tab and one embed. Uninstall ABP if all are clean.

**do not implement yet**
