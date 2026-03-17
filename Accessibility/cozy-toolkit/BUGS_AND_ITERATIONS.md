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
