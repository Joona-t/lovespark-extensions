# Bugs & Iterations — lovespark-extensions (monorepo root)

Per-extension logs live in each folder's own `BUGS_AND_ITERATIONS.md`. This file covers repo-wide changes.

## 2026-10-08: ITER-001 — 116 extensions merged into one monorepo (65 repos with history + 51 never in git)

**Problem:** 263 GitHub repos, dozens of them single extensions; 51 extensions had never been in git at all
(only on one Mac); most repos had work stranded on unmerged branches; store privacy links pointed at ~70
separate repos (several of which never existed).
**Fix:** Each repo's latest-work branch was snapshot-committed, pushed, then imported with full history via
`git filter-repo --to-subdirectory-filter` (home paths rewritten to `~`, author email mapped to the GitHub
noreply address). Local-only extensions were imported as first commits. Store/privacy links now point here.
Old repos are archived (read-only), not deleted. Scripts + gate reports: `docs/monorepo/`.
**Verified:** backup gate, snapshot gate, assembly gate (tree + history fidelity, build parity, public-exposure
audit), pre-publish gate — independent verifier agents at each step.


## 2026-10-24 — Chromium fleet audit and regression harness

**Problem:** The initial Chromium sweep reported 44 extensions with real load, script, asset or CSP failures; one further failure was an onboarding assumption in the test harness. Interaction tests then exposed silent worker initialization, disabled-state, draft restoration, theme and link-handling defects.

**Fix:** Repair 66 extensions with individual patch bumps and logs; restore Link Cleaner from its archived upstream; add locked Playwright tooling, manifest checks and actual extension interaction/content regressions. Keep all existing API/host permissions unchanged. Shared asset and UI repairs cover repeated instances across the collection.

**Verified:** 115 extensions / 130 pages pass Chromium checks; 148 browser scenario assertions pass; 191 Node tests and 2 Python checks pass; Sponsor Skip's package gate and standalone Chrome ping pass. Detailed coverage, source provenance and limitations: [audit record](docs/audits/2026-10-24.md). `ls-check` and the external automation helper were unavailable. Nothing was published to the Web Store.
