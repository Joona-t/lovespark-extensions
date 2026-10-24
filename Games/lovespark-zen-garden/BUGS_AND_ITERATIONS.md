# LoveSpark Zen Garden - Bugs and Iterations

## v1.0.0 (2026-03-24) - Initial Build

### Architecture Decisions
- **storage only** — No alarms, no content scripts. Garden state persisted in local storage.
- **Tap-to-place interaction** — Click anywhere on the 308x220 canvas to place the selected element. Right-click to remove.
- **6 element types** — Rock, Bamboo, Flower, Tree, Water Drop, Lantern. All emoji-based, no image assets needed.
- **30 item cap** — Prevents storage bloat. Enough for a detailed garden.
- **Persistent garden** — Saved on every placement. Restores on popup reopen.
- **Session tracking** — First placement per popup open counts as a "session" in daily stats.
- **Clear button** — Trash icon in picker bar. Wipes garden state.
- **Crosshair cursor** — Signals "click to place" interaction mode.
- **DOM API only** — Elements created via createElement. Zero innerHTML per KI-011.
- **prefers-reduced-motion** — Disables hover scale transitions.

### Known Limitations (V1)
- No drag to reposition (items are fixed after placement)
- No undo (only right-click to remove individual items)
- No sand drawing (raking patterns — V2 candidate using canvas API)
- No zoom or pan
- No garden sharing/export

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-24 | Initial build | Expansion Agent Cycle 15 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## BUG-038 (2026-07-08): popup.html referenced mascot.png that didn't exist on disk

**Problem:** `popup.html` has `<img src="mascot.png">` (line 27) but `mascot.png` was never present in the repo root. Rule #3 (mandatory Sparky mascot in every UI) was violated by construction — the popup rendered a broken image icon instead of the mascot.
**Root cause:** `scaffold-extension.py`'s canonical mascot source path (`{BASE}/Assets & Docs/mascot.png`) is stale — the canonical asset moved to `{BASE}/assets/mascot.png` during a repo reorg. The scaffold's mascot-copy step (`if os.path.exists(MASCOT): shutil.copy2(...)`) silently no-ops when the source path is wrong instead of failing, so no error surfaced at scaffold time.
**Fix:** Copied the canonical mascot (`Claude x LoveSpark/assets/mascot.png`) into the repo root. `icons/icon-{16,48,128}.png` were already present and valid (verified via `python3 -c json.load` on manifest.json + a static path-existence check over every `manifest.json` icon/action path and every `<img src>` in popup.html/newtab.html) — this repo's icon set was not part of the defect. Bumped patch version 1.0.29 → 1.0.30. Also patched `scaffold-extension.py` (shared tooling, not tracked in this repo) to fix the stale `MASCOT` path and hard-fail (`sys.exit(1)`) instead of silently warning when a generated manifest/popup references an asset path absent on disk, closing the defect class for all future scaffold runs.
**Files:** mascot.png (added), manifest.json (version bump)
**Commit:** see git log (fleet-p0 icon/mascot fix, unit P0-5-icons)

## BUG-039 (2026-07-08): lib/ shared-lib copies had uncommitted drift; lovespark-fonts.css + fonts/ were entirely missing

**Problem:** Two defects found in the same shared-lib sync pass. (1) `lib/lovespark-footer.css` and `lib/lovespark-theme.js` in the working tree differed from the last commit (uncommitted) — `.ls-suite-btn:hover` used `opacity: 0.75` instead of `text-decoration: underline`, and `lovespark-theme.js` read a stale `darkMode` fallback key canonical no longer sets. (2) `popup.html` links `<link rel="stylesheet" href="lib/lovespark-fonts.css">` but neither `lib/lovespark-fonts.css` nor a `lib/fonts/` directory existed anywhere in the repo — the DM Mono / Press Start 2P `@font-face` declarations were never present, so the popup silently fell back to system fonts despite loading a 404'd stylesheet link.
**Root cause:** (1) A prior shared-lib sync pass copied the current canonical files into `lib/` but the commit step was never run. (2) This repo's scaffold never received the fonts bundle that other game repos (color-match, pixel-art, reaction-time, word-scramble, flappy-waifu) already have — a partial/incomplete scaffold, not a regression.
**Fix:** Verified `lib/lovespark-footer.css` and `lib/lovespark-theme.js` working-tree content matches canonical byte-for-byte, committed the sync. Copied `lovespark-fonts.css` and the `fonts/` directory (1.1 MB, 54 `@font-face` rules) from `Extensions/infrastructure/lovespark-shared-lib/` into `lib/` so the existing `<link>` in popup.html resolves. Bumped patch version.
**Files:** lib/lovespark-footer.css, lib/lovespark-theme.js, lib/lovespark-fonts.css (new), lib/fonts/ (new, 53 files), manifest.json (1.0.30 → 1.0.31)

## 2026-10-24 — Chromium fleet audit (1.0.31 → 1.0.32)

- Wire the shared theme menu to this popup’s dropdown IDs, persist selections, and support Escape with accurate expanded state.
- Insert the shared footer HTML into its mount instead of discarding the renderer’s return value.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
