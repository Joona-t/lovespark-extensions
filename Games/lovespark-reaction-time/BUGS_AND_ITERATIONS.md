# Bugs & Iterations — LoveSpark Reaction Time

## 2026-04-01 — CWS Prep: popup.js rewrite
- **Problem:** popup.js was a generic LoveSpark template referencing non-existent elements (#enableToggle, #cuteMsg, #statusIcon, #statusText). Game logic was completely missing.
- **Root cause:** Scaffold generated boilerplate popup.js without customizing for reaction time game mechanics.
- **Fix:** Rewrote popup.js with full reaction time game state machine (idle → waiting → ready → result/early), proper sendMessage error handling, keyboard accessibility.

## 2026-04-01 — Missing LICENSE and BUGS_AND_ITERATIONS.md
- **Problem:** ls-check --strict failed on QUAL-LICENSE and QUAL-BUGS-LOG.
- **Root cause:** Not included in initial scaffold.
- **Fix:** Added MIT LICENSE and this file.

## BUG-001 (2026-07-08): CWS-prep work (popup rewrite, LICENSE, icons, screenshots) sat uncommitted; lib/ had shared-lib drift

**Problem:** Two separate defects found during a fleet shared-lib sync sweep. (1) The 2026-04-01 popup.js rewrite, popup.html accessibility fixes, LICENSE, this BUGS_AND_ITERATIONS.md file, `icons/` (icon-16/48/128.png), and `screenshots/` had never been committed — `manifest.json` has referenced `icons/icon-*.png` since the initial commit, so the last committed state of this repo would fail to load as an extension (missing icon files). (2) `lib/lovespark-footer.css` and `lib/lovespark-theme.js` in the working tree differed from the last commit (uncommitted) — `.ls-suite-btn:hover` used `opacity: 0.75` instead of `text-decoration: underline`, and `lovespark-theme.js` read a stale `darkMode` fallback key canonical no longer sets.
**Root cause:** (1) A prior session did the CWS-prep work and self-documented it in this file but never ran `git commit`. (2) A prior shared-lib sync pass copied canonical's current files into `lib/` but skipped the commit step (same gap found across 6 game repos in this sweep).
**Fix:** Committed the pre-existing CWS-prep work as-is (game logic, accessibility, LICENSE, icons, screenshots — all already correct, just uncommitted). Verified `lib/lovespark-footer.css` and `lib/lovespark-theme.js` working-tree content is a byte-for-byte match for `Extensions/infrastructure/lovespark-shared-lib/` before committing the sync. Bumped patch version.
**Files:** popup.html, popup.js, LICENSE (new), CHANGELOG.md (new), icons/ (new), screenshots/ (new), lib/lovespark-footer.css, lib/lovespark-theme.js, manifest.json (1.0.29 → 1.0.30)

## BUG-002 (2026-10-07): CHANGELOG.md top entry (1.0.3) drifted from manifest.json version (1.0.30)

**Problem:** `ls-check . --strict` failed on `QUAL-CHANGELOG-DRIFT` -- the new CHANGELOG.md (added in PR #1) topped out at 1.0.3 while manifest.json was bumped to 1.0.30 in the same PR.
**Root cause:** The CWS-prep session wrote CHANGELOG.md when the manifest read 1.0.3; later patch bumps (1.0.4 -> 1.0.30) never got CHANGELOG entries.
**Fix:** Added a `## 1.0.30` entry summarising the PR #1 changes. Docs-only, no code change, no manifest bump.
**Check:** `ls-check . --strict` -> QUAL-CHANGELOG-DRIFT gone (only the pre-existing MV3-STORAGE-KEY warning remains on main).
