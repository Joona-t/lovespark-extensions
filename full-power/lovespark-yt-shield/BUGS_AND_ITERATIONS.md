# Bugs & Iterations — LoveSpark YouTube Shield

## 2026-04-16

### ls-check --strict: 2 failures unblocked (v1.0.26)
- **Problem:** Stall autopilot flagged strict_fail (health 77). Failures: A11Y-KI008 (popup.css missing prefers-reduced-motion) and BRAND-DEAD-LIB (lib/browser-polyfill.min.js + lib/lovespark-tokens.css not referenced in HTML).
- **Root cause:** popup.css had transitions without reduced-motion fallback; polyfill was never used (all JS calls chrome.* directly); tokens.css was only @imported inside base.css so ls-check's HTML-substring scan missed it.
- **Fix:** Ran `ls-check --fix` to append @media (prefers-reduced-motion: reduce) block. Deleted unused lib/browser-polyfill.min.js. Added explicit <link> to lib/lovespark-tokens.css in popup.html. Bumped manifest version 1.0.25 → 1.0.26. Strict pipeline now 39 pass / 0 fail.

## 2026-04-15

### ls-check strict failures fixed
- **Problem:** 8 strict check failures blocking CWS submission (a11y, brand, quality)
- **Root cause:** popup.html missing shared lib wiring, missing ARIA attributes, missing LICENSE/BUGS_AND_ITERATIONS.md, orphan darkMode storage key
- **Fix:** Wired lovespark-base.css + lovespark-theme.js shared libs into popup.html, removed duplicate theme CSS/JS from popup.css/popup.js, added role="dialog" + aria-labelledby + aria-expanded + aria-live, created LICENSE and this file, bumped version to 1.0.24

---

## 2026-07-09: Remove duplicate lovespark-tokens.css load from `popup.html` (fleet 2026-03-28 regression)

**Problem:** `popup.html` carried a direct reference to `lovespark-tokens.css` even though
`lovespark-base.css` (loaded by the same page) already `@import`s it — the token sheet
loaded twice. This is the fleet-wide 2026-03-28 injection regression; `guard-fleet-sync.sh`
Gate 4 blocks all fleet shared-lib syncs while any such reference exists in extension HTML.

**Fix:** Removed the redundant `<link>` (a one-line deletion; no other markup touched). Also refreshed `lib/lovespark-tokens.css` to the canonical
deterministic-header build (token values byte-identical to the 80/80-audited canonical;
shared-lib ITER-003 / lovespark-shared-lib@7690133) and bumped the manifest patch version.

**Verification:** zero `lovespark-tokens.css` references remain in this extension's HTML;
`origin/main`'s `lib/lovespark-base.css` confirmed to `@import url('lovespark-tokens.css')`,
so removal is cascade-neutral — zero visual change. Fleet guard Gate 4 green on the live
tree 2026-07-09; `ls-check` samples (lovespark-breathe 41 pass / 0 fail,
lovespark-task-anchor 42 pass / 0 fail) after the fleet-wide sync.
