# Submit: LoveSpark Med Tracker

`v1.0.35` · repo: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-med-tracker

## CWS form field → source

| CWS dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | **Category** (Health / Productivity) |
| Language | **Language** (English) |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** (all categories "Not collected") |
| Privacy policy URL | https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-med-tracker/PRIVACY.md |

## Asset upload checklist

| CWS slot | File |
|---|---|
| ☐ Store icon (128×128) | `icons/icon-128.png` |
| ☐ Screenshots (1280×800) ×5 localized | 5 localized PNGs from `~/Downloads/lovespark-med-tracker-cws-assets` |
| ☐ Screenshots (1280×800) ×5 global | 5 global PNGs from `~/Downloads/lovespark-med-tracker-cws-assets` |
| ☐ Small promo tile (440×280) | small-promo tile in assets dir |
| ☐ Marquee promo tile (1400×560) | marquee-promo tile in assets dir |

> Screenshots must be **24-bit PNG, no alpha** (Chrome rejects alpha channels).

## Upload the package

- ☐ Chrome: upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-med-tracker-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

**Pre-submit checkboxes (tick during upload):**
- ☐ Version is bumped (`1.0.35`)
- ☐ Permissions match justifications
- ☐ Privacy form all "Not collected"
- ☐ Privacy policy URL set
- ☐ At least 1 screenshot uploaded

## Firefox AMO

- ☐ Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-med-tracker-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/). Already passed `amo-validate.py` during build.
- ☐ Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent Name / Summary / Description / permission fields).
