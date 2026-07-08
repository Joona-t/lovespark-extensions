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
