# Bugs & Iterations — LoveSpark Breathe

<!-- Log every bug fix and iteration with date, problem, root cause, and fix. -->

| Date | Problem | Root Cause | Fix |
|------|---------|------------|-----|
| | | | |


## 2026-07-08: P0-7-sweep-2 — finalize dead-lib deletion + land CWS submission prep

**Problem:** `lib/lovespark-badge.js`, `lovespark-lifecycle.js`, `lovespark-popup.js`, `lovespark-stats.js` were unwired from `popup.html` back in the 2026-04-20 ship-day pass but the actual file deletions from `lib/` and the `manifest.json`/`popup.html` follow-up (script tag reorder, version bump to 1.0.23) sat uncommitted on disk ever since. Separately, a CWS submission-autopilot pass had written a full `cws-listing.json` (permission justifications, privacy policy URL, distribution config) and 12 `cws-shots/` assets (5 localized + 5 global screenshots, 2 promo tiles) to disk, also never committed.
**Root cause:** Both passes stopped short of `git add`/commit.
**Fix:** Committed the dead-lib-file deletion + manifest/popup.html follow-up as-is (verified none of the 4 files are referenced anywhere in this repo). Committed `cws-listing.json` + `cws-shots/` as-is — note `cws-listing.json` still has 3 explicit `REVIEW:` placeholders (`single_purpose`, `host_permission_justification`, `reviewer_test_instructions`) that need Joona's input before CWS submission; left untouched, not my call to fill in.
**Files:** lib/lovespark-badge.js (deleted), lib/lovespark-lifecycle.js (deleted), lib/lovespark-popup.js (deleted), lib/lovespark-stats.js (deleted), manifest.json, popup.html, cws-listing.json, cws-shots/

## 2026-04-20: Ship-Day v1.0.19 — 5 fixes (swarm audit)

**Sparky missing in Step Back overlay**
- Problem: Sparky mascot (mascot.png) did not render in the step-back overlay on social media sites.
- Root cause: `chrome.runtime.getURL('mascot.png')` in content.js injects a chrome-extension:// URL into the page DOM. MV3 requires `web_accessible_resources` for this to load; field was absent from manifest.json.
- Fix: Added `web_accessible_resources` with `mascot.png` scoped to the 6 supported site patterns.

**CSP violation on every popup open**
- Problem: Browser console showed a CSP error on each popup open.
- Root cause: `popup.css` line 1 had `@import url('https://fonts.googleapis.com/...')` which was blocked by the extension's own `font-src 'self'` policy. No fonts loaded, just a violation log.
- Fix: Removed the @import. UI falls back to system fonts; typography still readable.

**Activity log showed stale counts after session completion**
- Problem: After finishing a breathing or grounding session, the popup log refreshed before the storage write completed.
- Root cause: `logSession()` was not awaited in background.js before `sendResponse({ ok: true })`.
- Fix: Changed to `logSession(msg.type).then(() => sendResponse({ ok: true }))`.

**High CPU usage when comment dimmer active on social media**
- Problem: Measurable CPU load on Twitter/Reddit with dimmer on during active scrolling.
- Root cause: MutationObserver callback ran `applyDimmer()` (multiple querySelectorAll calls) on every DOM mutation — up to 60+ times/sec.
- Fix: Added 250ms debounce; timer cleared on `stopDimmerObserver()`.

**4 dead lib scripts loaded in popup context**
- Problem: `lovespark-stats.js`, `lovespark-badge.js`, `lovespark-popup.js`, `lovespark-lifecycle.js` were loaded in popup.html but never called.
- Root cause: sync-shared-lib.sh added all lib files uniformly without checking per-extension usage.
- Fix: Removed the 4 unused script tags from popup.html.

---

## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-07-08: ITER-CWS-01 — CWS/AMO submission bundle committed + store zips built

