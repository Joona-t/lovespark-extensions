# Bugs & Iterations

_No entries yet. Document bugs, fixes, and iterations here as they occur._

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

**Problem:** Study Bubbles had no committed CWS Web Store / AMO submission package — CWS-LISTING.md, PRIVACY.md, SUBMIT.md, and cws-shots/ existed only as generator output on disk, never landed in git, so the extension wasn't submission-ready from a clean checkout.
**Root cause:** `fleet-to-store` generates these artifacts locally but a separate commit step was needed to land them, bump the patch version, and rebuild the store zips.
**Fix:** Verified PRIVACY.md is truthful (local-storage-only, zero external transmission) and CWS-LISTING.md's single-purpose + per-permission + host-permission justifications match the actual manifest.json permissions. Bumped manifest.json to v1.0.30. Rebuilt *-chrome.zip / *-firefox.zip via the canonical `scripts/build-zips.sh`; Firefox zip passed `amo-validate.py`. Committed the bundle.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/, manifest.json

## 2026-07-08: ITER-A11Y-2 — a11y remediation unblocks CWS pipeline (R-cws-a11y-2)

**Problem:** `ls-check .` failed A11Y-DIALOG (popup.html missing `role="dialog"`/`aria-labelledby`), A11Y-EXPANDED (theme dropdown trigger missing `aria-expanded`), A11Y-CONTRAST (3 fleet-wide beige/slate failures), and `--strict` additionally flagged A11Y-KI004 (`.study-source` at `opacity: 0.7` on top of the already-muted `--ls-text-muted` token, dropping below 4.5:1 in beige) — the staged CWS bundle was blocked by these real pre-commit a11y fails.
**Root cause:** popup.html already correctly loaded `lovespark-base.css`/`lovespark-theme.js` and called `LoveSparkTheme.init()`, but never declared a dialog role/label on the popup container or `aria-expanded` on the dropdown trigger (the shared `lovespark-theme.js` toggles the menu's `open` class but doesn't own `aria-expanded`). `.study-source`'s opacity stacked on top of an already-dimmed muted-text color, pushing it under the beige contrast floor (KI-004).
**Fix:** Added `role="dialog" aria-labelledby="popupTitle" aria-describedby="popupDesc"` to `.popup-container` (`id="popupTitle"`/`id="popupDesc"` on the existing header title/subtitle). Added `aria-expanded="false" aria-haspopup="true" aria-label="Change theme"` to `#themeToggle`, plus a small listener in popup.js that keeps `aria-expanded` synced to the menu's open/closed class. Raised `.study-source` opacity from 0.7 to 0.85 per the documented KI-004 fix. Added MIT `LICENSE` and a real `README.md`. Bumped manifest.json patch version and rebuilt CWS/AMO zips. `ls-check .` is now clean except the fleet-wide A11Y-CONTRAST check (computed against the canonical `Extensions/infrastructure/lovespark-shared-lib` tokens, KI-002/003, out of this unit's assigned repo scope — tracked separately in meta_implementation.md item 7).
**Files:** popup/popup.html, popup/popup.js, popup/popup.css, LICENSE, README.md, manifest.json, *-chrome.zip, *-firefox.zip
**Commit:** unit R-cws-a11y-2

## 2026-07-08: ITER-A11Y-3 — token re-sync + ARIA-dialog re-check (P2-sync-2)

**Problem:** `ls-check .` was still failing A11Y-CONTRAST (3 fleet-wide beige/slate failures, tracked as out-of-scope since the previous unit). This unit was also asked to verify the popup has `role="dialog"`/`aria-labelledby` since the fleet audit (meta_implementation.md line 717) flagged it as missing.
**Root cause (contrast):** Baked into canonical `Extensions/infrastructure/lovespark-shared-lib/lovespark-tokens.css`, identical fleet-wide; a sibling unit landed the fix (shared-lib commit 41b43cc, `BUG-002 / KI-002, KI-003, KI-004`) during this pass.
**Root cause (ARIA dialog, re-checked):** Already fixed by the previous unit (`R-cws-a11y-2`, see the entry above) — `popup/popup.html` has `role="dialog" aria-labelledby="popupTitle" aria-describedby="popupDesc"` on `.popup-container`, with matching `id="popupTitle"`/`id="popupDesc"` on the header title/subtitle. `ls-check .` confirms `A11Y-DIALOG` passes. The fleet audit note predates that fix. No change needed.
**Fix:** Synced the corrected `lovespark-tokens.css` from canonical into `lib/`. `ls-check .` no longer fails A11Y-CONTRAST. A **new** canonical-level check, BRAND-TOKEN-DRIFT, surfaced as a side effect: the shared-lib fix was hand-applied to the CSS without regenerating `design-tokens/generated/lovespark-tokens.css` from `design-tokens/tokens.json` (source-of-truth primitives `earth-dark`/`slate-border`/`gray-muted` still hold the pre-fix hex values). That generator pipeline isn't a git repo and sits outside every extension repo's boundary — not this unit's to fix; flagging as the new fleet-wide follow-up, replacing the now-resolved A11Y-CONTRAST tracking note. Bumped manifest.json patch version and rebuilt CWS/AMO zips via `scripts/build-zips.sh` (Firefox zip passed `amo-validate.py`).
**Files:** lib/lovespark-tokens.css, manifest.json, *-chrome.zip, *-firefox.zip
**Commit:** unit P2-sync-2

## 2026-07-08: ITER-A11Y-4 — zip self-inclusion bug fixed, clean rebuild (P2-sync-2)

**Problem:** `ls-check .` still reports 1 residual fail (BRAND-TOKEN-DRIFT), and the `*-chrome.zip`/`*-firefox.zip` produced by the previous unit (ITER-A11Y-3, built 19:44) predated that commit's contrast-token sync (landed 19:47-19:48), so the shipped zips were already stale on top of a second problem: the built zips were committed into the repo root, and `scripts/build-zips.sh` rsyncs the whole extension directory with no `*.zip` exclude — so every rebuild nested the previous `-chrome.zip`/`-firefox.zip` inside the new one, doubling the package size on every build cycle (confirmed: sensory-shield's zip contained its own prior 4.17MB zip pair nested inside, inflating the "clean" rebuild to 9.3MB before the fix).
**Root cause:** `ITER-CWS-01` / `R-cws-a11y-2` committed the build output (`*-chrome.zip`, `*-firefox.zip`) directly into the extension source tree instead of only the canonical `lovespark zips/` output directory. `build-zips.sh`'s rsync stage excludes `.git/`, `node_modules/`, etc. but never `*.zip`, so those tracked zips got swept into every subsequent build's input, recursively nesting.
**Fix:** `git rm --cached` the tracked `*-chrome.zip`/`*-firefox.zip` from the repo root, deleted them from disk, added `*.zip` to `.gitignore` so build output never gets re-committed. Reran `scripts/build-zips.sh` — output zip size dropped from 3.70M→1.2M, Firefox zip passed `amo-validate.py`. Verified `ls-check .` is otherwise unchanged (BRAND-TOKEN-DRIFT remains the sole residual fail, root-caused in ITER-A11Y-3 as a `design-tokens/tokens.json` vs. hand-patched canonical CSS mismatch — that pipeline isn't a git repo and sits outside every extension repo's boundary, not this unit's to fix; flagged for a dedicated follow-up).
**Files:** .gitignore, *-chrome.zip (untracked), *-firefox.zip (untracked)
**Commit:** unit P2-sync-2
