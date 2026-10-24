# Bugs & Iterations — LoveSpark Context Switch

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

## 2026-07-08: ITER-CWS-01 — CWS/AMO submission bundle committed + store zips built

**Problem:** Extension was feature-complete but had no CWS submission package per house rule #14 (no CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/) and no Firefox zip — only a stale Chrome zip sat in the repo.
**Root cause:** Packaging/store-listing work was never run for this extension; `lovespark-fleet-to-store` generated the bundle in a prior pass but it was left uncommitted on the `security/cso-hardening-2026-06-26` branch.
**Fix:** Verified the generated PRIVACY.md (local-storage-only, zero transmission, matches actual `storage`-only permission set) and CWS-LISTING.md (single-purpose + per-permission justification matches manifest.json's `["storage"]`, no host permissions claimed or present) are accurate — no hand-fixes needed. Bumped manifest.json to 1.0.30. Ran `scripts/build-zips.sh` — Firefox zip passed AMO validation (auto-fixed `data_collection_permissions.required`, `background.scripts`, `strict_min_version`); both `-chrome.zip` and `-firefox.zip` regenerated and copied into repo root.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/, manifest.json, lovespark-context-switch-chrome.zip, lovespark-context-switch-firefox.zip
**Commit:** unit P0-4-commit-2

## 2026-07-08: ITER-CWS-A11Y-1 — mascot.png missing (real ship-blocking fail), LICENSE missing

**Problem:** `ls-check .` failed with BRAND-SPARKY — `mascot.png` (referenced by `popup.html`'s `<img src="mascot.png">`, rule #3) was missing from the repo, even though the extension otherwise renders correctly locally (browsers just show a broken image icon). Also flagged QUAL-LICENSE missing.
**Root cause:** The file was never checked in — likely dropped during an earlier asset-cleanup pass, or the repo was scaffolded before the mascot was copied in.
**Fix:** Copied the canonical `mascot.png` (`Assets & Docs/mascot.png` lineage, verified identical 400×266 RGBA PNG as used by the other passing sibling extensions) into the repo root. Added the standard MIT LICENSE (matches every other LoveSpark repo). `ls-check .` went from 32 pass/1 fail/3 warn to 33 pass/0 fail/3 warn.
**Files:** mascot.png, LICENSE, manifest.json (1.0.30 → 1.0.31)

## 2026-07-08: ITER-CWS-A11Y-2 — A11Y-CONTRAST fail is a canonical shared-lib defect, not fixable in this repo

**Problem:** `ls-check .` reports `A11Y-CONTRAST: Contrast audit: 3 failure(s)` — `[beige] Hint text (0.8 opacity) on glass: 4.26:1 (needs 4.5:1)`, `[slate] Muted text on glass-strong: 4.17:1 (needs 4.5:1)`, `[slate] Slider thumb on track: 2.65:1 (needs 3.0:1)` — identically across every extension in the neurodivergent batch (habit-garden, hub, med-tracker, tab-garden, mood-bloom, context-switch all show the exact same 3 failures/ratios).
**Root cause:** `audit-contrast.py` (invoked by `ls-check.py`'s A11Y-CONTRAST check) resolves the shared-lib token file via `find_shared_lib()`, which walks up from **the audit script's own file location** (`Claude x LoveSpark/scripts/`), not from the repo path passed on the command line. It therefore always audits the canonical `Extensions/infrastructure/lovespark-shared-lib/lovespark-tokens.css` regardless of which repo `ls-check .` is run against. These 3 failures are already documented as known issues (KI-002, KI-003, KI-004 in `~/.claude/docs/memory/known-issues.md`) with real, computed fixes — but the fix must land in the canonical token source, not in any single extension's own `lib/` copy (editing the per-repo copy would only desync it from canonical and trip the separate "shared lib matches canonical" check).
**Fix (verified, ready to apply by whoever owns `lovespark-shared-lib` / `design-tokens`):** In `design-tokens/tokens.json` primitives — darken `earth-dark` from `#5C4A2A` to `#4E3F24` (beige `text.dark`, fixes the 0.8-opacity hint-text check to 4.87:1, all other beige pairings re-verified passing with margin); lighten `gray-muted` from `#9A9A9A` to `#A5A5A5` (slate `text.muted`, fixes muted-on-glass-strong to 4.76:1); add a new primitive `rust-focus: #DA8763` and repoint slate's `interactive.focus-ring` to `{rust-focus}` instead of `{rust}` (fixes slider-thumb-on-track to 3.22:1) — this decouples the focus-ring fix from `rust`, which is also slate's decorative pink-accent and title-override color, so those stay visually unchanged. Verified via `generate-tokens.py --check`: 28/28 contrast pairings pass, 0 regressions. After landing, regenerate `lovespark-tokens.css`/`LoveSparkTokens.swift`, sync to all extensions via `scripts/sync-shared-lib.sh`, and re-run `ls-check .` fleet-wide.
**Why not fixed here:** `lovespark-shared-lib` and `design-tokens` are not part of this repo; per the fleet-p1 unit's scope discipline (assigned repos only, never touch other repos), the canonical-infra fix was computed and verified but not applied — flagged as a follow-up task instead.
**Files:** none (documentation only — no in-repo fix exists for this failure)

## 2026-07-08: ITER-P2-SYNC-1 — re-sync tokens.css after canonical A11Y-CONTRAST fix lands; rebuild zips

**Problem:** Fleet P2 unit "token re-sync": the canonical fix computed in ITER-CWS-A11Y-2 landed in `Extensions/infrastructure/lovespark-shared-lib/lovespark-tokens.css` (beige `text-dark` → `#564424`, slate `glass-border` → `#3e3e3e`, slate `text-muted` → `#a8a8a8`) while this unit was in progress. `ls-check .` before this fix: 38 pass, **1 fail** (A11Y-CONTRAST, 3 sub-failures), 2 warn.
**Root cause:** This repo's `lib/lovespark-tokens.css` copy predated the canonical fix and had drifted (md5 mismatch), tripping `BRAND-LIB-SYNC` the moment canonical changed.
**Fix:** Re-copied `lovespark-tokens.css` from canonical `Extensions/infrastructure/lovespark-shared-lib/` into `lib/` (byte-identical, verified via md5). `ls-check .` now shows A11Y-CONTRAST and BRAND-LIB-SYNC both passing. One fail remains: `BRAND-TOKEN-DRIFT` (shared-lib CSS vs. `design-tokens/generated/lovespark-tokens.css`) — infra outside this repo, not fixable here; flagged as a follow-up. Bumped patch version and rebuilt both store zips (`build-zips.sh`), which passed the AMO validator gate. Gave this repo a real README.md (was a 3-line stub) mirroring its `CWS-LISTING.md` long description, following `lovespark-med-tracker`'s README as the quality template. `ls-check .` after: 38 pass, **1 fail** (BRAND-TOKEN-DRIFT, infra-level, out of scope), 2 warn (pre-existing BRAND-DEAD-LIB, unrelated to this unit).
**Files:** lib/lovespark-tokens.css, README.md, manifest.json (1.0.31 → 1.0.32), lovespark-context-switch-chrome.zip, lovespark-context-switch-firefox.zip

## 2026-10-07: BUG-001 — store zips recursively contained the previous store zips + listing docs

**Problem:** PR #1 verification (`python3 -c "import zipfile; ..."` listing of `lovespark-context-switch-{chrome,firefox}.zip` at 1.0.32) showed each 710 KB store zip contained `lovespark-context-switch-chrome.zip` + `lovespark-context-switch-firefox.zip` (the 1.0.31 pair, ~267 KB each, which in turn contained the 1.0.30 pair, …) plus `CWS-LISTING.md` and `SUBMIT.md`. Real shipping content is ~265 KB; ~62% of the artifact was stale nested zips that grow on every rebuild. The zips' `README.md` was also the pre-ITER-P2-SYNC-1 3-line stub (built before the README commit).
**Root cause:** ITER-CWS-01 started committing the built zips into the repo root. `scripts/build-zips.sh` stages the whole extension dir with a fixed exclude list that does not cover `*.zip`, `CWS-LISTING.md` or `SUBMIT.md`, so the previously committed zips were re-packed into the new ones. The script does honor a per-extension `.zipignore`, which this repo lacked.
**Fix:** Added `.zipignore` (`*.zip`, `CWS-LISTING.md`, `SUBMIT.md`, `scripts/`). Bumped manifest.json 1.0.32 → 1.0.33 (rule #9). Rebuilt both zips with the fleet `build-zips.sh` staging + AMO-validate gate (unchanged copy of the script with only `OUT` pointed at a scratch dir, since the real `OUT` is Joona's local checkout). Added `scripts/check-zips.py` as the regression test: no nested zips/listing docs, manifest version == repo version, gecko only in the Firefox zip, every shipped file byte-identical to the repo tree.
**Regression check:** `python3 scripts/check-zips.py` → must print `check-zips: PASS`.
**Follow-up (fleet, out of this repo):** add `*.zip`, `CWS-LISTING.md`, `SUBMIT.md` to the default `rsync --exclude` list in `Claude x LoveSpark/scripts/build-zips.sh` so every repo that commits its zips is protected, not just those with a `.zipignore`.
**Files:** .zipignore, manifest.json, scripts/check-zips.py, lovespark-context-switch-chrome.zip, lovespark-context-switch-firefox.zip, BUGS_AND_ITERATIONS.md

## 2026-10-24 — Chromium fleet audit (1.0.33 → 1.0.34)

- Insert the shared footer HTML into its mount instead of discarding the renderer’s return value.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
