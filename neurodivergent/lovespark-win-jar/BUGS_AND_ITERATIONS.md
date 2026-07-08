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
