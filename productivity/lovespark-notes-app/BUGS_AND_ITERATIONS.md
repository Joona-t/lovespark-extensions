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
