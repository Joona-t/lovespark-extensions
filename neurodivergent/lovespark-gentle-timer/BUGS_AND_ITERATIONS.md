# Bugs & Iterations

Log every bug fix and iteration with date, problem, root cause, and fix.

---

<!-- Template:
## YYYY-MM-DD — Short description
**Problem:**
**Root cause:**
**Fix:**
-->

## 2026-07-08 — BUG-001: lib/ shared-lib copies stuck on pre-tokens-split architecture

**Problem:** `lib/lovespark-base.css` was still the old monolithic pre-`lovespark-tokens.css` version (no `@import`, no beige/slate theme variants defined via tokens), `lib/lovespark-theme.js` still had the legacy `darkMode` boolean fallback canonical had already dropped, and `lib/lovespark-stats.js`, `lovespark-badge.js`, `lovespark-popup.js`, `lovespark-lifecycle.js` were entirely missing (ls-check BRAND-LIB-SYNC failure).
**Root cause:** Extension was scaffolded 2026-03-19 from an older canonical snapshot and never re-synced as `Extensions/infrastructure/lovespark-shared-lib/` evolved (tokens split, darkMode-fallback removal, footer/theme cleanup).
**Fix:** Copied current canonical `lovespark-base.css`, `lovespark-theme.js`, `lovespark-tokens.css`, `lovespark-stats.js`, `lovespark-badge.js`, `lovespark-popup.js`, `lovespark-lifecycle.js` into `lib/`. `ls-check .` "Shared lib matches canonical" now passes (was BRAND-LIB-SYNC fail before).
**Files:** lib/lovespark-base.css, lib/lovespark-theme.js, lib/lovespark-tokens.css, lib/lovespark-stats.js, lib/lovespark-badge.js, lib/lovespark-popup.js, lib/lovespark-lifecycle.js
**Note (pre-existing, out of scope):** `ls-check .` still fails A11Y-KI001 (`--ls-pink-accent` used as background in popup.css:349) — pre-dates this sweep, unrelated to shared-lib sync, not fixed here.
