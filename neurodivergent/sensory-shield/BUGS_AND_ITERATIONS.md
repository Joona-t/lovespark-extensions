# Bugs & Iterations

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup/popup.css
**Commit:** 0df05db

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup/popup.html
**Commit:** 72a5296

## : |2026-03-05|||Fix dead code in popup, dynamic version in settings (v1.0.6)

**Problem:** |2026-03-05|||Fix dead code in popup, dynamic version in settings (v1.0.6)
**Details:** Remove orphaned theme code at popup.js lines 36-38 that would error.
Settings page now reads version from manifest dynamically instead of
hardcoding v1.0.0. Bump to v1.0.6.
**Files:** manifest.json,popup/popup.js,settings/settings.html,settings/settings.js
**Commit:** 8888b61

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json
**Commit:** b1362a7

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-07-08: CWS/AMO submission bundle committed (P0-4-commit-3)

**Problem:** Sensory Shield had no committed CWS Web Store / AMO submission package — CWS-LISTING.md, PRIVACY.md, SUBMIT.md, and cws-shots/ existed only as generator output on disk, never landed in git, so the extension wasn't submission-ready from a clean checkout.
**Root cause:** `fleet-to-store` generates these artifacts locally but a separate commit step was needed to land them, bump the patch version, and rebuild the store zips.
**Fix:** Verified PRIVACY.md is truthful (local-storage-only, zero external transmission) and CWS-LISTING.md's single-purpose + per-permission + host-permission justifications match the actual manifest.json permissions. Bumped manifest.json to v1.0.37. Rebuilt *-chrome.zip / *-firefox.zip via the canonical `scripts/build-zips.sh`; Firefox zip passed `amo-validate.py`. Committed the bundle.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/, manifest.json

## 2026-07-08: ITER-A11Y-2 — a11y remediation unblocks CWS pipeline (R-cws-a11y-2)

**Problem:** `ls-check .` failed A11Y-DIALOG (popup.html missing `role="dialog"`/`aria-labelledby`), A11Y-EXPANDED (theme dropdown trigger missing `aria-expanded`), BRAND-LIB-WIRED (popup.html never loaded `lovespark-base.css`/`lovespark-theme.js` despite both files sitting unused in lib/), A11Y-CONTRAST (3 fleet-wide beige/slate failures), and warned QUAL-README/QUAL-LICENSE — the staged CWS bundle was blocked by these real pre-commit a11y fails.
**Root cause:** popup.html predates the shared-lib theme pattern: it hand-rolled its own theme dropdown (`applyTheme`/`initThemeDropdown` duplicated in popup.js, including a stale `chrome.storage.local` `darkMode` migration key nothing else in the repo ever wrote) instead of loading `lib/lovespark-theme.js`, and never declared a dialog role/label on the popup container or `aria-expanded` on the dropdown trigger. README/LICENSE were never generated for this repo.
**Fix:** Linked `lib/lovespark-base.css` in `<head>`. Added `role="dialog" aria-labelledby="popupTitle" aria-describedby="popupDesc"` to `.popup-container` (`id="popupTitle"`/`id="popupDesc"` on the existing `<h1>`/subtitle). Added `aria-expanded="false" aria-haspopup="true" aria-label="Change theme"` to `#themeToggle` and loaded `lib/lovespark-theme.js`. Deleted the duplicated hand-rolled theme JS from popup.js and replaced it with `LoveSparkTheme.init()` plus a small listener that keeps `aria-expanded` synced to the menu's open/closed class (verified no other file reads the dropped legacy `darkMode` key). Added MIT `LICENSE` and a real `README.md`. Bumped manifest.json patch version and rebuilt CWS/AMO zips. `ls-check .` is now clean except the fleet-wide A11Y-CONTRAST check, which is computed against the canonical `Extensions/infrastructure/lovespark-shared-lib` tokens (KI-002/003/004) and is out of this unit's assigned repo scope — tracked separately in meta_implementation.md item 7.
**Files:** popup/popup.html, popup/popup.js, LICENSE, README.md, manifest.json, *-chrome.zip, *-firefox.zip
**Commit:** unit R-cws-a11y-2

## 2026-07-08: ITER-A11Y-3 — token re-sync + font-duplication re-check (P2-sync-2)

