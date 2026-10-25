// Minimal chrome/browser API stub so a popup renders outside the extension.
(() => {
  const store = {};
  const area = {
    get(keys, cb) { const r = {}; if (cb) cb(r); return Promise.resolve(r); },
    set(obj, cb) { Object.assign(store, obj); if (cb) cb(); return Promise.resolve(); },
    remove(k, cb) { if (cb) cb(); return Promise.resolve(); },
    clear(cb) { if (cb) cb(); return Promise.resolve(); },
  };
  const ev = { addListener() {}, removeListener() {}, hasListener() { return false; } };
  const api = {
    runtime: {
      id: 'theme-sweep', lastError: undefined, onMessage: ev, onInstalled: ev,
      sendMessage(m, cb) { if (typeof cb === 'function') cb(undefined); return Promise.resolve(undefined); },
      getURL: (p) => p, getManifest: () => ({ version: '0.0.0', name: 'sweep' }), openOptionsPage() {},
    },
    storage: { local: area, sync: area, session: area, onChanged: ev },
    tabs: { query(q, cb) { if (cb) cb([]); return Promise.resolve([]); }, create() {}, sendMessage() { return Promise.resolve(); }, onUpdated: ev },
    i18n: { getMessage: (k) => k, getUILanguage: () => 'en' },
    action: { setBadgeText() {}, setBadgeBackgroundColor() {} },
    alarms: { create() {}, clear() {}, onAlarm: ev, get(n, cb) { if (cb) cb(); } },
    scripting: { executeScript() { return Promise.resolve([]); } },
    permissions: { contains(p, cb) { if (cb) cb(false); return Promise.resolve(false); }, request() { return Promise.resolve(false); } },
    windows: { getCurrent(cb) { if (cb) cb({}); return Promise.resolve({}); } },
  };
  window.chrome = api;
  window.browser = api;
})();
