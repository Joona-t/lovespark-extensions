# LoveSpark Win Jar - Bugs and Iterations

## 2026-07-08: P0-4-commit-4 — commit CWS/AMO submission bundle, bump to 1.0.30, build store zips

**Problem:** `fleet-to-store` had generated `CWS-LISTING.md`, `PRIVACY.md`, `SUBMIT.md`, and `cws-shots/` (12 CWS visual assets) on disk but they were never committed; `manifest.json` had been bumped to 1.0.30 locally without a commit.
**Root cause:** Same generation-without-commit pattern seen fleet-wide (P0-7-sweep-2 in sibling repos).
**Fix:** Verified `PRIVACY.md`/`CWS-LISTING.md` accurately declare the single `storage` permission and no host permissions — matches manifest exactly, no hand-fixes needed. Synced the stale "Applies to version 1.0.29" reference in `PRIVACY.md` to 1.0.30. Committed the bundle + version bump, then ran `scripts/build-zips.sh` to produce `lovespark-win-jar-chrome.zip`/`lovespark-win-jar-firefox.zip`; Firefox zip passed `amo-validate.py`.
**Note (out of scope, not fixed here):** `ls-check .` reports a pre-existing gate failure — `BRAND-SPARKY: mascot.png missing` (repo root has no `mascot.png`, unlike sibling repos) — unrelated to the CWS bundle work in this unit, left for a mascot-asset fix pass. `lib/lovespark-footer.css` and `lib/lovespark-theme.js` were already modified in the working tree from an earlier, unrelated session; left untouched/uncommitted here since they're outside this unit's scope.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/ (12 files), manifest.json (1.0.29 → 1.0.30)

## v1.0.0 (2026-03-21) - Initial Build

### Architecture Decisions
- **storage only** - Simplest possible permission surface. No alarms needed (wins are user-initiated, not scheduled).
- **Win jar metaphor** - Targets ADHD rejection sensitivity dysphoria (RSD) and negative self-talk. The jar fills visually as you log wins, providing tangible proof of progress.
- **6 jar levels** - Empty jar, A few wins (5+), Getting full (15+), Half full (30+), Nearly full (50+), Overflowing (100+). Each level has a distinct emoji.
- **Shake for random win** - The core loop: when feeling down, shake the jar to surface a random past victory. Combats the ADHD tendency to fixate on failures.
- **500 win cap** - Auto-prunes oldest entries. Keeps storage bounded while preserving a rich history.
- **Streak tracking** - Consecutive days with at least one win logged. Encourages daily use without punishment for breaks.
- **8 celebration messages** - Rotated randomly on each win add. Positive reinforcement.
- **DOM API only** - el() helper for building win items. Zero innerHTML per KI-011.

### Known Limitations (V1)
- No win categories/tags (V2 candidate)
- No export/share functionality
- No weekly summary view
- No search through past wins
- Delete only available via background message (no UI button in V1)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-21 | Initial build | Expansion Agent Cycle 6 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-07-08: R-cws-a11y-3 — mascot, LICENSE, broken theme dropdown, todayWinsList live region, confirm A11Y-CONTRAST blocker

**Problem:** `ls-check .` failed `BRAND-SPARKY` (`mascot.png` missing, rule #3 violation) and `A11Y-CONTRAST`, plus warned on `QUAL-LICENSE` (missing) and `A11Y-LIVE`. While auditing `A11Y-LIVE`, found a real functional bug: the theme dropdown was completely non-interactive. `popup.html` used `id="themeDropdownTrigger"`/`id="themeDropdownMenu"`, but the shared `lib/lovespark-theme.js` (`LoveSparkTheme.init()`, called from `popup.js`) looks up `getElementById('themeToggle')`/`getElementById('themeMenu')` — both lookups returned `null`, so the `if (toggle && menu)` guard skipped wiring the click handlers entirely. Users could never open the theme menu; only the on-load `apply(theme || 'retro')` ran.
**Root cause:** `mascot.png` was referenced by `popup.html` (`<img src="mascot.png">`, already correct alt text) but the file itself was never committed. LICENSE was never added. The theme-dropdown id mismatch was introduced when this popup was authored — it never matched the canonical shared-lib convention (`themeToggle`/`themeMenu`/`themeLabel`) used by every other repo in this batch (verified against `focus-blossom`), so the bug shipped from day one and no visible error was thrown (both `getElementById` calls just silently returned `null`).
**Fix:** Copied `mascot.png` from the canonical `Extensions/assets/mascot.png` (md5-verified identical to the copy already used in `lovespark-calm` etc.). Added the standard LoveSpark MIT LICENSE. Renamed `popup.html`'s theme-dropdown ids to the canonical `themeToggle`/`themeMenu` and wrapped the label text in `<span id="themeLabel" aria-live="polite">` (fixes both the dead click handlers and the missing live-region announcement) — verified no CSS/JS referenced the old ids by id-selector (only classes), so the rename is safe. Added `aria-live="polite"` to `#todayWinsList` (the one dynamic target with no covering ancestor live region; `#jarEmoji`/`#jarLabel`/`#jarCount`/`#streakText` are already inside `.jar-section[aria-live="polite"]` and `#randomWinText`/`#randomWinDate` inside `#randomWin[aria-live="polite"]` — checker limitation flagged separately for `ls-check.py`). `A11Y-CONTRAST` is out of scope for this repo — belongs in the canonical `lovespark-shared-lib` repo (not one of this unit's assigned repos); flagged separately.
**Files:** mascot.png (added), LICENSE (added), popup.html, manifest.json (1.0.30 → 1.0.31)

