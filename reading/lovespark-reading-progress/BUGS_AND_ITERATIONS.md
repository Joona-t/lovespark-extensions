# LoveSpark Reading Progress - Bugs and Iterations

## 2026-07-08: BUG-002 — shared-lib copies drifted from canonical

**Problem:** `lib/lovespark-footer.css` and `lib/lovespark-theme.js` carried uncommitted local edits (hover state → underline instead of opacity; removed legacy `darkMode` boolean fallback in favor of the `theme` string key only) that already matched the canonical shared-lib's pending edits but had never been committed.
**Root cause:** A prior fleet shared-lib sync pass (P0-7-sweep) edited the working tree but never committed.
**Fix:** Verified the two files matched `Extensions/infrastructure/lovespark-shared-lib/` exactly and committed them. `ls-check .` "Shared lib matches canonical" now passes (was failing before this fix).
**Files:** lib/lovespark-footer.css, lib/lovespark-theme.js
**Note (pre-existing, out of scope):** `ls-check .` still fails BRAND-SPARKY (mascot.png missing) and warns QUAL-LICENSE (LICENSE missing) — both pre-date this sweep and are unrelated to shared-lib sync.

## v1.0.0 (2026-03-23) - Initial Build

### Architecture Decisions
- **activeTab + storage + scripting** — Content script auto-injected on page load. Progress bar appears on any scrollable page (>1.5x viewport height).
- **Fixed 3px progress bar** — Top of page, z-index max. Pink gradient matching LoveSpark brand. Non-interactive (pointer-events: none).
- **Time-to-read estimate** — 238 WPM average. Shows "X% · Y min left" badge on scroll. Auto-hides after 2s.
- **Position persistence** — Saves scroll % per URL in local storage. 200-entry cap, 30-day prune.
- **Page completion tracking** — Counts as "read" when scroll reaches 90%. Prevents double-counting via in-memory Set.
- **Smart article detection** — Tries article/main/[role=main] selectors before falling back to body.
- **Popup shows recent pages** — SVG ring progress for each, title + hostname.
- **prefers-reduced-motion** — Disables transitions on progress bar and info badge.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- No resume-from-saved-position (shows bar but doesn't scroll back)
- No reading time history/charts
- No per-site enable/disable
- No custom bar position (top only)
- No dark mode for the info badge (always dark bg)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-23 | Initial build | Expansion Agent Cycle 10 (resumed) |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-10-08: ls-check cleanup (v1.0.31)

**Problem:** `ls-check` failed BRAND-SPARKY: mascot.png missing.
**Root cause:** popup.html already rendered `<img src="mascot.png" alt="Sparky the LoveSpark mascot">` in the header, but the asset was never copied into the extension root, so the popup showed a broken image.
**Fix:** Copied canonical `assets/mascot.png` into the extension root. Bumped version 1.0.30 → 1.0.31. No code changes.
**Files:** mascot.png, manifest.json
