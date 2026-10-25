# Research: Korean theme, bullet points, custom categories, How it works & FAQ

Date: 2026-10-25. Asked by Joona, with screenshots of the new-tab notes page.

## Which build this is

The screenshot (⌘K search, list/grid toggle, "Candy" button, + button, Idea / Project / Someday / Daily tabs) is
`productivity/lovespark-notes-app`: the new-tab build, manifest v1.0.42, `chrome_url_overrides.newtab`.
It is **not** `productivity/lovespark-notes`, the popup + full-app build, which has a different toolbar
(`index.html` ids `btnDaily`, `btnVersions`, `markdownPreview`, …).

`lovespark-notes-app/ARCHIVED.md` marks this build "Archived — Frozen, Canonical TBD", one of two competing notes
builds. These features would make it the active one, so un-archiving is a product decision (see plan, Decision 1).

Every local copy was checked (monorepo, `~/lovespark-notes`, `~/lovespark-extensions-build/mono`, the atlas clones,
and the Mac mini via `mdfind`). **None contains theme CSS for Candy.** The "Candy" ARCHIVED.md mentions as local WIP
no longer exists anywhere on these machines.

## How the code works today

| Area | Where | Facts |
|---|---|---|
| Size | `newtab.js` 531 lines, `newtab.css` 590, `newtab.html` 117 | vanilla JS, MV3, no build step |
| Storage | `newtab.js:44-78` | `chrome.storage.local`: `note_index` (array of note metadata), `note_<id>` (content), `prefs` |
| Categories | hard-coded in **4 places** | tab buttons in `newtab.html` (`.category-tabs`/`.cat-tab`), `<select id="editorCategory">` options (`newtab.html:72-78`), `CAT_COLORS` (`newtab.js:92-98`: idea `#fbbf24`, project `#60a5fa`, someday `#a78bfa`, daily `#34d399`, uncategorized `null`), and the welcome note text (`newtab.js:101-106`) |
| Filtering | `newtab.js:150` | `if (cat !== 'all' && n.category !== cat) return false;` (a plain string match on `note.category`) |
| Editor | `newtab.html:105` | a plain `<textarea id="editorContent">`. Content is stored as plain text, with no markdown or rich text |
| Themes | `lib/lovespark-theme.js` | `THEMES = ['retro','dark','beige','slate']` sets `body.theme-<name>`. The menu in `newtab.html:41-47` also lists **candy**, which the shared lib doesn't know |
| Theme CSS | `lib/lovespark-tokens.css` | `@import`ed by `lib/lovespark-base.css:5`. It defines `:root` (retro) and `body.theme-dark/-beige/-slate`, but **no candy** |

**Bug found (corrected 2026-10-25 during the build):** the first draft of this doc said the token file was never
loaded, so no theme worked. That was wrong: `lovespark-base.css` `@import`s it, and I had grepped base.css for
variables, not imports. What is actually broken: the **Candy** option has no CSS (picking it looks like Retro, and
the shared lib's `apply()` doesn't recognise it), and the trigger label is the static markup text "Candy"
(`newtab.html:39`). Separately, white text on `--ls-pink-deep` fails AA in Beige (4.25:1) and Slate (2.40:1) on the
active tab and the + button. Those were live failures.

**Commit gate:** the monorepo pre-commit hook runs `ls-check` on every touched extension. This one fails 2 checks today:
A11Y-KI001 (`--ls-pink-accent` used as a background behind white text) and A11Y-KI006 (`outline: none` without a
`:focus-visible` replacement). There are also 3 warnings (KI004 low-opacity text in beige, KI008 animations without
reduced-motion). Nothing can be committed here until the 2 failures are fixed. That's how the 2026-10-25 candy →
bubblegum rename got blocked here.

## The "Korean theme"

No Korean colour theme exists anywhere in the suite (checked: `~/.claude/docs`, skills, the design system, the shared
lib, both notes builds, Tongue). The one Korean visual reference is **Retro Cursor's "Y2K Korean" group**
(`themes/lovespark-retro-cursor/popup.html:93`, CSS `popup.css:421` `.theme-korean`, `:455`), with packs named
Honey Bunny, Cyworld Dotti, Coquette Ribbon, Strawberry Milk, Bubble Boba, Phone Charm, Heart Locket and Cyber
Butterfly: the 2000s Cyworld-era Korean internet look. That's the natural source for a notes theme, so
the suite stays consistent. A traditional alternative (hanji paper, dancheong colours) would be new design work.

## Bullet points in a textarea

Plain-text bullets fit the current storage (no migration, search keeps working on raw text, export stays
readable). Rich text (contenteditable) would mean a content-format migration and a sanitiser. Not worth it for bullets.
Common patterns in plain-text editors (Apple Notes-lite, Bear's plain mode, Google Keep's list toggle):
- a toolbar button that toggles `• ` on the selected lines;
- typing `- ` or `* ` at a line start becomes `• `;
- Enter on a bullet line continues the bullet, and Enter on an empty bullet ends the list;
- Tab / Shift+Tab indents and outdents. **This is where accessibility gets hard:** trapping Tab in a textarea breaks keyboard
  navigation (WCAG 2.1.2 No Keyboard Trap). Indent should only happen on a bullet line, and Esc then Tab must still
  leave the field.

## Custom categories

Categories are plain strings on each note (`note.category`), so custom ones need **no note migration**. Only the
list of categories moves from hard-coded markup into storage. Deleting a category must not delete notes: they move to
`uncategorized`. The four built-ins keep their ids, so existing notes keep their category.

## How it works & FAQ

Joona wants a "How it works & FAQ" button on the left, where the top bar sits beside the list/grid toggle. The
FAQ's last entry links to the lovespark.love page listing all the other extensions: `https://lovespark.love/#tools`
(the "The Suite" section). An outbound link opened with `target="_blank" rel="noopener"` is allowed by the suite rules
(no remote code, no data sent).
