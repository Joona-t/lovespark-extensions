# LoveSpark Brain Dump - Bugs and Iterations

## BUG-001 (2026-10-07): theme dropdown dead — popup.html IDs never matched lib/lovespark-theme.js

**Problem:** Clicking the "Change theme" button in the popup did nothing; only the default retro theme was ever reachable (the stored `theme` still applied on load, but no menu could open to change it).
**Root cause:** `popup.html` declared `id="themeDropdownTrigger"` / `id="themeDropdownMenu"`, while the canonical shared `lib/lovespark-theme.js` `init()` looks up `document.getElementById('themeToggle')` / `('themeMenu')` and silently skips wiring when either is null (`if (toggle && menu) { ... }`). Nothing else in the repo wired those IDs (`grep -n themeDropdown popup.js lib/*.js` → 0 hits). Present since the initial commit; found during PR #1 verification because the PR ships store zips built from this markup. `ls-check` could not see it (its dropdown check only inspects `aria-expanded`).
**Fix:** Renamed the two IDs in `popup.html` to the canonical `themeToggle` / `themeMenu` (same convention as e.g. lovespark-cookie-nuke); CSS hooks are class-based (`.theme-dropdown-trigger`, `.theme-dropdown-menu.open`) so no style change was needed. Added `tests/test_popup_wiring.py`, which asserts every ID `lib/lovespark-theme.js` looks up exists in `popup.html` (fails on the old markup: 2 failures; passes after: 2 OK). Bumped manifest 1.0.35 → 1.0.36.
**Check command:** `python3 -m unittest discover -s tests -v`
**Not fixed here (follow-ups):** (1) `popup.html` links `lib/lovespark-fonts.css`, which this repo never had — canonical `lovespark-shared-lib` ships `lovespark-fonts.css` + `fonts/` (~1.2 MB, 51 woff2); until synced via `scripts/sync-shared-lib.sh`, DM Mono / Press Start 2P / Lora fall back to system `monospace` / `cursive` / `serif`. (2) The committed `*-chrome.zip` / `*-firefox.zip` are at 1.0.35 and contain the previous build's zips nested inside themselves plus `SUBMIT.md` with local `/Users/...` paths — rebuild with `scripts/build-zips.sh` before any store upload.
**Files:** popup.html, manifest.json (1.0.35 → 1.0.36), CHANGELOG.md, tests/test_popup_wiring.py

## 2026-07-08: P0-4-commit-4 — commit CWS/AMO submission bundle, bump to 1.0.32, build store zips

**Problem:** `fleet-to-store` had generated `CWS-LISTING.md`, `PRIVACY.md`, `SUBMIT.md`, and `cws-shots/` (12 CWS visual assets) on disk but they were never committed, and `manifest.json` had been bumped to 1.0.32 locally without a commit.
**Root cause:** Same pattern as P0-7-sweep-2 — asset-generation pass wrote files to disk and stopped short of `git add`/commit.
**Fix:** Verified `PRIVACY.md` (local-storage-only, zero-transmission, single `storage` permission — matches manifest exactly) and `CWS-LISTING.md` (single-purpose + per-permission + host-permission justifications match the actual manifest, which declares only `storage` and no host permissions) were accurate as generated — no hand-fixes needed for this repo. Committed the bundle + version bump, then ran `scripts/build-zips.sh` (canonical) to produce `lovespark-brain-dump-chrome.zip` and `lovespark-brain-dump-firefox.zip`; Firefox zip passed `amo-validate.py` on the first pass.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/ (12 files), manifest.json (1.0.31 → 1.0.32)

## 2026-07-08: P0-7-sweep-2 — shared-lib sync + missing mascot.png + untracked project files

**Problem:** `lib/lovespark-footer.css` and `lib/lovespark-theme.js` on disk already matched canonical `Extensions/infrastructure/lovespark-shared-lib/` byte-for-byte but were never committed. Two dead/unreferenced files (`lib/browser-polyfill.min.js`, `lib/lovespark-tokens.css`) had already been deleted from disk but the deletion was never committed. `popup.html` references `mascot.png` at the repo root but that file had never been committed. `CHANGELOG.md`, `LICENSE`, and `screenshots/` (CWS listing assets) also existed on disk only, never committed.
**Root cause:** Prior sync/asset-generation passes wrote files to disk but stopped short of `git add`/commit — same pattern as lovespark-body-double, likely the same batch run across both repos.
**Fix:** Committed the shared-lib sync, finalized the two dead-file deletions, committed `mascot.png` + `CHANGELOG.md` + `LICENSE` + `screenshots/` as-is. Also committed an unrelated uncommitted a11y/design tweak found alongside the sync (`popup.html` theme-label live region + thought-list aria-live, `popup.css` delete-icon hover opacity 0.6 → 0.85) in its own commit.
**Files:** lib/lovespark-footer.css, lib/lovespark-theme.js, lib/browser-polyfill.min.js (deleted), lib/lovespark-tokens.css (deleted), mascot.png, CHANGELOG.md, LICENSE, screenshots/, popup.html, popup.css

## v1.0.0 (2026-03-21) - Initial Build

### Architecture Decisions
- **storage only** - Simplest possible permission. No alarms, no content scripts.
- **Zero-friction capture** - Open popup, type, Enter. That's it. No categories to choose, no folders, no organization paralysis. Tags are optional.
- **3 optional tags** - Do (action items), Think (ideas/questions), Feel (emotions). Tags are one-tap toggles, not required.
- **7-day retention** - Auto-prunes thoughts older than 7 days. Brain dumps are ephemeral by design — they clear working memory, not create archives.
- **Newest-first display** - Most recent thought at top. Scrollable list with max-height.
- **Per-item delete + bulk clear** - Delete individual thoughts or clear all of today's dump.
- **280 char limit** - Keeps thoughts concise. This is a dump, not a journal.
- **DOM API only** - el() helper for building thought items. Zero innerHTML per KI-011.

