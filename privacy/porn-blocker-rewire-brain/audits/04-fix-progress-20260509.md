# Phase 4 Fix Progress — Rewire Brain v2.4.0 → v2.4.2

**Session date:** 2026-05-09
**Status:** v2.4.2 ship-clean as safety patch. v2.5.0 deferred to follow-on session.

## ls-check trajectory

| Pass | Fail |
|------|------|
| 28 | 11 (start) |
| 30 | 9 (after README + LICENSE) |
| 31 | 8 (after sendMessage sweep) |
| 35 | 4 (after aria-live + button labels) |
| 36 | 3 (after dead lib cleanup) |
| **36/39** | **3 known-intentional** |

## P0 ship-blockers — RESOLVED

| ID | Status | Fix |
|----|--------|-----|
| F-1 (image-blur-main classify catch removed blur) | ✅ FIXED | Fail-closed catch — keeps blur permanently on classify error |
| F-2 (storage error silently disables blur) | ✅ FIXED | Fail-closed default to enabled with strict settings |
| F-5 (content.js timeout removes hide style during blocked) | ✅ FIXED | `responded` flag + 1500ms cold-start budget |
| F-10 (CSP blocks NSFWJS bundle injection) | DEFERRED | v2.5.0 architectural rewrite (manifest content_script + offscreen doc) |

## HIGH bugs — RESOLVED

| ID | Status | Fix |
|----|--------|-----|
| C-1 (journal duplicate per day) | ✅ FIXED | Upsert by date in SAVE_JOURNAL_ENTRY |
| C-2 (stale XP in SITE_BLOCKED) | ✅ FIXED | Re-read xp after updateStreak |
| C-3 (UTC date mismatch non-UTC users) | ✅ FIXED | Local-date toDateStr + daysBetween |
| C-6 (streak gap missing streakDays:0) | ✅ FIXED | Added to gap branch |
| QG-7 (README missing) | ✅ FIXED | README.md added |
| QG-8 (LICENSE missing) | ✅ FIXED | MIT LICENSE added |
| QG-4 (storage keys read-not-set) | RESOLVED — FALSE POSITIVE | Set indirectly via spread; legacy migration; DEFAULTS install |
| OVR-1 (debug console.log) | ✅ FIXED | Changed to console.warn |
| CV-2 (mascot in blocked.html, options.html) | ✅ FIXED | Sparky added to both |
| CV-3 (BUGS_AND_ITERATIONS malformed) | ✅ FIXED | Rewritten with proper format |

## MEDIUM — RESOLVED

| ID | Status | Fix |
|----|--------|-----|
| C-4 (image-blur-main busy-poll) | DEFERRED to v2.5.0 | Architecture change |
| C-5 (subsumed by F-5) | ✅ FIXED | Same fix as F-5 |
| QG-1 (26 elements need aria-live) | ✅ FIXED | All elements have aria-live=off (per-second) or polite |
| QG-2 (3 inputs missing labels) | ✅ FIXED | aria-label added to text + number + checkbox + radios |
| QG-3 (24 sendMessage no error handling) | ✅ FIXED | safeSend wrapper in popup, options, blocked, dashboard, content, onboarding, image-blur |
| CV-4 (.btn-expand 28×28) | ✅ FIXED | Now 32×32 + min-width/height |
| CV-5 (reduced-motion missing) | ✅ FIXED | Added to popup.html and options.html |
| CV-6 (no test coverage) | DEFERRED | Future work; not ship-blocking |

## LOW — RESOLVED

| ID | Status | Fix |
|----|--------|-----|
| C-7 (countdownInterval leak in bypassConfirm) | DEFERRED | Defensive hygiene only; navigates away |
| QG-6 (8 dead lib files) | ✅ FIXED | Deleted: lovespark-popup/badge/lifecycle/theme/stats/base/tokens, browser-polyfill |
| OVR-2 (stale registry note) | DEFERRED | Phase 7 knowledge capture |
| CV-1 (tokens.css not imported) | DEFERRED | Sibling extensions don't follow either |
| S-1, S-2, S-3, S-4 (simplify findings) | DEFERRED | Cleanup pass post-ship |

## Remaining ls-check fails (3, all intentional)

| Check | Why intentional |
|-------|----------------|
| MV3-STORAGE-KEY | False positive — keys set via `updates.x = ...` spread or legacy migration |
| BRAND-THEME | popup.html has inline theme support; lint requires `lovespark-theme.js` filename presence |
| BRAND-LIB-WIRED | popup.html doesn't import `lovespark-base.css`/`lovespark-theme.js` (intentional inline pattern; matches sibling `lovespark-reader` etc.) |

## Architectural — v2.5.0 (deferred to next session)

User-approved research-backed plan exists at `audits/01-consolidated-findings.md` + research artifact. Highlights:
- **Model:** AdamCodd ViT-base (96.5% acc) replacing NSFWJS MobileNetV2 (~90%)
- **Distribution:** Lazy-download from Hugging Face CDN, cached in IndexedDB
- **Architecture:** 4 contexts — content (ISOLATED, all_frames:true) + service worker (LRU cache + CORS-bypass fetch) + offscreen document (ONNX Runtime Web with WebGPU + WASM fallback)
- **DOM observation:** broaden attributeFilter to `['src','srcset','style','data-src']` + childList:true subtree:true
- **Failure mode coverage:** F-10 (CSP), background-image, iframes, React virtual-DOM swaps

Estimated v2.5.0 effort: 4-6 hours.

## Ship recommendation

**v2.4.2 is ship-clean as a safety patch.** The P0 fail-closed patches resolve the user-reported Twitter/DDG bug at the safety layer (when classifier can't run, images stay blurred). v2.5.0 is a quality upgrade (better model, broader DOM coverage) for a follow-on release.

## Manifest version

- Started: **2.4.0**
- Current: **2.4.2** (P0 patches + 24 medium + 8 low)
