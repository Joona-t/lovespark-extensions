# Dark Mode Reader — research.md

**Date:** 2026-10-23 · **Status:** research, no code · **Repo:** `Joona-t/lovespark-extensions` → `reading/lovespark-dark-mode-reader/`

## 0. One-line thesis

Dark Reader wins on coverage and loses on four measurable things: first-paint flash, CPU/memory on heavy sites, breaking sites that are already dark, and zero reading-comfort features. Dark Mode Reader beats it on those four, guarantees WCAG AA text contrast by construction, and adds a reading layer. It does not try to out-cover Dark Reader's 7 years of per-site fixes in v1.

## 1. What exists in the fleet

| Thing | What it is | Verdict |
|---|---|---|
| `reading/lovespark-dark-mode` v2.0.37 | `filter: invert(0.9) hue-rotate(180deg)` on `<html>` + counter-filter on media, plus two pink filter themes. 41-line content.js. | Dark Reader's **weakest** mode (its own blog calls filter mode "sluggish, blurred text, dark parts become white"). Keep it as the pink-filter toy. Do not extend it; the engine is a different animal. |
| `reading/lovespark-reader` v1.1.35 | Reader mode, `storage` permission only. | Owns "strip the page to an article". Dark Mode Reader must **not** duplicate it. Our reading layer is in-place typography, not article extraction. |
| `infrastructure/lovespark-shared-lib` | base/tokens/fonts CSS, theme dropdown, popup helpers, lifecycle, footer, stats. | Reuse for popup + settings UI. |
| `~/.claude/docs/lovespark-design-system.md` | Candy glass-sticker system, 4 themes (candy/retro/noir/beige). | Popup follows it. Page-recoloring palettes are a separate concern (section 5). |

## 2. How Dark Reader actually works (verified facts, from its own blog + repo)

- **Filter mode:** `filter: invert() hue-rotate()` on the root. Cheap, blurs text (kills sub-pixel AA), inverts images, makes dark sites light. Same as our existing extension.
- **Dynamic mode (default since 2018):** parses every stylesheet via CSSOM, rewrites each color declaration into a modified copy appended as its own `<style>` overrides, watches DOM/attribute mutations, re-fetches cross-origin sheets from the background worker, analyses background images by drawing them to a canvas. Per-site fixes live in a 200k+ line `dynamic-theme-fixes.config` shipped in the bundle and refreshed from the web.
- **Color model:** HSL. Lightness is remapped per declaration with brightness/contrast/sepia/grayscale sliders. No contrast target; the user tunes sliders.
- **Flash prevention:** injects a "fallback" stylesheet at document_start, but reviewers still report white flashes, especially on Chrome.

## 3. Dark Reader's documented pain (user reports, 2024–2026; anecdotal, not benchmarked)

1. **CPU/memory on heavy sites.** Reddit, GitHub, Google Docs: "~80% CPU for several seconds", "huge memory leak", Firefox 150 shows a "Dark Reader is slowing down this page" bar. Root cause is structural: every mutation re-runs CSSOM analysis, and canvas image analysis is expensive.
2. **White flash on load** before the engine finishes, mainly Chrome.
3. **Double-darkening sites that are already dark.** "Detect dark theme" exists but is off by default and heuristic; users report GitHub dark + Dark Reader = unreadable greys.
4. **Images/videos**: black bars, washed photos, inverted logos.
5. **Interferes with Cloudflare Turnstile / bot checks.**
6. **No reading features.** It is a recolorer only; typography, line length, dyslexia fonts are out of scope for it.
7. **Trust/maintenance** grumbles after monetised builds (Safari paid, in-popup upsell). LoveSpark position: free, MIT, zero telemetry, no upsell, ever.

Competitors: Midnight Lizard (MIT, discontinued), Night Eye (proprietary, freemium), Turn Off the Lights (free, vendor-biased comparison). None combine a dynamic engine with a reading layer and a contrast guarantee. That is the open slot.

## 4. The "better" claims, each with its measurement

Every claim below gets a number from the bench harness in section 7. No claim ships without its number (benchmark-checklist rule).

| # | Claim | Mechanism | Metric |
|---|---|---|---|
| B1 | **Zero white flash.** | Static CSS registered at `document_start` paints a dark root + `color-scheme: dark` before first paint; a cheap filter acts as stage-1 fallback until the engine's stylesheet is ready; swap happens inside one frame. | First-dark-paint ≤ first-contentful-paint on 20/20 fixture sites (screenshot diff at FCP). |
| B2 | **Cheap on heavy sites.** | Stylesheet results cached per sheet (href + length hash) in `storage.session`; mutations batched per rAF with a 4 ms/frame work budget; no canvas image analysis in v1 (images are dimmed, not analysed); cross-origin sheets fetched once by the worker and cached. | Main-thread CPU ms over 30 s of scrolling GitHub/Reddit/Wikipedia vs Dark Reader; memory delta after 10 min. Target: ≤ 50 % of Dark Reader's. |
| B3 | **Stands aside for native dark sites.** | Before recoloring: read `meta[name=color-scheme]`, computed `<html>`/`<body>` background luminance, and whether the page's own sheets contain `prefers-color-scheme: dark` rules currently applying. If the page is already dark (L < 0.3), the engine does nothing; only the reading layer stays available. On by default. | 0 false darkenings on a 10-site native-dark set (GitHub dark, YouTube dark, Discord web, X dark, MDN dark, …). |
| B4 | **AA contrast by construction.** | Recolor in **OKLCH**, not HSL. Backgrounds remapped to L ∈ [0.12, 0.28], text to L ∈ [0.80, 0.96], hue and chroma preserved (chroma clamped so saturated accents stay in gamut). The lightness bands are chosen so any bg/text pair clears 4.5:1; the engine checks each resolved pair and nudges the text L up if a pair misses. | % of visible text nodes with ≥ 4.5:1 contrast after recolor, sampled via `getComputedStyle`. Target 100 % on fixtures (Dark Reader has no target). |
| B5 | **Images and video stay natural.** | Never inverted. Photos get `filter: brightness(0.85)` (user slider 60–100 %); `<svg>`/icon-sized images and CSS background images in UI chrome are treated as UI (recolored via their fill/currentColor), large raster backgrounds dimmed. | Manual fixture review + count of inverted images = 0. |
| B6 | **Reading layer.** | Optional per-site: font swap (OpenDyslexic / Atkinson Hyperlegible / site default), line-height 1.6, max text width 70ch, link underline + contrast, paragraph spacing. Applies to text content containers only, not app UI. Does not extract the article (that is `lovespark-reader`). | Toggles work on 20 fixtures without breaking layout (visual check). |
| B7 | **Privacy + size.** | No remote config, no fetch to any first-party server, no telemetry. Site-fix list ships in the zip and updates only with the extension. | Bundle < 300 KB (Dark Reader ≈ 1.5 MB unpacked); `grep fetch(` shows only same-page stylesheet fetches. |

