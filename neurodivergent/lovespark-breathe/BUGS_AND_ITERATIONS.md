# Bugs & Iterations — LoveSpark Breathe

<!-- Log every bug fix and iteration with date, problem, root cause, and fix. -->

| Date | Problem | Root Cause | Fix |
|------|---------|------------|-----|
| | | | |


## 2026-04-20: Ship-Day v1.0.19 — 5 fixes (swarm audit)

**Sparky missing in Step Back overlay**
- Problem: Sparky mascot (mascot.png) did not render in the step-back overlay on social media sites.
- Root cause: `chrome.runtime.getURL('mascot.png')` in content.js injects a chrome-extension:// URL into the page DOM. MV3 requires `web_accessible_resources` for this to load; field was absent from manifest.json.
- Fix: Added `web_accessible_resources` with `mascot.png` scoped to the 6 supported site patterns.

**CSP violation on every popup open**
- Problem: Browser console showed a CSP error on each popup open.
- Root cause: `popup.css` line 1 had `@import url('https://fonts.googleapis.com/...')` which was blocked by the extension's own `font-src 'self'` policy. No fonts loaded, just a violation log.
- Fix: Removed the @import. UI falls back to system fonts; typography still readable.

**Activity log showed stale counts after session completion**
- Problem: After finishing a breathing or grounding session, the popup log refreshed before the storage write completed.
- Root cause: `logSession()` was not awaited in background.js before `sendResponse({ ok: true })`.
- Fix: Changed to `logSession(msg.type).then(() => sendResponse({ ok: true }))`.

**High CPU usage when comment dimmer active on social media**
- Problem: Measurable CPU load on Twitter/Reddit with dimmer on during active scrolling.
- Root cause: MutationObserver callback ran `applyDimmer()` (multiple querySelectorAll calls) on every DOM mutation — up to 60+ times/sec.
- Fix: Added 250ms debounce; timer cleared on `stopDimmerObserver()`.

**4 dead lib scripts loaded in popup context**
- Problem: `lovespark-stats.js`, `lovespark-badge.js`, `lovespark-popup.js`, `lovespark-lifecycle.js` were loaded in popup.html but never called.
- Root cause: sync-shared-lib.sh added all lib files uniformly without checking per-extension usage.
- Fix: Removed the 4 unused script tags from popup.html.

---

## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
