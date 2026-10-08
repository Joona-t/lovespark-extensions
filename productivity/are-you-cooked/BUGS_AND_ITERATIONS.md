# Bugs & Iterations

## : |2026-03-02|||v1.2.0: Two-tier warning escalation + bug fixes 🔥

**Problem:** |2026-03-02|||v1.2.0: Two-tier warning escalation + bug fixes 🔥
**Details:** - 5 tabs: mild popup warning (auto-dismiss 5s, single dismiss button)
- 10+ tabs: strict popup (forced choice: Ignore or Be Mindful)
- "Be Mindful" closes the offending tab via chrome.tabs.remove
- Rotating copy for titles, dismiss buttons, and mindful buttons
- Deeper pink gradient + Sparky shake for strict mode
**Files:** .gitignore,background.js,manifest.json,popup.css,popup.html
**Commit:** 438c5d4

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** 920879c

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css
**Commit:** ec5c740

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** f1dc842

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


## 2026-05-07: v2.1.36 — Pre-ship audit (a11y + storage hygiene + research-aligned stats)

**Problem:** Static audit found five real issues blocking a confident CWS submission and an honest brand alignment with the "Are You Cooked?" promise:
1. `warning.js` read the legacy `darkMode` boolean, but `popup.js` writes the new `theme` string. Beige / slate / dark users got the retro-pink warning popup regardless of their selected theme (KI-017 storage-key mismatch).
2. `warning.html` had no `role="dialog"`, no `aria-modal`, no `aria-labelledby` / `aria-describedby`, and no initial focus or ESC handler — failing CLAUDE.md a11y rules and WCAG 2.1 keyboard expectations.
3. `background.js` had seven `.catch(() => {})` blocks that silently swallowed quota errors, permission denials, and `chrome.windows.create` failures (KI-021).
4. The Mindful button's teal accent (`#0D9488` / `#0F766E`) was hard-coded in `warning.css`, outside the token system.
5. The brand promised cookedness detection but the popup only showed a tab count — no daily peak, no positive-reinforcement counter, no JITAI-grade signals (per Nahum-Shani et al. 2018).

**Root cause:** Iterative additions over six versions accreted three theme paths (legacy `darkMode`, new `theme`, and the `data-theme` attribute) without unifying read sites. The warning popup was added in v1.2.0 before the suite-wide a11y framework existed and never got revisited. KI-021 silent catches predate the LoveSpark known-issues registry.

**Fix:**
- `warning.js`: read both `theme` and `darkMode` from storage, resolve to a single string, set `data-theme` accordingly. Added `Escape` keydown handler and `.focus()` on the appropriate button (Mindful in strict, Dismiss in mild).
- `warning.html`: added `role="dialog"`, `aria-modal="true"`, `aria-labelledby="title"`, `aria-describedby="warningSub"`, `aria-live="assertive"` on the title.
- `background.js`: every `.catch(...)` block now logs `console.warn('[AYC] <context>', err)`. Imports `lib/lovespark-stats.js` via `importScripts`. Added `bumpWorstToday()` and `bumpMindfulHelp()` with proper daily-reset semantics via `LoveSparkStats.checkDailyReset`.
- `warning.css`: defined `--ayc-calm`, `--ayc-calm-hover`, `--ayc-calm-glow*` tokens at `:root` and switched `.btn-mindful` to reference them.
- `popup.html` + `popup.css` + `popup.js`: added a stats strip with peak-tabs-today (resets daily) and lifetime mindful-saves count.
- `manifest.json`: 2.1.35 → 2.1.36.
- New `research.md` cites the 8 papers (Leroy 2009, Satici et al. 2023, Nahum-Shani et al. 2018, Albulescu et al. 2022, scroll-immersion SEM 2025, ADHD/short-form-video 2022, Maslach MBI, WCAG 2.1) that ground each Tier 2/3 decision.

**Files:** background.js, warning.js, warning.html, warning.css, popup.html, popup.css, popup.js, manifest.json, research.md
**Commit:** TBD
