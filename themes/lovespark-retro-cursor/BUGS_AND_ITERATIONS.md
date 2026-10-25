# Bugs & Iterations

## 2026-10-25: Bubblegum + Seoul Y2K popup themes, two pink-text contrast fixes

**Request:** Joona: "add korean and bubble gum theme for the cursor extension" (screenshot of the Change Theme menu).
**Change:** Added `bubblegum` and `seoul` ("Seoul Y2K 서울") to the popup's own theme list (`popup.js` THEMES/THEME_NAMES), the menu (`popup.html`) and token blocks in `popup.css`. Values match notes-app v1.1.0's Bubblegum and Seoul Y2K (same day), which took its Seoul palette from this extension's Y2K Korean packs. The shared `lib/lovespark-theme.js` / `lovespark-tokens.css` are untouched (the popup keeps its own list; the lib theme script is loaded but not called). Default stays Retro Pink.
**Bugs found while verifying (measured in the served popup, every visible text node, worst gradient stop):**
- `.sub-chevron` used `--ls-pink-accent` as 10px text: retro 2.42, beige 2.50, bubblegum 2.26, seoul 2.67:1. Now `--ls-text-muted`.
- `.theme-option.active` used `--ls-pink-accent` as 13px text: retro 3.31, bubblegum 3.05, seoul 2.87:1. Now `--ls-text-dark` bold; the colour dot marks the theme.
- Root cause for both: pink accent used as small text, which the design system forbids ("Never pink as small text").
**Not fixed (pre-existing, out of this change):** retro footer credit/suite link 3.24:1 (shared footer CSS), beige preview button and pack check 3.70:1. `ls-audit-contrast` only knows retro/dark/beige/slate, so the new themes were measured in the browser instead.
**Verification:** `ls-check . --strict` 38/0/0; popup served on localhost, both themes chosen through the real menu (label and trigger aria-label update); no horizontal overflow at 320px.
**Files:** popup.css, popup.html, popup.js, manifest.json, CHANGELOG.md
**Version:** 1.1.40

## 2026-06-28: BUG — selected cursor only applied after a page refresh

**Problem:** Picking a different cursor in the popup did nothing on already-open tabs until the page was reloaded.
**Root cause:** `content_script.js` registers a `chrome.storage.onChanged` listener as the *only* live-apply mechanism, but it early-returned unless `areaName === "sync"`. Every settings write goes to `chrome.storage.local` (background + popup), so `onChanged` always fired with `areaName === "local"` → the guard short-circuited and `applyCursorStyle` never ran. The cursor only changed on reload, when `loadAndApplyState()` re-reads `storage.local` at `document_start`. The `"sync"` value was a leftover from an earlier storage.local migration (commit 4c7c935) that flipped the read/write paths but missed the listener's area guard. Verified by a 3-auditor + skeptic adversarial audit (4 of 4 agents converged on this root cause).
**Fix:** Changed the live-apply guard to `areaName !== "local"`. While in the same data path, also: (1) popup now writes straight to `chrome.storage.local` and the dead popup→background `lovespark:set-settings` message hop was removed (background.js relay deleted) — fewer moving parts, more direct live-apply; (2) `getCurrentPack()` now reads a tracked `currentPack` variable instead of the `.selected` DOM class, closing a race where a fast ON/OFF toggle before `loadState()` finished clobbered the saved pack with the default.
**Files:** content_script.js, popup.js, background.js
**Version:** 1.1.35
**Follow-ups (not in this fix):** cursor doesn't apply inside iframes (content script has no `all_frames: true`); SVG packs define only 4 cursor rules vs the PNG packs' 8 (no grab/grabbing/crosshair/not-allowed). Also: `ls-check`'s storage check greps `storage.sync` substrings and missed an `onChanged` area guard mismatching the written area — propose an `MV3-STORAGE-AREA-MATCH` static check.

## 2026-06-28: SEO — prepend "Aesthetic" to the store title

