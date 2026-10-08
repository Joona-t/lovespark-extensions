# Bugs & Iterations Log

## 2026-06-28 — Dead storage.onChanged listener (v1.0.29) — KI-039

- **Problem:** Live settings changes never applied to open YouTube tabs; users had to refresh the page before any options edit took effect.
  - **Root cause:** `bindStorageEvents()` in `content.js` guarded on `areaName !== "sync"`, returning early on every event. All settings writes go to `chrome.storage.local` (background.js, options.js, lib/lovespark-lifecycle.js), so `onChanged` always fires with `areaName === "local"` — the listener was dead code. A prior sync→local storage migration left the guard stale. Third instance of KI-039, caught by ls-check rule MV3-STORAGE-AREA-MATCH (after LoveSpark-Retro-Cursor and lovespark-core-notion).
  - **Fix:** Changed the guard to `areaName !== "local"` (kept the `|| !changes[STORAGE_KEY]` clause) so the listener fires on the area writes actually target; added a comment noting the area must match where writes go.

## 2026-04-10 — Strict audit fixes (v1.0.17)

- **Problem:** `#lowVolumeValue` and `#shortcutValue` lacked `aria-live` attributes for dynamic content updates.
  - **Root cause:** Original HTML omitted ARIA live regions on dynamically-updated spans.
  - **Fix:** Added `aria-live="polite"` to both elements.

- **Problem:** Body background used hardcoded gradient instead of `--ls-bg-gradient`.
  - **Root cause:** Options page predated shared lib integration.
  - **Fix:** Replaced inline gradient with `var(--ls-bg-gradient)`.

- **Problem:** 11 shared lib files synced but not referenced in options.html.
  - **Root cause:** Options page was built standalone without shared lib integration.
  - **Fix:** Added `<link>` and `<script>` tags for all shared lib files.

- **Problem:** `chrome.tabs.query` and `chrome.tabs.sendMessage` used without `tabs` permission.
  - **Root cause:** Missing permission declaration in manifest.json.
  - **Fix:** Added `"tabs"` to permissions array.

- **Problem:** LICENSE file missing.
  - **Fix:** Added MIT LICENSE file.

- **Problem:** BUGS_AND_ITERATIONS.md missing.
  - **Fix:** Created this file.

---

## 2026-07-09: Remove duplicate lovespark-tokens.css load from `options.html` (fleet 2026-03-28 regression)

**Problem:** `options.html` carried a direct `<link>` to `lovespark-tokens.css` even though
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
