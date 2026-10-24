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


## 2026-10-24 — Published screenshot extension audit

**Scope:** 16 published Chrome Web Store screenshot extensions with located source. Drafts, the rejected listing, the missing theme and unrelated projects are excluded.

**Fixes:** Cookie Banner Blocker enable/allowlist behavior, Notes draft recovery and local fonts, Reddit dynamic ad matching, and restored Link Cleaner with correct relative URLs/history state/reused links. Four extension patch versions were bumped. Existing permissions are unchanged.

**Verified:** 16 extensions / 24 pages / 47 browser assertions and 32 Node tests passed. Test discovery uses an explicit allowlist. [Audit evidence and limits](docs/audits/2026-10-24.md). No Web Store publishing was performed; `ls-check` was unavailable.
