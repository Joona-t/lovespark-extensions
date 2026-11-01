# Privacy Policy — LoveSpark Notes

_Last updated: 2026-10-08_

LoveSpark Notes is a free, open-source LoveSpark browser extension. It keeps your notes on your device by default. It also contains an **optional, off-by-default Google Drive sync** feature, described truthfully below.

## What is stored

Everything is kept in your browser's own extension storage on your device:

- **`chrome.storage.local`**: your notes index (`ls_notes_index`: titles, categories, tags, pin state, snippets, timestamps), note content (`note_<id>`), up to 20 saved versions per note (`versions_<id>`), preferences (`ls_prefs`, `theme`, `darkMode`), and, only if you turn on Google Drive sync, sync metadata (`ls_sync_state`: last sync time, Drive file IDs, deletion records, last error, and the email address of the Google account you signed in with) plus a short-lived sync lock (`ls_sync_lock`).
- **`chrome.storage.session`** (cleared when the browser closes): the tab ID of the open notes app (`appTab`) and the note you are currently editing (`dirtyNote`) so a version snapshot can be saved.
- **`localStorage`**: read once to migrate notes from an older version of the extension (`lovespark_notes_v1`), then removed.

The extension does **not** use `chrome.storage.sync`. When you use the right-click "Save to LoveSpark Notes" clipper, the selected text and the address of the page it came from are saved into a new note locally. You can remove all of this at any time by uninstalling the extension.

## What is transmitted

By default, **none of your notes or settings leave your device.** There are no analytics, no tracking, no ads, and no remote code. There are two exceptions:

1. **Optional Google Drive sync (only if you sign in).** If you choose to sign in with Google from the extension, it uploads your notes index, note content and deletion records to a private, app-only folder (`appDataFolder`) in **your own** Google Drive via `https://www.googleapis.com/drive/v3` and `https://www.googleapis.com/upload/drive/v3`, and downloads them back to merge changes from your other devices. While signed in, this runs every 5 minutes and about 30 seconds after you save. When you sign out, the extension asks Google to revoke its access token (`https://accounts.google.com/o/oauth2/revoke`). Nothing is sent to LoveSpark or anyone other than Google. Note: in the current source the OAuth client ID is a placeholder, so this feature will not work until a real client ID is configured.
2. **Google Fonts stylesheet.** The popup and the full notes app link a stylesheet from `https://fonts.googleapis.com`. Opening them makes your browser request that stylesheet from Google, which receives standard request information such as your IP address and browser user agent. No note content is sent. (The bundled fonts in `fonts/` are loaded from the extension itself.)

The footer links to lovespark.love and Ko-fi only open when you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your notes, versions, preferences and sync status locally (`chrome.storage.local` / `chrome.storage.session`). |
| `unlimitedStorage` | Lets note content and version history grow beyond the default local storage quota. |
| `alarms` | Takes a version snapshot of the note you are editing every 2 minutes, and runs the optional Google Drive sync every 5 minutes when you are signed in. |
| `contextMenus` | Adds the right-click "Save to LoveSpark Notes" menu item that saves selected text (and its page address) as a new note. |
| `identity` | Signs you in to Google (`chrome.identity.getAuthToken`, `getProfileUserInfo`) for the optional Google Drive sync, with the `drive.appdata` scope only. Not used unless you sign in. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit. The context-menu clipper only receives the text you selected and the page address when you choose that menu item.

## Third-party services

- **Google Drive / Google Accounts** — only if you opt in to sync; your notes are stored in your own Drive account under Google's privacy policy.
- **Google Fonts** — a stylesheet request when the popup or notes app opens.

No other third-party services are used.

## Children's privacy

The extension collects no personal information for LoveSpark, from anyone, including children under 13. The optional Google sign-in is between you and Google.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-notes
