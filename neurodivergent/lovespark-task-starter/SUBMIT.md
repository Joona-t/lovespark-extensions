# Submit: LoveSpark Task Starter

`v1.0.0` · [repo](https://github.com/Joona-t/lovespark-task-starter) · all listing copy lives in `CWS-LISTING.md`

## CWS form field → source

| CWS dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | Set to **Productivity** |
| Language | **English (United States)** |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** (all categories → *Not collected*) |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-task-starter/blob/main/PRIVACY.md` |

## Asset upload checklist

> Screenshots **must** be 1280×800, 24-bit PNG, **no alpha channel**. Assets are in `~/Downloads/lovespark-task-starter-cws-assets`.

- [ ] **Store icon** (128×128) ← `icons/icon-128.png`
- [ ] **Screenshots** (1280×800) ← 5 localized + 5 global from `~/Downloads/lovespark-task-starter-cws-assets`
- [ ] **Small promo tile** (440×280) ← from assets dir
- [ ] **Marquee promo tile** (1400×560) ← from assets dir

## Upload the package

- [ ] **Chrome:** upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-task-starter-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole)

Pre-submit checkboxes (tick during upload):

- [ ] Version is bumped (`1.0.0`)
- [ ] Permissions match justifications
- [ ] Privacy form all *"Not collected"*
- [ ] Privacy policy URL set
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-task-starter-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/) — already passed `amo-validate.py` during build
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent fields)
