# Submit: LoveSpark Morning Routine

> Version `1.0.0` · Repo: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-morning-routine
> Goal: submit to the Chrome Web Store in ~5 minutes using artifacts already in the repo. Don't re-read the long `CWS-LISTING.md` — this maps each field for you.

## CWS form field → source

| CWS Dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | Productivity *(see CWS-LISTING.md header)* |
| Language | English (United States) |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** (all categories → *Not collected*) |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-morning-routine/PRIVACY.md` |

## Asset upload checklist

All assets live in `~/Downloads/lovespark-morning-routine-cws-assets`.

- [ ] **Store icon (128×128)** ← `icons/icon-128.png`
- [ ] **Screenshots (1280×800)** ← the **5 localized** + **5 global** PNGs from the assets dir
- [ ] **Small promo tile (440×280)** ← small promo tile PNG
- [ ] **Marquee promo tile (1400×560)** ← marquee promo tile PNG

> ⚠️ Chrome requires screenshots as **24-bit PNG, no alpha**. The generator outputs these already — don't re-export through a tool that adds an alpha channel.

## Upload the package

- [ ] **Chrome:** upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-morning-routine-chrome.zip` to the CWS Developer Dashboard.

**Pre-submit checkboxes** (tick during upload):

- [ ] Version is bumped (`1.0.0`)
- [ ] Permissions match the per-permission justifications
- [ ] Privacy form: every category set to **Not collected**
- [ ] Privacy policy URL set → `…/blob/main/PRIVACY.md`
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-morning-routine-firefox.zip` to https://addons.mozilla.org — already passed `amo-validate.py` during build.
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent name / summary / description fields).