## 2026-07-08: P2-sync-3 — re-sync canonical tokens.css after KI-002/003/004 contrast fix, rebuild zips

**Problem:** `ls-check .` was blocked on `A11Y-CONTRAST` (3 failures: beige hint-text 0.8-opacity 4.26:1, slate muted-on-glass-strong 4.17:1, slate slider-thumb-on-track 2.65:1 — KI-002/003/004), previously confirmed fleet-wide and out of scope for this repo (logged in the prior R-cws-a11y-3 entry above). During this unit, a concurrent session landed the actual fix in canonical (`lovespark-shared-lib` commit 41b43cc "fix: canonical lovespark-tokens.css fails its own contrast gate (BUG-002 / KI-002, KI-003, KI-004)"), darkening `--ls-text-dark` to #564424, `--ls-glass-border` to #3e3e3e, and lightening `--ls-text-muted` to #a8a8a8 for the affected themes.
**Root cause:** This repo's `lib/lovespark-tokens.css` was still on the pre-fix canonical snapshot; the fix landing in the shared-lib repo mid-session left this repo one sync behind.
**Fix:** Re-copied `lovespark-tokens.css` from canonical `Extensions/infrastructure/lovespark-shared-lib/` (md5-verified byte-identical post-copy). `ls-check .` now passes `A11Y-CONTRAST` clean (verified via `audit-contrast.py --json`: 80 pass, 0 fail across all 4 themes) and `BRAND-LIB-SYNC`. One residual fail remains: `BRAND-TOKEN-DRIFT` — the fix was hand-patched directly into the shared-lib CSS but `design-tokens/tokens.json` (the generator source of truth) was never updated to match, so `generate-tokens.py`'s output no longer matches canonical by md5. This check compares only canonical `design-tokens/` + `lovespark-shared-lib/` files (identical for every repo in the fleet), is not fixable at the per-repo level, and is outside this unit's assigned repos (`lovespark-shared-lib`/`design-tokens`) — flagged as a separate follow-up task rather than patched here. Bumped manifest.json, rebuilt `*-chrome.zip`/`*-firefox.zip` via `scripts/build-zips.sh`; Firefox zip passed `amo-validate.py`.
**Files:** lib/lovespark-tokens.css (re-synced), manifest.json (1.0.31 → 1.0.32)


## 2026-07-08: P2-sync-3 (completion pass) — close ls-check-to-zero gate, rebuild zips