### Known Limitations (V1)
- No search or filter by tag
- No export functionality
- No keyboard shortcut to open popup (would need commands API — V2)
- No "done" checkbox for Do-tagged items
- No drag-to-reorder

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-21 | Initial build | Expansion Agent Cycle 7 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-07-08: R-cws-a11y-3 — restore BRAND-LIB-SYNC (lovespark-tokens.css)

**Problem:** `ls-check .` failed `BRAND-LIB-SYNC` — `lib/lovespark-tokens.css` was missing locally, blocking the CWS submission gate (`ls-check . --gate cws`).
**Root cause:** `lib/lovespark-tokens.css` was never synced into this repo's `lib/` (or was dropped in a prior dead-file cleanup pass); `ls-check`'s `BRAND-LIB-SYNC` check requires the full 7-file canonical shared-lib set present and byte-identical regardless of HTML usage (unused-file cleanup is a separate, non-blocking `BRAND-DEAD-LIB` warning).
**Fix:** Copied `lovespark-tokens.css` back from canonical `Extensions/infrastructure/lovespark-shared-lib/` (byte-identical, verified via md5) — did not run the fleet-wide `sync-shared-lib.sh` since it walks every extension under `Extensions/` and this unit is scoped to 6 repos only. Also confirmed `A11Y-CONTRAST` (3 failures: beige hint-text opacity, slate muted-on-glass-strong, slate slider-thumb-on-track — KI-002/003/004) is a fleet-wide defect in canonical `lovespark-shared-lib/lovespark-tokens.css` itself (reproduced with `--hardcoded` fallback passing clean, proving the live canonical values are the actual regression, not a per-repo issue) — out of scope for this repo, flagged separately for the `lovespark-shared-lib` repo.
**Files:** lib/lovespark-tokens.css (restored), manifest.json (1.0.32 → 1.0.33)

## 2026-07-08: P2-sync-3 — re-sync canonical tokens.css after KI-002/003/004 contrast fix, rebuild zips

**Problem:** `ls-check .` was blocked on `A11Y-CONTRAST` (3 failures: beige hint-text 0.8-opacity 4.26:1, slate muted-on-glass-strong 4.17:1, slate slider-thumb-on-track 2.65:1 — KI-002/003/004), previously confirmed fleet-wide and out of scope for this repo (logged in the prior R-cws-a11y-3 entry above). During this unit, a concurrent session landed the actual fix in canonical (`lovespark-shared-lib` commit 41b43cc "fix: canonical lovespark-tokens.css fails its own contrast gate (BUG-002 / KI-002, KI-003, KI-004)"), darkening `--ls-text-dark` to #564424, `--ls-glass-border` to #3e3e3e, and lightening `--ls-text-muted` to #a8a8a8 for the affected themes.
**Root cause:** This repo's `lib/lovespark-tokens.css` was still on the pre-fix canonical snapshot; the fix landing in the shared-lib repo mid-session left this repo one sync behind.
**Fix:** Re-copied `lovespark-tokens.css` from canonical `Extensions/infrastructure/lovespark-shared-lib/` (md5-verified byte-identical post-copy). `ls-check .` now passes `A11Y-CONTRAST` clean (verified via `audit-contrast.py --json`: 80 pass, 0 fail across all 4 themes) and `BRAND-LIB-SYNC`. One residual fail remains: `BRAND-TOKEN-DRIFT` — the fix was hand-patched directly into the shared-lib CSS but `design-tokens/tokens.json` (the generator source of truth) was never updated to match, so `generate-tokens.py`'s output no longer matches canonical by md5. This check compares only canonical `design-tokens/` + `lovespark-shared-lib/` files (identical for every repo in the fleet), is not fixable at the per-repo level, and is outside this unit's assigned repos (`lovespark-shared-lib`/`design-tokens`) — flagged as a separate follow-up task rather than patched here. Bumped manifest.json, rebuilt `*-chrome.zip`/`*-firefox.zip` via `scripts/build-zips.sh`; Firefox zip passed `amo-validate.py`.
**Files:** lib/lovespark-tokens.css (re-synced), manifest.json (1.0.33 → 1.0.34)


## 2026-07-08: P2-sync-3 (completion pass) — close ls-check-to-zero gate, rebuild zips

**Problem:** `ls-check .` was clean on shared-lib sync (tokens already matched canonical from the prior P2-sync-3 commit) but still reported `BRAND-TOKEN-DRIFT` (fail) and, on this repo, a `QUAL-CHANGELOG-DRIFT` (warn). Distributable zips were also stale relative to the current manifest version.
**Root cause:** `BRAND-TOKEN-DRIFT` is a canonical-infra gap — the KI-002/003/004 contrast fix was hand-patched directly into `lovespark-shared-lib/lovespark-tokens.css` but `design-tokens/tokens.json` (the generator source of truth, outside this unit's assigned repos) was never regenerated to match, so `generate-tokens.py`'s output no longer md5-matches canonical for any fleet repo. Not fixable at the per-repo level.
**Fix:** Bumped manifest.json 1.0.34 → 1.0.35, added a matching CHANGELOG.md entry where drift was flagged, and rebuilt `*-chrome.zip`/`*-firefox.zip` via `scripts/build-zips.sh` (Firefox zip passed `amo-validate.py`). `BRAND-TOKEN-DRIFT` remains open and is flagged as a separate follow-up task against `lovespark-shared-lib`/`design-tokens` (not one of this unit's repos).
**Files:** manifest.json (1.0.34 → 1.0.35), lovespark-brain-dump-chrome.zip, lovespark-brain-dump-firefox.zip
