# Submit: LoveSpark Win Jar

`v1.0.29` · repo: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-win-jar

## CWS form field → source

All copy lives in `CWS-LISTING.md`. Paste each field from the section named below.

| CWS dashboard field | Source in CWS-LISTING.md |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | Productivity |
| Language | English (US) |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** (all categories → *Not collected*) |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-win-jar/PRIVACY.md` |

## Asset upload checklist

Assets are in `~/Downloads/lovespark-win-jar-cws-assets`.

- [ ] **Store icon** — `icons/icon-128.png` (128×128)
- [ ] **Screenshots** (1280×800) — the **5 localized + 5 global** PNGs from the assets dir → *Screenshots* slots
- [ ] **Small promo tile** — 440×280 PNG
- [ ] **Marquee promo tile** — 1400×560 PNG

> ⚠️ Chrome requires screenshots as **24-bit PNG, no alpha**. Icon/promo tiles unaffected.

## Upload the package

- [ ] Chrome: upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-win-jar-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

**Pre-submit checkboxes** (tick during upload):

- [ ] Version is bumped (`1.0.29`)
- [ ] Permissions match justifications
- [ ] Privacy form all **"Not collected"**
- [ ] Privacy policy URL set
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-win-jar-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/). It already passed `amo-validate.py` during build.
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent fields).
