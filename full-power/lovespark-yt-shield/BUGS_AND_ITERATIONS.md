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
