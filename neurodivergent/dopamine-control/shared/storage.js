// Storage helpers — used via importScripts in background.js
// Assumes STORAGE_DEFAULTS and getTodayString are already loaded

const storage = {
  get(keys) {
    return new Promise(resolve => chrome.storage.local.get(keys, resolve));
  },

  set(data) {
    return new Promise(resolve => chrome.storage.local.set(data, resolve));
  },

  async init() {
    const stored = await this.get(null);
    const toSet = {};

    for (const [key, value] of Object.entries(STORAGE_DEFAULTS)) {
      if (!(key in stored)) {
        toSet[key] = value;
      }
    }

    if (!stored.installDate) {
      toSet.installDate = new Date().toISOString();
      toSet.lastResetDate = getTodayString();
    }

    if (Object.keys(toSet).length > 0) {
      await this.set(toSet);
    }
  }
};
