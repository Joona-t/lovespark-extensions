// LoveSpark Notes — Storage backend selection
// INTEGRATION POINT: add StorageTauri detection for Core

import { StorageLocal } from './storage.js';

let _storage = null;

/**
 * Initialize and return the correct storage backend.
 * Detection order: Tauri (future) → Chrome extension → localStorage
 */
export async function initStorage() {
  if (_storage) return _storage;

  // Future: Tauri detection
  // if (typeof __TAURI_INTERNALS__ !== 'undefined') {
  //   const { StorageTauri } = await import('./storage-tauri.js');
  //   _storage = StorageTauri;
  //   return _storage;
  // }

  // Chrome extension detection
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    const { StorageChrome } = await import('./storage-chrome.js');
    _storage = StorageChrome;
    return _storage;
  }

  // Fallback: localStorage (standalone web app)
  _storage = StorageLocal;
  return _storage;
}

/** Get the already-initialized storage backend */
export function getStorage() {
  if (!_storage) throw new Error('Storage not initialized — call initStorage() first');
  return _storage;
}
