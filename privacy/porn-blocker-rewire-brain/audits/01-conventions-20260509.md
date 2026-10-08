# Conventions / CLAUDE.md Compliance Review — Rewire Brain v2.4.0

**Lens:** Style, conventions, CLAUDE.md rule compliance, test coverage
**Date:** 2026-05-09
**Verdict:** **WARNINGS**

## CLAUDE.md Rule Compliance

| Rule | Status | Evidence |
|---|---|---|
| #3 Sparky mascot in every UI | PARTIAL | Present in popup.html, dashboard.html, onboarding.html. **MISSING** in blocked.html and options.html (uses generic emojis instead) |
| #4 `--ls-bg-gradient` background on LoveSpark UIs | **VIOLATED** | Token defined in `lib/lovespark-tokens.css:11` but **no HTML file imports tokens.css**. All five pages hardcode gradients |
| #6 No `Co-Authored-By` lines | PASS | git log scan — 0 matches |
| #9 Patch version bumped | NEEDS CHECK | Currently 2.4.0; cannot verify last bump |
| #10 No paid LLM API | PASS | No anthropic/openai/sk- references; NSFWJS on-device |
| MV3 hard rules | PASS | manifest_version 3, service_worker, no remote code |
| `prefers-reduced-motion` | PARTIAL | Present in dashboard.html, onboarding.html, blocked.html. **MISSING** in popup.html and options.html |
| Touch targets ≥ 32×32 | PARTIAL | `.btn-expand` is 28×28 in popup.html (below 32px) |
| WCAG 2.1 AA contrast | PASS | (separate audit confirmed 80/80) |

## Critical Findings

1. **Missing shared lib import** — all 5 HTML pages duplicate `@font-face` and gradient definitions instead of importing `lib/lovespark-tokens.css` and `lib/lovespark-base.css`
2. **No mascot in `blocked.html` or `options.html`** — rule #3 violation (uses brain emoji and generic icons)
3. **`BUGS_AND_ITERATIONS.md` malformed** — lines 3-25 contain broken auto-generated format `## : |2026-03-05|||...` instead of documented `## YYYY-MM-DD: Short Title`

## Important Findings

4. **Touch target below 32px** — `.btn-expand` (popup.html:44) is 28×28px
5. **Missing `prefers-reduced-motion` in popup.html and options.html** — both have CSS transitions/transforms without fallback
6. **CSS code duplication across 5 HTML files** — every page redefines `@font-face`, `*` reset, color hex literals
7. **Hardcoded color values throughout** — `#e91e8c`, `#ff80b0`, `#c2185b` repeated ~50× in popup.html and dashboard.html instead of CSS custom properties
8. **Inline `style=` attributes** — popup.html (3), options.html (3+) — should be in stylesheet for CSP/maintainability
9. **No `aria-live` for dynamic timer** — popup.js:54-65, dashboard.js:64-78 update DOM every second

## Test Coverage

**Zero test files exist.** Critical untested areas:
- `background.js` XP/streak logic (lines 144-178, 389-436) — daily caps, milestone bonuses, gap detection
- `image-blur-main.js` classification queue + cache
- `normalizeDomain`/`normalizeSub` (background.js:584-604) — security-critical input sanitization
- `isValidUrl` (blocked.js:7-10) — XSS prevention
- DNR rule sync (background.js:439-500)

## Verdict

**WARNINGS** — three critical CLAUDE.md violations + zero test coverage. Otherwise solid: security-conscious, MV3-compliant, no paid-API violations, no Co-Authored-By trailers.

Fix path: import shared lib into all 5 HTML pages, add Sparky to blocked.html + options.html, fix BUGS_AND_ITERATIONS.md format, add minimal vitest coverage of background.js XP logic.