**Problem:** The store title "Pink Retro Cursor Pack by LoveSpark" missed "aesthetic" — a high-intent discovery keyword for this niche (users search "aesthetic cursor", "aesthetic pink cursor") and a natural lead word that still reads as a brand descriptor.
**Root cause:** Title captured the color keyword ("pink") but not the broader aesthetic-search intent.
**Fix:** Renamed to "Aesthetic Pink Retro Cursor Pack by LoveSpark" (45 chars, exactly at the 45-char CWS limit) — keyword-led, brand retained at the tail. Updated `extName` across all 55 locale `messages.json` files, `action.default_title` in manifest.json, and the popup tab `<title>`. Popup `<h1>` left at the concise "Pink Retro Cursor Pack" — the header flex row (mascot + heading + theme dropdown) has no room for a longer string without overflow, and the brand is already shown via the Sparky mascot.
**Files:** _locales/*/messages.json (55), manifest.json, popup.html
**Version:** 1.1.34

## 2026-06-21: SEO — lead the store title with "Pink"

**Problem:** The Chrome Web Store / AMO listing title was "LoveSpark Retro Cursor Pack" — the high-intent search keyword "pink" (the pack's defining trait) was absent, and the brand led the title where the store weights leading keywords most.
**Root cause:** Title optimized for brand-first naming convention rather than search discoverability.
**Fix:** Renamed to "Pink Retro Cursor Pack by LoveSpark" (35 chars, under the 45-char CWS limit) — keyword leads, brand retained at the tail. Updated `extName` across all 55 locale `messages.json` files and `action.default_title` in manifest.json; popup tab title matches the store name, popup `<h1>` set to the concise "Pink Retro Cursor Pack" (brand already shown via the Sparky mascot).
**Files:** _locales/*/messages.json (55), manifest.json, popup.html
**Version:** 1.1.33

## 2026-05-05: Y2K Korean Collection — replaced New Collection with dual-variant lineup

**Problem:** The 7 SVG packs in "New Collection" (Moonlight Rose, Candy Floss, Cyber Cherry, Mint Blossom, Golden Hour, Holographic, Obsidian Heart) drifted from the Pink Y2K Korean kawaii brand — palette went mint/orange/red, and the flat-icon style felt disconnected from cursor functionality.
**Root cause:** Initial New Collection optimized for procedural-generation variety in `gen_cursors.py` rather than brand consistency. Aesthetic divergence wasn't caught before ship because there was no brand audit gate.
**Fix:** Removed all 7 New Collection packs. Added 9 Y2K Korean themed packs in two design subcategories — Emoji (symmetric kawaii icon as the cursor) and Pointer (traditional asymmetric arrow with theme decoration) — for 18 new pack registrations. Final lineup: 21 packs (3 OG + 18 Y2K Korean). Pack IDs follow `{name}-emoji` / `{name}-pointer` convention. Storage migration in popup.js falls stale pack IDs back to retro-pink.
**Files:** manifest.json, gen_cursors.py, content_script.js, popup.html, popup.js, popup.css, README.md, CHANGELOG.md
**Version:** 1.1.32

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 1001acd

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** 3daec09

## : |2026-02-23|||Fix excessive permissions — strip to storage-only for CWS resubmission

**Problem:** |2026-02-23|||Fix excessive permissions — strip to storage-only for CWS resubmission
**Details:** Remove scripting, tabs, and host_permissions. Static content_scripts
handles injection; chrome.storage.onChanged handles settings propagation.
Delete redundant ensureScriptAndBroadcast() and onMessage listener.
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
**Files:** background.js,content_script.js,manifest.json
**Commit:** a5daacf

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json
**Commit:** b958a4d

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

## 2026-07-08: ITER — "Alive" update: butterfly-style animated companions on all Y2K packs (v1.1.36)

