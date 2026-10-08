# Submit: LoveSpark Brain Dump

> **Version 1.0.31** · Repo: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-brain-dump
> Goal: submit to CWS in ~5 minutes. Every field below maps to a section of `CWS-LISTING.md` — no need to re-read it in full.

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
| Privacy practices | **Privacy disclosure** |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-brain-dump/PRIVACY.md` |

## Asset upload checklist

| CWS slot | File |
|---|---|
| Store icon (128×128) | `icons/icon-128.png` |
| Screenshots (1280×800) | 5 localized + 5 global from `~/Downloads/lovespark-brain-dump-cws-assets` |
| Small promo tile (440×280) | `~/Downloads/lovespark-brain-dump-cws-assets` → small promo tile |
| Marquee promo tile (1400×560) | `~/Downloads/lovespark-brain-dump-cws-assets` → marquee promo tile |

- [ ] Screenshots are **24-bit PNG, no alpha** (Chrome requirement)
- [ ] At least 1 screenshot uploaded (5 localized + 5 global recommended)
- [ ] Both promo tiles uploaded

## Upload the package

**Chrome:** upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-brain-dump-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

Pre-submit checkboxes (tick during upload):

- [ ] Version is bumped (**1.0.31**)
- [ ] Permissions match justifications
- [ ] Privacy form all "Not collected"
- [ ] Privacy policy URL set
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-brain-dump-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/) — it already passed `amo-validate.py` during build
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent fields)
