# Google Drive Sync — Implementation Plan

**Scope:** This document specifies the v1 Drive sync design; current codebase is local-only; do not implement until the TODO gates are satisfied.

**Feature:** Optional Google Sign-In for cross-device note sync via Drive appDataFolder.
**Constraint:** Extension must work 100% offline. Sync is opt-in. Sync failures never break local ops.

---

## TODO Checklist

### Phase 1: Manifest + Constants

- [ ] **1.1** `manifest.json` — add `"identity"` to permissions
- [ ] **1.2** `manifest.json` — add `"oauth2"` section with `client_id` placeholder + `drive.appdata` scope
- [ ] **1.3** `shared/constants.js` — add sync constants:
  - `SYNC_INTERVAL_MINUTES` (5)
  - `SYNC_DEBOUNCE_AFTER_SAVE` (30000)
  - `SYNC_LOCK_TTL` (120000)
  - `SYNC_TOMBSTONE_RETENTION_DAYS` (30)
  - `DRIVE_INDEX_FILENAME` (`'lovespark-notes-index.json'`)
  - `DRIVE_NOTE_PREFIX` (`'lovespark-note-'`)
  - `KEY_SYNC_STATE` (`'ls_sync_state'`)
  - `KEY_SYNC_LOCK` (`'ls_sync_lock'`)

### Phase 2: Sync Module (`shared/sync-google.js`)

- [ ] **2.1** Create `shared/sync-google.js` with feature detection (`isGoogleSyncSupported()`)
- [ ] **2.2** Implement `signIn()`:
  - `chrome.identity.getAuthToken({ interactive: true })`
  - `chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' })` for email
  - Guard: if `email` is empty string → treat as sign-in failed, return `{ signedIn: false }`
  - Compare returned email against `syncState.userEmail` — if different account → wipe entire sync state (file ID cache, lastSyncTime, tombstones, lock) but **never wipe local notes** — only sync metadata is cleared
  - Return `{ signedIn: true, email }`
- [ ] **2.3** Implement `signOut()`:
  - `chrome.identity.removeCachedAuthToken({ token })`
  - Revoke token via `https://accounts.google.com/o/oauth2/revoke?token=...`
  - Clear sync state from `chrome.storage.local`: sync cursors, lock state, cached file IDs, cached user email
  - **Do not wipe local notes** — sign-out is not a "reset"
- [ ] **2.4** Implement `getSignInStatus()`:
  - Non-interactive `getAuthToken({ interactive: false })` wrapped in try/catch
  - If token obtained → `getProfileUserInfo()` for email, guard empty string
  - Returns `{ signedIn: true, email }` or `{ signedIn: false }`
- [ ] **2.5** Implement Drive helpers (each calls `_getToken()` independently — never reuse a token across calls):
  - `_getToken()` — calls `chrome.identity.getAuthToken({ interactive: false })`, extracts `.token`. On 401 from any caller: `removeCachedAuthToken({ token })` then retry once. No memoization — Chrome's internal cache handles that
  - `_driveList(filename)` — list by name in appDataFolder, request `fields=files(id,name,modifiedTime)`. Returns `{ id, name, modifiedTime }` or `null`
  - `_driveCreate(filename, data)` — multipart upload to appDataFolder, returns `{ id }`
  - `_driveUpdate(fileId, data)` — PATCH media upload
  - `_driveDownload(fileId)` — GET with `alt=media`, returns parsed JSON. **On 404: return `null`** — this is recoverable: sync logic will re-upload the local copy on the next cycle rather than silently dropping the note
  - `_driveDelete(fileId)` — DELETE file, swallow 404 (already deleted). **Safety rails:** only delete files in appDataFolder that match our `DRIVE_NOTE_PREFIX` or `DRIVE_INDEX_FILENAME` naming convention. Never delete a file by ID alone without verifying it belongs to us
  - All helpers: on 429/403 → log, return error status. No retry in v1; alarm will retry in 5min
- [ ] **2.6** Implement `_getOrCreateFile(filename)`:
  - Check cached file ID in sync state → verify with HEAD/GET (catch 404 → cache is stale, clear entry)
  - If no cached ID → `_driveList(filename)`
  - If still not found → `_driveCreate(filename, {})`
  - Cache file ID in sync state
