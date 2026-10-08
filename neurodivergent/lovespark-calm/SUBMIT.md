# Submit: LoveSpark Calm

> Version **1.0.29** · [github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-calm](https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-calm)
> Goal: submit to the Chrome Web Store in ~5 minutes. All copy lives in `CWS-LISTING.md` — this page just maps fields → source.

## CWS form field → source

| CWS Dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | Set to **Productivity** (or per listing header) |
| Language | **English (United States)** |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices (data-use form) | **Privacy disclosure** (all categories → *Not collected*) |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-calm/PRIVACY.md` |

## Asset upload checklist

| CWS slot | File |
|---|---|
| ☐ Store icon (128×128) | `icons/icon-128.png` |
| ☐ Screenshots (1280×800) — 5 localized | from `~/Downloads/lovespark-calm-cws-assets` |
| ☐ Screenshots (1280×800) — 5 global | from `~/Downloads/lovespark-calm-cws-assets` |
| ☐ Small promo tile (440×280) | from `~/Downloads/lovespark-calm-cws-assets` |
| ☐ Marquee promo tile (1400×560) | from `~/Downloads/lovespark-calm-cws-assets` |

> ⚠️ Screenshots must be **24-bit PNG, no alpha channel**. Chrome rejects 32-bit/alpha PNGs.

## Upload the package

- ☐ Upload `"~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-calm-chrome.zip"` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

**Pre-submit checkboxes** (tick during upload):

- ☐ Version is bumped (**1.0.29**)
- ☐ Permissions match the per-permission justifications
- ☐ Privacy form → every category set to **Not collected**
- ☐ Privacy policy URL set → `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-calm/PRIVACY.md`
- ☐ At least 1 screenshot uploaded

## Firefox AMO

- ☐ Upload `"~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-calm-firefox.zip"` to [addons.mozilla.org](https://addons.mozilla.org/developers/). It already passed `amo-validate.py` during build.
- ☐ Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent name / summary / description / privacy fields).
