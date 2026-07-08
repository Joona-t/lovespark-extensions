# Bugs & Iterations — LoveSpark Calm

<!-- Log every bug fix and iteration with date, problem, root cause, and fix. -->

## 2026-07-08: P0-7-sweep-2 — track shared-lib files sitting untracked on disk

**Problem:** `lib/lovespark-badge.js`, `lifecycle.js`, `popup.js`, `stats.js`, `lovespark-tokens.css` already existed on disk (byte-identical to canonical `Extensions/infrastructure/lovespark-shared-lib/`) but were never `git add`ed — they weren't referenced in `popup.html` either, so this is unused-but-present shared-lib boilerplate (not a functional gap). `lib/lovespark-base.css`, `lovespark-footer.css`, `lovespark-theme.js`, and `popup.css` also had uncommitted working-tree diffs, already matching canonical.
**Root cause:** A prior sync pass copied the full canonical `lib/` set into place without checking per-extension usage or committing.
**Fix:** Verified all lib files are byte-identical to canonical (no local drift, nothing to port back) and tracked/committed them as-is — leaving the unused-file cleanup question (same as was done for lovespark-breathe/body-double) for a separate pass, out of scope here. Committed the `popup.css` design tweak found alongside it (toggle/intensity/site-button active-state gradient: `--ls-pink-accent → --ls-pink-deep` solid, was `--ls-pink-accent → --ls-pink-deep` gradient) separately.
**Files:** lib/lovespark-badge.js, lib/lovespark-lifecycle.js, lib/lovespark-popup.js, lib/lovespark-stats.js, lib/lovespark-tokens.css, lib/lovespark-base.css, lib/lovespark-footer.css, lib/lovespark-theme.js, popup.css

| Date | Problem | Root Cause | Fix |
|------|---------|------------|-----|
| | | | |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
