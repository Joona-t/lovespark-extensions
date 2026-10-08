# BUGS AND ITERATIONS - LoveSpark Site Notes

## v1.1.0 (2026-08-20)

- Added the least-privilege `activeTab` permission required to identify the invoked page.
- Added versioned plaintext local backup and confirmed, fully validated restore.
- Enforced pause in both popup and worker while preserving read/export access.
- Added strict hostname, note, count, aggregate, and serialized-backup limits with fail-closed corrupt-storage behavior.
- Serialized mutations, made storage/runtime failures visible and retryable, restricted local storage to trusted contexts where supported, and rejected non-popup message callers.
- Corrected the Firefox disclosure: notes and hostnames are stored locally but are not collected or transmitted.
- Added dependency-free automated domain and worker integration tests.

## v1.0.0 (2026-03-25)

### Initial Release
- Scaffold generated via scaffold-extension.py
- Custom implementation: attach notes to any website URL, persist per-domain
- Notes stored in chrome.storage.local under siteNotes object keyed by hostname
- Save and Delete buttons with status feedback
- New notes increment stats counter; edits do not double-count
- Theme dropdown uses correct IDs (themeToggle/themeMenu) matching lovespark-theme.js
- 340px popup width, var(--ls-bg-gradient), Sparky mascot, 4 themes
- Zero innerHTML usage -- all DOM built via scaffold HTML or DOM API
- WCAG AA: focus-visible indicators, aria-live regions, aria-labels, prefers-reduced-motion
- Permissions: storage only (no activeTab needed -- uses chrome.tabs.query)

### Known Limitations
- Notes are per-domain (hostname), not per-URL path
- No export/import functionality yet
- No character limit on notes (storage.local has ~5MB limit)


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
