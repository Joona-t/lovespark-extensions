# Submit: LoveSpark Hub

**Extension:** LoveSpark Hub · **Version:** 1.0.29 · **Repo:** https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-hub

> Everything below maps to `CWS-LISTING.md` — don't re-read it. ~5 minutes end to end.

## CWS form field → source

| CWS dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | **Category** (Productivity) |
| Language | **Language** (English) |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** (all categories → *Not collected*) |
| Privacy policy URL | https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-hub/PRIVACY.md |

## Asset upload checklist

All assets live in `~/Downloads/lovespark-hub-cws-assets`.

- [ ] **Store icon (128×128)** ← `icons/icon-128.png`
- [ ] **Screenshots (1280×800)** ← the 5 localized + 5 global PNGs from `~/Downloads/lovespark-hub-cws-assets`
- [ ] **Small promo tile (440×280)**
- [ ] **Marquee promo tile (1400×560)**

> ⚠️ Chrome requires **24-bit PNG, no alpha** for screenshots. Icon/tiles as generated.

## Upload the package

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-hub-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

**Pre-submit checkboxes (tick during upload):**

- [ ] Version is bumped (**1.0.29**)
- [ ] Permissions match justifications
- [ ] Privacy form all "Not collected"
- [ ] Privacy policy URL set
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-hub-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/). It already passed `amo-validate.py` during build.
- [ ] Reuse the same listing copy from `CWS-LISTING.md` — AMO has equivalent fields.
