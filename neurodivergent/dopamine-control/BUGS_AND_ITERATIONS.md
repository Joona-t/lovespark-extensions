# Bugs & Iterations

## GOV-001 — 2026-07-08: Missing README.md, LICENSE, and populated BUGS log

**Problem:** CLAUDE.md's repo rule requires a populated BUGS_AND_ITERATIONS.md
and README.md at every repo root; this repo shipped only the unfilled
template plus no README.md/LICENSE. Flagged in the fleet P2 governance-doc
scaffold sweep (meta_implementation.md).
**Root cause:** The repo was built and committed in a single initial commit
(2026-03-17, `6f55142`) before the governance-doc requirement was
standardized fleet-wide, and no iteration history existed to backfill from.
**Fix:** Added `README.md` (feature list, file layout, dev-install steps,
privacy statement) and `LICENSE` (MIT, matching the fleet-standard text used
across other LoveSpark extension repos). Backfilling further entries as
future bugs/iterations land.
**Files:** `README.md` (new), `LICENSE` (new)
**Commit:** (this one)

## 2026-03-17: Initial commit

**Problem:** N/A — initial build.
**Fix:** YouTube watch-time limiter with streaks/gamification shipped as a
single commit: manifest, background service worker, content script +
overlay, popup, stats dashboard, shared constants/utils.
**Files:** all
**Commit:** `6f55142`
