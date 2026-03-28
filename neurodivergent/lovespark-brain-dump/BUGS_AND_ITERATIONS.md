# LoveSpark Brain Dump - Bugs and Iterations

## v1.0.0 (2026-03-21) - Initial Build

### Architecture Decisions
- **storage only** - Simplest possible permission. No alarms, no content scripts.
- **Zero-friction capture** - Open popup, type, Enter. That's it. No categories to choose, no folders, no organization paralysis. Tags are optional.
- **3 optional tags** - Do (action items), Think (ideas/questions), Feel (emotions). Tags are one-tap toggles, not required.
- **7-day retention** - Auto-prunes thoughts older than 7 days. Brain dumps are ephemeral by design — they clear working memory, not create archives.
- **Newest-first display** - Most recent thought at top. Scrollable list with max-height.
- **Per-item delete + bulk clear** - Delete individual thoughts or clear all of today's dump.
- **280 char limit** - Keeps thoughts concise. This is a dump, not a journal.
- **DOM API only** - el() helper for building thought items. Zero innerHTML per KI-011.

### Known Limitations (V1)
- No search or filter by tag
- No export functionality
- No keyboard shortcut to open popup (would need commands API — V2)
- No "done" checkbox for Do-tagged items
- No drag-to-reorder

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-21 | Initial build | Expansion Agent Cycle 7 |


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
