# Dark Mode Reader — plan.md

**Date:** 2026-10-23 · **Status:** DRAFT, awaiting Joona's annotation · **DO NOT IMPLEMENT YET**
Based on `research.md` (read it first). Implement only on "implement it all".

## Owner decisions (annotate inline)

1. **New extension vs. replace `lovespark-dark-mode`?** Recommendation: **new**, `reading/lovespark-dark-mode-reader/`. The old one stays as the pink-filter toy. Later we can point its listing at this one.
2. **Page palettes for v1** (research §6): recommendation ship **Noir + Plum + Warm**, Midnight later. Default = Noir (users expect neutral; Plum is the brand flex one click away).
3. **Reading layer default:** OFF per site, one toggle in the popup. Recommendation: off by default so the extension never changes layout unasked.
4. **Name on the store:** "Dark Mode Reader — by LoveSpark" (≤45 chars). Alternative: "LoveSpark Dark Mode Reader".
5. **Bench harness scope:** 20 fixture sites (10 light / 10 native-dark) is the proposed set. OK, or fewer?
6. **Firefox in v1?** Recommendation: yes, `build-zips.sh` already handles it; engine uses only MV3 APIs Firefox 109+ supports (no `storage.session` fallback needed: Firefox ≥115 has it; set `strict_min_version` to 115).

## Scope

**In:** three-stage engine, OKLCH recolor with AA guarantee, native-dark detection, image dimming, 3 palettes, reading layer, per-site memory, OS-follow + time schedule, popup, settings, keyboard shortcut (Alt+Shift+D toggle), site-fix JSON for ~10 hosts, bench harness, CWS + AMO packages.
**Out (v1):** background-image canvas analysis, PDF viewer, Safari, geolocation sunset, remote fix updates, cloud sync.

## Architecture

```
manifest.json                 MV3, permissions: storage, scripting, alarms, activeTab; host <all_urls>
src/
  content/
    stage0.css                document_start: dark root + color-scheme:dark (via content_scripts.css)
    stage1.css                filter fallback (.dmr-stage1) + media counter-filter
    engine.js                 document_start: stage1 class → detectNativeDark → recolor → swap
    recolor/oklch.js          srgb↔oklch, lightness bands, contrast nudge  (pure, unit-tested)
    recolor/sheets.js         CSSOM walk, cross-origin request to worker, cache lookup
    recolor/inline.js         style="" + shadow roots, rAF-batched MutationObserver
    detect.js                 native-dark heuristics (meta, luminance, prefers-color-scheme rules)
    reading.js                typography layer, applies to text containers only
  background/
    worker.js                 fetch cross-origin sheets, storage.session cache, alarms schedule, badge
  shared/
    storage.js                ONE module, chrome.storage.local, typed defaults (KI guard)
    palettes.js               Noir / Plum / Warm band definitions
    messages.js               message action constants
popup.html/.css/.js           design system, Sparky left, theme dropdown right, role=dialog
settings.html/.css/.js        palettes, schedule, reading defaults, site list, image dim slider
fixes/sites.json              per-host ignore/invert/append
lib/                          synced from lovespark-shared-lib (scripts/sync-shared-lib.sh)
_locales/en/messages.json     + the monorepo's standard locale set at ship time
icons/ + generate_icons.py    Pillow 16/48/128, moon over LoveSpark heart
tests/                        node:test for oklch.js, detect.js, palettes.js (no browser needed)
```

Monorepo `scripts/dmr-bench/` holds the Playwright harness (not shipped in the zip).

## Data flow

popup/settings ⇄ `storage.js` ⇄ worker. Content engine reads `SiteState` for `location.hostname` once at start, subscribes to `storage.onChanged` (area `local`) for live updates. Cross-origin sheet text: content → `{action:"fetchSheet", url}` → worker fetch + `storage.session` cache → content. Badge: worker sets "ON"/"" per tab from `sender.tab.id`.

## Milestones

**M0 — Scaffold + engine core (no UI)**
- [ ] `scaffold-extension.py` run for `lovespark-dark-mode-reader` (installs atlas workflow + `audit-meta.yml`); confirm BUGS_AND_ITERATIONS.md, LICENSE, README stubs
- [ ] `src/shared/storage.js` with defaults + `getSite(host)` / `setSite(host, patch)`
- [ ] `src/content/recolor/oklch.js` + `tests/oklch.test.js` (round-trip, band mapping, contrast nudge ≥ 4.5:1 for 1 000 random pairs)
- [ ] `src/shared/palettes.js` (Noir, Plum, Warm) + test that every palette's bands guarantee 4.5:1
- [ ] `stage0.css`, `stage1.css`, `engine.js` happy path on own-origin sheets; manual check on Wikipedia: no flash, swap in one frame
- [ ] `sheets.js` cross-origin via worker + session cache
- [ ] `inline.js` style attribute + shadow DOM
- [ ] `detect.js` + `tests/detect.test.js` on 10 native-dark fixtures (HTML snapshots)
- [ ] Image handling: dim slider value applied, zero inversions on fixtures
- [ ] `fixes/sites.json` with GitHub, YouTube, Reddit, Wikipedia, MDN, Google Search, Gmail, X, Stack Overflow, Hacker News

**M1 — Reading layer + UI**
- [ ] `reading.js`: font swap (OpenDyslexic / Atkinson from shared `fonts/`), 70ch width, 1.6 line-height, link underline; scoped to `article, main, [role=main], .content`-like containers via a heuristic (largest text block)
- [ ] Popup: enable toggle, palette dropdown, image dim slider, reading toggle, "this site: auto/on/off", Sparky, theme dropdown, `role=dialog`, aria-live for state
- [ ] Settings: default palette, schedule (follow OS / time window / always), reading defaults, site list editor, keyboard shortcut note
- [ ] Shortcut `Alt+Shift+D` via `commands` manifest key
- [ ] `ls-check .` green, `audit-contrast.py --verbose --history` green, 320/360 px popup widths checked

**M2 — Bench + proof**
- [ ] `scripts/dmr-bench/` Playwright harness, 20 fixtures, runs nothing / Dark Reader / DMR
- [ ] `bench/results.json` + README table generated from it (B1–B7 numbers from research §4)
- [ ] Fix whatever the bench exposes; log each in BUGS_AND_ITERATIONS.md

**M3 — Ship package**
- [ ] `_locales` full set, `generate_icons.py`, version 1.0.0
- [ ] `CWS-LISTING.md`, `PRIVACY.md`, `SUBMIT.md`, `marketing-asset-generator.py` → `cws-shots/` + `~/Downloads/lovespark-dark-mode-reader-cws-assets/`
- [ ] `scripts/build-zips.sh` → chrome + firefox zips, AMO validator passes
- [ ] Permission audit, `ls-check . --strict`
- [ ] Branch → PR → squash-merge → NOW.md Shipped line (repo only; store upload is Joona's click)

## Risks

- **Cross-origin stylesheet fetch** can fail (CORS-less CDN with cookies): fall back to leaving stage 1's filter on *that sheet's elements*? Not possible per-sheet; fallback is page-level stage 1 stays. Measure how often on fixtures.
- **Sites that recolor via JS inline styles at 60 fps** (canvas-heavy apps, games): the 4 ms budget means we lag, not freeze. Acceptable; document.
- **OKLCH gamut:** clamp chroma per hue; test with the 1 000-pair unit test.
- **Firefox `storage.session`:** requires Firefox 115+; set min version accordingly.

## Not doing (anti-goals)

No telemetry, no remote config, no upsell, no "pro" tier, no account, no paid API. No ads. No `tabs` permission.
