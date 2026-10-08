# Submit: LoveSpark Emotion Wheel

> Extension `lovespark-emotion-wheel` · v1.0.1 · [repo](https://github.com/Joona-t/lovespark-emotion-wheel)
> Goal: paste, upload, ship in ~5 min. All copy lives in `CWS-LISTING.md` — pull each field from the section named below.

## CWS form field → source

| CWS Dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** (≤45 chars) |
| Summary | **Short description** (≤132 chars) |
| Description | **Detailed description** |
| Category | Productivity |
| Language | English (US) |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** (all categories → *Not collected*) |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-emotion-wheel/blob/main/PRIVACY.md` |

## Asset upload checklist

All assets in `~/Downloads/lovespark-emotion-wheel-cws-assets/`.

- [ ] **Store icon** (128×128 PNG) ← `icons/icon-128.png`
- [ ] **Screenshots** (1280×800) — upload all 10: the **5 localized** + **5 global** PNGs
- [ ] **Small promo tile** (440×280 PNG)
- [ ] **Marquee promo tile** (1400×560 PNG)

> ⚠️ Screenshots must be **24-bit PNG, no alpha channel** — Chrome rejects RGBA/transparency.

## Upload the package

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-emotion-wheel-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

**Pre-submit checkboxes** (tick during upload):

- [ ] Version bumped to **1.0.1**
- [ ] Declared permissions match the **Per-permission justification** entries
- [ ] Privacy form: every data category set to **Not collected**
- [ ] Privacy policy URL set (link above)
- [ ] At least **1 screenshot** uploaded (10 recommended)

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-emotion-wheel-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/) — already passed `amo-validate.py` at build time.
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent name / summary / description / privacy fields).
