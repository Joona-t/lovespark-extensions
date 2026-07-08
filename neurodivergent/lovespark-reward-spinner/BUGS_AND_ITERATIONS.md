# Bugs & Iterations — LoveSpark Reward Spinner

## 2026-07-08: R-cws-a11y-4-followup — footer never actually rendered (wrong LoveSparkFooter.render() call signature)

**Problem:** `popup.js` called `LoveSparkFooter.render(footerMount)`, but canonical `lovespark-footer.js`'s `render()` takes no arguments and returns an HTML string — it never touches the passed element. The return value was discarded, so `#footerMount` stayed empty and the LoveSpark Suite / Ko-fi / Report-a-Bug footer never appeared in the popup at all.
**Root cause:** Call-site didn't match the documented usage in the shared-lib source comment (`document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render())`).
**Fix:** Changed to `footerMount.insertAdjacentHTML('beforeend', LoveSparkFooter.render())`, matching canonical usage. Content is a fixed string literal from the shared lib (no user-controlled interpolation), so this is not an XSS risk. Found incidentally while working the R-cws-a11y-4 unit; fixed since trivial and in-repo.
**Files:** popup.js

## 2026-07-08: R-cws-a11y-4 — add missing mascot.png, commit stranded shared-lib sync, bump to 1.0.31

**Problem:** `ls-check .` failed BRAND-SPARKY (mascot.png missing from repo root), flagged as out-of-scope in the P0-4-commit-4 entry above. Separately, `lib/lovespark-footer.css` and `lib/lovespark-theme.js` had already been re-synced to canonical in the working tree by an earlier interrupted session (footer hover state switched from opacity to text-decoration for KI-004 opacity-on-text safety; theme.js legacy `darkMode` migration read removed) but never committed.
**Root cause:** Mascot copy step was skipped when the extension was scaffolded (fleet convention requires it per CLAUDE.md rule #3); the shared-lib sync commit for the footer/theme fix simply never landed after being applied to the working tree.
**Fix:** Copied canonical `mascot.png` (400x266, verified byte-identical md5 match against `Claude x LoveSpark/assets/mascot.png`) into repo root — already wired into `popup.html` with proper alt text. Added missing `LICENSE` (MIT, matches fleet template). Committed the already-correct working-tree footer.css/theme.js re-sync. `ls-check .` now reports 0 fail (was 1 fail: BRAND-SPARKY). Bumped manifest to 1.0.31, synced PRIVACY.md version reference, rebuilt CWS/AMO zips.
**Note (out of scope, not fixed here):** `ls-check .` still reports A11Y-CONTRAST failing — this is a fleet-wide bug in the canonical `lovespark-shared-lib` repo's token values (KI-002/003/004: slate muted-on-glass-strong, slate slider-thumb-on-track, beige 0.8-opacity hint text), NOT specific to this extension. `audit-contrast.py` always audits the canonical shared-lib tokens regardless of which repo's `ls-check` invoked it, so this cannot be fixed by editing this repo. Flagged separately for a canonical shared-lib fix pass (spawned as its own task).
**Files:** mascot.png (new), LICENSE (new), lib/lovespark-footer.css, lib/lovespark-theme.js, manifest.json (1.0.30 → 1.0.31), PRIVACY.md

## 2026-07-08: P0-4-commit-4 — commit CWS/AMO submission bundle, bump to 1.0.30, build store zips

**Problem:** `fleet-to-store` had generated `CWS-LISTING.md`, `PRIVACY.md`, `SUBMIT.md`, and `cws-shots/` (12 CWS visual assets) on disk but they were never committed; `manifest.json` had been bumped to 1.0.30 locally without a commit.
**Root cause:** Same generation-without-commit pattern seen fleet-wide (P0-7-sweep-2 in sibling repos).
**Fix:** Verified `PRIVACY.md`/`CWS-LISTING.md` accurately declare the single `storage` permission and no host permissions — matches manifest exactly, no hand-fixes needed. Synced the stale "v1.0.29" reference in `PRIVACY.md` to v1.0.30. Committed the bundle + version bump, then ran `scripts/build-zips.sh` to produce `lovespark-reward-spinner-chrome.zip`/`lovespark-reward-spinner-firefox.zip`; Firefox zip passed `amo-validate.py`.
**Note (out of scope, not fixed here):** `ls-check .` reports a pre-existing gate failure — `BRAND-SPARKY: mascot.png missing` (repo root has no `mascot.png`, unlike sibling repos) — unrelated to the CWS bundle work in this unit, left for a mascot-asset fix pass. `lib/lovespark-footer.css` and `lib/lovespark-theme.js` were already modified in the working tree from an earlier, unrelated session; left untouched/uncommitted here since they're outside this unit's scope.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/ (12 files), manifest.json (1.0.29 → 1.0.30)

## v1.0.0 (2026-03-25)
- **Initial release.** No bugs logged yet.
- Scaffolded with shared lib, 4 themes, WCAG AA focus indicators, prefers-reduced-motion.
- Zero innerHTML — all DOM built via DOM API.
- Storage-only permissions. No data collection.


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
