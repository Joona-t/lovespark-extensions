# Submit: Study Bubbles by LoveSpark

> **Package:** `study-bubbles-chrome.zip` · **Version:** 1.0.29 · **Repo:** https://github.com/Joona-t/study-bubbles
> Goal: submit to the Chrome Web Store in ~5 minutes. Every field maps to a section of `CWS-LISTING.md`.

## CWS form field → source

| CWS dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | **Category** |
| Language | **Language** |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** (all data categories → *Not collected*) |
| Privacy policy URL | `https://github.com/Joona-t/study-bubbles/blob/main/PRIVACY.md` |

## Asset upload checklist

Assets live in `~/Downloads/study-bubbles-cws-assets`.

| CWS slot | File | Spec |
|---|---|---|
| Store icon | `icons/icon-128.png` | 128×128 PNG |
| Screenshots (×5–10) | 5 localized + 5 global from `study-bubbles-cws-assets` | **1280×800, 24-bit PNG, NO alpha** |
| Small promo tile | small promo tile | 440×280 PNG |
| Marquee promo tile | marquee promo tile | 1400×560 PNG |

- [ ] Store icon uploaded (128×128)
- [ ] At least 1 screenshot uploaded (24-bit PNG, no alpha — Chrome rejects alpha)
- [ ] Small promo tile (440×280)
- [ ] Marquee promo tile (1400×560)

## Upload the package

**Chrome:** upload `~/Claude x LoveSpark/lovespark zips/chrome zips/study-bubbles-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

Pre-submit checkboxes — tick during upload:

- [ ] Version is bumped (`1.0.29`)
- [ ] Permissions match the per-permission justifications
- [ ] Privacy form: every data category set to **Not collected**
- [ ] Privacy policy URL set → `https://github.com/Joona-t/study-bubbles/blob/main/PRIVACY.md`
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/study-bubbles-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/). It already passed `amo-validate.py` during build.
- [ ] Reuse the same listing copy from `CWS-LISTING.md` — AMO has equivalent name / summary / description fields.
