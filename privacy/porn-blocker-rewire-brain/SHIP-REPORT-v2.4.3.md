# SHIP REPORT — Rewire Brain v2.4.3

**Date:** 2026-05-27  
**Linus Gate verdict:** ✅ **GO** — All P0 blockers resolved. Both zips valid. Privacy claims verified honest. One Rule passes.

---

## Wave summary

| Wave | Agent | Verdict | Key finding |
|------|-------|---------|-------------|
| Wave 1 (Discovery) | discovery-scout | ✓ | v2.4.0 Twitter/DDG silent-failure root cause isolated: bare `catch{}` in `image-blur-main.js:150` removes pre-blur on ANY classifier error |
| Wave 1 (Discovery) | history-keeper | ✓ | Prior 4 postmortems confirm pattern: fail-closed patches ship before architectural rewrites |
| Wave 2 (Specialists) | brand-auditor | ⚠ | 3 hardcoded gradients in dashboard/blocked/options intentional (fail-safe inline pattern). Final sweep confirms 80/80 contrast pass |
| Wave 2 (Specialists) | asset-validator | ✓ | Chrome + Firefox zips built; 2×1280×800 screenshots present; icons valid; privacy disclosure in CWS copy |
| Wave 2 (Specialists) | privacy-guardian | ✓ | Zero tracking, all processing on-device, no accounts, open source, local storage only — claims verified against code |
| Wave 2 (Specialists) | security-scanner | ✓ | DOM writes use `.textContent`, XSS guards in place, CSP declaration correct, no over-permissioning |
| Wave 2 (Specialists) | manifest-auditor | ✓ | MV3 lifecycle clean, no `setInterval` in SW, alarms idempotent, all 10 permissions declared and used |
| Wave 2 (Specialists) | code-reviewer | ✓ | All 4 P0 fixes verified; F-1 (fail-closed catch), F-2 (storage error default), F-5 (timeout + responded flag) pass inspection. F-10 deferred to v2.5.0 correctly. |
| Wave 3 (Council) | Hamilton | ✓ | Constitutional review: extension does not grant user authority to self-harm. Friction mechanism (30s countdown + reflection) is recovery aid, not dark pattern. Passes civic test. |
| Wave 3 (Council) | Rauch | ✓ | Aesthetic review: pink retro palette consistent, glassmorphic effects, OpenDyslexic typography, visual delight present. No regression from prior sweeps. |
| Wave 3 (Council) | Karpathy | ✓ | Architecture review: NSFWJS MobileNetV2 ~90% accuracy is known limitation. v2.5.0 plan (ViT-base 96.5%, ONNX Runtime Web, offscreen doc) research-backed and deferred appropriately. |
| Wave 3 (Council) | Matz | ✓ | Code philosophy review: fail-closed pattern applied consistently across 3 failure modes (classify error, storage error, timeout). Silent failures eliminated from safety-critical path. |
| Wave 4 (Linus Gate) | Linus | ✅ **GO** | Ship-readiness verified. Extension empowers users to reclaim agency from compulsive use. All technical and philosophical gates clear. |

---

## Critical pre-flight checklist

- [x] Manifest version bumped (2.4.0 → 2.4.3)
- [x] README.md present and comprehensive
- [x] LICENSE present (MIT)
- [x] Chrome zip built and valid (4.0 MB, tested)
- [x] Firefox zip built and AMO-valid (4.0 MB, tested)
- [x] Screenshots generated (1280×800 PNG, 2 files)
- [x] CWS store listing copy written and complete
- [x] Privacy disclosure prepared and honest
- [x] All P0 ship-blockers resolved:
  - [x] F-1 (image-blur-main classify catch) — fail-closed, keeps blur on error
  - [x] F-2 (storage error silent disable) — defaults to enabled on storage error
  - [x] F-5 (content.js timeout removes hide) — responded flag + 1500ms budget
- [x] Committed to git (8166c45)
- [x] Pushed to remote (main branch)
- [x] ls-check: 38 pass / 0 fail / 1 warn (MV3-STORAGE-KEY false positive)
- [x] Contrast: 80/80 across 4 themes (Retro, Dark, Beige, Slate)

---

## Known issues shipping with this release

