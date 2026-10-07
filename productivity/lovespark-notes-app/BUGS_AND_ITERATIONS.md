# Bugs & Iterations

_No entries yet. Document bugs, fixes, and iterations here as they occur._

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->

## 2026-07-08: ITER-001 — Mark canonical status TBD vs. lovespark-notes

**Problem:** This repo (`lovespark-notes-app`) and `lovespark-notes` both exist as
independently-built notes products (new-tab-override vs. popup-based) with no canonical
designation.
**Root cause:** Fleet audit (`meta_implementation.md` P1 consolidation unit) found the
notes product idea duplicated across repos with no marker of which is authoritative, and
unlike the other duplicate pairs in this audit, both builds have real, non-overlapping
feature investment — no obvious "stub vs. real" split.
**Fix:** Added `ARCHIVED.md` documenting both repos and flagging canonical status as TBD —
Joona needs to make the call. Both repos are frozen for new feature work until then.

## 2026-10-07: ITER-002 — ARCHIVED.md overstated committed state

**Problem:** ARCHIVED.md (ITER-001) said this repo had "candy theme + WCAG-audited CWS
assets already done". Nothing in the repo backs that up, and ARCHIVED.md is the doc used
to pick the canonical notes app, so the claim skewed the comparison.
**Root cause:** The claim described uncommitted local WIP, not committed state. The PR body
itself called the candy/WCAG work "pre-existing uncommitted".
**Fix:** Reworded the bullet to say candy/WCAG/CWS work is uncommitted local WIP, not on
`main`.
**Check (no test harness):**
`git grep -niE 'candy|wcag|cws' -- ':!ARCHIVED.md' ':!BUGS_AND_ITERATIONS.md'` → only a CSS
comment; `ls cws-shots CWS-LISTING.md PRIVACY.md SUBMIT.md` → all missing; `ls-check .` →
A11Y-KI001 + A11Y-KI006 fail. ARCHIVED.md must not claim these are done until those pass.
