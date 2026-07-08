# Bugs & Iterations

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup/popup.css,settings/settings.css
**Commit:** 04028aa

## : |2026-03-06|||fix: WCAG AA compliance — contrast, keyboard nav, ARIA, touch targets

**Problem:** |2026-03-06|||fix: WCAG AA compliance — contrast, keyboard nav, ARIA, touch targets
**Details:** - Fix white-on-pink contrast failures: title/card text now uses --ls-text-dark
- Darken --ls-text-muted from #9E4D6E to #783850 for 4.5:1+ contrast
- Remove opacity on footer text that degraded contrast below AA
- Add full keyboard navigation to theme dropdown (arrows, Enter, Escape)
- Add aria-expanded, aria-haspopup, role=listbox/option to theme dropdown
**Files:** lib/lovespark-footer.css,manifest.json,popup/popup.css,popup/popup.html,popup/popup.js
**Commit:** 384f639

## : |2026-03-08|||fix: storage API mismatch causing all features to be non-functional + a11y fixes

**Problem:** |2026-03-08|||fix: storage API mismatch causing all features to be non-functional + a11y fixes
**Details:** Content scripts read from storage.sync while popup/SW wrote to storage.local,
so features never activated (caused Chrome Web Store rejection). Also fixes
ARIA roles, aria-live, focus ring tokens, touch targets, and KI-001 contrast.
**Files:** content/agents/ContentOrchestrator.js,lib/lovespark-base.css,manifest.json,popup/popup.css,popup/popup.html
**Commit:** 55e9612

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup/popup.html
**Commit:** 7041047

## : |2026-03-08|||fix: stale comments and ARIA role correction

**Problem:** |2026-03-08|||fix: stale comments and ARIA role correction
**Details:** - ContentOrchestrator comment: storage.sync → storage.local
- settings.js comment: sync rate limits → write storm avoidance
- popup: role="alertdialog" → role="dialog" (non-modal panel)
- Remove aria-live from cute-msg (cosmetic rotating text, not status)
**Files:** content/agents/ContentOrchestrator.js,popup/popup.html,settings/settings.js
**Commit:** 720cafb

## : |2026-02-28|||Fix font override not applying — invalid :not(svg *) selector

**Problem:** |2026-02-28|||Fix font override not applying — invalid :not(svg *) selector
**Details:** :not(svg *) uses a descendant combinator inside :not() which is
invalid CSS. Browsers silently dropped the entire rule, so no font
override was applied. Changed to :not(svg).
**Files:** content/agents/StyleAgent.js
**Commit:** 97b1a16

## : |2026-03-08|||fix: KI-001 and KI-008 in shared footer — pink-accent bg + missing reduced-motion

**Problem:** |2026-03-08|||fix: KI-001 and KI-008 in shared footer — pink-accent bg + missing reduced-motion
**Details:** Ko-fi button used --ls-pink-accent with white text (fails 4.5:1 contrast).
Changed to --ls-pink-deep. Added prefers-reduced-motion for footer transitions.
Bumped version to 1.0.8.
**Files:** lib/lovespark-footer.css,manifest.json
**Commit:** b468030

## : |2026-02-28|||Fix 11 bugs from Carmack audit: rate limits, stale DOM, accessibility

**Problem:** |2026-02-28|||Fix 11 bugs from Carmack audit: rate limits, stale DOM, accessibility
**Details:** - Storage sync rate limit: enforce 500ms MIN_WRITE_GAP in popup + settings
- FocusAgent: isConnected checks in rAF mouseover callback
- DistractionAgent: epoch guard prevents stale rAF after disable
- Popup: clear setInterval on beforeunload, defensive ensureInjected
- Popup: disable site button on non-injectable tabs (chrome://, etc.)
**Files:** content/agents/ContentOrchestrator.js,content/agents/DistractionAgent.js,content/agents/FocusAgent.js,content/message-bus.js,popup/popup.css
**Commit:** bf24a17

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup/popup.css
**Commit:** df7d857

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

## 2026-07-08: P2-4 asset diet — deduped a ~790KB duplicated/dead font set in lib/fonts

**Problem:** `lib/fonts/` (loaded by `lib/lovespark-fonts.css` for popup/settings chrome) carried the FULL 9-family LoveSpark shared-lib font catalog (DM Mono, Lora, Press Start 2P, Orbitron, Rajdhani, Comfortaa, Playfair Display, Atkinson Hyperlegible, Lexend) even though this extension's popup/settings only ever set `--ls-font-body`/`--ls-font-display` to DM Mono, Lora (beige theme), or Press Start 2P — the other 6 families were either byte-for-byte duplicates of the reading-page font set the extension already ships separately (Atkinson Hyperlegible + Lexend, applied to arbitrary web pages by `content/agents/StyleAgent.js` via `chrome.runtime.getURL('fonts/')`, i.e. the top-level `fonts/` dir — never `lib/fonts/`) or entirely unreferenced (Orbitron/Rajdhani/Comfortaa/Playfair Display — no CSS rule in the repo sets `font-family` to any of them).
**Root cause:** `lib/lovespark-fonts.css` was synced wholesale from the canonical shared-lib font sheet (`scripts/sync-shared-lib.sh`) without trimming to the subset this extension's theme system actually uses, so every extension in the fleet ships the entire 9-family catalog regardless of use.
**Fix:** Deleted the 34 unused/duplicate `.woff2` files from `lib/fonts/` (Atkinson Hyperlegible x8, Lexend x8, Orbitron x1, Rajdhani x6, Comfortaa x6, Playfair Display x6 — ~790KB) and trimmed the matching `@font-face` blocks out of `lib/lovespark-fonts.css`, leaving only DM Mono / Lora / Press Start 2P. Verified via `python3` brace-count + file-existence check that every remaining `@font-face` rule resolves. Did NOT touch the top-level `fonts/` dir (OpenDyslexic/Lexend/Atkinson Hyperlegible) — that's the live reading-page font set applied by StyleAgent.js and is unrelated to the popup/settings chrome fonts. `ls-check .` confirmed no new failures (pre-existing BRAND-LIB-SYNC + QUAL-CHANGELOG-DRIFT unaffected — same 2 fail/1 warn with or without this change, verified via `git stash`). Bumped manifest.json 1.0.32 → 1.0.33 per rule #9.
**Files:** lib/lovespark-fonts.css, lib/fonts/*.woff2 (34 deleted), manifest.json
**Commit:** (this commit)

**Separately flagged, not fixed here (out of scope for asset diet):** `manifest.json` `web_accessible_resources` only declares `fonts/*.woff` — not `fonts/*.woff2` — so the Lexend/Atkinson-Hyperlegible reading-page fonts StyleAgent.js injects via `chrome.runtime.getURL('fonts/...')` may 404 on real pages since they're `.woff2`. Pre-existing, unrelated to this asset diet; spawned as a separate task.