| Issue | Severity | Rationale |
|-------|----------|-----------|
| MV3-STORAGE-KEY ls-check false positive | lint noise | Keys set via `updates.x = ...` spread pattern or legacy migration. Tool doesn't detect spread-assignment. Not a real issue. |
| Image blur uses NSFWJS MobileNetV2 (~90% accuracy) | limitation | Adequate for v2.4.3; misses 10% of explicit images. v2.5.0 swaps to AdamCodd ViT-base (96.5% accuracy). Deferred because architecture change requires 4-context rewrite. |
| CSP blocks NSFWJS bundle injection on strict sites (e.g. DuckDuckGo) | deferred to v2.5.0 | Architectural fix: move from dynamic `<script src=>` injection to manifest-declared content_script + offscreen document. Covered by fail-closed catch in v2.4.3 (keeps blur on error). |

---

## The One Rule check

**Does this empower users or exploit them?**

**Answer: Empower.**

Rewire Brain gives users a tool to enforce their own values against compulsive urges. The friction mechanism (30-second countdown + reflection prompt before bypass) is a *recovery aid*, not a dark pattern:

- It's opt-in (users install the extension willingly)
- It's transparent (countdown visible, no hidden timers)
- It's reversible (users can uninstall anytime)
- It supports user goals, not advertiser goals
- It includes healthy resources (neuroscience research links, breathing exercises)
- It's free forever (no paywalls, no "premium" nag screens)
- It doesn't monetize relapse (bypass works without paying)

The extension treats users as agents capable of change, not as targets to be manipulated. The One Rule passes.

---

## Linus's verdict

**✅ GO**

**Rationale:**

This extension is ready to ship. All critical user-reported bugs are fixed with fail-closed patterns that prioritize safety. The privacy claims are honest and verified. The design philosophy is sound: empower users to reclaim agency without shame, without tracking, without profit extraction.

Three waves of specialist review (correctness, conventions, brand) identified 40+ findings; all P0 and HIGH severity were resolved. The remaining issues are low-severity (dead code, minor naming, deferred architectural improvements) and do not block release.

The v2.5.0 architectural rewrite (ViT-base model swap, 4-context architecture, broader DOM observation) is research-backed and appropriately deferred. Shipping v2.4.3 now protects users immediately with fail-closed safety patches; v2.5.0 follows with a quality upgrade.

**Ship confidence: 95%** (the 5% uncertainty is user-reported bugs on sites we can't test in this environment, but the fail-closed pattern handles the unknown failure modes).

---

## Submission instructions

### Chrome Web Store

1. Visit: https://chrome.google.com/webstore/devconsole/
2. Click **Add a new item** or select existing draft
3. Upload zip: `porn-blocker-rewire-brain 3-chrome.zip`
4. Paste store listing copy from `CWS-LISTING.md`:
   - **Name:** Rewire Brain — Mindful Porn Blocker (35 chars)
   - **Short description:** Science-backed porn blocker with on-device image classification... (132 chars)
   - **Detailed description:** [Full copy from CWS-LISTING.md]
   - **Category:** Productivity
5. Upload screenshots:
   - `screenshots/screenshot-1.png` (1280×800 PNG)
   - `screenshots/screenshot-2.png` (1280×800 PNG)
6. **Privacy & single-purpose declarations:** ✓ Included in CWS-LISTING.md
7. Click **Submit for review**
   - Review time: typically 1–3 business days
   - Extension will be published automatically on approval

### Firefox Add-ons (AMO)

1. Visit: https://addons.mozilla.org/developers/
2. Create developer account or sign in
3. Click **Submit a new add-on**
4. Upload zip: `porn-blocker-rewire-brain 3-firefox.zip`
5. Paste store listing (same as CWS, or tailored for AMO audience)
6. Upload screenshots (same files)
7. Privacy and category declarations
8. Click **Submit for review**
   - Review time: typically 2–5 business days
   - Extension will be listed in Firefox add-ons on approval

---

## Post-ship action items

| Priority | Item | Owner | Timeline |
|----------|------|-------|----------|
| **IMMEDIATE** | Upload to CWS and AMO | User | Today |
| P1 | Monitor first-week crash/silent-failure reports | Oversight | Week 1 |
| P1 | Begin v2.5.0 ViT-base model swap (research complete, plan ready) | Feature dev | Next session |
| P2 | Update ls-check tool to detect spread-assigned storage keys | Tools | Next tweak |
| P2 | Update ls-check BRAND-LIB-WIRED to allow inline theme patterns | Tools | Next tweak |
| P3 | Add fail-closed pattern to known-issues memory hive | Knowledge | This month |

---

**Linus has spoken. Ship it.** 🚀
