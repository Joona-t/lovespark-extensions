// LoveSpark Notes — Google Drive Sync (v1)
// Pull-merge-push sync via Drive appDataFolder.
// All sync state owned by background.js — UI contexts only read.
// Sync failures never break local operations.

import {
  KEY_INDEX, KEY_CONTENT_PREFIX, KEY_SYNC_STATE, KEY_SYNC_LOCK,
  SYNC_LOCK_TTL, SYNC_TOMBSTONE_RETENTION_DAYS, SYNC_CLOCK_SKEW_THRESHOLD,
  DRIVE_INDEX_FILENAME, DRIVE_NOTE_PREFIX,
} from './constants.js';

// ── Feature Detection ────────────────────────────────────────

export function isGoogleSyncSupported() {
  return typeof chrome !== 'undefined' &&
    typeof chrome.identity !== 'undefined' &&
    typeof chrome.identity.getAuthToken === 'function';
}

// ── Session Identity (for lock fencing) ──────────────────────

const SESSION_ID = (typeof crypto !== 'undefined' && crypto.randomUUID)
  ? crypto.randomUUID()
  : Date.now().toString(36) + Math.random().toString(36).slice(2);

// ── Sync State Helpers ───────────────────────────────────────

async function loadSyncState() {
  const result = await chrome.storage.local.get(KEY_SYNC_STATE);
  return result[KEY_SYNC_STATE] || {
    lastSyncTime: 0,
    indexFileId: null,
    noteFileIds: {},
    userEmail: null,
    tombstones: [],
    lastError: null,
    lastErrorTime: null,
  };
}

async function saveSyncState(state) {
  await chrome.storage.local.set({ [KEY_SYNC_STATE]: state });
}

// ── Auth ─────────────────────────────────────────────────────

export async function signIn() {
  try {
    const { token } = await chrome.identity.getAuthToken({ interactive: true });
    if (!token) return { signedIn: false };

    const info = await chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' });
    if (!info.email) {
      await chrome.identity.removeCachedAuthToken({ token });
      return { signedIn: false };
    }

    const state = await loadSyncState();
    if (state.userEmail && state.userEmail !== info.email) {
      // Different account — wipe sync metadata, keep local notes
      await saveSyncState({
        lastSyncTime: 0,
        indexFileId: null,
        noteFileIds: {},
        userEmail: info.email,
        tombstones: [],
        lastError: null,
        lastErrorTime: null,
      });
    } else {
      state.userEmail = info.email;
      state.lastError = null;
      state.lastErrorTime = null;
      await saveSyncState(state);
    }

    return { signedIn: true, email: info.email };
  } catch (err) {
    console.error('LoveSpark Notes: sign-in failed', err);
    return { signedIn: false, error: err.message };
  }
}

export async function signOut() {
  try {
    const { token } = await chrome.identity.getAuthToken({ interactive: false });
    if (token) {
      await chrome.identity.removeCachedAuthToken({ token });
      // Best-effort revoke
      try {
        await fetch(`https://accounts.google.com/o/oauth2/revoke?token=${token}`);
      } catch {}
    }
  } catch {}

  // Clear sync state but not local notes
  await saveSyncState({
    lastSyncTime: 0,
    indexFileId: null,
    noteFileIds: {},
    userEmail: null,
    tombstones: [],
    lastError: null,
    lastErrorTime: null,
  });

  // Clear lock if held
  await chrome.storage.local.remove(KEY_SYNC_LOCK);
}

export async function getSignInStatus() {
  try {
    const { token } = await chrome.identity.getAuthToken({ interactive: false });
    if (!token) return { signedIn: false };

    const info = await chrome.identity.getProfileUserInfo({ accountStatus: 'ANY' });
    if (!info.email) return { signedIn: false };

    return { signedIn: true, email: info.email };
  } catch {
    return { signedIn: false };
  }
}

// ── Token Helper ─────────────────────────────────────────────

async function _getToken() {
  const { token } = await chrome.identity.getAuthToken({ interactive: false });
  if (!token) throw new Error('Not signed in');
  return token;
}

