# Submit: LoveSpark Tab Garden

> Extension `lovespark-tab-garden` · v1.0.27 · [repo](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-tab-garden)
> Goal: submit to CWS in ~5 min without re-reading `CWS-LISTING.md`.

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
| Privacy practices | **Privacy disclosure** (all data categories → "Not collected") |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-tab-garden/PRIVACY.md` |

## Asset upload checklist

All assets in `~/Downloads/lovespark-tab-garden-cws-assets`.

| CWS slot | File / spec |
|---|---|
| ☐ Store icon (128×128) | `icons/icon128.png` |
| ☐ Screenshots (1280×800) | 5 localized + 5 global from the assets dir |
| ☐ Small promo tile (440×280) | small promo tile PNG |
| ☐ Marquee promo tile (1400×560) | marquee promo tile PNG |

> ⚠️ Screenshots must be **24-bit PNG, no alpha** (Chrome rejects alpha/32-bit).

## Upload the package

- ☐ Upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-tab-garden-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

**Pre-submit checkboxes (tick during upload):**
- ☐ Version is bumped (`1.0.27`)
- ☐ Permissions match justifications
- ☐ Privacy form all "Not collected"
- ☐ Privacy policy URL set
- ☐ At least 1 screenshot uploaded

## Firefox AMO

- ☐ Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-tab-garden-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/). Already passed `amo-validate.py` during build.
- ☐ Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent fields).
