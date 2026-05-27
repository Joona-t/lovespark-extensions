# Phase 1 + 2 Consolidated Findings (FINAL)

**Date:** 2026-05-09
**Scope:** All 4 multi-lens reviews + 5 automated quality gates complete
**Top-line verdict:** **CRITICAL** — root cause of v2.4.0 Twitter/DDG failure isolated to two related bugs (F-1 + F-10). Several P1 logic bugs across journal/streak/XP. Multiple P0 ship-blockers in image-blur safety pipeline. v2.5.0 architectural rewrite remains the right call.

---

## P0 — Ship-blocking (must fix before any release)

| ID | Source | File:Line | Issue | Fix-Closed Pattern |
|----|--------|-----------|-------|--------------------|
| F-1 | silent-failures | `image-blur-main.js:139-150` | Bare `catch{}` removes pre-blur on ANY error. Tainted-canvas (Twitter/DDG/Reddit/Imgur) silently lifts the blur. **THIS IS THE v2.4.0 BUG.** | On catch: keep `rb-blur` permanently, log warning, increment stats. Fail closed. |
| F-2 | silent-failures | `image-blur.js:14-22` | `chrome.storage.local.get` failure returns silently → blur disabled sitewide on any storage error | Default to `enabled: true` on storage error |
| F-5 | silent-failures | `content.js:49-51` | 500ms timeout removes hide-style EVEN if SW response says blocked → flash of porn page | `responded` flag + 1500ms timeout; on timeout without response, redirect to safe page |
| F-10 | silent-failures | `image-blur-main.js:46-63` | NSFWJS loaded via dynamic `<script src=>` injection; killed by strict host CSP. Once `getModel()` fails, F-1 hides it. | (Architectural — superseded by v2.5.0 manifest content_script + offscreen doc design) |

---

## HIGH — Must fix before ship

| ID | Source | Issue |
|----|--------|-------|
| C-1 | correctness | Journal entries push not upsert → duplicates per day; dashboard shows oldest |
| C-2 | correctness | SITE_BLOCKED returns stale XP (10-110 behind) → wrong toast |
| C-3 | correctness | UTC date mismatch for non-UTC users → wrong date slot for journal/streak |
| QG-4 | ls-check | Storage keys read-but-never-set: `dailyBlockXpDate`, `darkMode`, `imageBlurThreshold` (always default) |
| QG-7 | ls-check | `README.md` missing — CWS submission requires |
| QG-8 | ls-check | `LICENSE` missing — CWS submission requires |
| CV-1 | conventions | Rule #4 violation — `--ls-bg-gradient` defined but not imported anywhere; all 5 pages hardcode |
| CV-2 | conventions | Rule #3 partial — Sparky mascot missing in `blocked.html` and `options.html` |
| CV-3 | conventions | `BUGS_AND_ITERATIONS.md` malformed (lines 3-25 broken auto-gen format) |
| OVR-1 | oversight | Debug `console.log` at `background.js:609` |

---

## MEDIUM — Should fix before ship

| ID | Source | Issue |
|----|--------|-------|
| C-4 | correctness | `image-blur-main.js` busy-poll up to 5s on every navigation |
| C-5 | correctness | (subsumed by F-5) |
| QG-1 | ls-check | 26 elements in `dashboard.html` need `aria-live="polite"` for dynamic updates |
| QG-2 | ls-check | 3 inputs in `options.html` missing `<label>` or `aria-label` |
| QG-3 | ls-check | 24 `chrome.runtime.sendMessage` calls without try/catch + `lastError` check |
| CV-4 | conventions | `.btn-expand` is 28×28 (below 32×32 touch target) |
| CV-5 | conventions | `prefers-reduced-motion` missing in `popup.html` and `options.html` |
| CV-6 | conventions | Zero test coverage — security-critical functions unverified |
| F-* | silent-failures | 13 P1/P2 silent failures across `background.js`, `popup.js`, `options.js` (full list in `01-silent-failures-20260509.md`) |

