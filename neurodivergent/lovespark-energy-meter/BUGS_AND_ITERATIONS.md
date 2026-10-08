# Bugs & Iterations — LoveSpark Energy Meter

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
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/, manifest.json, lovespark-energy-meter-chrome.zip, lovespark-energy-meter-firefox.zip
**Commit:** unit P0-4-commit-2

## 2026-07-08: ITER-A11Y-2 — a11y/contrast CWS-unblock pass (R-cws-a11y-2)

**Problem:** `ls-check .` failed A11Y-CONTRAST (3 failures across beige/slate themes) and warned QUAL-LICENSE (no LICENSE file), blocking the fleet CWS-autofill upload pipeline.
**Root cause:** A11Y-CONTRAST is computed by `scripts/audit-contrast.py` directly against the canonical `Extensions/infrastructure/lovespark-shared-lib/lovespark-tokens.css` token values (KI-002 slate muted-on-glass-strong 4.17:1, KI-003 slate focus-ring-on-glass-border 2.65:1, KI-004 beige hint-opacity 4.26:1) — it is identical for every extension in the fleet regardless of local repo content, and can only be fixed by editing the canonical shared-lib repo, which is out of this unit's assigned repo scope. QUAL-LICENSE was simply a missing file.
**Fix:** Added MIT `LICENSE` (matching the canonical LoveSpark MIT text used across the fleet). Verified every other `ls-check` category passes (A11Y-DIALOG, A11Y-EXPANDED, BRAND-LIB-SYNC/WIRED all clean). Bumped manifest.json patch version and rebuilt CWS/AMO zips. A11Y-CONTRAST remains failing and requires the separate shared-lib fix tracked in `meta_implementation.md` item 7 ("Repair the quality gate, then sweep and enforce shared-lib sync") — flagging here so it isn't lost.
**Files:** LICENSE, manifest.json, *-chrome.zip, *-firefox.zip
**Commit:** unit R-cws-a11y-2

## 2026-07-08: ITER-A11Y-3 — token re-sync closes the fleet-wide contrast gate (P2-sync-2)

**Problem:** `ls-check .` was still failing A11Y-CONTRAST (3 fleet-wide beige/slate failures: KI-002 slate muted-on-glass-strong 4.17:1, KI-003 slate slider-thumb-on-track 2.65:1, KI-004 beige hint-text 4.26:1), tracked since the previous unit as an out-of-scope canonical issue.
**Root cause:** The contrast values are baked into `Extensions/infrastructure/lovespark-shared-lib/lovespark-tokens.css` and are identical for every fleet repo; the fix could only land by editing that canonical file, which sits outside this repo's boundary. A sibling unit landed the canonical fix (shared-lib commit 41b43cc, `BUG-002 / KI-002, KI-003, KI-004`) during this pass.
**Fix:** Synced the corrected `lovespark-tokens.css` from canonical into `lib/`. `ls-check .` no longer fails A11Y-CONTRAST. A **new** canonical-level check, BRAND-TOKEN-DRIFT, surfaced as a side effect: the shared-lib fix was hand-applied to the CSS without regenerating `design-tokens/generated/lovespark-tokens.css` from `design-tokens/tokens.json` (the source-of-truth primitives `earth-dark`/`slate-border`/`gray-muted` still hold the old, pre-fix hex values). That generator pipeline lives outside every extension repo's boundary (it isn't a git repo at all) and is not this unit's to fix — flagging it as the new fleet-wide follow-up item, replacing the now-resolved A11Y-CONTRAST tracking note. Verified no other shared-lib file has drifted from canonical. Bumped manifest.json patch version and rebuilt CWS/AMO zips via `scripts/build-zips.sh` (Firefox zip passed `amo-validate.py`). Added a real README.md (mirrors this repo's CWS-LISTING.md long-form description, med-tracker README as the structural template).
**Files:** lib/lovespark-tokens.css, README.md, manifest.json, *-chrome.zip, *-firefox.zip
**Commit:** unit P2-sync-2

## 2026-07-08: ITER-A11Y-4 — zip self-inclusion bug fixed, clean rebuild (P2-sync-2)

**Problem:** `ls-check .` still reports 1 residual fail (BRAND-TOKEN-DRIFT), and the `*-chrome.zip`/`*-firefox.zip` produced by the previous unit (ITER-A11Y-3, built 19:44) predated that commit's contrast-token sync (landed 19:47-19:48), so the shipped zips were already stale on top of a second problem: the built zips were committed into the repo root, and `scripts/build-zips.sh` rsyncs the whole extension directory with no `*.zip` exclude — so every rebuild nested the previous `-chrome.zip`/`-firefox.zip` inside the new one, doubling the package size on every build cycle (confirmed: sensory-shield's zip contained its own prior 4.17MB zip pair nested inside, inflating the "clean" rebuild to 9.3MB before the fix).
**Root cause:** `ITER-CWS-01` / `R-cws-a11y-2` committed the build output (`*-chrome.zip`, `*-firefox.zip`) directly into the extension source tree instead of only the canonical `lovespark zips/` output directory. `build-zips.sh`'s rsync stage excludes `.git/`, `node_modules/`, etc. but never `*.zip`, so those tracked zips got swept into every subsequent build's input, recursively nesting.
**Fix:** `git rm --cached` the tracked `*-chrome.zip`/`*-firefox.zip` from the repo root, deleted them from disk, added `*.zip` to `.gitignore` so build output never gets re-committed. Reran `scripts/build-zips.sh` — output zip size dropped from 708K→173K, Firefox zip passed `amo-validate.py`. Verified `ls-check .` is otherwise unchanged (BRAND-TOKEN-DRIFT remains the sole residual fail, root-caused in ITER-A11Y-3 as a `design-tokens/tokens.json` vs. hand-patched canonical CSS mismatch — that pipeline isn't a git repo and sits outside every extension repo's boundary, not this unit's to fix; flagged for a dedicated follow-up).
**Files:** .gitignore, *-chrome.zip (untracked), *-firefox.zip (untracked)
**Commit:** unit P2-sync-2
