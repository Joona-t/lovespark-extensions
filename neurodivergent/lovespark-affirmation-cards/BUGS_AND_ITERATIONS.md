# LoveSpark Affirmation Cards - Bugs and Iterations

## 2026-07-08: P0-7-sweep-2 — shared-lib sync + missing mascot.png (rule #3)

**Problem:** `lib/lovespark-footer.css` and `lib/lovespark-theme.js` on disk already matched canonical `Extensions/infrastructure/lovespark-shared-lib/` byte-for-byte but were never committed. Separately, `ls-check` flagged `BRAND-SPARKY: mascot.png missing` — `popup.html` references `mascot.png` at the repo root but it never existed in this repo's git history at all (not a deletion, never added).
**Root cause:** The shared-lib sync was never committed after copying. The mascot asset was simply never added when the popup was built, despite being referenced from day one (CLAUDE.md rule #3: Sparky mascot required in every UI).
**Fix:** Committed the shared-lib sync. Copied the canonical mascot (`Claude x LoveSpark/assets/mascot.png`, byte-identical to the copy already shipped in lovespark-body-double) into the repo root and committed it.
**Files:** lib/lovespark-footer.css, lib/lovespark-theme.js, mascot.png

## v1.0.0 (2026-03-21) - Initial Build

### Architecture Decisions
- **storage only** - Simplest possible permission surface. No alarms needed (cards are on-demand, not scheduled).
- **60 ADHD-specific affirmations** - 8 categories (Identity, Momentum, Rest, Strength, Worth, Compassion, Resilience, Pace). All written for neurodivergent self-compassion.
- **Random without repeat** - Ensures you never see the same card twice in a row.
- **Favorites deck** - Max 50 saved cards. Stored locally with category metadata.
- **Card entrance animation** - Subtle translateY + fade. Wrapped in prefers-reduced-motion.
- **Keyboard shortcuts** - Space/ArrowRight for next card, F to favorite.
- **DOM API only** - Zero innerHTML per KI-011.

### Known Limitations (V1)
- No favorites gallery view (can see count but not browse saved cards)
- No card sharing (copy to clipboard — V2 candidate)
- No custom affirmation input (V2 candidate)
- No daily reminder notification (could use chrome.alarms — V2)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-21 | Initial build | Expansion Agent Cycle 4 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-07-08: CWS/AMO submission bundle committed (P0-4-commit-3)

**Problem:** LoveSpark Affirmation Cards had no committed CWS Web Store / AMO submission package — CWS-LISTING.md, PRIVACY.md, SUBMIT.md, and cws-shots/ existed only as generator output on disk, never landed in git, so the extension wasn't submission-ready from a clean checkout.
**Root cause:** `fleet-to-store` generates these artifacts locally but a separate commit step was needed to land them, bump the patch version, and rebuild the store zips.
**Fix:** Verified PRIVACY.md is truthful (local-storage-only, zero external transmission) and CWS-LISTING.md's single-purpose + per-permission + host-permission justifications match the actual manifest.json permissions. Bumped manifest.json to v1.0.31. Rebuilt *-chrome.zip / *-firefox.zip via the canonical `scripts/build-zips.sh`; Firefox zip passed `amo-validate.py`. Committed the bundle.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/, manifest.json

## 2026-07-08: R-cws-a11y-3 — add LICENSE, confirm A11Y-CONTRAST blocker

**Problem:** `ls-check .` failed on `QUAL-LICENSE` (LICENSE missing) and `A11Y-CONTRAST` (3 failures), blocking the CWS submission gate.
**Root cause:** LICENSE was never added to this repo despite the suite-wide MIT policy. `A11Y-CONTRAST` is a fleet-wide defect in canonical `lovespark-shared-lib/lovespark-tokens.css` itself: beige hint-text at 0.8 opacity (4.26:1, needs 4.5:1), slate muted-text on glass-strong (4.17:1, needs 4.5:1), slate slider-thumb on track (2.65:1, needs 3.0:1) — matches documented KI-002/KI-003/KI-004. Confirmed real (not a checker false-alarm): `audit-contrast.py --hardcoded` (old fallback values) passes clean, so the live canonical values are the actual regression.
**Fix:** Added the standard LoveSpark MIT LICENSE (copied verbatim from `focus-blossom/LICENSE`, same copyright line used fleet-wide). Reviewed `A11Y-LIVE` warning for `#card`/`#cardCategory`/`#cardText`/`#favIcon` — verified these are already inside a `.card-section[aria-live="polite"]` ancestor (functionally covered per ARIA live-region semantics; `#favIcon` is `aria-hidden="true"` and correctly excluded from AT), so this is a checker limitation (only checks the exact tag, not ancestors) rather than a real gap — flagged separately for `ls-check.py`. `A11Y-CONTRAST` is out of scope for this repo — belongs in the canonical `lovespark-shared-lib` repo (not one of this unit's assigned repos); flagged separately.
**Files:** LICENSE (added), manifest.json (1.0.31 → 1.0.32)

## 2026-07-08: P2-sync-3 — re-sync canonical tokens.css after KI-002/003/004 contrast fix, rebuild zips

**Problem:** `ls-check .` was blocked on `A11Y-CONTRAST` (3 failures: beige hint-text 0.8-opacity 4.26:1, slate muted-on-glass-strong 4.17:1, slate slider-thumb-on-track 2.65:1 — KI-002/003/004), previously confirmed fleet-wide and out of scope for this repo (logged in the prior R-cws-a11y-3 entry above). During this unit, a concurrent session landed the actual fix in canonical (`lovespark-shared-lib` commit 41b43cc "fix: canonical lovespark-tokens.css fails its own contrast gate (BUG-002 / KI-002, KI-003, KI-004)"), darkening `--ls-text-dark` to #564424, `--ls-glass-border` to #3e3e3e, and lightening `--ls-text-muted` to #a8a8a8 for the affected themes.
**Root cause:** This repo's `lib/lovespark-tokens.css` was still on the pre-fix canonical snapshot; the fix landing in the shared-lib repo mid-session left this repo one sync behind.
**Fix:** Re-copied `lovespark-tokens.css` from canonical `Extensions/infrastructure/lovespark-shared-lib/` (md5-verified byte-identical post-copy). `ls-check .` now passes `A11Y-CONTRAST` clean (verified via `audit-contrast.py --json`: 80 pass, 0 fail across all 4 themes) and `BRAND-LIB-SYNC`. One residual fail remains: `BRAND-TOKEN-DRIFT` — the fix was hand-patched directly into the shared-lib CSS but `design-tokens/tokens.json` (the generator source of truth) was never updated to match, so `generate-tokens.py`'s output no longer matches canonical by md5. This check compares only canonical `design-tokens/` + `lovespark-shared-lib/` files (identical for every repo in the fleet), is not fixable at the per-repo level, and is outside this unit's assigned repos (`lovespark-shared-lib`/`design-tokens`) — flagged as a separate follow-up task rather than patched here. Bumped manifest.json, rebuilt `*-chrome.zip`/`*-firefox.zip` via `scripts/build-zips.sh`; Firefox zip passed `amo-validate.py`.
**Files:** lib/lovespark-tokens.css (re-synced), manifest.json (1.0.32 → 1.0.33)


## 2026-07-08: P2-sync-3 (completion pass) — close ls-check-to-zero gate, rebuild zips

**Problem:** `ls-check .` was clean on shared-lib sync (tokens already matched canonical from the prior P2-sync-3 commit) but still reported `BRAND-TOKEN-DRIFT` (fail). Distributable zips were also stale relative to the current manifest version.
**Root cause:** `BRAND-TOKEN-DRIFT` is a canonical-infra gap — the KI-002/003/004 contrast fix was hand-patched directly into `lovespark-shared-lib/lovespark-tokens.css` but `design-tokens/tokens.json` (the generator source of truth, outside this unit's assigned repos) was never regenerated to match, so `generate-tokens.py`'s output no longer md5-matches canonical for any fleet repo. Not fixable at the per-repo level.
**Fix:** Bumped manifest.json 1.0.33 → 1.0.34 and rebuilt `*-chrome.zip`/`*-firefox.zip` via `scripts/build-zips.sh` (Firefox zip passed `amo-validate.py`). `BRAND-TOKEN-DRIFT` remains open and is flagged as a separate follow-up task against `lovespark-shared-lib`/`design-tokens` (not one of this unit's repos).
**Files:** manifest.json (1.0.33 → 1.0.34), lovespark-affirmation-cards-chrome.zip, lovespark-affirmation-cards-firefox.zip

## 2026-10-07: BUG-001 — store zips contained the previous store zips (nested packaging)

**Problem:** Both committed store packages (`lovespark-affirmation-cards-chrome.zip`, `-firefox.zip`, v1.0.34) contained `lovespark-affirmation-cards-chrome.zip` and `lovespark-affirmation-cards-firefox.zip` as entries — stale 1.0.3x builds nested inside the new build. Each package was 614 KB instead of ~178 KB, and the nested zips would have shipped to every user via CWS/AMO.
**Root cause:** `scripts/build-zips.sh` stages the extension dir with `rsync --exclude ...` but has no `*.zip` exclusion, and this repo commits its zips at the repo root. The first build was clean; every rebuild after that swept the previously committed zips into the stage. Fleet-wide hazard for any repo that commits its zips (flagged against `build-zips.sh` separately).
**Fix:** Stripped the two nested `*.zip` entries from both packages in place (26 entries kept, 2 dropped each; all other entries byte-preserved, manifests untouched, `unzip -t` clean). Firefox zip re-passed `amo-validate.py` (PASS — AMO-ready). Added `.zipignore` with `*.zip` — `build-zips.sh` honours it, so future rebuilds can never nest zips again. No code changed, so manifest stays at 1.0.34 (matches the manifests inside both zips).
**Regression check:** `for z in *.zip; do unzip -l "$z" | awk '{print $4}' | grep -c '\.zip$'; done` → must print `0` twice.
**Files:** lovespark-affirmation-cards-chrome.zip, lovespark-affirmation-cards-firefox.zip, .zipignore (added)