**Problem:** Only cyber-butterfly felt alive — its arrow cursor carries 2 SMIL wing-flap butterflies that visibly animate while the mouse moves (Chrome re-rasterizes SVG cursors on move). The other 8 Y2K packs had static or single-twinkle decorations; hands were lifeless in all 9 packs.
**Root cause:** Packs were designed before the butterfly recipe (2-3 staggered parametrized companions, `additive="sum"` nesting, rest-pose-first keyframes) existed; no shared animation builders in `gen_cursors.py`.
**Fix:** Added generic `anim_translate/scale/rotate/opacity` SMIL builders + `extra=` param on `hand()/hand_grad()`; each pack got pack-prefixed companion helpers (`_bun_bunny`, `_dot_sparkle`, `_coq_pearl`, `_str_berry`, `_prl_mini`, `_bob_pearl`, `_chm_star`, `_loc_heart`, …) wired into arrow default, hand, and emoji default cursors (25 SVGs changed; I-beam/wait and OG PNG packs untouched per owner decision). Built via 9-agent parallel design workflow (each agent self-tested XML validity, <4KB size, rest-pose loop closure) + 3-skeptic adversarial verify.
**Verify findings fixed:** cyworld-dotti sparkles were pure white → invisible on light pages; added #5A2A4A outline. Note: cyworld-dotti's old translate(20 4) 1.7s sparkle was deliberately superseded (not lost) by the new twinkle+pop set. ls-check: 34 pass / 0 fail / 1 pre-existing A11Y-LIVE warning (popup.js, untouched by this change).
**Files:** gen_cursors.py, cursors/*/{default,pointer}.svg (25), manifest.json, CHANGELOG.md

---

## 2026-07-09: Remove duplicate lovespark-tokens.css load from `popup.html` (fleet 2026-03-28 regression)

**Problem:** `popup.html` carried a direct `<link>` to `lovespark-tokens.css` even though
`lovespark-base.css` (loaded by the same page) already `@import`s it — the token sheet loaded
twice (fleet 2026-03-28 injection regression; `guard-fleet-sync.sh` Gate 4 blocks fleet
shared-lib syncs while any such reference exists).

**Fix:** Removed the redundant `<link>` (one-line deletion, no other markup touched); refreshed
`lib/lovespark-tokens.css` to the canonical deterministic-header build (values byte-identical to
the 80/80-audited canonical; shared-lib ITER-003 / lovespark-shared-lib@7690133); bumped the
manifest patch version.

**Also in this commit (required to pass the pre-commit ls-check gate — main fails it independently of the tokens cleanup):** KI-039 MV3-STORAGE-AREA-MATCH in `content_script.js` — `storage.onChanged` guarded on `areaName !== "sync"` while every write targets `chrome.storage.local`, so live cursor updates never fired from the listener. Flipped the guard to `"local"` (same fix as lovespark-youtube-ad-comfort-mode f642bc1). The two fixes are bundled because the gate deadlocks a split: a tokens-only commit trips KI-039, a KI-039-only commit trips BRAND-LIB-SYNC's stale tokens.css.

**Verification:** zero `lovespark-tokens.css` references remain in this extension's HTML;
`lib/lovespark-base.css` confirmed to `@import url('lovespark-tokens.css')`, so the removal is
cascade-neutral — zero visual change. Fleet guard Gate 4 green on the live tree 2026-07-09;
pre-commit ls-check green at this commit.

**Follow-up (2026-10-07, PR #1 verification):** `ls-check .` flagged QUAL-CHANGELOG-DRIFT (CHANGELOG latest 1.1.32 vs manifest 1.1.33). Added the `[1.1.33]` CHANGELOG entry. Check: `ls-check . --strict` → 0 fail, 0 warn.

**Monorepo merge note (2026-10-08):** this branch's fixes (KI-039 guard flip, duplicate tokens `<link>` removal, canonical tokens.css refresh) were also delivered independently on the main line — the guard flip in v1.1.35 (03bb2cc) and the tokens/popup cleanup in the pre-import snapshot (30e7909, on top of v1.1.37). The `1.1.33` label here collides with the main line's 1.1.33 ("Pink" store-title SEO); manifest stays at 1.1.37.

---

## 2026-10-13: BUG — "It does not show the cursor" (user bug report via popup Report-a-Bug email) (v1.1.38)

**Problem:** User emailed "It does not show the curser". Joona reproduced the shape of it: the cursor only changes on some websites and never on the New Tab page or plain Chrome surfaces.
**Root cause (two parts):**
1. Browser limitation, not a code bug: Chrome refuses to run content scripts on `chrome://newtab` / `chrome://new-tab-page`, any `chrome://` page, the Chrome Web Store, the PDF viewer and other extensions' pages. The extension works purely by injecting CSS via a content script, so those surfaces can never be themed. Nothing in the UI said so, so users read it as broken.
2. Real gap: manifest `content_scripts` only run in pages loaded *after* install. Every tab already open when the user installed stayed on the system cursor until manually reloaded — the most likely reason a fresh install "does not show the cursor". Also no `all_frames`/`match_about_blank`, so iframes (embedded players, comment widgets) showed the system cursor on otherwise-themed sites.
**Fix:** `background.js` injects `content_script.js` into all open `http(s)`/`file` tabs on `onInstalled` (install + update) via `chrome.scripting.executeScript`. Manifest gains `scripting` (no `tabs` — `tabs.query` works without it, and executeScript's rejection already filters unscriptable pages), `all_frames: true`, `match_about_blank: true`. Popup gets a browser-neutral coverage note and, when `<all_urls>` is not granted (Chrome site-access set to "On click"/"On specific sites", Firefox opt-in host permissions — a third cause of "only some websites"), swaps it for a "set to On all sites" instruction; README documents both. Double injection is harmless: the guard short-circuits same-world re-runs and `applyCursorStyle` reuses the existing `#lovespark-cursors` element. Version 1.1.37 → 1.1.38.
**Not done (owner call):** overriding the New Tab page via `chrome_url_overrides.newtab` would let the cursor show there, but it replaces the user's New Tab (a separate CWS-disclosed capability and a product change for a cursor pack).
**Verify:** 3-skeptic adversarial workflow — diagnosis confirmed (alt causes debunked: all 72 SVGs 32×32, PNGs 32×32, storage area already local); 0 correctness bugs; fixed: dropped `tabs`, Firefox-false warning claim, `file://` README claim, Chrome-only popup copy, missing site-access cause, stale store description.
**Files:** manifest.json, background.js, popup.html, popup.css, popup.js, README.md, CHANGELOG.md, _locales/en/messages.json

---

## 2026-10-13: ITER — Popup redesign + OG cursor pack regeneration (v1.1.39)

**Problem:** (1) Skeptic review of the popup redesign found it shipped unversioned: `popup.css` (+309), `popup.html` (+234), `popup.js` (+157) modified on top of HEAD 079f568 (= 1.1.38) with no manifest bump, CHANGELOG entry or trail entry (rule #9 + trail rule). (2) Measured today: starlight-purple PNGs were orange (dominant opaque rgb(255,158,85)) since first release; OG arrows were hollow white outlines that vanished on white pages; the "link" cursor was an arrow with a minus-circle badge that read as zoom-out/not-allowed.
**Root cause:** (1) Popup work landed as a working-tree change by a parallel agent without the version/trail step. (2) OG PNGs were hand-made once and never regenerated from source; no generator existed, so the mislabelled palette was never caught.
**Fix:** Popup — live preview strip (`#previewPage`, `applyPreview`), Pointer group ordered before Emoji, radiogroup with roving tabindex + arrow keys (`popup.js:170,211`), chip/selection redesign. Cursors — new `gen_og_cursors.py` (Pillow only, deterministic, 32-unit design space, 8x supersample, LANCZOS downscale) regenerates 8 cursors x 2 sizes (32px `_32` + 64px retina, identical filenames; `content_script.js` untouched) x 3 packs: filled gradient + 1px dark outline + 1px white halo, link = pointing hand, text = I-beam, grab/grabbing = open/closed hand, crosshair/not_allowed/wait centred on the `8 8` hotspot. Palettes: retro-pink #FF62B4, sakura-peach #FF7188, starlight-purple #B57BEE core / #7B4FC9 outline / lavender highlight. Three OG swatch gradients in `popup.html` updated to match. Version 1.1.38 -> 1.1.39.
**Verify:** Skeptic round: median hue of opaque pixels in `cursor_default_32.png` = retro-pink 326deg, sakura-peach 345deg, starlight-purple 265deg (purple); link alpha mask shows index finger + palm + cuff; outline + halo visible on white/pink/dark contact sheets. Topmost opaque (halo) pixel of default/link measured (2,1), first solid (2,2) — hotspot `3 1` lands on the halo row beside the apex (functionally correct); the generator docstring/comments corrected to the measured values. Zips rebuilt via `scripts/build-zips.sh`.
**Files:** manifest.json, CHANGELOG.md, BUGS_AND_ITERATIONS.md, gen_og_cursors.py, cursors/{retro-pink,sakura-peach,starlight-purple}/*.png, popup.html, popup.css, popup.js

---

## 2026-10-13: ITER — Y2K pack legibility redesign + hotspot audit (v1.1.39, continued)

**Problem:** Owner asked for a "SOTA" pass on charms and pointers. Rendering all 72 SVGs at native 32px on white / pastel-pink / dark (new `render_pack.py`, headless Chrome) showed: 1px I-beam stems vanishing, pale fills with no outline on pink pages, companions scattered as 2-3px specks in the corners, several emoji-variant pointer cursors unreadable as "clickable", wait cursors with no busy cue in the static frame. Hotspots were also off: arrow CSS hotspot "3 1" vs tip at (5,4); hand "8 4" vs fingertip (11.5,2); OG text/crosshair/not-allowed/wait drawn in the top-left 18px for an "8 8" hotspot.
**Root cause:** Packs were authored one at a time against 128px previews; no shared outline/halo primitive, no native-size review loop, hotspots copied from the OG PNG pack rather than measured.
**Fix:** `cursor_lib.py` gains `OUTLINE`, `halo()`, `arrow()`, haloed `hand()/hand_grad()`, 2px `ibeam()`; generator split into `packs/<name>.py` so 9 agents could redesign in parallel (byte-identical regeneration verified before the split was used); 11-agent design workflow → 3-lens skeptic pass (23 findings) → 8-agent fix round → re-verify (16, mostly tooling) → orchestrator + 1 polish agent for the remainder (glossy-pearl I-beam contrast, honey-bunny outline weight, busy-ring weights, uniform emoji fingertip at (15.5,12)). Hotspots fixed in `content_script.js` + `popup.js`. OG shapes recentred on (16,16) with "16 16" hotspots. `.zipignore` added.
**Not fixed (reported to shared lib):** footer buttons in `lib/lovespark-footer.css` are 15–25px tall (<32px touch target) — fix belongs in `lovespark-shared-lib`, then `scripts/sync-shared-lib.sh`. UNCERTAIN: a few companions travel up to 3px past the 32px canvas mid-animation in Chrome (clipped for a frame, harmless).
**Files:** cursor_lib.py, gen_cursors.py, packs/*.py, render_pack.py, gen_og_cursors.py, cursors/**, content_script.js, popup.js, popup.css, .zipignore, .gitignore, CHANGELOG.md
