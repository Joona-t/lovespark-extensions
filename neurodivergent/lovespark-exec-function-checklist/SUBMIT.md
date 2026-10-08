# Submit: LoveSpark Executive Function Checklist

**Version:** 1.0.0 · **Repo:** https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-exec-function-checklist

---

## CWS form field → source

| CWS Dashboard field | Source in `CWS-LISTING.md` |
|---|---|
| Title | **Extension name** |
| Summary | **Short description** |
| Description | **Detailed description** |
| Category | **Category** |
| Language | **Language** |
| Single purpose | **Single-purpose justification** |
| Permission justifications | **Per-permission justification** + **Host-permissions justification** |
| Privacy practices | **Privacy disclosure** |
| Privacy policy URL | https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-exec-function-checklist/PRIVACY.md |

---

## Asset upload checklist

| CWS slot | File |
|---|---|
| Store icon (128×128) | `icons/icon-128.png` |
| Screenshots (1280×800) — 5 localized | from `~/Downloads/lovespark-exec-function-checklist-cws-assets` |
| Screenshots (1280×800) — 5 global | from `~/Downloads/lovespark-exec-function-checklist-cws-assets` |
| Small promo tile (440×280) | from `~/Downloads/lovespark-exec-function-checklist-cws-assets` |
| Marquee promo tile (1400×560) | from `~/Downloads/lovespark-exec-function-checklist-cws-assets` |

- [ ] Screenshots are **24-bit PNG, no alpha** (Chrome requirement)

---

## Upload the package

- **Chrome:** upload `~/Claude x LoveSpark/lovespark zips/chrome zips/lovespark-exec-function-checklist-chrome.zip` to the [CWS Developer Dashboard](https://chrome.google.com/webstore/devconsole).

**Pre-submit checkboxes:**
- [ ] Version is bumped (1.0.0)
- [ ] Permissions match justifications
- [ ] Privacy form all **"Not collected"**
- [ ] Privacy policy URL set
- [ ] At least 1 screenshot uploaded

---

## Firefox AMO

- [ ] Upload `~/Claude x LoveSpark/lovespark zips/firefox zips/lovespark-exec-function-checklist-firefox.zip` to [addons.mozilla.org](https://addons.mozilla.org/developers/) — already passed `amo-validate.py` during build.
- [ ] Reuse the same listing copy from `CWS-LISTING.md` (AMO has equivalent fields).
