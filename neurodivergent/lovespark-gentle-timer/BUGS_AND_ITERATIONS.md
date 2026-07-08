# Bugs & Iterations

Log every bug fix and iteration with date, problem, root cause, and fix.

---

<!-- Template:
## YYYY-MM-DD — Short description
**Problem:**
**Root cause:**
**Fix:**
-->

## 2026-07-08 — R-cws-a11y-4: real a11y fixes + footer sync, bump to 1.0.2

**Problem:** `ls-check .` failed A11Y-KI001 (`--ls-pink-accent` used directly as the Save button's background gradient with white text — fails WCAG contrast, per color-decisions.md the pairing is 2.58–3.77:1 depending on theme, needs 4.5:1). `lib/` was also missing `lovespark-footer.css`/`lovespark-footer.js` (present in every sibling extension), and several strict-mode warns were open: no CSP in manifest, `sendMessage` calls without error handling in popup.js/content.js, missing README/LICENSE, missing `aria-live` on the theme label.
**Root cause:** `.save-btn` was styled directly against `--ls-pink-accent` (a decorative-only token per color-decisions.md — "DO NOT use as bg for white text") instead of the verified-safe `--ls-btn-hover-bg` token. The footer files were simply never copied in during scaffolding (unlike the other lib/ files, footer.css/js aren't part of ls-check's SHARED_FILES sync-check list, so the gap went undetected). CSP/try-catch/README/LICENSE/aria-live were never added.
**Fix:**
- `.save-btn` background changed from `linear-gradient(135deg, var(--ls-pink-accent), var(--ls-pink-deep))` to `var(--ls-btn-hover-bg)` — the fleet's documented "White on btn-hover-bg" universal-safe pairing (4.62:1+ across all 4 themes).
- Copied canonical `lib/lovespark-footer.css` + `lib/lovespark-footer.js` in, added the footer markup (`#footerMount`) to `popup.html`, and wired `footerMount.insertAdjacentHTML('beforeend', LoveSparkFooter.render())` in popup.js's init (matching the shared-lib's documented call convention — static string, no user data, not an XSS concern). Also added the (redundant-but-conventional) `lib/lovespark-tokens.css` `<link>` for BRAND-DEAD-LIB parity with sibling extensions.
- Added `content_security_policy.extension_pages` to manifest.json (SEC-CSP).
- Wrapped all 6 `chrome.runtime.sendMessage` call sites (popup.js x3, content.js x3) in try/catch — genuine correctness fix, not just checker appeasement: content scripts throw synchronously on "Extension context invalidated" after a reload/update, which `chrome.runtime.lastError` checks alone don't catch.
- Added `aria-live="polite"` to `#themeLabel` (matches task-anchor's pattern).
- Added README.md and LICENSE (MIT, fleet template).
- Bumped manifest to 1.0.2, rebuilt CWS/AMO zips (Firefox zip AMO-valid).

`ls-check .` now 1 fail (was 2) — the fleet-wide A11Y-CONTRAST issue, not fixable per-repo (see note below). `ls-check . --strict` is 4 fail: A11Y-CONTRAST (fleet-wide) plus 3 investigated-and-not-fixed items below.

**Investigated, NOT changed (false positives / justified design choices):**
- `MV3-STORAGE-KEY` warn ("breakDue_*/lastBreak_* read but never set") is a checker false positive: `background.js` DOES set these keys, via computed property names (`['breakDue_' + breakType]: true`) that the checker's static string search can't resolve. Verified manually — no real bug.
- `A11Y-KI004` warn on `content.css` (`opacity: 0.55` on the floating time badge, `opacity: 0.7` on its domain label) is a content-script overlay rendered directly on arbitrary host-page backgrounds via `backdrop-filter` — it does not participate in the extension's own `--ls-glass`/beige-theme system that KI-004 is about, so a fixed contrast ratio can't even be computed. The dim rest-state is the deliberate "gentle/unobtrusive" UX (extension's whole premise); it goes to full opacity 1.0 on `:hover` and `:focus-visible` (with a visible focus outline), so keyboard/interactive access has full contrast. Left as-is; not chasing a false-positive against the extension's stated design intent.
- `BRAND-DEAD-LIB` warn for `lovespark-popup.js`/`badge.js`/`lifecycle.js`/`stats.js`: gentle-timer's popup.js and content.js implement their own badge/stats logic independently rather than using these shared-lib helpers (they were never part of this extension's original architecture). Wiring in unused `<script>` tags just to silence the grep-based checker would be dead code, not a real fix — left as a pre-existing scaffold/architecture choice, out of scope for an a11y-focused unit.
- `A11Y-CONTRAST` fail is a fleet-wide bug in the canonical `Extensions/infrastructure/lovespark-shared-lib` repo's token values (KI-002/003/004), NOT specific to this extension — `audit-contrast.py` always audits the canonical shared-lib tokens regardless of which repo's `ls-check` invoked it (no per-repo `--css` override is passed), so it is structurally impossible to fix by editing this repo. Flagged for a canonical shared-lib fix pass (spawned separately).

**Files:** popup.css, popup.html, popup.js, content.js, manifest.json (1.0.1 → 1.0.2), lib/lovespark-footer.css (new), lib/lovespark-footer.js (new), README.md (new), LICENSE (new)

## 2026-07-08 — BUG-001: lib/ shared-lib copies stuck on pre-tokens-split architecture

**Problem:** `lib/lovespark-base.css` was still the old monolithic pre-`lovespark-tokens.css` version (no `@import`, no beige/slate theme variants defined via tokens), `lib/lovespark-theme.js` still had the legacy `darkMode` boolean fallback canonical had already dropped, and `lib/lovespark-stats.js`, `lovespark-badge.js`, `lovespark-popup.js`, `lovespark-lifecycle.js` were entirely missing (ls-check BRAND-LIB-SYNC failure).
**Root cause:** Extension was scaffolded 2026-03-19 from an older canonical snapshot and never re-synced as `Extensions/infrastructure/lovespark-shared-lib/` evolved (tokens split, darkMode-fallback removal, footer/theme cleanup).
**Fix:** Copied current canonical `lovespark-base.css`, `lovespark-theme.js`, `lovespark-tokens.css`, `lovespark-stats.js`, `lovespark-badge.js`, `lovespark-popup.js`, `lovespark-lifecycle.js` into `lib/`. `ls-check .` "Shared lib matches canonical" now passes (was BRAND-LIB-SYNC fail before).
**Files:** lib/lovespark-base.css, lib/lovespark-theme.js, lib/lovespark-tokens.css, lib/lovespark-stats.js, lib/lovespark-badge.js, lib/lovespark-popup.js, lib/lovespark-lifecycle.js
**Note (pre-existing, out of scope):** `ls-check .` still fails A11Y-KI001 (`--ls-pink-accent` used as background in popup.css:349) — pre-dates this sweep, unrelated to shared-lib sync, not fixed here.
