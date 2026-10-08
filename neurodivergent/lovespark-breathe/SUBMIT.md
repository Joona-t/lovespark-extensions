# Submit: LoveSpark Breathe

> Extension ID: `lovespark-breathe` · Version: **1.0.23** · Repo: https://github.com/Joona-t/lovespark-breathe
> Goal: paste-and-go CWS submission in ~5 min. All copy lives in **CWS-LISTING.md** — this page just maps it.

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
| Privacy practices | **Privacy disclosure** (all data types → *Not collected*) |
| Privacy policy URL | https://github.com/Joona-t/lovespark-breathe/blob/main/PRIVACY.md |

## Asset upload checklist

| CWS slot | File |
|---|---|
| ☐ Store icon (128×128) | `icons/icon-128.png` |
| ☐ Screenshots (1280×800) ×10 | 5 localized + 5 global from `~/Downloads/lovespark-breathe-cws-assets` |
| ☐ Small promo tile (440×280) | `440x280.png` in assets dir |
| ☐ Marquee promo tile (1400×560) | `1400x560.png` in assets dir |

> ⚠️ Chrome requires screenshots to be **24-bit PNG, no alpha channel**. Icon and promo tiles same format.

## Upload the package

- ☐ **Chrome:** upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-breathe-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

**Pre-submit checkboxes (tick during upload):**
- ☐ Version is bumped (`1.0.23`)
- ☐ Permissions match justifications
- ☐ Privacy form all "Not collected"
- ☐ Privacy policy URL set
- ☐ At least 1 screenshot uploaded

## Firefox AMO

- ☐ Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-breathe-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/). Already passed `amo-validate.py` during build.
- ☐ Reuse the same listing copy from **CWS-LISTING.md** (AMO has equivalent name / summary / description fields).
