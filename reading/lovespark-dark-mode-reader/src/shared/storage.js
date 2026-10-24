/* Dark Mode Reader — storage.js
   ONE storage module, ONE area (chrome.storage.local), for worker, popup and
   settings. Content scripts never touch storage directly; they ask the worker.
   (known-issues: storage-area mismatch between contexts.) */
(function (root) {
  'use strict';
  // Nested defaults are named constants so DEFAULTS stays one flat, readable table.
  const DEFAULT_SCHEDULE = { mode: 'always', from: '20:00', to: '07:00' }; // mode: always | system | time
  const DEFAULT_READING = { font: 'opendyslexic', width: true, lineHeight: true, links: true };
  const DEFAULT_STATS = { pagesToday: 0, pagesTotal: 0, lastResetDate: '' };
  const DEFAULTS = {
    enabled: true,
    palette: 'noir',
    imageDim: 85,                       // percent brightness for photos and video
    schedule: DEFAULT_SCHEDULE,
    reading: DEFAULT_READING,
    stats: DEFAULT_STATS,
    theme: 'retro',                     // popup UI theme (shared lib)
    sites: {},                          // host -> { mode, reading, nativeDark, seen }
  };
  // Every top-level key, spelled out. tests/storage.test.js keeps it equal to DEFAULTS.
  const KEYS = ['enabled', 'palette', 'imageDim', 'schedule', 'reading', 'stats', 'theme', 'sites'];
  const MSG = {
    GET_PAGE_STATE: 'dmr:getPageState',   // content -> worker  { host }
    FETCH_SHEET: 'dmr:fetchSheet',        // content -> worker  { url }
    REPORT_NATIVE_DARK: 'dmr:nativeDark', // content -> worker  { host, nativeDark }
    PAGE_THEMED: 'dmr:pageThemed',        // content -> worker  { host }
    GET_STATE: 'dmr:getState',            // popup   -> worker
    SET_GLOBAL: 'dmr:setGlobal',          // popup/settings -> worker { patch }
    SET_SITE: 'dmr:setSite',              // popup -> worker { host, patch }
    TOGGLE_SITE: 'dmr:toggleSite',        // command/popup -> worker { host }
    APPLY: 'dmr:apply',                   // worker -> content  { pageState }
    RESET: 'dmr:reset',                   // settings -> worker
  };
  function localDate() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
  async function getAll() {
    const data = await chrome.storage.local.get(['enabled', 'palette', 'imageDim', 'schedule', 'reading', 'stats', 'theme', 'sites']);
    const out = {};
    for (const k of KEYS) {
      const d = DEFAULTS[k];
      out[k] = (d && typeof d === 'object' && !Array.isArray(d)) ? { ...d, ...(data[k] || {}) } : (data[k] === undefined ? d : data[k]);
    }
    return out;
  }
  async function set(patch) { await chrome.storage.local.set(patch); }
  function siteFor(state, host) { return { mode: 'auto', reading: false, nativeDark: false, ...(state.sites[host] || {}) }; }
  // Is the time schedule currently "dark"? (mode 'time' only)
  function inWindow(from, to, now = new Date()) {
    const [fh, fm] = from.split(':').map(Number), [th, tm] = to.split(':').map(Number);
    const mins = now.getHours() * 60 + now.getMinutes(), a = fh * 60 + fm, b = th * 60 + tm;
    return a <= b ? (mins >= a && mins < b) : (mins >= a || mins < b);
  }
  const api = { DEFAULTS, KEYS, MSG, getAll, set, siteFor, inWindow, localDate };
  root.DMR = root.DMR || {};
  root.DMR.storage = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
