// LoveSpark Notes — StorageChrome (chrome.storage implementation)
// INTEGRATION POINT: sync carries index + prefs, local carries content + versions
// TODO: replace with Tauri invoke() for Core

import {
  KEY_INDEX, KEY_PREFS, KEY_CONTENT_PREFIX, KEY_VERSIONS_PREFIX,
  KEY_LEGACY, MAX_VERSIONS, STORAGE_VERSION, DEFAULT_PREFS,
} from './constants.js';

/** Helper: promisify chrome.storage calls */
function syncGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(result);
    });
  });
}

function syncSet(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

function localGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (result) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(result);
    });
  });
}

function localSet(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(data, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

function localRemove(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

function sessionGet(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.session.get(keys, (result) => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve(result);
    });
  });
}

function sessionSet(data) {
  return new Promise((resolve, reject) => {
    chrome.storage.session.set(data, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

function sessionRemove(keys) {
  return new Promise((resolve, reject) => {
    chrome.storage.session.remove(keys, () => {
      if (chrome.runtime.lastError) reject(new Error(chrome.runtime.lastError.message));
      else resolve();
    });
  });
}

/**
 * StorageChrome — chrome.storage backend for the extension.
 * Index + prefs in chrome.storage.local (cross-device).
 * Content + versions in chrome.storage.local (unlimited with permission).
 */
export const StorageChrome = {

  // ── Index (synced across devices) ───────────────────────────

  async loadIndex() {
    try {
      const result = await syncGet(KEY_INDEX);
      return result[KEY_INDEX] || { notes: [], version: STORAGE_VERSION };
    } catch {
      // Sync unavailable — try local fallback
      try {
        const result = await localGet(KEY_INDEX);
        return result[KEY_INDEX] || { notes: [], version: STORAGE_VERSION };
      } catch {
        return { notes: [], version: STORAGE_VERSION };
      }
    }
  },

  async saveIndex(index) {
    index.version = STORAGE_VERSION;
    try {
      await syncSet({ [KEY_INDEX]: index });
    } catch (err) {
      // Sync failed — save to local as fallback
      console.warn('LoveSpark Notes: sync write failed, using local fallback', err.message);
      await localSet({ [KEY_INDEX]: index });
    }
  },

  // ── Note content (local only — too large for sync) ─────────

  async loadContent(id) {
    try {
      const key = KEY_CONTENT_PREFIX + id;
      const result = await localGet(key);
      if (!result[key]) return '';
      return result[key].content || '';
    } catch {
      return '';
    }
  },

  async saveContent(id, content) {
    const key = KEY_CONTENT_PREFIX + id;
    await localSet({ [key]: { id, content } });
  },

  async deleteNoteData(id) {
    await localRemove([KEY_CONTENT_PREFIX + id, KEY_VERSIONS_PREFIX + id]);
  },

  // ── Version history (local only) ───────────────────────────

  async loadVersions(noteId) {
    try {
      const key = KEY_VERSIONS_PREFIX + noteId;
      const result = await localGet(key);
      return result[key] || [];
    } catch {
      return [];
    }
  },

  async saveVersions(noteId, versions) {
    const key = KEY_VERSIONS_PREFIX + noteId;
    try {
      await localSet({ [key]: versions });
    } catch (err) {
      // Quota exceeded — prune and retry
      const pruned = versions.slice(-Math.floor(MAX_VERSIONS / 2));
      await localSet({ [key]: pruned });
    }
  },

  async pushVersion(noteId, snapshot) {
    const versions = await this.loadVersions(noteId);
    // Skip if content is identical to last version
    if (versions.length > 0 && versions[versions.length - 1].content === snapshot.content) {
      return;
    }
    versions.push(snapshot);
    if (versions.length > MAX_VERSIONS) versions.shift();
    await this.saveVersions(noteId, versions);
  },

  // ── Preferences (synced) ────────────────────────────────────

  async loadPrefs() {
    try {
      const result = await syncGet(KEY_PREFS);
      return { ...DEFAULT_PREFS, ...(result[KEY_PREFS] || {}) };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  },

  async savePrefs(prefs) {
    try {
      await syncSet({ [KEY_PREFS]: prefs });
    } catch {
      await localSet({ [KEY_PREFS]: prefs });
    }
  },

  async setPref(key, value) {
    const prefs = await this.loadPrefs();
    prefs[key] = value;
    await this.savePrefs(prefs);
  },

  // ── Session storage (ephemeral, survives SW suspension) ────

  async getDirtyNote() {
    try {
      const result = await sessionGet('dirtyNote');
      return result.dirtyNote || null;
    } catch {
      return null;
    }
  },

  async setDirtyNote(noteId, content) {
    await sessionSet({ dirtyNote: { id: noteId, content, ts: Date.now() } });
  },

  async clearDirtyNote() {
    await sessionRemove('dirtyNote');
  },

  // ── App tab registration (avoids tabs permission) ──────────

  async getAppTab() {
    try {
      const result = await sessionGet('appTab');
      return result.appTab || null;
    } catch {
      return null;
    }
  },

  async setAppTab(tabId, windowId) {
    await sessionSet({ appTab: { tabId, windowId } });
  },

  async clearAppTab() {
    await sessionRemove('appTab');
  },

  // ── Migration ───────────────────────────────────────────────

  async migrate() {
    // Check for foundation's single-blob localStorage format
    // This runs in extension pages that have access to localStorage
    if (typeof localStorage === 'undefined') return false;
    const legacy = localStorage.getItem(KEY_LEGACY);
    if (!legacy) return false;

    try {
      const oldNotes = JSON.parse(legacy);
      if (!Array.isArray(oldNotes) || oldNotes.length === 0) return false;

      const index = { notes: [], version: STORAGE_VERSION };

      for (const note of oldNotes) {
        const entry = {
          id: note.id,
          title: note.title || '',
          category: note.category || 'idea',
          pinned: note.pinned || false,
          tags: note.tags || [],
          wordCount: note.content ? note.content.trim().split(/\s+/).length : 0,
          createdAt: note.createdAt || Date.now(),
          updatedAt: note.updatedAt || Date.now(),
        };
        index.notes.push(entry);
        await this.saveContent(note.id, note.content || '');
      }

      await this.saveIndex(index);
      await this.setPref('hasSeenWelcome', true);
      localStorage.removeItem(KEY_LEGACY);
      return true;
    } catch (err) {
      console.error('LoveSpark Notes: migration failed', err);
      return false;
    }
  },

  // ── Change listener ─────────────────────────────────────────

  onChange(handler) {
    const listener = (changes, area) => {
      for (const key of Object.keys(changes)) {
        handler(key, changes[key].newValue, area);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  },
};
