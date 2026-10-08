# Google Drive Sync — Research

## 1. Chrome Identity API (MV3)

### `chrome.identity.getAuthToken()`

- Returns a Promise resolving to `{ token, grantedScopes }` (since Chrome 105, MV3 style)
- `interactive: true` — shows Google sign-in / consent UI if needed
- `interactive: false` — fails silently if auth would require user interaction (use for background checks)
- Chrome's internal token cache lives in the browser process, survives service worker restarts
- Tokens are ~1 hour, but Chrome auto-refreshes transparently via its internal cache

### Manifest format

```json
"permissions": ["identity"],
"oauth2": {
  "client_id": "YOUR_CLIENT_ID.apps.googleusercontent.com",
  "scopes": ["https://www.googleapis.com/auth/drive.appdata"]
}
```

- `key` field recommended for stable extension ID (needed for OAuth client registration)
- Client ID must be registered as "Chrome App" type in Google Cloud Console

### Token revocation handling

- Chrome does NOT know when user revokes token server-side
- Only signal is 401 from API call
- Recovery: `removeCachedAuthToken({ token })` → `getAuthToken()` again
- `removeCachedAuthToken` takes `{ token: tokenString }`, not the string directly

### Not signed in behavior

- `interactive: true` → Chrome shows sign-in screen automatically
- `interactive: false` → rejects with `"The user is not signed in or OAuth2 not granted or revoked"`
- No way to distinguish "not signed in" vs "revoked" vs "not granted" — same error message

### MV3 service worker gotchas

- **SW terminates after 30s idle** — never cache tokens in module-level variables
- Always call `getAuthToken()` fresh before each API call (internal cache makes this cheap)
- Use `chrome.alarms` not `setInterval` for periodic sync
- `interactive: true` from SW without user gesture shows decontextualized prompt — only call interactive from popup/app UI

---

## 2. Google Drive REST API v3 — appDataFolder

### What it is

- Hidden per-app storage in Drive, invisible to user
- Deleted when user uninstalls/disconnects the app
- Designed for config/settings sync

### Scope

```
https://www.googleapis.com/auth/drive.appdata
```

- **Non-sensitive scope** — no Google OAuth verification or CASA assessment required
- Only grants access to the app's own appDataFolder, not user files

### API Endpoints

**List files:**
```
GET https://www.googleapis.com/drive/v3/files
  ?spaces=appDataFolder
  &q=name='filename.json'
  &fields=files(id,name,modifiedTime)
```

**Create file (multipart):**
```
POST https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart
Content-Type: multipart/related; boundary=BOUNDARY

--BOUNDARY
Content-Type: application/json; charset=UTF-8

{"name": "filename.json", "parents": ["appDataFolder"]}
--BOUNDARY
Content-Type: application/json

{...content...}
--BOUNDARY--
```

Note: `/upload/` in path is required for content uploads.

**Update file content:**
```
PATCH https://www.googleapis.com/upload/drive/v3/files/FILE_ID?uploadType=media
Content-Type: application/json

{...content...}
```

All updates are PATCH (no PUT in v3).

**Download file:**
```
GET https://www.googleapis.com/drive/v3/files/FILE_ID?alt=media
```

Returns raw file content.

**Delete file:**
```
DELETE https://www.googleapis.com/drive/v3/files/FILE_ID
```

No trash in appDataFolder — delete is permanent.

### Duplicate prevention

- Drive does NOT enforce name uniqueness in appDataFolder
- Must list-then-create, or cache file ID locally in `chrome.storage.local`
- Pattern: first sync → list by name → cache ID. Subsequent syncs → use cached ID. If 404 → re-list.

### Rate limits

- 12,000 requests per user per 60 seconds
- Use exponential backoff on 403/429

---

## 3. Chrome Web Store review implications

- Privacy policy URL required when using any OAuth scope
- Must disclose sync in extension description
- Google Limited Use Policy applies to all data accessed via Google APIs
- `drive.appdata` being non-sensitive means no CASA required

---

## 4. Cross-browser (Firefox)

