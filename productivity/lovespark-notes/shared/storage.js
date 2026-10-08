// LoveSpark Notes — StorageLocal (localStorage implementation)
// INTEGRATION POINT: swap this for StorageChrome or StorageTauri
// TODO: replace with Tauri invoke() for Core

import {
  KEY_INDEX, KEY_PREFS, KEY_CONTENT_PREFIX, KEY_VERSIONS_PREFIX,
  KEY_LEGACY, MAX_VERSIONS, STORAGE_VERSION, DEFAULT_PREFS,
} from './constants.js';

/**
 * StorageLocal — localStorage backend for standalone web app.
 * All methods are async to match the chrome.storage interface.
 */
export const StorageLocal = {

  // ── Index (note metadata list) ──────────────────────────────

  async loadIndex() {
    try {
      const raw = localStorage.getItem(KEY_INDEX);
      return raw ? JSON.parse(raw) : { notes: [], version: STORAGE_VERSION };
    } catch {
      return { notes: [], version: STORAGE_VERSION };
    }
  },

  async saveIndex(index) {
    try {
      localStorage.setItem(KEY_INDEX, JSON.stringify(index));
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        console.error('LoveSpark Notes: localStorage quota exceeded (index)');
      }
      throw err;
    }
  },

  // ── Note content ────────────────────────────────────────────

  async loadContent(id) {
    try {
      const raw = localStorage.getItem(KEY_CONTENT_PREFIX + id);
      if (!raw) return '';
      const data = JSON.parse(raw);
      return data.content || '';
    } catch {
      return '';
    }
  },

  async saveContent(id, content) {
    try {
      localStorage.setItem(KEY_CONTENT_PREFIX + id, JSON.stringify({ id, content }));
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        console.error('LoveSpark Notes: localStorage quota exceeded (content)');
      }
      throw err;
    }
  },

  async deleteNoteData(id) {
    localStorage.removeItem(KEY_CONTENT_PREFIX + id);
    localStorage.removeItem(KEY_VERSIONS_PREFIX + id);
  },

  // ── Version history ─────────────────────────────────────────

  async loadVersions(noteId) {
    try {
      const raw = localStorage.getItem(KEY_VERSIONS_PREFIX + noteId);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  async saveVersions(noteId, versions) {
    try {
      localStorage.setItem(KEY_VERSIONS_PREFIX + noteId, JSON.stringify(versions));
    } catch (err) {
      if (err.name === 'QuotaExceededError') {
        // Prune to half and retry
        const pruned = versions.slice(-Math.floor(MAX_VERSIONS / 2));
        localStorage.setItem(KEY_VERSIONS_PREFIX + noteId, JSON.stringify(pruned));
      }
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

  // ── Preferences ─────────────────────────────────────────────

  async loadPrefs() {
    try {
      const raw = localStorage.getItem(KEY_PREFS);
      return raw ? { ...DEFAULT_PREFS, ...JSON.parse(raw) } : { ...DEFAULT_PREFS };
    } catch {
      return { ...DEFAULT_PREFS };
    }
  },

  async savePrefs(prefs) {
    localStorage.setItem(KEY_PREFS, JSON.stringify(prefs));
  },

  async setPref(key, value) {
    const prefs = await this.loadPrefs();
    prefs[key] = value;
    await this.savePrefs(prefs);
  },

  // ── Migration ───────────────────────────────────────────────

  async migrate() {
    // Migrate from foundation's single-blob format
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

  // ── Change listener (no-op for localStorage) ───────────────

  onChange(handler) {
    // localStorage has a 'storage' event but only fires in OTHER tabs
    const listener = (e) => {
      if (e.key && (e.key === KEY_INDEX || e.key === KEY_PREFS || e.key.startsWith(KEY_CONTENT_PREFIX))) {
        handler(e.key, e.newValue);
      }
    };
    window.addEventListener('storage', listener);
    return () => window.removeEventListener('storage', listener);
  },
};
