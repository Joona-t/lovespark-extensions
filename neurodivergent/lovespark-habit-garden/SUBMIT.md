# Submit: LoveSpark Habit Garden

`v1.0.28` · [repo](https://github.com/Joona-t/lovespark-habit-garden) · all copy lives in `CWS-LISTING.md`

## CWS form field → source

| CWS dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | Productivity |
| Language | English (United States) |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-habit-garden/blob/main/PRIVACY.md` |

## Asset upload checklist

- [ ] **Store icon — 128×128** ← `icons/icon-128.png`
- [ ] **Screenshots — 1280×800** ← the 5 localized + 5 global PNGs in `~/Downloads/lovespark-habit-garden-cws-assets`
- [ ] **Small promo tile — 440×280** ← `~/Downloads/lovespark-habit-garden-cws-assets`
- [ ] **Marquee promo tile — 1400×560** ← `~/Downloads/lovespark-habit-garden-cws-assets`

> ⚠️ Screenshots must be **24-bit PNG, no alpha channel**, exactly 1280×800. Chrome rejects RGBA.

## Upload the package

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-habit-garden-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole)

Pre-submit checkboxes (tick during upload):

- [ ] Version is bumped (`1.0.28`)
- [ ] Permissions match the justifications in `CWS-LISTING.md`
- [ ] Privacy form: every data category set to **"Not collected"**
- [ ] Privacy policy URL set → `https://github.com/Joona-t/lovespark-habit-garden/blob/main/PRIVACY.md`
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-habit-garden-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/) — already passed `amo-validate.py` during build
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent name / summary / description fields)
