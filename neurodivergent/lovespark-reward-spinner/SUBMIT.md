# Submit: LoveSpark Reward Spinner

> Version **1.0.29** · [repo](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-reward-spinner) · assets in `~/Downloads/lovespark-reward-spinner-cws-assets`
> Goal: submit to CWS in ~5 min. Fill each dashboard field from the mapped `CWS-LISTING.md` section — no need to re-read the whole listing.

## CWS form field → source

| CWS dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | **Category** (listing header) |
| Language | **Language** (listing header) |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** (all data categories → *Not collected*) |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-reward-spinner/PRIVACY.md` |

## Asset upload checklist

| CWS slot | File |
|---|---|
| Store icon (128×128) | `icons/icon-128.png` |
| Screenshots (1280×800) | 5 localized + 5 global from `~/Downloads/lovespark-reward-spinner-cws-assets` |
| Small promo tile (440×280) | small promo tile from assets dir |
| Marquee promo tile (1400×560) | marquee promo tile from assets dir |

- [ ] Screenshots are **24-bit PNG, no alpha** (Chrome requirement)
- [ ] At least 1 screenshot uploaded (5+5 recommended)

## Upload the package

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-reward-spinner-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole)

**Pre-submit checkboxes** (tick during upload):

- [ ] Version is bumped (**1.0.29**)
- [ ] Permissions match justifications
- [ ] Privacy form all **"Not collected"**
- [ ] Privacy policy URL set
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-reward-spinner-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/) — already passed `amo-validate.py` during build
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent Name / Summary / Description / privacy fields)
