# Bugs & Iterations — LoveSpark Dashboard

Running log of every bug fix and iteration. Append new entries at the top.

## 2026-04-22 — v1.0.29 dead-lib cleanup

**Problem:** `ls-check` flagged 9 unreferenced files in `lib/` (BRAND-DEAD-LIB)
and a phantom `#themeLabel` aria-live warning coming from the unused
`lovespark-theme.js`. Health stuck at 83, stall-detector had flagged the
extension as low-health for 5 nights.

**Root cause:** Dashboard is self-contained with its own embedded CSS and
theme styling; the shared-lib files reintroduced by an earlier sync were never
wired into `dashboard.html`.

**Fix:** Deleted the 9 unused lib files (kept `lovespark-fonts.css` which is
actually referenced). Bumped manifest to `1.0.29`. `ls-check` now reports
39/39 pass, health 85.

## 2026-04-17 — v1.0.21 strict-pass sweep

**Problems:**
1. Four `innerHTML` assignments in `dashboard.js` flagged by `ls-check` as XSS
   surface, even though inputs were escaped.
2. `#grid` was a dynamic region with no `aria-live`, so screen-reader users
   heard nothing when filters changed or extensions were toggled.
3. `background.js` called `chrome.tabs.query({ url })` without the `tabs`
   permission — on Chrome the `url` filter silently returns nothing, which
   meant the "focus existing tab" path never triggered and a second Dashboard
   tab was opened every click.
4. Body background hard-coded to `#0D0D0D`, bypassing the LoveSpark
   `--ls-bg-gradient` convention.
5. 10 shared-lib files shipped in `lib/` despite the dashboard being
   self-contained — unused bytes in the CWS package.
6. Repo missing `README.md`, `LICENSE`, and `BUGS_AND_ITERATIONS.md`.

**Root causes:**
- Early prototype built template strings for speed; escape helpers masked the
  lint signal but not the risk class.
- Dashboard was scaffolded from an extension template that bundles the full
  shared lib by default.
- `chrome.tabs.query` URL-filter behaviour is documented as needing host or
  `tabs` access; not caught because the path is only exercised on the second
  click in a session.

**Fixes:**
- Replaced all `innerHTML` writes with `document.createElement` / `textContent`
  through a small `makeEl`/`clearChildren` helper set.
- Added `aria-live="polite"` and `aria-label` to `#grid`.
- Added `tabs` to `permissions`.
- Introduced `--ls-bg-gradient` via `:root` and applied it to `body`.
- Deleted unused `lib/` files; kept only `lovespark-fonts.css` + `fonts/`.
- Added `README.md`, `LICENSE` (MIT), and this log.
- Bumped `manifest.json` from `1.0.20` to `1.0.21`.
