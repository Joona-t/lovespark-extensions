# BUGS_AND_ITERATIONS.md — LoveSpark Link Saver

## v1.0.0 — 2026-03-25

### Initial Release
- **Scaffolded** via scaffold-extension.py, shared lib synced
- **Features:** One-click save current page, max 100 links, sorted by date, click to open, delete per item, duplicate detection
- **Permissions:** storage only
- **A11y:** WCAG AA focus indicators, prefers-reduced-motion, aria-live regions, role=dialog, role=list/listitem
- **Themes:** 4 themes via shared lovespark-theme.js (retro/dark/beige/slate)
- **Zero innerHTML** — all DOM built with createElement/textContent

### Known Considerations
- Link list max-height 220px with scroll — tested for popup max height constraint
- Duplicate detection by URL — shows "Already saved" feedback


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## v1.0.3 — 2026-10-08: ls-check cleanup

**Problem:** `ls-check` failed PERM-MISSING: `chrome.tabs.query` used in popup.js but no tab permission declared.
**Root cause:** "Save This Page" reads `tab.url` and `tab.title` from `chrome.tabs.query`. Without `tabs` or `activeTab`, Chrome leaves those fields undefined, so the save could store an empty link.
**Fix:** Added `activeTab` to manifest permissions. It is the narrowest option: the popup opens from an action click, which grants temporary access to the current tab only. `tabs` was not needed. Added a matching `activeTab` row to PRIVACY.md. Bumped version 1.0.2 → 1.0.3.
**Files:** manifest.json, PRIVACY.md
