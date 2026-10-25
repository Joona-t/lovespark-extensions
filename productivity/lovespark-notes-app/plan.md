# Plan: Korean theme · bullet points · custom categories · How it works & FAQ

Research: `research-features-2026-10.md`. **Status: built 2026-10-25 (v1.1.0)** after Joona said yes to all four
recommendations. See BUGS_AND_ITERATIONS ITER-003 for what shipped and how it was verified. Phase 0's
"link the tokens" step turned out unnecessary (base.css already `@import`s them).

## Decisions for Joona (annotate inline)

1. **Un-archive `lovespark-notes-app`?** It's marked frozen, competing with `lovespark-notes` (popup build). These
   features make it the active new-tab notes app. *Recommendation: yes. Un-archive it and keep `lovespark-notes`
   as the popup/quick-capture build.*
2. **Korean theme look.** *Recommendation: "Seoul Y2K", the Cyworld-era pastel look from Retro Cursor's Y2K Korean
   packs (strawberry-milk pink, boba cream, sky blue, a dotted mini-room grid, and a pixel heart on the active
   tab).* Alternative: traditional hanji paper + dancheong (red/green/blue) accents.
3. **Theme name.** "Seoul Y2K" / "Cyworld" / "Korean" / other?
4. **Bullets.** *Recommendation: plain-text `• ` bullets* (toolbar button, `- `→`•`, Enter continues). There's no
   rich text, so no data migration.

## Phase 0: make themes work at all (needed by everything else)

- [x] Link `lib/lovespark-tokens.css` in `newtab.html` before `newtab.css`, and check that `newtab.css` reads the
      `--ls-*` tokens rather than hard-coded pinks (grep for hex literals and convert the ones that are theme colours).
- [x] Rename Candy → **Bubblegum** here as everywhere else (2026-10-25 suite rename). The default theme key is
      `bubblegum`, and a saved `candy` maps to `bubblegum` on load.
- [x] Theme list = Bubblegum (default) · Retro Pink · Dark · Beige · Slate · Korean. Update `lib/lovespark-theme.js`
      `THEMES`/`THEME_NAMES` and the menu markup together, and make the label show the active theme.
- [x] Fix ls-check **A11Y-KI001** (white text on `--ls-pink-accent`: use the deep button gradient) and **A11Y-KI006**
      (add `:focus-visible` rings wherever `outline: none` appears). These unblock the commit hook.
- [x] Note: `lib/` is a synced copy of `infrastructure/lovespark-shared-lib/`. Theme-list changes that other extensions
      should get go into the canonical shared lib and are synced with `scripts/sync-shared-lib.sh`. Notes-only tokens
      (the Korean theme) stay in `newtab.css`.

## Phase 1: Korean theme

- [x] `body.theme-korean` token block in `newtab.css`: background gradient, glass/card, ink, accent, focus, and
      category accent overrides, sourced from the Retro Cursor Y2K Korean swatches.
- [x] Every text/background pair at **WCAG AA** (4.5:1 body, 3:1 large/UI), checked with `ls-audit-contrast` and
      logged in `color-decisions.md`.
- [x] Reduced-motion respected for any decorative motion (KI008).
- [x] The Sparky mascot stays visible (suite rule).

## Phase 2: Bullet points (plain text)

- [x] Toolbar button **"• List"** (`aria-pressed` reflects whether the caret line is a bullet). It toggles `• ` on
      every selected line, and keeps the selection.
- [x] Typing `- ` or `* ` at a line start becomes `• `.
- [x] Enter on `• text` inserts a new `• ` line, and Enter on an empty `• ` line removes the bullet (ends the list).
- [x] Tab / Shift+Tab indents and outdents **only on bullet lines** (two spaces). Elsewhere Tab keeps moving focus,
      and Esc then Tab always leaves the field (no keyboard trap).
- [x] Every edit goes through the existing debounced `updateNote` save, and undo (⌘Z) still works (use
      `setRangeText` / `execCommand('insertText')` so the browser's undo stack keeps the change).
- [x] Word count and search unaffected (`•` is not a word).

## Phase 3: Custom categories

- [x] Store categories in `prefs.categories`: `[{id, label, emoji, color, builtin}]`, seeded with Idea, Project,
      Someday, Daily (built-ins keep ids `idea`/`project`/`someday`/`daily`, so existing notes are untouched).
- [x] Render the category tabs, the editor `<select>` and the card accent colours from that list (replacing the 4
      hard-coded places).
- [x] "**+ New category**" as the last tab and the last select option. It opens a small dialog: name (required,
      ≤24 chars, unique case-insensitively), optional emoji, and a colour from a fixed AA-safe palette.
- [x] Rename and delete from a category's context menu (right-click or a ⋯ button, keyboard reachable). Deleting
      asks to confirm, moves its notes to Uncategorized, and never deletes notes.
- [x] Saving a note into a custom category = picking it in the editor select, or creating a note while its tab is
      active (same as built-ins today).

## Phase 4: How it works & FAQ

- [x] A **"How it works & FAQ"** button in the top bar, to the left of the list/grid toggle. It opens an accessible
      dialog (`<dialog>`, focus trapped while open, Esc closes, focus returns to the button).
- [x] How it works: notes save automatically to this browser only, plus categories, bullets, tags, pin, search (⌘K),
      list/grid, and themes.
- [x] FAQ: Where are my notes stored? (on this device; no account, no sync, no tracking) · Can I lose them? (clearing
      browser data or removing the extension deletes them) · How do I make my own category? · How do bullets work?
      · Is it free? (always, no ads) · **Last item: "More free LoveSpark tools", linking to
      `https://lovespark.love/#tools`** (new tab, `rel="noopener"`).

## Ship

- [x] Version bump 1.0.42 → **1.1.0** (new features), `BUGS_AND_ITERATIONS.md` entries (including the theme-switching
      bug, with its root cause), and update `ARCHIVED.md` per Decision 1.
- [x] `ls-check . --strict` clean, `python3 scripts/audit-contrast.py --verbose --history`, and `/test-extension`  *(Covered by `tests/e2e.py` instead; the `/test-extension` skill itself was not run.)*
      checklist (storage, new-tab lifecycle, keyboard).
- [ ] Manual run in Chrome as an unpacked extension: each theme, bullets, create/rename/delete category, FAQ link.  *(Automated run in Playwright Chromium done; a hands-on pass in Joona's own Chrome is still open.)*
- [x] Commit, push, PR, merge in the monorepo. Store upload follows `~/.claude/docs/release-extension.md` as a separate step.