async function _fetchWithAuth(url, options = {}) {
  let token = await _getToken();
  let response = await fetch(url, {
    ...options,
    headers: { ...options.headers, Authorization: `Bearer ${token}` },
  });

  if (response.status === 401) {
    // Token revoked server-side — flush and retry once
    await chrome.identity.removeCachedAuthToken({ token });
    token = await _getToken();
    response = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
    });
    if (response.status === 401) {
      throw new Error('Access revoked');
    }
  }

  return response;
}

// ── Drive API Helpers ────────────────────────────────────────

async function _driveList(filename) {
  const q = encodeURIComponent(`name='${filename}'`);
  const fields = encodeURIComponent('files(id,name,modifiedTime)');
  const url = `https://www.googleapis.com/drive/v3/files?spaces=appDataFolder&q=${q}&fields=${fields}&pageSize=1`;
  const res = await _fetchWithAuth(url);
  if (!res.ok) return null;
  const data = await res.json();
  return data.files && data.files.length > 0 ? data.files[0] : null;
}

async function _driveCreate(filename, data) {
  const boundary = 'LS_BOUNDARY_' + Date.now();
  const metadata = JSON.stringify({ name: filename, parents: ['appDataFolder'] });
  const content = JSON.stringify(data);

  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    metadata,
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    content,
    `--${boundary}--`,
  ].join('\r\n');

  const res = await _fetchWithAuth(
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name',
    {
      method: 'POST',
      headers: { 'Content-Type': `multipart/related; boundary=${boundary}` },
      body,
    }
  );

  if (!res.ok) throw new Error(`Drive create failed: ${res.status}`);
  return res.json();
}

async function _driveUpdate(fileId, data) {
  const res = await _fetchWithAuth(
    `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media`,
    {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    }
  );
  if (!res.ok) throw new Error(`Drive update failed: ${res.status}`);
}

async function _driveDownload(fileId) {
  const res = await _fetchWithAuth(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`
  );
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`Drive download failed: ${res.status}`);
  return res.json();
}

async function _driveDelete(fileId) {
  const res = await _fetchWithAuth(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    { method: 'DELETE' }
  );
  // 404 = already deleted, that's fine
  if (!res.ok && res.status !== 404 && res.status !== 204) {
    throw new Error(`Drive delete failed: ${res.status}`);
  }
}

// ── File ID Resolution ───────────────────────────────────────

async function _getOrCreateFile(filename, state) {
  const cacheKey = filename === DRIVE_INDEX_FILENAME ? 'indexFileId' : null;

  // Check cached ID
  if (cacheKey && state[cacheKey]) {
    try {
      const res = await _fetchWithAuth(
        `https://www.googleapis.com/drive/v3/files/${state[cacheKey]}?fields=id`
      );
      if (res.ok) return state[cacheKey];
    } catch {}
    // Stale — clear
    state[cacheKey] = null;
  }

  // List by name
  const existing = await _driveList(filename);
  if (existing) {
    if (cacheKey) state[cacheKey] = existing.id;
    return existing.id;
  }

  // Create new
  const created = await _driveCreate(filename, {});
  if (cacheKey) state[cacheKey] = created.id;
  return created.id;
}

async function _getNoteFileId(noteId, state) {
  const filename = DRIVE_NOTE_PREFIX + noteId + '.json';
  const cached = state.noteFileIds[noteId];

  if (cached) {
    try {
      const res = await _fetchWithAuth(
        `https://www.googleapis.com/drive/v3/files/${cached}?fields=id`
      );
      if (res.ok) return cached;
    } catch {}
    delete state.noteFileIds[noteId];
  }

  const existing = await _driveList(filename);
  if (existing) {
    state.noteFileIds[noteId] = existing.id;
    return existing.id;
  }

  const created = await _driveCreate(filename, {});
  state.noteFileIds[noteId] = created.id;
  return created.id;
}

// ── Sync Lock (with TTL + fencing) ───────────────────────────

async function _acquireLock() {
  const result = await chrome.storage.local.get(KEY_SYNC_LOCK);
  const lock = result[KEY_SYNC_LOCK];

  if (lock && lock.inProgress && (Date.now() - lock.startedAt < SYNC_LOCK_TTL)) {
    return null; // Lock held by another session
  }

  const fenceToken = (lock && lock.fenceToken ? lock.fenceToken : 0) + 1;
  const newLock = {
    inProgress: true,
    startedAt: Date.now(),
    ownerId: SESSION_ID,
    fenceToken,
  };
  await chrome.storage.local.set({ [KEY_SYNC_LOCK]: newLock });
  return fenceToken;
}

