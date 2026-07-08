# Submit: LoveSpark Gratitude Journal

> One-page quickstart so you can push v1.0.29 to the Chrome Web Store in ~5 min without re-reading `CWS-LISTING.md`. Firefox AMO pointer at the bottom.

## CWS form field → source

Each Developer Dashboard field and where its copy lives in `CWS-LISTING.md`:

| CWS Dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** (≤45 chars) |
| Summary | **Short description** (≤132 chars) |
| Description | **Detailed description** (long-form, SEO body) |
| Category | **Category** — set to *Productivity* |
| Language | **Language** — set to *English (United States)* |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** (one paragraph per permission) + **Host-permissions justification** |
| Privacy practices (Section 5 form) | **Privacy disclosure** (all data categories → *Not collected*) |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-gratitude-journal/blob/main/PRIVACY.md` |

## Asset upload checklist

All images live in `~/Downloads/lovespark-gratitude-journal-cws-assets`. Match each to its CWS slot:

- [ ] **Store icon** — 128×128 PNG ← `icons/icon-128.png`
- [ ] **Screenshots** — 1280×800 PNG ← the **5 localized + 5 global** shots from the assets dir (upload at least 1; use all 10 for full coverage)
- [ ] **Small promo tile** — 440×280 PNG
- [ ] **Marquee promo tile** — 1400×560 PNG

⚠️ Screenshots must be **24-bit PNG, no alpha channel** — Chrome rejects RGBA. (The generator already outputs them this way; only re-check if you hand-edited any.)

## Upload the package

- [ ] **Chrome:** upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-gratitude-journal-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

**Pre-submit checkboxes** (tick during upload):

- [ ] Version is bumped (`1.0.29`)
- [ ] Declared permissions match the justifications in the listing
- [ ] Privacy form: every data category set to **Not collected**
- [ ] Privacy policy URL set → `https://github.com/Joona-t/lovespark-gratitude-journal/blob/main/PRIVACY.md`
- [ ] At least 1 screenshot uploaded

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-gratitude-journal-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/). It already passed `amo-validate.py` during build — no re-validation needed.
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent Name / Summary / Description / privacy fields).
