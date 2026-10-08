# Submit: LoveSpark Energy Meter

`v1.0.29` · [repo](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-energy-meter) · every field below sources from `CWS-LISTING.md`

## CWS form field → source

| CWS dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | Productivity |
| Language | English (US) |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** (all categories → *Not collected*) |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-energy-meter/PRIVACY.md` |

## Asset upload checklist

| CWS slot | File |
|---|---|
| Store icon (128×128) | `icons/icon-128.png` |
| Screenshots (1280×800) | 5 localized + 5 global from `~/Downloads/lovespark-energy-meter-cws-assets` |
| Small promo tile (440×280) | `440x280` promo from assets dir |
| Marquee promo tile (1400×560) | `1400x560` promo from assets dir |

- [ ] Screenshots are **24-bit PNG, no alpha** (Chrome rejects alpha channels)
- [ ] Icon is 128×128 PNG

## Upload the package

- **Chrome:** upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-energy-meter-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

Pre-submit checkboxes (tick during upload):

- [ ] Version is bumped (`1.0.29`)
- [ ] Permissions match justifications
- [ ] Privacy form all **"Not collected"**
- [ ] Privacy policy URL set
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-energy-meter-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/) — already passed `amo-validate.py` during build.
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent fields).
