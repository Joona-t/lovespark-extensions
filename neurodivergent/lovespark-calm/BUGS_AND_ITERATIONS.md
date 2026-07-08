# Bugs & Iterations — LoveSpark Calm

<!-- Log every bug fix and iteration with date, problem, root cause, and fix. -->

## 2026-07-08: P0-4-commit-4 — commit CWS/AMO submission bundle, bump to 1.0.30, build store zips

**Problem:** `fleet-to-store` had generated `CWS-LISTING.md`, `PRIVACY.md`, `SUBMIT.md`, and `cws-shots/` (12 CWS visual assets) on disk but they were never committed; `manifest.json` had been bumped to 1.0.30 locally without a commit.
**Root cause:** Same pattern as P0-7-sweep-2 — asset-generation pass wrote files to disk and stopped short of `git add`/commit.
**Fix:** Verified `PRIVACY.md`/`CWS-LISTING.md` accurately cover all three declared permissions (`storage`, `activeTab`, `scripting`) with no host permissions declared or used — matches manifest exactly, no hand-fixes needed. Synced the stale "Applies to version 1.0.29" reference in `PRIVACY.md` to 1.0.30. Committed the bundle + version bump, then ran `scripts/build-zips.sh` to produce `lovespark-calm-chrome.zip`/`lovespark-calm-firefox.zip`; Firefox zip passed `amo-validate.py`.
**Note (out of scope, not fixed here):** `ls-check .` reports a pre-existing gate failure — `PERM-MISSING: chrome.tabs.query used but 'tabs' not in permissions` — present before this commit (confirmed via `git stash`), unrelated to the CWS bundle work in this unit. Also found three untracked `icons/icon-{16,48,128}.png` files (hyphenated names, differ in content from the committed `icon{16,48,128}.png`) that appeared on disk during this session's tooling runs, origin unclear — left untracked, not committed, flagged for follow-up investigation.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/ (12 files), manifest.json (1.0.29 → 1.0.30)

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

## 2026-07-08: R-cws-a11y-3 — README/LICENSE, live theme label, sendMessage error handling, confirm A11Y-CONTRAST blocker

**Problem:** `ls-check .` failed `A11Y-CONTRAST` and warned on `QUAL-README` (missing), `QUAL-LICENSE` (missing), `A11Y-LIVE` (`#themeLabel` text updates with no `aria-live`), and `SEC-SENDMSG` (4 `chrome.runtime.sendMessage` calls in `popup.js` with no error handling), blocking the CWS submission gate.
**Root cause:** README.md and LICENSE were never added. `popup.html`'s theme-label span was missing the `aria-live="polite"` attribute every other repo's theme dropdown carries (screen-reader users get no announcement when the theme changes). `popup.js`'s `sendMessage` calls had no `try/catch` or `lastError` check, so a closed-popup or respawning-service-worker race throws an uncaught error into the console. `A11Y-CONTRAST` is a fleet-wide defect in canonical `lovespark-shared-lib/lovespark-tokens.css` itself: beige hint-text at 0.8 opacity (4.26:1, needs 4.5:1), slate muted-text on glass-strong (4.17:1, needs 4.5:1), slate slider-thumb on track (2.65:1, needs 3.0:1) — matches documented KI-002/KI-003/KI-004. Confirmed real (not a checker false-alarm): `audit-contrast.py --hardcoded` (old fallback values) passes clean, so the live canonical values are the actual regression.
**Fix:** Added README.md (real usage doc, not a stub) and the standard LoveSpark MIT LICENSE. Added `aria-live="polite"` to `#themeLabel` (matches the canonical pattern used in `focus-blossom`/other repos). Added a `sendBg()` wrapper (`try/catch` + `chrome.runtime.lastError` check, same pattern as `lovespark-win-jar`'s `sendBg`) and routed all 4 `sendMessage` call sites through it. `#siteCount` was a false positive — already inside a `<p aria-live="polite">` ancestor, functionally covered; not touched (checker limitation flagged separately for `ls-check.py`). `A11Y-CONTRAST` is out of scope for this repo — belongs in the canonical `lovespark-shared-lib` repo (not one of this unit's assigned repos); flagged separately.
**Files:** README.md (added), LICENSE (added), popup.html, popup.js, manifest.json (1.0.30 → 1.0.31)
