# Bugs & Iterations — lovespark-core-notion

## 2026-06-28 — v0.1.36 fix dead onChanged listeners (KI-039)

**Problem:** Toggling a module (or editing state in the options page) did not apply live to open tabs — the change only took effect after a manual page refresh.

**Root cause:** State is persisted to `storage.local`, but both `chrome.storage.onChanged` listeners guarded `if (area !== "sync") return;` — a value left over from the sync→local storage migration. `onChanged` fires with `area === "local"`, so the guard returned early every time and the listener bodies (`inject(newState)` in `core/runtime.js`, `getState().then(render)` in `dashboard/options.js`) never ran. Dead code.

**Fix:** Guard on `"local"` (the area actually written) in both listeners. Surfaced by the new ls-check rule **MV3-STORAGE-AREA-MATCH** (KI-039), added the same day after the identical bug shipped in LoveSpark-Retro-Cursor. `ls-check --only mv3` now reports 7 pass / 0 fail.

**Prevention:** ls-check MV3-STORAGE-AREA-MATCH (cross-file area-vs-write correlation) blocks this class going forward; post-edit-lint carries a fast `[!=]== "sync"` heuristic.

## 2026-04-22 — v0.1.27 unblock strict_fail

**Problem:** `ls-check --strict` failing with A11Y-KI004 (low opacity) and BRAND-THEME (no theme support). Extension stalled at health 76-78.

**Root causes:**
- Disabled-state opacities (0.65) and placeholder opacity (0.75) below 0.85 threshold
- `lovespark-theme.js` not included — BRAND-THEME linter couldn't detect theme wiring
- Adding theme.js introduced A11Y-LIVE hit on `#themeLabel` (dynamic target without aria-live)

**Fixes:**
- Bumped `.toggle-switch:disabled`, `.module-row.disabled` to opacity 0.85; placeholder to 0.9
- Copied `lovespark-theme.js` from canonical shared lib into `lib/`; referenced in `options.html`; `LoveSparkTheme.init()` called in `options.js`
- Added hidden `<span id="themeLabel" aria-live="polite">` so theme-name updates are announced
- Bumped manifest to v0.1.27

## 2026-04-21 — v0.1.25 ship-readiness pass

**Problem:** strict `ls-check` failing with 7 issues blocking CWS submission.

**Root causes:**
- Low opacity values (0.4/0.45/0.6) failing AA contrast in beige theme
- Dynamic DOM targets (`#cursorSettings`, `#dataStatus`) lacked `aria-live`
- `innerHTML = ""` used to clear exclusion list (SEC-INNERHTML)
- 9 shared-lib files copied in but never referenced — dead weight in the zip
- Missing `README.md`, `LICENSE`, `BUGS_AND_ITERATIONS.md`

**Fixes:**
- Raised disabled-state opacities to 0.65, placeholder to 0.75
- Added `aria-live="polite"` to `#cursorSettings`, `#dataStatus`, and `#exclusionList`; `role="status"` on data status
- Replaced `innerHTML = ""` with `replaceChildren()`
- Deleted 9 unused lib files; kept `browser-polyfill.min.js` (referenced by manifest + now by options.html)
- Wired `browser-polyfill.min.js` into `dashboard/options.html` — fixes latent Chrome runtime bug where `browser.storage.local` was undefined
- Added `aria-label` to the "add domain" `+` button
- Generated README / LICENSE / this file
- Bumped manifest version 0.1.24 → 0.1.25

---

## 2026-07-09: Remove duplicate lovespark-tokens.css load from `dashboard/options.html` (fleet 2026-03-28 regression)

**Problem:** `dashboard/options.html` carried a direct `<link>` to `lovespark-tokens.css` even though
`lovespark-base.css` (loaded by the same page) already `@import`s it — the token sheet loaded
twice (fleet 2026-03-28 injection regression; `guard-fleet-sync.sh` Gate 4 blocks fleet
shared-lib syncs while any such reference exists).

**Fix:** Removed the redundant `<link>` (one-line deletion, no other markup touched); refreshed
`lib/lovespark-tokens.css` to the canonical deterministic-header build (values byte-identical to
the 80/80-audited canonical; shared-lib ITER-003 / lovespark-shared-lib@7690133); bumped the
manifest patch version.

**Verification:** zero `lovespark-tokens.css` references remain in this extension's HTML;
`lib/lovespark-base.css` confirmed to `@import url('lovespark-tokens.css')`, so the removal is
cascade-neutral — zero visual change. Fleet guard Gate 4 green on the live tree 2026-07-09;
pre-commit ls-check green at this commit.

## 2026-10-24 — Chromium fleet audit (0.1.37 → 0.1.38)

- Give dashboard switch buttons accessible names, including unavailable modules, so assistive technology can identify the controls.

Validation: manifest/resource and Chromium page checks; see [the audit record](../../docs/audits/2026-10-24.md).
