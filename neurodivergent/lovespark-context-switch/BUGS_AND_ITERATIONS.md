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
