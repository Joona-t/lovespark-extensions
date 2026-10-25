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

## 2026-10-25: ITER-003 — v1.1.0: un-archived; Seoul Y2K theme, bullets, custom categories, How it works & FAQ

**Decision (Joona, 2026-10-25):** un-archive this build, so it becomes the active new-tab notes app; `lovespark-notes`
stays the popup / quick-capture build. Add the Korean theme as "Seoul Y2K", plain-text bullets, and user-made
categories. `ARCHIVED.md` is removed; README and LICENSE added.

**Themes:**
- Six themes: **Bubblegum** (default, was "Candy"), Retro Pink, Dark, Beige, Slate, and **Seoul Y2K**.
- Seoul Y2K is a Cyworld-era look: sky → strawberry-milk → butter gradient, boba-ink text, lavender pixel shadows and a
  dotted grid. Colours come from Retro Cursor's Y2K Korean packs.
- Notes keeps its own small theme controller in `newtab.js`, so the shared `lib/lovespark-theme.js` is untouched. The
  menu is now a menu of radio items with `aria-expanded`/`aria-checked` (KI-013).
- A saved `theme: 'candy'` migrates to `bubblegum`.

**Bullets:** plain text `• `, so no storage change. The **• List** button toggles the selected lines; `- `/`* ` at a
line start converts. Enter continues the list, and Enter on an empty bullet ends it. Tab/Shift+Tab indent only on
bullet lines; Esc releases Tab, so there's no keyboard trap. Edits go through `execCommand('insertText')`, so ⌘Z works
and the normal save path runs. Word count ignores `•`.

**Categories:** the list moved from 4 hard-coded places into `prefs.categories`, seeded with the 4 built-ins under
their old ids, so existing notes are unchanged. Users can:
- add a category (name ≤24, unique ignoring case, optional emoji, colour from 8 swatches);
- edit or rename it (Edit category button, or right-click the tab);
- delete it, which moves its notes to Uncategorized and never deletes notes.

The editor's category select also has "+ New category…".

**How it works & FAQ:** a `<dialog>` button left of the list/grid toggle. The last FAQ item links to
`https://lovespark.love/#tools`.

**Bugs fixed along the way:**
- **Candy theme did nothing.** Root cause: the menu offered `candy`, but neither the shared token file nor the shared
  theme module defines it, so picking it rendered as Retro, and the label was static markup.
- **ls-check A11Y-KI001** (decorative `--ls-pink-accent` backgrounds) and **A11Y-KI006** (`outline: none` with no
  `:focus-visible` ring on the search, title, tag and content fields). Both fixed. These two were blocking every commit
  to this folder through the pre-commit hook.
- **White text on `--ls-pink-deep` failed AA in Beige (4.25:1) and Slate (2.40:1)** on the active tab, + button and
  selection. Root cause: one token doing two jobs. New `--notes-fill` per theme (≥4.62:1).
- **Note count failed AA in Retro (4.06:1).** Muted ink sat on the page gradient rather than glass. It now uses the main ink.
- KI-004 (low-opacity text) and KI-008 (no reduced-motion) warnings cleared. CSP added to the manifest (fleet standard).
- **Narrow layout overlapped at 360px:** the FAQ button sat under the search box, + New category went off-screen,
  and the bullet button wrapped. The top bar, category bar and toolbar now wrap at ≤700px.

**Correction:** the first research draft said the token file was never loaded, so no theme worked. Wrong:
`lib/lovespark-base.css` `@import`s it. That claim came from static greps and was never run. Recorded in the failures ledger.

**Verification:**
- `tests/e2e.py` (new) loads the real unpacked extension in Chromium. 57/57 pass: themes and migration, bullets
  (convert, continue, end, indent, toggle, undo, Esc-then-Tab, saved to storage), categories (validation, create,
  persist, select-to-new, rename, delete keeps notes), FAQ link and focus return, rendered text ≥4.5:1 in all six
  themes, and no off-screen, overlapping or <32px controls at 360 and 320px.
- No console errors. `ls-check . --strict`: 38 pass, 0 fail, 0 warn (was 2 fail, 6 warn).
- `audit-contrast.py --history` run.
- Screenshots of Bubblegum, Seoul Y2K, the FAQ and 320px checked by eye.
