# BUGS AND ITERATIONS - LoveSpark Word Count

## v1.0.0 (2026-03-25)

### Initial Release
- Scaffold generated via scaffold-extension.py
- Custom implementation: select text on any page, see word count + character count + estimated read time
- Uses chrome.scripting.executeScript to read selection from active tab
- Read time estimate: 200 words per minute
- Stats tracked via shared LoveSparkStats accumulator
- Theme dropdown uses correct IDs (themeToggle/themeMenu) matching lovespark-theme.js
- 340px popup width, var(--ls-bg-gradient), Sparky mascot, 4 themes
- Zero innerHTML usage -- all DOM built via scaffold HTML or DOM API
- WCAG AA: focus-visible indicators, aria-live regions, aria-labels, prefers-reduced-motion
- Permissions: storage, activeTab, scripting

### Known Limitations
- Cannot read selection from chrome:// or extension pages (browser security)
- Read time rounds to nearest second (< 1 min) or minute (>= 1 min)


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
