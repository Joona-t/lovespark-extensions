# Bugs & Iterations — LoveSpark Popup Fortress

## 2026-03-29 — Strict audit fixes (overnight automation)

### A11Y-KI004: Low opacity on hover text
- **Problem:** `.ls-suite-btn:hover` used `opacity: 0.75`, failing contrast in beige theme
- **Root cause:** Opacity-based hover reduces contrast below WCAG threshold on light backgrounds
- **Fix:** Replaced `opacity: 0.75` with `text-decoration: underline` for hover feedback

### MV3-STORAGE-KEY: darkMode read without set
- **Problem:** `popup.js` read `darkMode` key from storage but never wrote it — stale migration path
- **Root cause:** Legacy dark mode toggle was replaced by theme system but read was never cleaned up
- **Fix:** Removed `darkMode` from storage.get call; theme system handles dark mode via theme key

### BRAND-DEAD-LIB: Unused shared lib files
- **Problem:** 6 lib files synced but not referenced in popup.html
- **Root cause:** `sync-shared-lib.sh` copies all files; this extension only uses base, fonts, footer, theme
- **Fix:** Removed unused files (lovespark-popup.js, lovespark-badge.js, lovespark-lifecycle.js, browser-polyfill.min.js, lovespark-stats.js, lovespark-tokens.css)

### QUAL-LICENSE: Missing LICENSE
- **Problem:** No LICENSE file present
- **Fix:** Added MIT LICENSE

### QUAL-BUGS-LOG: Missing BUGS_AND_ITERATIONS.md
- **Problem:** Required by CLAUDE.md but not present
- **Fix:** Created this file

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
