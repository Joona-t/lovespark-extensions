# Submit: LoveSpark Site Blocker

> Version **1.0.1** · [repo](https://github.com/Joona-t/lovespark-site-blocker) · ~5-minute submission. Tick boxes, don't re-read the long listing.

## CWS form field → source

All copy lives in `CWS-LISTING.md` unless noted.

| CWS dashboard field | Source |
|---|---|
| Title | "Extension name" |
| Summary | "Short description" |
| Description | "Detailed description" |
| Category | Productivity (see "Detailed description" header) |
| Language | English (United States) |
| Single purpose | "Single-purpose justification" |
| Permission justifications | "Per-permission justification" + "Host-permissions justification" |
| Privacy practices | "Privacy disclosure" (all categories → Not collected) |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-site-blocker/blob/main/PRIVACY.md` |

## Asset upload checklist

Screenshots & promo tiles in `~/Downloads/lovespark-site-blocker-cws-assets`.

- [ ] **Store icon** 128×128 ← `icons/icon-128.png`
- [ ] **Screenshots** 1280×800 ← 5 localized + 5 global from the assets dir
- [ ] **Small promo tile** 440×280 ← assets dir
- [ ] **Marquee promo tile** 1400×560 ← assets dir

⚠️ Screenshots **must** be 24-bit PNG, **no alpha channel**, exactly 1280×800 — Chrome rejects RGBA.

## Upload the package

- [ ] Chrome: upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-site-blocker-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

Pre-submit checkboxes (tick during upload):

- [ ] Version is bumped (**1.0.1**)
- [ ] Permissions match justifications
- [ ] Privacy form all "Not collected"
- [ ] Privacy policy URL set
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-site-blocker-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/). Already passed `amo-validate.py` during build.
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent fields).
