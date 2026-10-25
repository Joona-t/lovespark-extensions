# LoveSpark Notes (new tab)

A calm, private notes app on every new tab. Free, open source, no account, no tracking, no ads.

- **Categories:** Idea, Project, Someday and Daily, plus your own. Use **+ New category** to add one with a name,
  emoji and colour. Rename or delete it with **Edit category** (or right-click its tab). Deleting a category moves
  its notes to Uncategorized; it never deletes notes.
- **Bullet points:** the **• List** button bullets the selected lines. Typing `- ` at the start of a line works too,
  Enter continues the list, Enter on an empty bullet ends it, and Tab / Shift+Tab indent on bullet lines. Press
  Esc first to Tab out of the editor. Bullets are plain text (`• `), so notes stay readable anywhere.
- **Themes:** Bubblegum (default), Retro Pink, Dark, Beige, Slate and **Seoul Y2K**, a Cyworld-era Korean
  look in sky blue, strawberry milk and butter, with a dotted grid.
- Tags, pinning, search (⌘/Ctrl+K), new note (⌘/Ctrl+N), list or grid view.
- **How it works & FAQ** in the top bar, ending with a link to every other LoveSpark tool.

## Privacy

Notes, categories and settings live in `chrome.storage.local` on your device only. The only permission is
`storage`. The extension makes no network requests; the FAQ's lovespark.love link opens in a new tab when you
click it.

## Develop

Load this folder unpacked at `chrome://extensions` (Developer mode). Vanilla JS, Manifest V3, no build step.
`lib/` is synced from `infrastructure/lovespark-shared-lib/` (don't edit it here). Notes-only themes live at the
end of `newtab.css`.

MIT licensed.