async function _verifyFence(fenceToken) {
  const result = await chrome.storage.local.get(KEY_SYNC_LOCK);
  const lock = result[KEY_SYNC_LOCK];
  return lock && lock.fenceToken === fenceToken && lock.ownerId === SESSION_ID;
}

async function _releaseLock() {
  const result = await chrome.storage.local.get(KEY_SYNC_LOCK);
  const lock = result[KEY_SYNC_LOCK];
  // Only release our own lock
  if (lock && lock.ownerId === SESSION_ID) {
    await chrome.storage.local.remove(KEY_SYNC_LOCK);
  }
}

// ── Full Sync (pull-merge-push) ──────────────────────────────

export async function fullSync() {
  const fenceToken = await _acquireLock();
  if (!fenceToken) {
    return { pushed: 0, pulled: 0, deleted: 0, errors: 0, timestamp: Date.now(), skipped: 'lock_held' };
  }

  const state = await loadSyncState();
  let pushed = 0, pulled = 0, deleted = 0, errors = 0;

  try {
    // ── Load local index ──
    const localResult = await chrome.storage.local.get(KEY_INDEX);
    const localIndex = localResult[KEY_INDEX] || { notes: [], version: 1 };
    const localNotesById = new Map(localIndex.notes.map(n => [n.id, n]));

    // ── Pull: download remote index ──
    const indexFileId = await _getOrCreateFile(DRIVE_INDEX_FILENAME, state);
    let remoteIndex = await _driveDownload(indexFileId);
    const isFirstSync = !remoteIndex || !remoteIndex.notes;
    const remoteNotes = isFirstSync ? [] : remoteIndex.notes;
    const remoteTombstones = (remoteIndex && remoteIndex.tombstones) || [];
    const remoteNotesById = new Map(remoteNotes.map(n => [n.id, n]));

    // Merge tombstones from remote
    const tombstoneMap = new Map();
    for (const t of state.tombstones) tombstoneMap.set(t.noteId, t);
    for (const t of remoteTombstones) {
      const existing = tombstoneMap.get(t.noteId);
      if (!existing || t.deletedAt > existing.deletedAt) {
        tombstoneMap.set(t.noteId, t);
      }
    }

    // ── Merge ──
    const mergedNotes = [];
    const toUpload = [];    // noteIds to push content to Drive
    const toDownload = [];  // noteIds to pull content from Drive
    const allNoteIds = new Set([...localNotesById.keys(), ...remoteNotesById.keys()]);

    for (const noteId of allNoteIds) {
      const local = localNotesById.get(noteId);
      const remote = remoteNotesById.get(noteId);
      const tombstone = tombstoneMap.get(noteId);

      // Tombstone check: if tombstone is newer than the surviving copy, delete wins
      if (tombstone) {
        if (local && !local.deletedAt && tombstone.deletedAt > local.updatedAt) {
          // Tombstone wins over local — soft-delete locally
          local.deletedAt = tombstone.deletedAt;
          local.originalCategory = local.category;
          local.category = 'trash';
          local.pinned = false;
          continue; // Don't include in merged (it's trashed)
        }
        if (remote && !remote.deletedAt && tombstone.deletedAt > remote.updatedAt) {
          // Tombstone wins over remote — don't pull
          continue;
        }
      }

      if (local && remote) {
        // Both sides have it — LWW
        const delta = Math.abs(local.updatedAt - remote.updatedAt);
        let localWins;

        if (local.updatedAt === remote.updatedAt) {
          localWins = false; // Tie → remote wins (avoids unnecessary upload)
        } else if (delta < SYNC_CLOCK_SKEW_THRESHOLD && remoteIndex && remoteIndex._driveModifiedTime) {
          // Within clock skew range — use server timestamp if available
          localWins = local.updatedAt > remote.updatedAt;
        } else {
          localWins = local.updatedAt > remote.updatedAt;
        }

        if (localWins) {
          mergedNotes.push(local);
          toUpload.push(noteId);
        } else {
          mergedNotes.push(remote);
          toDownload.push(noteId);
        }
      } else if (local && !remote) {
        // Local only
        mergedNotes.push(local);
        toUpload.push(noteId);
      } else if (remote && !local) {
        // Remote only
        mergedNotes.push(remote);
        toDownload.push(noteId);
      }
    }

    // ── Download remotely-newer content ──
    for (const noteId of toDownload) {
      try {
        const remoteFileId = state.noteFileIds[noteId];
        let content = null;
        if (remoteFileId) {
          content = await _driveDownload(remoteFileId);
        }
        if (!content) {
          // Try listing by name
          const file = await _driveList(DRIVE_NOTE_PREFIX + noteId + '.json');
          if (file) {
            state.noteFileIds[noteId] = file.id;
            content = await _driveDownload(file.id);
          }
        }
        if (content && content.content !== undefined) {
          await chrome.storage.local.set({
            [KEY_CONTENT_PREFIX + noteId]: { id: noteId, content: content.content },
          });
          pulled++;
        }
        // If content is null (404), skip — originator will re-push next cycle
      } catch (err) {
        console.error(`LoveSpark Notes: failed to download note ${noteId}`, err);
        errors++;
      }
    }

    // Verify fence before writing
    if (!await _verifyFence(fenceToken)) {
      return { pushed: 0, pulled, deleted: 0, errors, timestamp: Date.now(), aborted: 'fence_stolen' };
    }

    // ── Save merged index locally ──
    localIndex.notes = mergedNotes;
    await chrome.storage.local.set({ [KEY_INDEX]: localIndex });

    // ── Push locally-newer content ──
    for (const noteId of toUpload) {
      try {
        // Verify fence periodically
        if (!await _verifyFence(fenceToken)) {
          return { pushed, pulled, deleted, errors, timestamp: Date.now(), aborted: 'fence_stolen' };
        }

        const contentResult = await chrome.storage.local.get(KEY_CONTENT_PREFIX + noteId);
        const noteData = contentResult[KEY_CONTENT_PREFIX + noteId];
        if (!noteData) continue;

        const fileId = await _getNoteFileId(noteId, state);
        await _driveUpdate(fileId, noteData);
        pushed++;
      } catch (err) {
        console.error(`LoveSpark Notes: failed to upload note ${noteId}`, err);
        errors++;
      }
    }

    // ── Upload merged index to Drive ──
    if (!await _verifyFence(fenceToken)) {
      return { pushed, pulled, deleted, errors, timestamp: Date.now(), aborted: 'fence_stolen' };
    }

    const indexToUpload = {
      notes: mergedNotes,
      tombstones: [...tombstoneMap.values()],
      version: localIndex.version || 1,
    };
    await _driveUpdate(indexFileId, indexToUpload);

    // ── Cleanup: orphaned Drive files ──
    const mergedNoteIds = new Set(mergedNotes.map(n => n.id));
    for (const [noteId, fileId] of Object.entries(state.noteFileIds)) {
      if (!mergedNoteIds.has(noteId)) {
        try {
          await _driveDelete(fileId);
          delete state.noteFileIds[noteId];
          deleted++;
        } catch (err) {
          console.error(`LoveSpark Notes: failed to delete orphan ${noteId}`, err);
        }
      }
    }

    // ── Prune old tombstones ──
    const tombstoneCutoff = Date.now() - (SYNC_TOMBSTONE_RETENTION_DAYS * 86400000);
    state.tombstones = [...tombstoneMap.values()].filter(t => t.deletedAt > tombstoneCutoff);

    // ── Update sync state ──
    state.lastSyncTime = Date.now();
    state.lastError = null;
    state.lastErrorTime = null;
    await saveSyncState(state);

    return { pushed, pulled, deleted, errors, timestamp: state.lastSyncTime };
  } catch (err) {
    console.error('LoveSpark Notes: sync failed', err);
    state.lastError = err.message;
    state.lastErrorTime = Date.now();
    await saveSyncState(state);
    return { pushed, pulled, deleted, errors: errors + 1, timestamp: Date.now(), error: err.message };
  } finally {
    await _releaseLock();
  }
}

// ── Tombstone Registration ───────────────────────────────────

export async function addTombstone(noteId) {
  const state = await loadSyncState();
  const existing = state.tombstones.find(t => t.noteId === noteId);
  if (existing) {
    existing.deletedAt = Date.now();
  } else {
    state.tombstones.push({ noteId, deletedAt: Date.now() });
  }
  await saveSyncState(state);
}
