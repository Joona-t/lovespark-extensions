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

## ITER — Candy theme + WCAG + real-product CWS assets (2026-06-20)
**What:** Added the canonical LoveSpark **Candy** theme (LoveSpark Design System default) to the Notes new-tab UI (`lib/lovespark-tokens.css` `body.theme-candy`, registered in `lib/lovespark-theme.js`, set as `newtab.html` default). Fixed WCAG: `pink-accent` was used as small text (note titles, active tabs — ~2.5:1) and as white-text fills (FAB, active tab — ~2.3:1). Changed text→plum (`--ls-text-dark`), white-text fills→deep pink (`--ls-pink-deep` #c01571, white 5:1).
**Why:** Per LoveSpark Design System (candy glass-sticker, "body text PLUM on cream/glass, pink never small text"). CWS store assets must show the real product on-brand + WCAG AA.
**Assets:** 10 real-UI screenshots (the actual Notes app rendered with mocked sample notes, candy theme, across states), 3D-notepad store icon (128/48/16), candy promo tiles (small+marquee). All verified WCAG AA (plum-on-cream 15:1, white-on-deep-pink 4.86–7.42) and CWS-spec (exact size, 24-bit RGB no-alpha).

**Follow-up fix:** Candy theme wasn't actually applying at runtime — `lib/lovespark-theme.js` `init()` ran `apply(theme || 'retro')` on load, overriding the `theme-candy` body class for fresh installs. (My first screenshots only looked candy because the demo's storage mock was Promise-style and never fired theme.js's callback-style `get(...,cb)`.) Fixed default → `apply(theme || 'candy')`; verified with a callback-accurate shim + empty storage: fresh install now reports `body.className='theme-candy'`, label 'Candy'. Screenshots re-rendered from the true runtime state.

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

**Update 2026-10-08:** the candy/WCAG/CWS work above was committed in the pre-monorepo snapshot commit, so it is now committed state.