---

## LOW — Nice-to-have

| ID | Source | Issue |
|----|--------|-------|
| C-6 | correctness | Streak reset gap branch missing `streakDays: 0` (corrected on next line) |
| C-7 | correctness | `countdownInterval` not cleared in `bypassConfirm` |
| C-8 | correctness | (subsumed by F-1) |
| QG-5 | ls-check | `popup.html` not wired to shared lib (likely intentional) |
| QG-6 | ls-check | 8 dead lib files in package |
| OVR-2 | oversight | Stale registry note "options.js IDs don't match" — verified false |
| OVR-3 | oversight | Pending uncommitted changes (expected during dev) |
| CV-7 | conventions | ~50 hardcoded color hex values across HTMLs |
| CV-8 | conventions | Inline `style=` attributes in popup.html and options.html |
| S-1 | simplify | Dead helpers: `escHtml` (options.js:295), `checkMilestoneBonus` (xp.js:103), `getResourcesByCategory` (resources.js:114) |
| S-2 | simplify | Write-only fields: `totalBlocksEver`, `breathingCompleted`, `pauseMinutes`, vestigial `streakStartDate` fetch |
| S-3 | simplify | Onboarding sends `goal:''` and `journalTime:''` but HTML only collects `reason` (after recent simplification) |
| S-4 | simplify | `BONUS_DAYS` literal duplicated between `background.js:422` and `xp.js:31` |

---

## ARCHITECTURAL — v2.5.0 image-blur rewrite (already planned, research-backed)

| ID | Issue | Fixed by |
|----|-------|---------|
| ARCH-1 | NSFWJS broken on Twitter/DDG/Reddit | F-1 fix + 4-context architecture |
| ARCH-2 | DOM observation too narrow (no srcset, style, react node swaps) | Broaden `attributeFilter`; childList:true subtree:true |
| ARCH-3 | CORS canvas-tainting silent failure | Service-worker fetch → ImageBitmap |
| ARCH-4 | iframes skipped (DDG detail view) | `all_frames: true` |
| ARCH-5 | MobileNetV2 ~90% vs ViT-base 96-98% | AdamCodd ViT-base via ONNX Runtime Web in offscreen document |

---

## Verified Non-Issues

- Contrast: **80/80 PASS** across all 4 themes (Retro, Dark, Beige, Slate)
- Permissions: **all declared permissions used** (no over-permissioning)
- MV3 lifecycle: no `setInterval` in service worker; alarms idempotent
- XSS in `blocked.js`: all DOM writes use `.textContent`; `rel="noopener noreferrer"`; `isValidUrl` correctly gates http/https
- `normalizeDomain` regex: valid (no false positives)
- Storage API: `chrome.storage.local` only (no sync/local mixing)
- Alarm replacement: same-name alarms cleanly replace (no stacking)

---

## Statistics

| Bucket | Count |
|--------|-------|
| **P0 ship-blockers** | **4** |
| HIGH | 10 |
| MEDIUM | 9 |
| LOW | 12 |
| Architectural (v2.5.0) | 5 |
| **TOTAL** | **40 findings** |
| Verified non-issues | 7 |
| Lenses run | 4 multi-lens + 5 quality gates = 9 |

---

## Phase 4 work plan (priority order)

1. **F-1, F-2, F-5** (P0 fail-closed patches in current v2.4.0 — quick wins, ~1 hour)
2. **v2.5.0 image-blur architectural rewrite** (4-context — research approved by user; ~4-6 hours)
3. **HIGH-severity logic + ship-prerequisites** (C-1, C-2, C-3, QG-4, QG-7, QG-8, CV-1, CV-2, CV-3, OVR-1 — ~2-3 hours)
4. **MEDIUM** (a11y live regions, sendMessage error handling, CSS hardening — ~1-2 hours)
5. **LOW** (cleanup pass — ~30 min)

**Estimated total:** 9-13 hours for ship-clean state.
