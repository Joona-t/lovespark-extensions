# Submit: LoveSpark Read Aloud

`v1.0.28` · [repo](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-read-aloud) · ~5 min to submit

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
| Privacy practices | **Privacy disclosure** (all categories → "Not collected") |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-read-aloud/PRIVACY.md` |

## Asset upload checklist

| CWS slot | File |
|---|---|
| ☐ Store icon (128×128) | `icons/icon-128.png` |
| ☐ Screenshots (1280×800) | 5 localized + 5 global from `~/Downloads/lovespark-read-aloud-cws-assets` |
| ☐ Small promo tile (440×280) | `~/Downloads/lovespark-read-aloud-cws-assets` |
| ☐ Marquee promo tile (1400×560) | `~/Downloads/lovespark-read-aloud-cws-assets` |

> Screenshots **must** be 24-bit PNG, **no alpha channel**, exactly 1280×800.

## Upload the package

- Chrome: upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-read-aloud-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

Pre-submit checkboxes (tick during upload):

- ☐ Version is bumped (`1.0.28`)
- ☐ Permissions match justifications
- ☐ Privacy form all "Not collected"
- ☐ Privacy policy URL set
- ☐ At least 1 screenshot uploaded

## Firefox AMO

- ☐ Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-read-aloud-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/). Already passed `amo-validate.py` during build.
- ☐ Reuse the same listing copy from `CWS-LISTING.md` (AMO fields map 1:1).
