# Bugs & Iterations

## : |2026-03-08|||Fix remaining contrast failures across all 4 themes

**Problem:** |2026-03-08|||Fix remaining contrast failures across all 4 themes
**Details:** Darken beige --ls-text-muted (#8b6f47 -> #6b5630) for 5.5:1 on glass.
Fix settings header-sub, setting-desc, hint, and footer to use
--ls-text-dark instead of --ls-text-muted. Remove opacity from
footer elements on gradient (need full contrast at deepest point).
Ko-fi button uses fixed #b92d5d background for 5.8:1 with white text.
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,popup/popup.css,settings/settings.css
**Commit:** 0c305f4

## : |2026-03-08|||Fix hover/focus/component contrast across all themes (v1.1.0)

**Problem:** |2026-03-08|||Fix hover/focus/component contrast across all themes (v1.1.0)
**Details:** - Add --ls-focus-ring and --ls-btn-hover-bg per-theme variables
- Button hover/active states use deeper colors (4.5:1+ white text)
- Focus outlines use darker ring colors (3:1+ against backgrounds)
- Toggle checked state uses focus-ring color (passes beige 3:1)
- Slider thumb uses focus-ring color for component contrast
**Files:** guide/guide.css,lib/lovespark-base.css,manifest.json,popup/popup.css,popup/popup.html
**Commit:** 10a79ae

## : |2026-03-08|||Chrome Web Store readiness audit fixes (v1.0.9)

**Problem:** |2026-03-08|||Chrome Web Store readiness audit fixes (v1.0.9)
**Details:** Bundle UI fonts locally (DM Mono, Lora, Press Start 2P) replacing
Google Fonts CDN — eliminates external requests and privacy concern.
Fix WCAG 2.1 AA contrast ratios across all 4 themes. Increase touch
targets to 32px minimum. Respect prefers-reduced-motion for message
rotation. Add ARIA labels to preset buttons, TTS FAB, and disabled
**Files:** .gitignore,README.md,content/agents/TTSAgent.js,fonts/DM_Mono_300.woff2,fonts/DM_Mono_400.woff2
**Commit:** f13a6a9

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
