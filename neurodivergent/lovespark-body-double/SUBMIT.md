# Submit: LoveSpark Body Double

> Extension: **LoveSpark Body Double** · Version **1.0.31** · [Repo](https://github.com/Joona-t/lovespark-body-double)
> Everything below maps to `CWS-LISTING.md` — you shouldn't need to reopen it.

## CWS form field → source

| CWS Dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | **Category** |
| Language | **Language** |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** |
| Privacy policy URL | https://github.com/Joona-t/lovespark-body-double/blob/main/PRIVACY.md |

## Asset upload checklist

Assets folder: `~/Downloads/lovespark-body-double-cws-assets`

- [ ] **Store icon** 128×128 ← `icons/icon-128.png`
- [ ] **Screenshots** 1280×800 ← the **5 localized + 5 global** PNGs from the assets folder
- [ ] **Small promo tile** 440×280 ← from assets folder
- [ ] **Marquee promo tile** 1400×560 ← from assets folder

> ⚠️ Chrome requires screenshots as **24-bit PNG, no alpha**.

## Upload the package

- [ ] **Chrome:** upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-body-double-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

**Pre-submit checkboxes (tick during upload):**
- [ ] Version is bumped (**1.0.31**)
- [ ] Permissions match justifications
- [ ] Privacy form all set to **"Not collected"**
- [ ] Privacy policy URL set
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-body-double-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/). It already passed `amo-validate.py` during build.
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent fields).
