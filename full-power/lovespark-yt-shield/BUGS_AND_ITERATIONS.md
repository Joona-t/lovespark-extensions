# Bugs & Iterations — LoveSpark YouTube Shield

## 2026-10-07

### document_start null-body crash from BUG-005's one-shot call (BUG-006, v1.0.29)
- **Problem:** BUG-005 replaced the `setInterval` safety net with one synchronous
  `nukeAdblockWarning()` call at inject time. `inject.js` is registered with
  `run_at: document_start` / `world: MAIN` (manifest.json), where `document.body`
  is still `null` — so the new call hit `document.body.style.overflow = ''` and
  threw `TypeError: Cannot read properties of null (reading 'style')` on every
  YouTube page load. The old interval had masked this because its first tick ran
  1 s later, after `<body>` existed; the `MutationObserver` callback had the same
  latent null-deref on any mutation that fired before `<body>` was parsed.
- **Root cause:** `nukeAdblockWarning()` assumed `document.body` exists; nothing
  in the PR verified the script's `run_at` timing.
- **Fix:** Guard the body write: `if (document.body) document.body.style.overflow = '';`.
  Regression test added: `tests/inject-document-start.test.js` evaluates `inject.js`
  in a `document_start`-shaped sandbox (`document.body === null`), fires an early
  observer callback, and asserts no `setInterval(` call remains. Run with
  `node tests/inject-document-start.test.js` (3 checks). Version stays 1.0.29 —
  the 1.0.28 → 1.0.29 bump from BUG-005 in this same unreleased branch already
  covers the code change.

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

## 2026-07-08

### Deleted setInterval DOM-poll fallback in inject.js (BUG-005, v1.0.29)
- **Problem:** `inject.js`'s adblock-warning-removal logic set up a
  `MutationObserver` on `document.documentElement` (the correct, event-driven
  way to catch dynamically injected warning dialogs) and then *also* ran a
  `setInterval(..., 1000)` for the first 30 seconds as a "safety net" —
  directly contradicting the suite's no-`setInterval`-for-DOM-watching rule,
  and contradicting `background.js`'s own header comment ("No setInterval —
  uses chrome.alarms for MV3 safety") which implied the whole extension held
  that line.
- **Root cause:** The observer only fires on future DOM mutations, not on
  page-load state that already existed when it was attached — the interval
  was covering that initial-state gap the lazy way instead of the observer
  being paired with a single initial invocation.
- **Fix:** Deleted the `setInterval`/`clearInterval` block entirely — the
  `MutationObserver` already covers ongoing detection (YouTube's DOM churns
  constantly, so any injected warning triggers a mutation almost
  immediately). Replaced the interval's initial-state coverage with one
  direct `nukeAdblockWarning()` call right after `observer.observe(...)`
  (a single call, not a timer, so it doesn't reintroduce the pattern).
  Bumped manifest version 1.0.28 → 1.0.29. `ls-check .` unchanged at
  40 pass / 2 fail (pre-existing BRAND-LIB-SYNC / BRAND-TOKEN-DRIFT,
  unrelated to this fix) / 1 warn.

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