- [ ] **2.7** Implement `fullSync()` — **pull-merge-push**:
  1. Acquire sync lock (see Decision #5)
  2. Load local index + local sync state
  3. **Pull phase:** Download remote index from Drive
     - If remote index doesn't exist → first sync, skip to push phase
     - If download returns `null` (404) → clear cached indexFileId, re-discover via `_getOrCreateFile`
  4. **Merge phase** (see Decision #2 for full rules)
  5. **Push phase:**
     - Upload merged index to Drive
     - For each locally-newer note: upload content to Drive
     - For each note in local index with no Drive file → upload
  6. **Cleanup phase:**
     - Orphan cleanup: delete Drive files matching our prefix whose note ID is absent from the merged index (mark-and-sweep, see Decision #10)
     - Prune tombstones older than `SYNC_TOMBSTONE_RETENTION_DAYS`
  7. Update `lastSyncTime` in sync state
  8. Release sync lock in `finally` block (always, even on error)
  9. Return `{ pushed, pulled, deleted, errors, timestamp }`
  10. **Idempotency guarantee:** running sync twice with no local or remote changes produces zero uploads, zero downloads, zero index writes
- [ ] **2.8** Export public API: `isGoogleSyncSupported`, `signIn`, `signOut`, `getSignInStatus`, `fullSync`

### Phase 3: Background Service Worker (`background.js`)

- [ ] **3.1** Import sync module (dynamic `import()`, guarded by `isGoogleSyncSupported()`)
- [ ] **3.2** Create `google-sync` alarm on install (every 5 minutes). This also serves as a SW keepalive during sync — the alarm re-wakes the SW if it suspends
- [ ] **3.3** On alarm fire: check `getSignInStatus()`, if signed in → `fullSync()`. Wrap in try/catch — never let sync crash the SW
- [ ] **3.4** Add message handlers with explicit request/response contract:
  - `{ type: 'sync.trigger', reason: 'save'|'manual', source: 'popup'|'app' }` → background debounces (30s for `reason: 'save'`, immediate for `reason: 'manual'`) then calls `fullSync()`. Response: `{ ok: true }` (fire-and-forget; status updates come via sync state key)
  - `{ type: 'sync.status' }` → returns `{ signedIn, email, lastSyncTime, lastError, syncing }` from sync state
  - `{ type: 'sync.signin' }` → calls `signIn()`, returns `{ signedIn, email }` or `{ signedIn: false, error }`
  - `{ type: 'sync.signout' }` → calls `signOut()`, returns `{ ok: true }`
- [ ] **3.5** **Ownership rule:** Only background.js writes to `KEY_SYNC_STATE` and `KEY_SYNC_LOCK`. Popup/app only read these keys. This eliminates onChange loop risk entirely — UI contexts never mutate sync keys, so storage changes to sync keys always come from background, and background never re-triggers sync from its own writes

### Phase 4: Popup UI (`popup/popup.html` + `popup/popup.css` + `popup/popup.js`)

- [ ] **4.1** `popup/popup.html` — add sync UI between header-left and header-right:
  ```html
  <div class="sync-area" id="syncArea" style="display:none">
    <button class="sync-signin-btn" id="syncSignIn" style="display:none">Sign in</button>
    <div class="sync-user" id="syncUser" style="display:none">
      <button class="sync-avatar-btn" id="syncAvatarBtn" aria-label="Sync account menu">
        <span class="sync-avatar-initial" id="syncAvatarInitial" aria-hidden="true"></span>
        <span class="sync-pulse" id="syncPulse"></span>
      </button>
      <div class="sync-dropdown" id="syncDropdown" style="display:none">
        <div class="sync-email" id="syncEmail"></div>
        <button class="sync-action" id="syncNowBtn">Sync now</button>
        <div class="sync-last" id="syncLast">Never synced</div>
        <button class="sync-action sync-signout" id="syncSignOutBtn">Sign out</button>
      </div>
    </div>
  </div>
  ```
  Acceptance criteria: no external image requests, consistent layout across themes, `aria-label` on avatar button for accessibility
- [ ] **4.2** `popup/popup.css` — add styles for sync UI elements. `.sync-avatar-initial`: 22px circle, `var(--ls-pink-accent)` border, centered letter, `var(--ls-font-body)`. `.sync-dropdown`: z-index 100, positioned below avatar, `var(--ls-glass-strong)` background
- [ ] **4.3** `popup/popup.js` — on init:
  - `isGoogleSyncSupported()` → if false, leave `.sync-area` hidden, done
  - If true → show `.sync-area`, send `{ type: 'sync.status' }` to background → update UI
  - Wire click handlers: all auth/sync actions send messages to background (see 3.4)
- [ ] **4.4** `popup/popup.js` — after `scheduleSave()` completes, if signed in, send `{ type: 'sync.trigger', reason: 'save', source: 'popup' }` to background. Background handles debounce. Sync fires even if popup closes
- [ ] **4.5** `popup/popup.js` — sync status: listen for `chrome.storage.onChanged` on `KEY_SYNC_STATE` → update pulse animation + "Last synced" text. Popup only reads, never writes sync state

### Phase 5: Full App UI (`app/app.html` + `app/app.css` + `app/app.js`)

- [ ] **5.1** `app/app.html` — same sync UI structure as popup, placed in header between header-actions and theme dropdown
- [ ] **5.2** `app/app.css` — sync styles adapted for app header spacing
- [ ] **5.3** `app/app.js` — sync integration:
  - Init: feature-detect, send `sync.status` to background, render UI
  - Wire handlers: all delegated to background via messages
  - On save: send `sync.trigger` to background
  - Listen for `chrome.storage.onChanged` on `KEY_SYNC_STATE` → update sync status UI
  - Listen for `chrome.storage.onChanged` on `ls_notes_index` → compare with in-memory `index` to detect external mutations (sync pulled new data). If changed: reload index, refresh note list, refresh active note content if it was modified
- [ ] **5.4** `app/app.js` — add `syncArea` elements to `cacheDom()`

### Phase 6: Version Bump + Testing Scenarios

- [ ] **6.1** `manifest.json` — bump patch version (1.0.3 → 1.0.4)
- [ ] **6.2** Verify: extension loads without errors in Chrome with no Google account (sync UI hidden)
- [ ] **6.3** Verify: all existing functionality works unchanged (notes, themes, categories, versions)
- [ ] **6.4** Verify: Firefox build excludes sync UI (feature detection hides it)
- [ ] **6.5** Verify: sign in → sign out → sign in with different account correctly wipes stale sync state but keeps local notes
- [ ] **6.6** Test: trigger sync from popup, immediately close popup → sync completes, state is consistent
- [ ] **6.7** Test: two devices edit same note offline → both sync → stable converged result (last-write-wins on `updatedAt`; both devices end up with the same content after two sync cycles)
- [ ] **6.8** Test: device A deletes note, device B edits same note offline → B syncs → tombstone wins if `tombstone.deletedAt > remote.updatedAt`
- [ ] **6.9** Test: sync A starts → hangs → lock TTL expires → sync B starts → sync A cannot commit stale writes (fencing token mismatch)
- [ ] **6.10** Test: storage onChanged events from sync writes do not re-trigger sync (ownership rule: only background writes sync keys)
- [ ] **6.11** Test: `fullSync()` called twice with no changes → zero API uploads, zero index writes (idempotency)

---

## Architecture Decisions

### 1. Single sync module, no storage layer changes

Sync lives entirely in `shared/sync-google.js`. It reads/writes through the same `chrome.storage.local` keys the app already uses. No changes to `StorageChrome`, `StorageLocal`, or `storage-init.js`. Removing sync = delete one file and its imports.

### 2. Pull-merge-push with per-note LWW

**Merge unit:** Per-note. Each note entry in the index is an independent merge unit. Fields within a note are NOT merged independently — the entire note entry (metadata) and its content file are treated as atomic.

**Reconciliation rules (deterministic):**

```
For each noteId present in either local or remote index:

1. BOTH SIDES HAVE IT:
   a. Check tombstones first:
      - Local tombstone exists AND tombstone.deletedAt > remote.updatedAt
        → Delete wins. Remove from merged index. Delete Drive file.
      - Remote tombstone exists AND tombstone.deletedAt > local.updatedAt
        → Delete wins. Remove from merged index. Delete local content.
   b. No tombstone applies:
      - Compare ordering signal (see below)
      - Winner's metadata goes into merged index
      - Winner's content is the canonical version
      - Loser does nothing (no upload/download for that note)

2. LOCAL ONLY (not in remote index, no remote tombstone):
   → Include in merged index. Upload content to Drive.

3. REMOTE ONLY (not in local index, no local tombstone):
   → Include in merged index. Download content to local storage.
```

**Ordering signal:** Primary: `updatedAt` timestamp. Tiebreaker: if `updatedAt` values are equal (same millisecond), prefer the version whose content is already in Drive (remote wins). This makes the tiebreaker deterministic and avoids unnecessary uploads.

**Drive `modifiedTime` as a secondary signal:** When available from the `_driveList` or `_driveDownload` response, store `modifiedTime` in the remote index entry. If `abs(local.updatedAt - remote.updatedAt) < 60000` (within 1 minute — plausible clock skew range), use Drive's `modifiedTime` as the ordering signal instead, since it comes from a server clock and is immune to device clock drift.

**Convergence guarantee:** After two devices each run `fullSync()` once (A syncs, then B syncs, then A syncs again), both devices have identical index and content. This is the definition of convergence for this system.

**No conflict copies in v1.** LWW means one version wins, one is lost. This is the explicit tradeoff for simplicity. Users who need conflict copies can use version history (local snapshots every 2 minutes) to recover overwritten content.

### 3. File ID caching

Store Drive file IDs in `chrome.storage.local` under `KEY_SYNC_STATE`:
```json
{
  "lastSyncTime": 1709654400000,
  "indexFileId": "abc123",
  "noteFileIds": { "note_xyz": "def456" },
  "userEmail": "user@gmail.com",
  "tombstones": [
    { "noteId": "abc", "deletedAt": 1709654400000 }
  ],
  "lastError": null,
  "lastErrorTime": null
}
```
On 404 from a cached ID → clear that entry and re-discover via list.

### 4. User info — email initial, no photo

Use `chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' })` for email. Guard against empty string (managed environments, incognito). Show the user's initial letter in a styled `<span>` — no `<img>` tag, no photo, no extra scope, no external requests.

Accessibility: `aria-label="Sync account menu"` on the avatar button.

### 5. Sync lock with TTL + fencing token

Store lock in `chrome.storage.local` under `KEY_SYNC_LOCK`:
```json
{
  "inProgress": true,
  "startedAt": 1709654400000,
  "ownerId": "sw_abc123",
  "fenceToken": 42
}
```

- `ownerId`: random ID generated per service worker session (module-level `const SESSION_ID = crypto.randomUUID()`). Identifies which SW instance holds the lock
- `fenceToken`: monotonic counter incremented each time the lock is acquired. Stored in sync state alongside the lock

**Acquiring the lock:**
1. Read current lock
2. If `inProgress && (Date.now() - startedAt < SYNC_LOCK_TTL)` → lock is held by another session, abort sync
3. If lock is expired OR not held → acquire: write new lock with current `ownerId`, `startedAt: Date.now()`, `fenceToken: previous + 1`

**Fencing writes:**
Before each Drive write (index upload, note upload), re-read the lock and verify `fenceToken` matches what we acquired. If mismatch → another sync stole the lock after TTL expiry → abort immediately, do not commit. This prevents a slow/revived sync from overwriting a newer sync's results.

**Release:** Always in `finally` block. Only release if `ownerId` still matches (don't clear another session's lock).

**Lock refresh:** Not implemented in v1. TTL of 2 minutes is generous for typical sync (most notes < 50, each API call < 2s). If a sync legitimately exceeds 2 minutes on a very slow connection, the next alarm cycle will retry.

### 6. Error handling

Every sync operation wrapped in try/catch. On failure:
- Log to console with `console.error('LoveSpark Notes: sync failed', err)`
- Write to sync state: `{ lastError: err.message, lastErrorTime: Date.now() }`
- Release sync lock in `finally`
- Never throw to caller
- Never break local save/load operations
- Missing Drive files (404 on content download) → return `null`, sync logic marks note for re-upload on next cycle from originating device. Content is NOT silently dropped — it's flagged as "content unavailable, will retry"

### 7. Deletion tombstones

**Schema:**
```json
{
  "noteId": "abc123",
  "deletedAt": 1709654400000
}
```

**Lifecycle:**
- Created when: `deleteNote()` is called (soft-delete), OR `permanentlyDeleteNote()` is called, OR `emptyTrash()` is called
- The sync module hooks into these operations by checking for deletions during merge (comparing current local index against what we last synced)
- Stored in `syncState.tombstones[]`

**Retention/compaction:**
- Tombstones older than `SYNC_TOMBSTONE_RETENTION_DAYS` (30 days) are pruned during cleanup phase
- 30 days is chosen to match the existing `TRASH_RETENTION_DAYS` constant
- After 30 days, if another device has a stale copy of the deleted note and syncs, the note will reappear. This is an accepted edge case for v1 — the alternative (keeping tombstones forever) causes unbounded growth

**Interaction with permanent delete / empty trash:**
- `permanentlyDeleteNote()` and `emptyTrash()` must both generate tombstones. Without tombstones, another device would re-upload the permanently deleted note on its next sync
- Tombstones are synced inside the index file (embedded in the sync state, uploaded as part of the index). Both devices see the same tombstone list after sync

### 8. All sync triggers go through background.js

**Message contract:**

| Direction | Message | Response |
|-----------|---------|----------|
| UI → BG | `{ type: 'sync.trigger', reason: 'save'\|'manual', source: 'popup'\|'app' }` | `{ ok: true }` (fire-and-forget) |
| UI → BG | `{ type: 'sync.status' }` | `{ signedIn, email, lastSyncTime, lastError, syncing }` |
| UI → BG | `{ type: 'sync.signin' }` | `{ signedIn, email }` or `{ signedIn: false, error }` |
| UI → BG | `{ type: 'sync.signout' }` | `{ ok: true }` |

**Ownership rule:** Only `background.js` writes to `KEY_SYNC_STATE` and `KEY_SYNC_LOCK`. Popup and app only read these keys via `chrome.storage.onChanged` listener or `sync.status` message. This is the single rule that prevents onChange infinite loops — there is no conditional guard or flag needed because UI contexts simply never write sync keys.

**SW keepalive:** The 5-minute alarm cycle re-wakes the SW if it suspends. During an active sync, the ongoing `fetch()` calls and `chrome.storage` operations keep the SW alive. If the SW is killed mid-sync despite this, the lock TTL handles cleanup and the next alarm retries.

### 9. Token freshness — per-request, no memoization

`_getToken()` is called **per API request**. Chrome's internal token cache (in the browser process, not the JS heap) makes this a cheap local lookup, not an HTTP round-trip. No application-level memoization — that would re-introduce the "stale token in module variable" bug that MV3 service worker restarts cause.

On 401 from any Drive API call:
1. `removeCachedAuthToken({ token })` — flush Chrome's cache
2. `getAuthToken({ interactive: false })` — get fresh token
3. Retry the same API call once
4. If still 401 → user revoked access. Abort sync, set `lastError: 'Access revoked'`. Do NOT call `interactive: true` from background — that would show a decontextualized prompt

### 10. Orphaned Drive file cleanup (mark-and-sweep)

**Problem:** When notes are permanently deleted locally, their Drive files linger.

**Approach: mark-and-sweep with safety rails:**

1. **Mark:** After merge, compute `orphanCandidates = noteFileIds.keys() - mergedIndex.noteIds`
2. **Safety check:** For each candidate, verify the filename matches `DRIVE_NOTE_PREFIX + noteId + '.json'`. Never delete a file by ID alone
3. **Sweep:** Delete only candidates where the cached file was created more than 24 hours ago (prevents deleting a file that another device just created but hasn't synced its index yet)
4. Remove deleted file IDs from cache

This is conservative. Worst case: orphans persist for 24 hours longer than necessary. Best case: no accidental deletion of in-flight files from another device.

### 11. Clock skew mitigation

**Primary signal:** `updatedAt` (client `Date.now()`). Vulnerable to clock skew.

**Mitigation (implemented):** When `abs(local.updatedAt - remote.updatedAt) < 60000` (within 1 minute), fall back to Drive's `modifiedTime` (server-assigned timestamp) as the ordering signal. This handles the common case where two devices edit "at the same time" but their clocks disagree by a few seconds/minutes.

**Mitigation (not implemented, documented):** For v2, consider a logical clock (Lamport timestamp) incremented on each edit. This would make ordering immune to wall-clock skew entirely, at the cost of adding a `logicalClock` field to every note entry.

**Accepted risk:** If one device's clock is off by hours/days, LWW produces incorrect winners. Users can recover via local version history (snapshots every 2 minutes). This is acceptable for v1.

---

## Failure Mode Reference

| Failure | Detection Signal | Automated Action | User Sees | Data-Loss Risk | Recovery |
|---------|-----------------|------------------|-----------|---------------|----------|
| Not signed into Chrome | `getAuthToken` rejects | Hide sync UI | "Sign in" button | None | User signs in |
| Token expired mid-sync | 401 from Drive API | `removeCachedAuthToken` + retry once | Nothing (transparent) | None | Automatic |
| Token revoked server-side | 401 after retry | Abort sync, set `lastError` | "Sync failed" status | None (local intact) | User re-signs in |
| SW killed mid-sync | Lock TTL expires | Next alarm re-acquires lock, retries | Brief "syncing..." then normal | None — partial push is safe, next sync re-merges | Automatic on next alarm |
| Network offline | `fetch` rejects | try/catch → set `lastError` | "Sync failed — will retry" | None | Automatic on next alarm |
| Drive rate limit (429) | 429 response | Log, abort sync | "Sync failed — will retry" | None | Automatic (5min backoff) |
| Drive file 404 (stale cache) | 404 from Drive API | Clear cached ID → re-list → re-create | Nothing (transparent) | None | Automatic |
| Content file 404 (partial upload) | `_driveDownload` returns `null` | Skip note, mark for re-upload | Nothing (transparent) | Low — note content delayed 1 cycle | Originator re-pushes on next sync |
| Popup closes before sync | Message sent to BG before close | BG completes sync independently | Nothing (background handles it) | None | By design |
| onChange infinite loop | N/A — prevented by ownership rule | N/A | N/A | N/A | By design |
| Account switch (stale cache) | Email mismatch on sign-in | Wipe sync state, keep local notes | Re-syncs from scratch | None (local notes preserved) | Automatic |
| `getProfileUserInfo` empty | Empty email string | Treat as not signed in | "Sign in" button | None | User checks Chrome profile |
| Note deleted on A, edited on B | Tombstone vs `updatedAt` comparison | Tombstone wins if `deletedAt > updatedAt` | Deleted note stays deleted | Low — B's edit lost if tombstone wins | Version history on B has the edit |
| Clock skew between devices | `abs(delta) < 60000` | Fall back to Drive `modifiedTime` | Nothing (transparent) | Low — wrong winner if skew > 1min | Version history preserves overwritten content |
| Two concurrent syncs (alarm + manual) | Lock check on acquire | Second sync aborts immediately | Brief "syncing..." then retry | None | Next alarm retries |
| Slow sync exceeds lock TTL | Lock stolen by new sync | Old sync's writes fenced (token mismatch → abort) | Nothing (transparent) | None — fencing prevents stale writes | Automatic |
| 100+ notes first sync | Many sequential API calls | Rate limit is 12k/min — well within bounds | "Syncing..." for longer | None | Completes normally |
| Very large note | Upload timeout | Drive handles up to 5MB simple upload; notes unlikely to exceed | Sync error for that note | Low — one note delayed | Retry on next cycle |

---

## File Changes Summary

| File | Action | Lines ~est |
|------|--------|-----------|
| `manifest.json` | Edit | +5 |
| `shared/constants.js` | Edit | +10 |
| `shared/sync-google.js` | **NEW** | ~400 |
| `background.js` | Edit | +55 |
| `popup/popup.html` | Edit | +12 |
| `popup/popup.css` | Edit | +80 |
| `popup/popup.js` | Edit | +45 |
| `app/app.html` | Edit | +12 |
| `app/app.css` | Edit | +80 |
| `app/app.js` | Edit | +55 |

**Total: ~1 new file, 9 edited files, ~760 lines added**

---

**Do not implement yet.** Waiting for Joona's review and "implement it all."
