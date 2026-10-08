# Submit: LoveSpark Hyperfocus Guard

`v1.0.0` · Repo: https://github.com/Joona-t/lovespark-hyperfocus-guard

Submit to the Chrome Web Store in ~5 minutes. Copy comes from `CWS-LISTING.md` — don't rewrite it, just map fields below.

## CWS form field → source

| CWS Dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | Productivity |
| Language | English (United States) |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** |
| Privacy policy URL | https://github.com/Joona-t/lovespark-hyperfocus-guard/blob/main/PRIVACY.md |

## Asset upload checklist

| CWS slot | File |
|---|---|
| Store icon (128×128) | `icons/icon-128.png` |
| Screenshots (1280×800) — 5 localized | `…/lovespark-hyperfocus-guard-cws-assets` (localized set) |
| Screenshots (1280×800) — 5 global | `…/lovespark-hyperfocus-guard-cws-assets` (global set) |
| Small promo tile (440×280) | `…/lovespark-hyperfocus-guard-cws-assets` |
| Marquee promo tile (1400×560) | `…/lovespark-hyperfocus-guard-cws-assets` |

Assets dir: `~/Downloads/lovespark-hyperfocus-guard-cws-assets`

- [ ] Screenshots are **24-bit PNG, no alpha** (Chrome rejects RGBA)
- [ ] All 10 screenshots are exactly 1280×800
- [ ] Promo tiles match exact dimensions (440×280, 1400×560)

## Upload the package

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-hyperfocus-guard-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole)

Pre-submit checkboxes (tick during upload):

- [ ] Version bumped (`1.0.0` in manifest)
- [ ] Permissions match the justifications in `CWS-LISTING.md`
- [ ] Privacy form: every data category set to **Not collected**
- [ ] Privacy policy URL set → https://github.com/Joona-t/lovespark-hyperfocus-guard/blob/main/PRIVACY.md
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-hyperfocus-guard-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/) — already passed `amo-validate.py` during build
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent name/summary/description fields)
- [ ] Same privacy policy URL as CWS