- `chrome.identity.getAuthToken()` does NOT exist in Firefox
- Firefox only has `browser.identity.launchWebAuthFlow()` and `browser.identity.getRedirectURL()`
- `webextension-polyfill` does NOT polyfill these Chrome-specific methods
- **Decision: feature-detect and disable sync UI entirely in Firefox**

```js
function isGoogleSyncSupported() {
  return typeof chrome !== 'undefined' &&
         typeof chrome.identity !== 'undefined' &&
         typeof chrome.identity.getAuthToken === 'function';
}
```

---

## 5. Race condition mitigations

- Store Drive file IDs in `chrome.storage.local` after creation (avoids list-then-create race)
- Use a sync lock flag in `chrome.storage.local` (`syncInProgress: true/false`)
- Only one sync entry point: background alarm handler or explicit user "sync now" action
- Debounce sync triggers (30s after save, not on every keystroke)

---

## 6. Existing codebase patterns (relevant for implementation)

### Storage architecture

- `storage-init.js` — selects backend: `StorageChrome` (extension) or `StorageLocal` (web)
- `storage-chrome.js` — wraps `chrome.storage.local` with promisified helpers (`syncGet`, `localGet`, etc.)
- `notes-core.js` — all CRUD through Storage abstraction, pure data logic, no DOM
- `constants.js` — all keys, debounce intervals, categories defined here

### Data shape

- **Index** (`ls_notes_index`): `{ notes: [{ id, title, category, pinned, tags, wordCount, snippet, createdAt, updatedAt }], version: 1 }`
- **Content** (`note_{id}`): `{ id, content }`
- **Prefs** (`ls_prefs`): `{ lastEditedId, darkMode, theme, contentFont, ... }`

### Existing patterns to follow

- `$()` helper for `getElementById`
- `dom` object for cached DOM references (app.js)
- ES module imports, async/await throughout
- `DEBOUNCE_SYNC` already defined in constants.js (3000ms)
- Background already uses `chrome.alarms` for version snapshots (every 2 min)
- `chrome.storage.onChanged` listener pattern exists in `StorageChrome.onChange()`
- Theme system: IIFE `initThemeDropdown()` handles dropdown, `applyTheme()` applies

### Files that will be touched

| File | Change |
|------|--------|
| `manifest.json` | Add `identity` permission, `oauth2` section |
| `shared/sync-google.js` | NEW — all Drive sync logic |
| `shared/constants.js` | Add sync-related constants |
| `popup/popup.html` | Add sign-in button/avatar in header |
| `popup/popup.css` | Add sync UI styles |
| `popup/popup.js` | Wire sign-in, sync status, debounced sync after save |
| `app/app.html` | Add sign-in button/avatar in header |
| `app/app.css` | Add sync UI styles |
| `app/app.js` | Wire sign-in, sync status, refresh on sync changes |
| `background.js` | Add sync alarm, listen for storage changes |

### Architectural decision: single index file vs per-note files

The prompt spec says: store `lovespark-notes-index.json` + individual `lovespark-note-{id}.json` files.

**Pros of per-note files:**
- Only changed notes need uploading (bandwidth efficient)
- Last-write-wins merge is per-note, not all-or-nothing

**Cons:**
- More API calls (one per note on full sync)
- Must track which notes are dirty since last sync
- Drive rate limits become relevant with many notes

**Decision:** Follow the spec — index file + per-note files. Track dirty notes via `updatedAt` comparison with last sync timestamp. On sync: upload only notes with `updatedAt > lastSyncTime`.

### Sync flow design

```
syncToGoogle():
  1. Get token (non-interactive in background, interactive from UI)
  2. Load local index
  3. Find/create remote index file (cache Drive file ID)
  4. Upload local index
  5. For each note with updatedAt > lastSyncTime:
     - Find/create remote note file
     - Upload content
  6. Update lastSyncTime in prefs

syncFromGoogle():
  1. Get token
  2. Download remote index
  3. For each remote note:
     - If remote.updatedAt > local.updatedAt → download content, update local
     - If local.updatedAt > remote.updatedAt → skip (local is newer)
     - If note doesn't exist locally → download and create
  4. Save merged index locally

fullSync():
  1. syncToGoogle() — push local changes up
  2. syncFromGoogle() — pull remote changes down
  3. Return status { pushed, pulled, errors }
```
