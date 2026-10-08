# Submit: LoveSpark Working Memory Pad

> Extension `lovespark-working-memory-pad` · v1.0.0 · [repo](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-working-memory-pad)
> Goal: submit to the Chrome Web Store in ~5 minutes. Pull copy from `CWS-LISTING.md`; don't rewrite it.

## CWS form field → source

| CWS Dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | Productivity |
| Language | English (United States) |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** (all categories → "Not collected") |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-working-memory-pad/PRIVACY.md` |

## Asset upload checklist

| CWS slot | File |
|---|---|
| Store icon — 128×128 | `icons/icon-128.png` |
| Screenshots — 1280×800 (×5–10) | 5 localized + 5 global from `~/Downloads/lovespark-working-memory-pad-cws-assets` |
| Small promo tile — 440×280 | `lovespark-working-memory-pad-small-promo.png` (assets dir) |
| Marquee promo tile — 1400×560 | `lovespark-working-memory-pad-marquee.png` (assets dir) |

- [ ] Screenshots are **24-bit PNG, no alpha** (Chrome rejects alpha/indexed PNGs)
- [ ] Every screenshot is exactly 1280×800
- [ ] Store icon is exactly 128×128

## Upload the package

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-working-memory-pad-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole)

**Pre-submit checkboxes — tick during upload:**

- [ ] Version is bumped (manifest = `1.0.0`)
- [ ] Declared permissions match the **Per-permission justification** entries (no extras)
- [ ] Privacy form: every data category set to **Not collected**
- [ ] Privacy policy URL set → `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-working-memory-pad/PRIVACY.md`
- [ ] At least 1 screenshot uploaded (5 localized + 5 global recommended)

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-working-memory-pad-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/) — already passed `amo-validate.py` during build
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent name / summary / description fields)
- [ ] Privacy policy URL → same as CWS
