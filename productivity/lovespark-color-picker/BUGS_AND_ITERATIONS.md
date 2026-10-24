# BUGS AND ITERATIONS - LoveSpark Color Picker

## v1.0.0 (2026-03-25)

### Initial Release
- Scaffold generated via scaffold-extension.py
- Custom implementation: pick colors from page using EyeDropper API
- Shows hex, RGB, HSL values with click-to-copy on each row
- Keeps history of last 10 picked colors as clickable swatches
- Color conversion (hex->RGB->HSL) done in background.js
- History stored in chrome.storage.local as colorHistory array
- Theme dropdown uses correct IDs (themeToggle/themeMenu) matching lovespark-theme.js
- 340px popup width, var(--ls-bg-gradient), Sparky mascot, 4 themes
- Zero innerHTML usage -- history swatches built via document.createElement
- WCAG AA: focus-visible indicators, aria-live regions, aria-labels, prefers-reduced-motion
- Permissions: storage, activeTab, scripting

### Known Limitations
- EyeDropper API requires Chromium 95+ (not supported in Firefox)
- Cannot pick colors from cross-origin iframes
- Firefox zip included for future compatibility when EyeDropper ships


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
