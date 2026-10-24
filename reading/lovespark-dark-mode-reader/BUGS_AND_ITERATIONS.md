# Bugs & Iterations — Dark Mode Reader

Running log. Every defect found and every fix landed: date, problem, root cause, fix. IDs are `BUG-NNN` / `ITER-NNN`; commits reference them.

## ITER-001 · 2026-10-23 · v1.0.0 initial build

**What:** Three-stage engine (document_start CSS → filter fallback → OKLCH dynamic theme), native-dark stand-aside, image dimming, Noir/Plum/Warm palettes, reading layer, popup + settings, keyboard toggle.
**Why these choices:** see `research.md` §4 (B1–B7) and `plan.md` owner decisions.

## BUG-001 · 2026-10-23 · OKLab forward matrix had a wrong coefficient

**Problem:** white round-tripped to rgb(255, 251, 254); the unit test caught it.
**Root cause:** the `m` row's blue term was typed as 0.0808884420 instead of 0.1073969566 (Ottosson 2020).
**Fix:** corrected coefficient in `src/content/recolor/oklch.js`; round-trip test covers 9 colours within 1/255.

## BUG-002 · 2026-10-23 · Accent lightness bands too generous for AA

**Problem:** worst-case saturated green background (L 0.40) vs magenta text (L 0.72) measured 3.28:1.
**Root cause:** OKLCH lightness is perceptual; WCAG luminance weights green heavily, so same-L greens are "brighter" than the band assumed.
**Fix:** searched the band space against the real contrast function; accentBg → [0.24, 0.36], accentText → [0.78, 0.92], chromaCap 0.14. Worst corner now 4.87:1; `tests/oklch.test.js` asserts ≥ 4.5 on 12 hues × 3 chromas × all band corners plus 1 000 random pairs per palette.

## BUG-003 · 2026-10-23 · Custom property role guess missed camelCase names

**Problem:** `--borderColor-muted` was classified as a background (via lightness fallback).
**Root cause:** the name regex looked for `-border-`; camelCase has no separator.
**Fix:** tokenise on camelCase + punctuation, check border words first, then background, then text. Test `custom properties: role from name, else from lightness`.

## BUG-004 · 2026-10-23 · White page and light-grey cards mapped to almost the same dark

**Problem:** cards (#f4f4f6) on a white page became indistinguishable once darkened.
**Root cause:** linear mapping of `1 - L` squeezed the whole near-white range into the bottom 2% of the background band.
**Fix:** map backgrounds with `pow(1 - L, 0.45)`, so white → rgb(19,20,22), #f4f4f6 → rgb(25,25,27). Verified on the light-article fixture screenshot.

## BUG-005 · 2026-10-23 · Unused shared-lib import crashed the service worker

**Problem:** the worker never started, so pages stayed in the stage-1 filter forever.
**Root cause:** `importScripts('../../lib/lovespark-badge.js')` resolved against the worker's own folder and 404'd. A failed `importScripts` aborts the worker.
**Fix:** dropped the import; the worker sets its own badge. Smoke test `bench/run.py smoke` now catches a dead worker (page never reaches `dmr-on`).

## BUG-006 · 2026-10-23 · CSS variables and var() shorthands were never recoloured

**Problem:** sites that colour through custom properties (`color: var(--fg)`, `border: 1px solid var(--line)`) stayed light; smoke test found 8 of 16 text nodes below 4.5:1.
**Root cause:** one variable can feed both a background and a text colour, so recolouring its definition in place is wrong for one of them. Shorthands holding var() also read back empty longhands from CSSOM.
**Fix:** each colour variable now gets per-role copies (`--dmr-bg-x`, `--dmr-text-x`, `--dmr-border-x`), and every var() usage is rewritten to `var(--dmr-<role>-x, var(--x))`. var() shorthands are read and rewritten as shorthands. Tests in `tests/colors.test.js`.

## BUG-007 · 2026-10-24 · YouTube dark theme was darkened again

**Problem:** live bench, dark-scheme YouTube: engine stayed on and injected a 1.8 MB theme.
**Root cause:** YouTube paints #0f0f0f on `<html>` but leaves `body { color }` black; the detector required body text lighter than the background.
**Fix:** a background with relative luminance under 0.05 counts as dark on its own (`classify()` in `src/content/detect.js`, now pure and covered by `tests/detect.test.js`). Re-bench: 4 of 4 dark-scheme sites left untouched.

## PERF-001 · 2026-10-24 · Live bench, first numbers

Chromium 148, MacBook, other sessions running. 4 light + 4 dark-scheme sites, each side run twice, baseline and extension alternating per run.
- Early-frame luminance (first screenshot after DOMContentLoaded, not true first paint): 0.94 → 0.13 median.
- AA text coverage on light sites: 100% on 4 of 4 with the extension.
- Main-thread TaskDuration over 10 s of scrolling: baseline 82 / 101 ms, extension 134 / 152 ms (two runs). Overhead about 50 ms per 10 s, consistent across both runs. Limiter not profiled, so treat as indicative.
- No Dark Reader column: it is not installed here, so the "vs Dark Reader" claim is unmeasured.

## BUG-008 · 2026-10-24 · Strict ls-check: three failures before CWS

**Problem:** `ls-check . --strict` failed on A11Y-KI004, A11Y-LIVE and MV3-STORAGE-KEY.
**Root cause:** (1) the popup CSS forked from lovespark-dark-mode dimmed disabled pills with opacity 0.35/0.45, which fails contrast in the beige theme; (2) `#themeLabel` changes without an aria-live region; (3) storage read keys through `Object.keys(DEFAULTS)` and nested default objects, so neither a human nor the lint could see which keys are read.
**Fix:** grey-out via `filter: grayscale(0.8)` at opacity 0.85; `aria-live="polite"` on the theme label; flat DEFAULTS with named nested constants plus an explicit literal key list in `getAll()`, guarded by a test that the list equals `Object.keys(DEFAULTS)`. Strict ls-check: 38 pass, 0 fail, 0 warn.
- Package size: zip 1.3 MB → 662 KB after excluding 5 unused shared-lib font families in `.zipignore`. Still above research.md's < 300 KB target (B7): the OpenDyslexic OTFs alone are about 360 KB. Converting them to WOFF2 is the next lever.
