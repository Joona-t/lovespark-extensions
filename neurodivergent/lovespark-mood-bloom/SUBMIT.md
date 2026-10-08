# Submit: LoveSpark Mood Bloom

`v1.0.33` · [repo](https://github.com/Joona-t/lovespark-mood-bloom) · ~5 min to submit

## CWS form field → source

| CWS dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | **Category** |
| Language | **Language** |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-mood-bloom/blob/main/PRIVACY.md` |

## Asset upload checklist

Files live in the repo's `cws-shots/` folder (paths below are repo-relative).

- [ ] **Store icon** (128×128) ← `icons/icon-128.png`
- [ ] **Screenshots** (1280×800) ← `cws-shots/screenshot-localized-{1..5}.png` + `cws-shots/screenshot-global-{1..5}.png`
- [ ] **Small promo tile** (440×280) ← `cws-shots/promo-small.png`
- [ ] **Marquee promo tile** (1400×560) ← `cws-shots/promo-marquee.png`

> ⚠️ Chrome requires screenshots as **24-bit PNG, no alpha**.

## Upload the package

- [ ] **Chrome:** upload `lovespark-mood-bloom-chrome.zip` (repo root, built by `build-zips.sh` honoring `.zipignore`) to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

Pre-submit checkboxes (tick during upload):

- [ ] Version is bumped (`1.0.33`, must equal `manifest.json` and the zip's manifest)
- [ ] Permissions match justifications
- [ ] Privacy form all **"Not collected"**
- [ ] Privacy policy URL set
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `lovespark-mood-bloom-firefox.zip` (repo root) to [addons.mozilla.org](https://addons.mozilla.org/developers/). Already passed `amo-validate.py` during build.
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent fields).
