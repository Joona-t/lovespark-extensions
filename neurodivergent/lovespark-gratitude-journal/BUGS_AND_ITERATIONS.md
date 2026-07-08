# LoveSpark Gratitude Journal - Bugs and Iterations

## v1.0.0 (2026-03-24) - Initial Build

### Architecture Decisions
- **storage only** — No alarms, no content scripts, no host permissions. Simplest possible surface.
- **3 entries per day** — Hard cap prevents overwhelm. Slot indicators (3 dots) show progress. Input hides when full.
- **10 random prompts** — Rotating gratitude prompts reduce decision paralysis ("Something that made you smile", "A person you're grateful for", etc).
- **Flower growth streak** — Consecutive days with entries: Seed -> Sprout -> Daisy -> Blossom -> Sunflower -> Bouquet (30d+).
- **Entry flowers** — Each of the 3 daily entries gets a unique flower emoji (daisy, blossom, sunflower).
- **90-day retention** — Auto-prunes entries older than 90 days.
- **DOM API only** — el() helper for entry rendering. Zero innerHTML per KI-011.

### Known Limitations (V1)
- No browse/search past entries
- No export functionality
- No weekly/monthly reflection view
- No custom prompts

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-24 | Initial build | Expansion Agent Cycle 14 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-07-08: ITER-CWS-01 — CWS/AMO submission bundle committed + store zips rebuilt

**Problem:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, and cws-shots/ existed on disk but were untracked (never committed); the Chrome and Firefox zips in the repo predated the current shared-lib/manifest changes.
**Root cause:** `lovespark-fleet-to-store` generated the bundle in a prior pass but it was left uncommitted on the `security/cso-hardening-2026-06-26` branch, and the checked-in zips were stale relative to the pending manifest version bump.
**Fix:** Verified the generated PRIVACY.md (local-storage-only, zero transmission, matches actual `storage`-only permission set) and CWS-LISTING.md (single-purpose + per-permission justification matches manifest.json's `["storage"]`, no host permissions claimed or present) are accurate — no hand-fixes needed. Bumped manifest.json to 1.0.30. Ran `scripts/build-zips.sh` — Firefox zip passed AMO validation (auto-fixed `data_collection_permissions.required`, `background.scripts`, `strict_min_version`); both `-chrome.zip` and `-firefox.zip` regenerated and copied into repo root, replacing the stale zips.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/, manifest.json, lovespark-gratitude-journal-chrome.zip, lovespark-gratitude-journal-firefox.zip
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
