# LoveSpark Working Memory Pad - Bugs and Iterations

## v1.0.0 (2026-03-26) - Initial Build

### Architecture Decisions
- **storage only** — No alarms, no content scripts.
- **3 pinned pads** — Fixed count, always visible on popup open. No folders, no categories, no organization overhead. Just 3 slots for things you need to remember right now.
- **Auto-save with debounce** — 500ms debounce on input, immediate save on blur. No save button needed.
- **Badge shows active count** — 1/2/3 pink badge indicates how many pads have content.
- **Clear per-pad** — X button visible on hover. One click to clear.
- **200 char limit** — Working memory notes should be short. This is a scratchpad, not a notebook.
- **Different from brain-dump** — Brain dump is for rapid thought capture with tags and 7-day retention. Working memory pad is for persistent pinned notes (phone numbers, instructions) that stay until cleared.
- **Different from site-notes** — Site-notes are per-URL. Working memory pad is URL-independent.
- **CWS keyword** — "working memory ADHD" is high-search.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- Fixed 3 pads (not configurable)
- No copy-to-clipboard button
- No color coding per pad
- Text only (no links, no formatting)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-26 | Initial build | CWS keyword: "working memory" |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-10-24 — Chromium fleet audit (1.0.2 → 1.0.3)

- Package the local font stylesheet and the font files it references so the UI renders without missing assets or remote font requests.
- Wire the shared theme menu to this popup’s dropdown IDs, persist selections, and support Escape with accurate expanded state.
- Insert the shared footer HTML into its mount instead of discarding the renderer’s return value.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
