# Submit: Focus Blossom: Site Blocker & Digital Detox

> **Package version:** 1.0.44 · **Repo:** https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/focus-blossom
> Everything below maps 1:1 to `CWS-LISTING.md` — no need to re-read it.

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
| Privacy practices | **Privacy disclosure** (all categories → *Not collected*) |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/focus-blossom/PRIVACY.md` |

## Asset upload checklist

All assets live in `~/Downloads/focus-blossom-cws-assets`.

- [ ] **Store icon (128×128)** ← `icons/icon-128.png`
- [ ] **Screenshots (1280×800)** ← the **5 localized** + **5 global** PNGs from the assets dir
- [ ] **Small promo tile (440×280)** ← `small-promo-440x280.png`
- [ ] **Marquee promo tile (1400×560)** ← `marquee-promo-1400x560.png`

> ⚠️ Chrome requires screenshots as **24-bit PNG, no alpha channel**. The 1280×800 screenshots in the assets dir are already exported this way.

## Upload the package

- [ ] **Chrome:** upload `~/Claude x LoveSpark/lovespark zips/chrome zips/focus-blossom-chrome.zip` to the CWS Developer Dashboard.

**Pre-submit checkboxes (tick during upload):**

- [ ] Version is bumped (**1.0.44**)
- [ ] Permissions match the per-permission justifications
- [ ] Privacy form → every category set to **Not collected**
- [ ] Privacy policy URL set → `https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/focus-blossom/PRIVACY.md`
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/focus-blossom-firefox.zip` to https://addons.mozilla.org — it already passed `amo-validate.py` during build.
- [ ] Reuse the **same listing copy** from `CWS-LISTING.md` (AMO has equivalent Name / Summary / Description / privacy fields).
