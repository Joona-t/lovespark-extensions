# Submit: LoveSpark Task Anchor

> Version **1.0.15** · [repo](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-task-anchor) · Goal: submit to CWS in ~5 min without re-reading `CWS-LISTING.md`.

## CWS form field → source

| CWS dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | **Category** (set in listing) |
| Language | **Language** (set in listing) |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** (all categories → "Not collected") |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-task-anchor/PRIVACY.md` |

## Asset upload checklist

All assets live in `~/Downloads/lovespark-task-anchor-cws-assets`.

- [ ] **Store icon** (128×128) ← `icons/icon-128.png`
- [ ] **Screenshots** (1280×800) ← 5 localized + 5 global from the assets dir
- [ ] **Small promo tile** (440×280) ← `small-promo-440x280.png`
- [ ] **Marquee promo tile** (1400×560) ← `marquee-promo-1400x560.png`

> ⚠️ Screenshots must be **24-bit PNG, no alpha** — Chrome rejects RGBA/indexed PNGs.

## Upload the package

- [ ] Chrome: upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-task-anchor-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

**Pre-submit checkboxes (tick during upload):**

- [ ] Version is bumped (`1.0.15`)
- [ ] Permissions match justifications
- [ ] Privacy form: all "Not collected"
- [ ] Privacy policy URL set
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-task-anchor-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/). Already passed `amo-validate.py` during build.
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent fields).
