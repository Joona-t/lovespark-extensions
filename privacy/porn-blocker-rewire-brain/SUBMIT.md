# Rewire Brain v2.4.4 — CWS Submission Quickstart

**One-page reference. Everything you need to submit in this folder.**

---

## 📦 Upload to Chrome Web Store

CWS Developer Dashboard → https://chrome.google.com/webstore/devconsole/

### Package upload
Upload this zip:
```
~/Downloads/porn-blocker-rewire-brain 3-chrome.zip
```

### Store icon (128×128)
Use the bundled icon (already inside the zip):
```
icons/icon128.png
```

### Localized screenshots (drop into "Localized screenshots" slot)
- `screenshot-localized-1.png` — Hero: Block 125+ Adult Sites
- `screenshot-localized-2.png` — Mindful Pause (blocked page)
- `screenshot-localized-3.png` — Track Your Streak (dashboard)
- `screenshot-localized-4.png` — On-Device NSFW Blur (options)
- `screenshot-localized-5.png` — Free. Forever. Private. (onboarding)

### Global screenshots (drop into "Global screenshots" slot)
- `screenshot-global-1.png` — 🌸 LoveSpark suite
- `screenshot-global-2.png` — 🧠 Rewire Brain
- `screenshot-global-3.png` — 🛡 Block & Blur
- `screenshot-global-4.png` — 🔥 Day 14 milestone
- `screenshot-global-5.png` — 🌱 Level 5 brain-tree

### Promo tiles
- Small promo tile (440×280): `promo-small.png`
- Marquee promo tile (1400×560): `promo-marquee.png`

---

## 📝 Copy/paste text from `CWS-LISTING.md` (this folder)

| CWS form field | Source in CWS-LISTING.md |
|----------------|--------------------------|
| Extension name (≤45 chars) | Section 1 |
| Short description (≤132 chars) | Section 2 |
| Detailed description | Section 5 — full SEO-optimized body |
| Single-purpose justification | Section 7 |
| Permission justification: `storage` | Section 6 |
| Permission justification: `declarativeNetRequest` | Section 6 |
| Permission justification: `declarativeNetRequestWithHostAccess` | Section 6 |
| Permission justification: `tabs` | Section 6 |
| Permission justification: `alarms` | Section 6 |
| Permission justification: `notifications` | Section 6 |
| Host permission justification (`<all_urls>`) | Section 6 |
| Privacy disclosure form answers | Section 8 |
| Privacy policy URL | `https://github.com/Joona-t/porn-blocker-rewire-brain/blob/main/PRIVACY.md` |
| Reviewer test instructions | Section 10 |

---

## 🔒 Privacy policy

`PRIVACY.md` (this folder) is the full policy document. It's already
published at:
```
https://github.com/Joona-t/porn-blocker-rewire-brain/blob/main/PRIVACY.md
```
Paste that URL into the CWS "Privacy policy" field.

---

## 🦊 Firefox AMO (separate submission)

```
~/Downloads/porn-blocker-rewire-brain 3-firefox.zip
```
Upload at https://addons.mozilla.org/developers/ — same listing copy
works (it auto-validates against AMO requirements; gecko block is
already included).

---

## ✅ Pre-submit checklist

- [ ] All 5 localized screenshots uploaded
- [ ] All 5 global screenshots uploaded (or skipped — CWS allows just localized)
- [ ] Small promo tile uploaded
- [ ] Marquee promo tile uploaded
- [ ] Extension name (Section 1) pasted
- [ ] Short description (Section 2) pasted
- [ ] Detailed description (Section 5) pasted
- [ ] Single-purpose justification (Section 7) pasted
- [ ] All 7 permission justifications (Section 6) pasted
- [ ] Privacy disclosure form: all 7 data-collection boxes UNCHECKED
- [ ] 3 certification checkboxes (Section 8) checked
- [ ] Privacy policy URL pasted
- [ ] Reviewer test instructions (Section 10) pasted
- [ ] Category: Productivity
- [ ] Language: English (default — _locales/ handles the rest automatically)

When all boxes are ticked → click **Submit for review**.

Typical CWS review time: 1–3 business days.