**Problem:** `ls-check .` was still failing A11Y-CONTRAST (3 fleet-wide beige/slate failures, tracked as out-of-scope since the previous unit). The fleet audit (meta_implementation.md) also flagged this repo as shipping a fully duplicated ~1.1MB font set across a top-level `fonts/` dir and `lib/fonts/`.
**Root cause (contrast):** Baked into canonical `Extensions/infrastructure/lovespark-shared-lib/lovespark-tokens.css`, identical fleet-wide; a sibling unit landed the fix (shared-lib commit 41b43cc, `BUG-002 / KI-002, KI-003, KI-004`) during this pass.
**Root cause (fonts, re-investigated):** Re-checked file-by-file — the audit description no longer matches this repo's actual state. Top-level `fonts/` contains exactly one file, `OpenDyslexic-Regular.woff` (120KB), referenced only by `content/content.js` to inject an optional dyslexia-friendly font into the pages the user visits (a content-script feature). `lib/fonts/` contains a completely different 1.1MB set (atkinson-hyperlegible, comfortaa, dm-mono, lexend, lora, orbitron, playfair-display, press-start-2p, rajdhani) backing the popup UI's `lovespark-fonts.css` — zero filename or content overlap with `fonts/`. There is no duplicate font tree to delete; deleting `fonts/OpenDyslexic-Regular.woff` would break the content-script's dyslexia-font feature. No change made — closing this as a false positive against current repo state (possibly stale from before an earlier refactor, or conflated with a different repo in the batch audit).
**Fix:** Synced the corrected `lovespark-tokens.css` from canonical into `lib/`. `ls-check .` no longer fails A11Y-CONTRAST. A **new** canonical-level check, BRAND-TOKEN-DRIFT, surfaced as a side effect: the shared-lib fix was hand-applied to the CSS without regenerating `design-tokens/generated/lovespark-tokens.css` from `design-tokens/tokens.json` (source-of-truth primitives `earth-dark`/`slate-border`/`gray-muted` still hold the pre-fix hex values). That generator pipeline isn't a git repo and sits outside every extension repo's boundary — not this unit's to fix; flagging as the new fleet-wide follow-up, replacing the now-resolved A11Y-CONTRAST tracking note. Bumped manifest.json patch version and rebuilt CWS/AMO zips via `scripts/build-zips.sh` (Firefox zip passed `amo-validate.py`).
**Files:** lib/lovespark-tokens.css, manifest.json, *-chrome.zip, *-firefox.zip
**Commit:** unit P2-sync-2

## 2026-07-08: ITER-A11Y-4 — zip self-inclusion bug fixed, clean rebuild (P2-sync-2)

**Problem:** `ls-check .` still reports 1 residual fail (BRAND-TOKEN-DRIFT), and the `*-chrome.zip`/`*-firefox.zip` produced by the previous unit (ITER-A11Y-3, built 19:44) predated that commit's contrast-token sync (landed 19:47-19:48), so the shipped zips were already stale on top of a second problem: the built zips were committed into the repo root, and `scripts/build-zips.sh` rsyncs the whole extension directory with no `*.zip` exclude — so every rebuild nested the previous `-chrome.zip`/`-firefox.zip` inside the new one, doubling the package size on every build cycle (confirmed: sensory-shield's zip contained its own prior 4.17MB zip pair nested inside, inflating the "clean" rebuild to 9.3MB before the fix).
**Root cause:** `ITER-CWS-01` / `R-cws-a11y-2` committed the build output (`*-chrome.zip`, `*-firefox.zip`) directly into the extension source tree instead of only the canonical `lovespark zips/` output directory. `build-zips.sh`'s rsync stage excludes `.git/`, `node_modules/`, etc. but never `*.zip`, so those tracked zips got swept into every subsequent build's input, recursively nesting.
**Fix:** `git rm --cached` the tracked `*-chrome.zip`/`*-firefox.zip` from the repo root, deleted them from disk, added `*.zip` to `.gitignore` so build output never gets re-committed. Reran `scripts/build-zips.sh` — output zip size dropped from 4.17M→1.3M, Firefox zip passed `amo-validate.py`. Verified `ls-check .` is otherwise unchanged (BRAND-TOKEN-DRIFT remains the sole residual fail, root-caused in ITER-A11Y-3 as a `design-tokens/tokens.json` vs. hand-patched canonical CSS mismatch — that pipeline isn't a git repo and sits outside every extension repo's boundary, not this unit's to fix; flagged for a dedicated follow-up).
**Files:** .gitignore, *-chrome.zip (untracked), *-firefox.zip (untracked)
**Commit:** unit P2-sync-2