**Problem:** Extension had CWS-LISTING.md/PRIVACY.md/SUBMIT.md/cws-shots/ generated but not committed (cws-shots showed as modified working-tree images from a re-generation), and had no packaged zips at all in the repo.
**Root cause:** `lovespark-fleet-to-store` generated/regenerated the bundle in a prior pass but the assets were left uncommitted on the `security/cso-hardening-2026-06-26` branch, and packaging (build-zips.sh) was never run for this extension.
**Fix:** Verified the generated PRIVACY.md (local-storage-only, zero transmission) and CWS-LISTING.md (single-purpose + per-permission justification matches manifest.json's `["storage", "activeTab", "tabs"]`, no host permissions claimed or present) are accurate — no hand-fixes needed. Bumped manifest.json to 1.0.24. Ran `scripts/build-zips.sh` — Firefox zip passed AMO validation (auto-fixed `data_collection_permissions.required`, `background.scripts`); both `-chrome.zip` and `-firefox.zip` built for the first time and added to repo root.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/, manifest.json, lovespark-breathe-chrome.zip, lovespark-breathe-firefox.zip
**Commit:** unit P0-4-commit-2

## 2026-07-08: ITER-A11Y-2 — a11y/contrast CWS-unblock pass (R-cws-a11y-2)

**Problem:** `ls-check .` failed BRAND-LIB-SYNC (lib/ was missing 4 of the 9 canonical shared-lib files: lovespark-stats.js, lovespark-badge.js, lovespark-popup.js, lovespark-lifecycle.js) and A11Y-CONTRAST (3 fleet-wide beige/slate token failures), blocking the CWS-autofill upload pipeline.
**Root cause:** `lib/` here only ever received 2 of the 6-9 canonical shared-lib files historically (a known fleet-wide sync-drift pattern, see meta_implementation.md), and BRAND-LIB-SYNC requires all canonical files to be present and byte-identical even if a given extension's HTML doesn't reference every one. A11Y-CONTRAST is computed by `scripts/audit-contrast.py` directly against the canonical shared-lib tokens (KI-002/KI-003/KI-004) and is identical fleet-wide; it can only be fixed by editing the canonical `Extensions/infrastructure/lovespark-shared-lib` repo, which is outside this unit's assigned repo scope.
**Fix:** Copied the 4 missing files byte-for-byte from the canonical shared-lib (verified clean/unmodified in the canonical repo's working tree before copying, so no in-progress canonical edits were pulled in). BRAND-LIB-SYNC now passes. Bumped manifest.json patch version and rebuilt CWS/AMO zips. A11Y-CONTRAST remains failing pending the separate shared-lib fix tracked in meta_implementation.md item 7.
**Files:** lib/lovespark-stats.js, lib/lovespark-badge.js, lib/lovespark-popup.js, lib/lovespark-lifecycle.js, manifest.json, *-chrome.zip, *-firefox.zip
**Commit:** unit R-cws-a11y-2

## 2026-07-08: ITER-A11Y-3 — token re-sync closes the fleet-wide contrast gate (P2-sync-2)

**Problem:** `ls-check .` was still failing A11Y-CONTRAST (3 fleet-wide beige/slate failures: KI-002 slate muted-on-glass-strong 4.17:1, KI-003 slate slider-thumb-on-track 2.65:1, KI-004 beige hint-text 4.26:1), tracked since the previous unit as an out-of-scope canonical issue.
**Root cause:** The contrast values are baked into `Extensions/infrastructure/lovespark-shared-lib/lovespark-tokens.css` and are identical for every fleet repo; the fix could only land by editing that canonical file, which sits outside this repo's boundary. A sibling unit landed the canonical fix (shared-lib commit 41b43cc, `BUG-002 / KI-002, KI-003, KI-004`) during this pass.
**Fix:** Synced the corrected `lovespark-tokens.css` from canonical into `lib/`. `ls-check .` no longer fails A11Y-CONTRAST. A **new** canonical-level check, BRAND-TOKEN-DRIFT, surfaced as a side effect: the shared-lib fix was hand-applied to the CSS without regenerating `design-tokens/generated/lovespark-tokens.css` from `design-tokens/tokens.json` (the source-of-truth primitives `earth-dark`/`slate-border`/`gray-muted` still hold the old, pre-fix hex values). That generator pipeline lives outside every extension repo's boundary (it isn't a git repo at all) and is not this unit's to fix — flagging it as the new fleet-wide follow-up item, replacing the now-resolved A11Y-CONTRAST tracking note. Verified no other shared-lib file has drifted from canonical. Bumped manifest.json patch version and rebuilt CWS/AMO zips via `scripts/build-zips.sh` (Firefox zip passed `amo-validate.py`).
**Files:** lib/lovespark-tokens.css, manifest.json, *-chrome.zip, *-firefox.zip
**Commit:** unit P2-sync-2

## 2026-07-08: ITER-A11Y-4 — zip self-inclusion bug fixed, clean rebuild (P2-sync-2)

**Problem:** `ls-check .` still reports 1 residual fail (BRAND-TOKEN-DRIFT), and the `*-chrome.zip`/`*-firefox.zip` produced by the previous unit (ITER-A11Y-3, built 19:44) predated that commit's contrast-token sync (landed 19:47-19:48), so the shipped zips were already stale on top of a second problem: the built zips were committed into the repo root, and `scripts/build-zips.sh` rsyncs the whole extension directory with no `*.zip` exclude — so every rebuild nested the previous `-chrome.zip`/`-firefox.zip` inside the new one, doubling the package size on every build cycle (confirmed: sensory-shield's zip contained its own prior 4.17MB zip pair nested inside, inflating the "clean" rebuild to 9.3MB before the fix).
**Root cause:** `ITER-CWS-01` / `R-cws-a11y-2` committed the build output (`*-chrome.zip`, `*-firefox.zip`) directly into the extension source tree instead of only the canonical `lovespark zips/` output directory. `build-zips.sh`'s rsync stage excludes `.git/`, `node_modules/`, etc. but never `*.zip`, so those tracked zips got swept into every subsequent build's input, recursively nesting.
**Fix:** `git rm --cached` the tracked `*-chrome.zip`/`*-firefox.zip` from the repo root, deleted them from disk, added `*.zip` to `.gitignore` so build output never gets re-committed. Reran `scripts/build-zips.sh` — output zip size dropped from n/a (no prior zip)→252K, Firefox zip passed `amo-validate.py`. Verified `ls-check .` is otherwise unchanged (BRAND-TOKEN-DRIFT remains the sole residual fail, root-caused in ITER-A11Y-3 as a `design-tokens/tokens.json` vs. hand-patched canonical CSS mismatch — that pipeline isn't a git repo and sits outside every extension repo's boundary, not this unit's to fix; flagged for a dedicated follow-up).
**Files:** .gitignore, *-chrome.zip (untracked), *-firefox.zip (untracked)
**Commit:** unit P2-sync-2

---

## 2026-07-09: Remove duplicate lovespark-tokens.css load from `popup.html` (fleet 2026-03-28 regression)

**Problem:** `popup.html` carried a direct reference to `lovespark-tokens.css` even though
`lovespark-base.css` (loaded by the same page) already `@import`s it — the token sheet
loaded twice. This is the fleet-wide 2026-03-28 injection regression; `guard-fleet-sync.sh`
Gate 4 blocks all fleet shared-lib syncs while any such reference exists in extension HTML.

**Fix:** Removed the redundant `<link>` (a one-line deletion; no other markup touched). Also refreshed `lib/lovespark-tokens.css` to the canonical
deterministic-header build (token values byte-identical to the 80/80-audited canonical;
shared-lib ITER-003 / lovespark-shared-lib@7690133) and bumped the manifest patch version.

**Verification:** zero `lovespark-tokens.css` references remain in this extension's HTML;
`origin/main`'s `lib/lovespark-base.css` confirmed to `@import url('lovespark-tokens.css')`,
so removal is cascade-neutral — zero visual change. Fleet guard Gate 4 green on the live
tree 2026-07-09; `ls-check` samples (lovespark-breathe 41 pass / 0 fail,
lovespark-task-anchor 42 pass / 0 fail) after the fleet-wide sync.

## 2026-10-07: ITER-MERGE-01 — fold PR #2 (tokens.css double-load) into the CWS bundle branch

**Problem:** PR #2 (`fix/tokens-css-double-load`) and PR #1 (`security/cso-hardening-2026-06-26`) both edited manifest.json and this log, so whichever merged second would conflict.
**Root cause:** Two fix branches cut from the same base, each bumping the patch version.
**Fix:** Merged PR #2 into PR #1's branch, kept both log entries, bumped version to 1.0.27. After PR #1 merges, PR #2 shows as merged/empty and can be closed.
**Check:** `git grep -c "lovespark-tokens.css" -- popup.html` → 0 (tokens now load once via lovespark-base.css @import); `ls-check .` → 0 fail.