## 5. Engine design (data-first)

**Data the engine owns**
- `SiteState` per hostname: `{ mode: "auto"|"on"|"off", palette, imageDim, reading: {font, width, lineHeight, links} }` in `chrome.storage.local`.
- `SheetCache` keyed `hash(href || inline text length + first 200 chars)` → list of `[selectorText, prop, originalValue, recoloredValue]`, in `chrome.storage.session` (cleared on browser restart, so it never goes stale across extension updates).
- `Palette`: `{ bgL: [min,max], textL: [min,max], chromaCap, hueShift }`. Four built-ins (section 6).

**Three-stage pipeline per page**
0. `document_start` static CSS (from `content_scripts[].css`): `html{background:#131316;color-scheme:dark}`. Costs nothing, kills the flash.
1. Same tick, content script adds `html.dmr-stage1` → `filter: invert(.88) hue-rotate(180deg)` on root + counter-filter on media. Readable within the first frame.
2. Engine walks `document.styleSheets` (own-origin) + worker-fetched cross-origin text, rewrites color-bearing declarations through the OKLCH mapper, emits one `<style id="dmr-theme">`, then removes `.dmr-stage1` in the same rAF. Inline `style=""` colors handled via a MutationObserver on `style` attributes, batched. Shadow roots: adopt the same sheet via `adoptedStyleSheets`.

**Native-dark detection** runs between stage 1 and 2; a positive result removes stage 1 and skips stage 2.

**Per-site fixes**: a small JSON (`fixes/sites.json`) with `{ host, ignoreSelectors, invertSelectors, cssAppend }`. Start with ~10 hosts from the fixture set. Community PRs later.

**Out of scope v1:** canvas analysis of background images, PDF viewer, Safari, scheduled sunrise/sunset by geolocation (we follow the OS `prefers-color-scheme` + a fixed time window instead; no geolocation permission).

## 6. Page palettes (owner taste call, see plan.md)

Candidate dark palettes for recolored pages: **Noir** (neutral #131316), **Plum** (LoveSpark brand dark, `--ls-text-strong` #2a0413 territory), **Midnight** (cool blue-black), **Warm** (sepia-dark for long reads). Popup/settings UI themselves follow the design system's 4 themes and are a separate choice.

## 7. Bench harness (the instrument)

`scripts/dmr-bench/` (lives in the monorepo `scripts/`, not in the extension zip): headless Chrome via Playwright loads 20 fixture URLs (10 light sites, 10 native-dark) with (a) nothing, (b) Dark Reader, (c) Dark Mode Reader. Records FCP screenshot luminance, main-thread CPU ms during a scripted 30 s scroll, JS heap delta, % text nodes ≥ 4.5:1, count of inverted `<img>`. Writes `bench/results.json`; README table is generated from it. This is what lets us say "better" in the store listing without lying.

## 8. Permissions (minimal)

`storage`, `scripting`, `alarms` (schedule), host `<all_urls>` (document_start CSS on any site; justification: the dark theme must paint before the page does). No `tabs` (use `activeTab` + `sender.tab`). No `declarativeNetRequest`, no `geolocation`.

## 9. Known-issue guards from `~/.claude/docs/memory/known-issues.md`

- Storage area mismatch (KI: worker wrote `local`, content read `sync`): one `storage.js` module, `local` only, imported by all three contexts.
- Firefox AMO: `gecko.id`, `strict_min_version 109`, `data_collection_permissions`, `background.scripts` fallback: `scripts/build-zips.sh` handles it; never bypass.
- Popup a11y: `role="dialog"`, theme **dropdown** top-right, Sparky left, ≥32 px targets, `prefers-reduced-motion`.

## Sources

- Dark Reader, "Dynamic theme" announcement: https://darkreader.org/blog/dynamic-theme/
- Dark Reader source + `dynamic-theme-fixes.config`: https://github.com/darkreader/darkreader
- Firefox AMO reviews (slowdowns, memory, Firefox 150): https://addons.mozilla.org/de/android/addon/darkreader/reviews/
- Orion issue tracker (white flash on Chrome build): https://orionfeedback.org/all?page=444
- Alternatives landscape: https://alternativeto.net/software/dark-reader
- Turn Off the Lights vs Dark Reader (vendor page, biased): https://www.turnoffthelights.com/turn-off-the-lights-vs-dark-reader/
