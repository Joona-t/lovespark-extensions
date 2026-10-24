# LoveSpark Task Starter - Bugs and Iterations

## v1.0.0 (2026-03-25) - Initial Build

### Architecture Decisions
- **storage only** — Simplest possible permission surface.
- **3-step guided flow** — Step 1: "What task are you avoiding?" Step 2: "What's the tiniest first step?" Step 3: "Go do it." Based on the ADHD technique of making the first step so small it's impossible to refuse.
- **8 encouragement messages** — Rotated randomly on completion. Validates the act of starting, not finishing.
- **No task storage** — Intentionally ephemeral. The point is to break paralysis right now, not create a task list. Different from daily-checklist, planner, or brain-dump.
- **CWS keyword** — "task paralysis ADHD" is high-search in neurodivergent communities.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- No task history (by design — ephemeral)
- No timer integration
- No keyboard shortcut to open
- Steps not customizable

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-25 | Initial build | CWS keyword: "task paralysis" |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits


## 2026-06-26: Broken `lovespark-fonts.css` stylesheet link (404 at runtime) — v1.0.4

**Problem:** `popup.html:8` references `<link rel="stylesheet" href="lib/lovespark-fonts.css">`, but `lib/lovespark-fonts.css` did not exist in this extension — and neither did the `lib/fonts/` woff2 payload it depends on. The stylesheet 404'd at runtime, so none of the bundled `@font-face` declarations loaded. The popup silently fell back to the generic `monospace` / `cursive` system fonts instead of the brand typography (DM Mono body / Press Start 2P display).
**Root cause:** Shared-lib sync gap. `lib/lovespark-tokens.css` (auto-generated) defines only the *family-name variables* — `--ls-font-body: 'DM Mono'`, `--ls-font-display: 'Press Start 2P'` — which point at font families that are NOT system fonts. The `@font-face` rules that actually load those families from bundled local woff2 files live in `lovespark-fonts.css` (54 `@font-face` blocks, `src: url(fonts/*.woff2)`), which was never copied into this extension's `lib/`. Manifest CSP already declared `font-src 'self'`, confirming local bundled fonts are the intended design (no remote/Google Fonts — privacy-first). Likely fallout from the 2026-03-28 fleet revert/sync event above.
**Fix (PATCH, not remove-the-link):** Restored the canonical font bundle by copying `lovespark-fonts.css` (21,382 B) + the full `fonts/` directory (51 woff2 files, 1.1 MB) from the canonical shared lib (`Extensions/infrastructure/lovespark-shared-lib/`) into `lib/`. Verified every `@font-face` `src: url(fonts/…)` now resolves relative to `lib/`. Removing the dead `<link>` was rejected: it would have locked in the broken system-font fallback and diverged from the 50+ sibling extensions that correctly ship this file. Bumped manifest 1.0.3 → 1.0.4 and rebuilt chrome + firefox zips.
**Files:** lib/lovespark-fonts.css (new), lib/fonts/ (new, 51 files), manifest.json
**Fleet note:** This is NOT isolated — ~40 other extensions reference `lovespark-fonts.css` in their HTML but are missing the file (e.g. lovespark-brain-dump, lovespark-pomodoro-rose, lovespark-quick-timer, lovespark-panic-button, calm-down-kit, body-double, working-memory-pad, …). Same class of bug. Fleet-wide remediation surfaced for a separate guarded sweep so each extension gets its own version bump + rebuild.

## 2026-10-24 — Chromium fleet audit (1.0.5 → 1.0.6)

- Wire the shared theme menu to this popup’s dropdown IDs, persist selections, and support Escape with accurate expanded state.
- Insert the shared footer HTML into its mount instead of discarding the renderer’s return value.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
