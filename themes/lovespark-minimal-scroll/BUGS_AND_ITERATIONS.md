# LoveSpark Minimal Scroll - Bugs and Iterations

## BUG-001 (2026-07-08): manifest.json icons + popup.html mascot referenced files that didn't exist on disk

**Problem:** `manifest.json` declared `icons/icon-{16,48,128}.png` and `popup.html` had `<img src="mascot.png">` (line 14), but neither the `icons/` directory nor `mascot.png` existed in the repo. Chrome cannot load an extension with a manifest that points at missing icon files — 100% of potential users were blocked. Rule #3 (mandatory Sparky mascot in every UI) was violated by construction.
**Root cause:** `scaffold-extension.py` writes a per-extension `generate_icons.py` script but never runs it automatically (it's left as a manual "Next: cd $ext_dir && python3 generate_icons.py" step that's easy to skip), and its canonical mascot source path (`{BASE}/Assets & Docs/mascot.png`) is stale — the asset moved to `{BASE}/assets/mascot.png` in a repo reorg, so the scaffold's `if os.path.exists(MASCOT): shutil.copy2(...)` mascot-copy step silently no-op'd instead of failing. No error surfaced at scaffold time in either case, so the gap shipped undetected.
**Fix:** Ran `generate_icons.py` (Pillow-based, produces the pink rounded-square icon set already shipped by sibling repo `lovespark-zen-garden` — same design, same byte sizes, verified for fleet visual consistency) to populate `icons/icon-{16,48,128}.png`. Copied the canonical mascot (`Claude x LoveSpark/assets/mascot.png`) into the repo root as `mascot.png`. Verified every asset path referenced in `manifest.json` (icons, action.default_icon, action.default_popup) and every `<img src>` in `popup.html`/`newtab.html` resolves on disk via a static Python check loop (`json.load` on the manifest + path-existence walk). Bumped patch version 1.0.29 → 1.0.30. Also patched `scaffold-extension.py` (shared tooling, not tracked in this repo) to fix the stale `MASCOT` path and hard-fail (`sys.exit(1)`) instead of silently warning when a generated manifest/popup references an asset path absent on disk, closing the defect class for every future scaffold run.
**Files:** icons/icon-16.png, icons/icon-48.png, icons/icon-128.png (added), mascot.png (added), manifest.json (version bump)
**Commit:** see git log (fleet-p0 icon/mascot fix, unit P0-5-icons)

## 2026-10-24 — Chromium fleet audit (1.0.30 → 1.0.31)

- Load the shared footer before popup initialization.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
