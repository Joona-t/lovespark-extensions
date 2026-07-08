# Submit: LoveSpark Dopamine Menu

> Version **1.0.29** · [repo](https://github.com/Joona-t/lovespark-dopamine-menu) · assets in `~/Downloads/lovespark-dopamine-menu-cws-assets`
> Goal: submit to CWS in ~5 min. Everything below maps to `CWS-LISTING.md` — you shouldn't need to reopen it.

## CWS form field → source

| CWS Dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | **Category** (Productivity) |
| Language | **Language** (English) |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices (data use) | **Privacy disclosure** |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-dopamine-menu/blob/main/PRIVACY.md` |

## Asset upload checklist

| CWS slot | File |
|---|---|
| ☐ Store icon (128×128) | `icons/icon-128.png` |
| ☐ Screenshots (1280×800) — need ≥1, up to 10 | 5 localized + 5 global from `~/Downloads/lovespark-dopamine-menu-cws-assets` |
| ☐ Small promo tile (440×280) | small promo tile in assets dir |
| ☐ Marquee promo tile (1400×560) | marquee promo tile in assets dir |

> ⚠️ Screenshots must be **24-bit PNG, no alpha channel**, exactly 1280×800. Chrome rejects RGBA.

## Upload the package

**Chrome** — upload to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole):

```
~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-dopamine-menu-chrome.zip
```

Pre-submit checkboxes (tick during upload):

- ☐ Version is bumped (**1.0.29**)
- ☐ Permissions match the justifications in `CWS-LISTING.md`
- ☐ Privacy form: every data-collection category set to **Not collected**
- ☐ Privacy policy URL set → `https://github.com/Joona-t/lovespark-dopamine-menu/blob/main/PRIVACY.md`
- ☐ At least 1 screenshot uploaded

## Firefox AMO

- ☐ Upload to [addons.mozilla.org](https://addons.mozilla.org/developers/):

```
~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-dopamine-menu-firefox.zip
```

- ☐ Already passed `amo-validate.py` during build — no extra validation needed.
- ☐ Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent name / summary / description / privacy fields).