**Problem:** `ls-check .` was clean on shared-lib sync (tokens already matched canonical from the prior P2-sync-3 commit) but still reported `BRAND-TOKEN-DRIFT` (fail). Distributable zips were also stale relative to the current manifest version.
**Root cause:** `BRAND-TOKEN-DRIFT` is a canonical-infra gap — the KI-002/003/004 contrast fix was hand-patched directly into `lovespark-shared-lib/lovespark-tokens.css` but `design-tokens/tokens.json` (the generator source of truth, outside this unit's assigned repos) was never regenerated to match, so `generate-tokens.py`'s output no longer md5-matches canonical for any fleet repo. Not fixable at the per-repo level.
**Fix:** Bumped manifest.json 1.0.32 → 1.0.33 and rebuilt `*-chrome.zip`/`*-firefox.zip` via `scripts/build-zips.sh` (Firefox zip passed `amo-validate.py`). `BRAND-TOKEN-DRIFT` remains open and is flagged as a separate follow-up task against `lovespark-shared-lib`/`design-tokens` (not one of this unit's repos).
**Files:** manifest.json (1.0.32 → 1.0.33), lovespark-win-jar-chrome.zip, lovespark-win-jar-firefox.zip

## 2026-10-07: BUG-001 — popup.html loaded a non-existent `lib/lovespark-fonts.css`

**Problem:** `popup.html` line 8 has `<link rel="stylesheet" href="lib/lovespark-fonts.css">` but the file was never committed (present on `main` since v1.0.0 and in every store zip through 1.0.33). Every popup open logged a failed stylesheet load; `--ls-font-body: 'DM Mono'` / `--ls-font-display: 'Press Start 2P'` / beige `'Lora'` silently fell back to `monospace` / `cursive` / `Georgia`, so the shipped UI never rendered the design-system fonts. The CSP `font-src 'self'` hardening in this PR had nothing to apply to.
**Root cause:** `scripts/sync-shared-lib.sh` syncs the JS/CSS lib files but not `lovespark-fonts.css` + `fonts/`; this repo was scaffolded with the `<link>` but the font assets were never copied in (60 sibling extensions ship `lib/lovespark-fonts.css` + `lib/fonts/`).
**Fix:** Copied canonical `Extensions/infrastructure/lovespark-shared-lib/lovespark-fonts.css` (md5 `8cd206e8ba94fae29baa23f2dbdefa84`) and the 51 `fonts/*.woff2` files into `lib/`, matching the fleet convention. Bumped manifest 1.0.33 → 1.0.34, rebuilt both zips (Firefox zip passed `amo-validate.py`).
**Regression check (no test harness in this repo):**
`for f in $(grep -oE '(src|href)="[^"]+"' popup.html | cut -d'"' -f2 | grep -vE '^https?:'); do [ -f "$f" ] || echo "MISSING $f"; done` → must print nothing.
`grep -oE "url\(fonts/[^)]+\)" lib/lovespark-fonts.css | sed 's/url(//;s/)//' | sort -u | while read f; do [ -f "lib/$f" ] || echo "MISSING lib/$f"; done` → must print nothing.
**Files:** lib/lovespark-fonts.css (added), lib/fonts/ (51 files added), manifest.json (1.0.33 → 1.0.34), PRIVACY.md (version ref synced), lovespark-win-jar-chrome.zip, lovespark-win-jar-firefox.zip

## 2026-10-07: BUG-002 — store zips nested the previous zips and shipped submission docs with local paths

**Problem:** `unzip -l lovespark-win-jar-chrome.zip` (1.0.33) listed `lovespark-win-jar-chrome.zip` (18 KB, v1.0.0) and `lovespark-win-jar-firefox.zip` (21 KB) *inside* the package, plus `CWS-LISTING.md` and `SUBMIT.md`. `SUBMIT.md` contains three `~/...` filesystem paths, so every store download would have carried the author's local home-directory layout, and each rebuild would re-nest the previous zips.
**Root cause:** `scripts/build-zips.sh` stages the whole extension dir and only excludes a fixed list (cws-shots, BUGS, CHANGELOG, …); it has no `*.zip` exclude, and this repo had no `.zipignore` (the sibling convention for excluding `CWS-LISTING.md` / `SUBMIT.md`). Zips are committed to the repo root, so the staged tree always contained the previous build.
**Fix:** Added `.zipignore` with `CWS-LISTING.md`, `SUBMIT.md`, `*.zip` (honored by `build-zips.sh` via `--exclude-from`). Rebuilt zips: 77 files each, zero nested archives, zero submission docs. Follow-up for the fleet (out of scope here): add `--exclude '*.zip'` to `build-zips.sh` itself so no repo can regress this.
**Regression check:** `unzip -Z1 lovespark-win-jar-chrome.zip | grep -cE "\.zip$|SUBMIT\.md|CWS-LISTING\.md"` → must print `0` (same for the Firefox zip); `unzip -p lovespark-win-jar-chrome.zip SUBMIT.md 2>&1 | grep -c /Users/` → `0`.
**Files:** .zipignore (added), lovespark-win-jar-chrome.zip, lovespark-win-jar-firefox.zip
