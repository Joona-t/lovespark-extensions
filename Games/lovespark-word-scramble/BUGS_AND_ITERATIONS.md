# Bugs & Iterations — LoveSpark Word Scramble

## BUG-001 (2026-07-08): lib/ shared-lib copies had uncommitted drift from canonical

**Problem:** `lib/lovespark-footer.css` and `lib/lovespark-theme.js` in the working tree differed from the last commit (uncommitted) — `.ls-suite-btn:hover` used `opacity: 0.75` instead of `text-decoration: underline`, and `lovespark-theme.js` read a stale `darkMode` fallback key that canonical shared-lib no longer sets. Both files already matched `Extensions/infrastructure/lovespark-shared-lib/` byte-for-byte in the working tree, they just had never been committed.
**Root cause:** A prior shared-lib sync pass copied the current canonical files into this repo's `lib/` but the commit step was never run (fleet P0-7-sweep-1 unit spec flagged this as a known gap across 6 game repos).
**Fix:** Verified working-tree files are an exact match for canonical (diffed both dirs), committed the sync as-is. No porting into canonical was needed since local already matched canonical; no stale drift needed reverting.
**Files:** lib/lovespark-footer.css, lib/lovespark-theme.js, manifest.json (1.0.29 → 1.0.30)

## 2026-10-24 — Chromium fleet audit (1.0.30 → 1.0.31)

- Wire the shared theme menu to this popup’s dropdown IDs, persist selections, and support Escape with accurate expanded state.
- Insert the shared footer HTML into its mount instead of discarding the renderer’s return value.
- Restore missing manifest icons from the identical repository icon generator output.
- Remove duplicate local theme listeners now handled by the shared theme module.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
