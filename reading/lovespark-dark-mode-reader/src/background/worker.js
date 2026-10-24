/* Dark Mode Reader — worker.js (MV3 service worker)
   Owns: state, dynamic CSS registration (what makes stage 0 flash-free and
   never injected on sites the user turned off), cross-origin sheet fetch +
   session cache, schedule alarms, badge, keyboard command. */
'use strict';
importScripts('../shared/storage.js', '../shared/palettes.js');

const TAG = '[dark-mode-reader]';
const { MSG, getAll, set, siteFor, inWindow, localDate } = DMR.storage;
const CSS_SCRIPT_ID = 'dmr-theme-css';
const CSS_FILES = ['src/content/theme.css'];
let fixesCache = null;
let systemDarkCache = null; // reported by pages/popup; worker has no matchMedia

// ── helpers ──────────────────────────────────────────────────────────────
async function loadFixes() {
  if (fixesCache) return fixesCache;
  try {
    const res = await fetch(chrome.runtime.getURL('fixes/sites.json'));
    fixesCache = await res.json();
  } catch (err) { console.warn(TAG, 'loadFixes failed:', err); fixesCache = {}; }
  return fixesCache;
}
function fixesFor(fixes, host) {
  const parts = [fixes['*'], fixes[host]];
  const bare = host.replace(/^www\./, '');
  if (bare !== host) parts.push(fixes[bare]);
  const css = parts.filter(Boolean).map(f => f.css || '').join('\n');
  return { css };
}
function scheduleActive(state) {
  const s = state.schedule;
  if (s.mode === 'time') return inWindow(s.from, s.to);
  if (s.mode === 'system') return systemDarkCache !== false; // unknown → assume yes
  return true;
}
function siteActive(state, host) {
  const site = siteFor(state, host);
  if (site.mode === 'off') return false;
  if (site.mode === 'on') return true;
  return !site.nativeDark;
}
async function pageStateFor(state, host) {
  const fixes = await loadFixes();
  const site = siteFor(state, host);
  const active = state.enabled && scheduleActive(state) && siteActive(state, host);
  return {
    active, palette: state.palette, imageDim: state.imageDim,
    reading: state.reading, readingEnabled: !!site.reading, site,
    schedule: state.schedule.mode, fixes: fixesFor(fixes, host),
  };
}
function hostPatterns(host) {
  if (!host || /[*:/]/.test(host)) return [];
  return [`*://${host}/*`, `*://*.${host}/*`];
}

// ── dynamic CSS registration (stage 0) ───────────────────────────────────
async function syncRegistration(state) {
  state = state || await getAll();
  const wanted = state.enabled && scheduleActive(state);
  let existing = [];
  try { existing = await chrome.scripting.getRegisteredContentScripts({ ids: [CSS_SCRIPT_ID] }); } catch (err) { console.warn(TAG, 'getRegistered failed:', err); }
  if (!wanted) {
    if (existing.length) { try { await chrome.scripting.unregisterContentScripts({ ids: [CSS_SCRIPT_ID] }); } catch (err) { console.warn(TAG, 'unregister failed:', err); } }
    return;
  }
  const excludeMatches = [];
  for (const [host, site] of Object.entries(state.sites)) {
    if (site.mode === 'off' || (site.mode !== 'on' && site.nativeDark)) excludeMatches.push(...hostPatterns(host));
  }
  const def = { id: CSS_SCRIPT_ID, matches: ['http://*/*', 'https://*/*'], excludeMatches, css: CSS_FILES, runAt: 'document_start', allFrames: true, persistAcrossSessions: true };
  try {
    if (existing.length) await chrome.scripting.updateContentScripts([def]);
    else await chrome.scripting.registerContentScripts([def]);
  } catch (err) {
    console.warn(TAG, 'register failed, retrying without excludeMatches:', err);
    try { await chrome.scripting.registerContentScripts([{ ...def, excludeMatches: [] }]); } catch (err2) { console.warn(TAG, 'register retry failed:', err2); }
  }
}

// ── schedule alarm ───────────────────────────────────────────────────────
async function armScheduleAlarm(state) {
  await chrome.alarms.clear('dmr-schedule');
  if (state.schedule.mode !== 'time') return;
  const now = new Date();
  const next = [state.schedule.from, state.schedule.to].map((t) => {
    const [h, m] = t.split(':').map(Number);
    const d = new Date(now); d.setHours(h, m, 0, 0);
    if (d <= now) d.setDate(d.getDate() + 1);
    return d.getTime();
  }).sort()[0];
  chrome.alarms.create('dmr-schedule', { when: next + 1000 });
}
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dmr-schedule') { const s = await getAll(); await syncRegistration(s); await armScheduleAlarm(s); await broadcast(s); }
  if (alarm.name === 'dmr-daily') await dailyReset();
});
async function dailyReset() {
  const s = await getAll();
  if (s.stats.lastResetDate !== localDate()) await set({ stats: { ...s.stats, pagesToday: 0, lastResetDate: localDate() } });
  await updateBadge();
}

// ── badge ────────────────────────────────────────────────────────────────
async function updateBadge() {
  const s = await getAll();
  if (!s.enabled) { chrome.action.setBadgeText({ text: 'OFF' }); chrome.action.setBadgeBackgroundColor({ color: '#666666' }); return; }
  const n = s.stats.pagesToday;
  chrome.action.setBadgeText({ text: n > 999 ? '999+' : n > 0 ? String(n) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#e91e8c' });
  try { chrome.action.setBadgeTextColor({ color: '#ffffff' }); } catch (err) { console.warn(TAG, 'badge text colour unsupported:', err); }
}

// ── push state to open tabs ──────────────────────────────────────────────
async function broadcast(state, onlyTabId) {
  state = state || await getAll();
  let tabs = [];
  try { tabs = onlyTabId ? [await chrome.tabs.get(onlyTabId)] : await chrome.tabs.query({}); } catch (err) { console.warn(TAG, 'tabs query failed:', err); return; }
  for (const tab of tabs) {
    if (!tab.url || !/^https?:/.test(tab.url)) continue;
    let host = ''; try { host = new URL(tab.url).hostname; } catch (err) { continue; }
    const ps = await pageStateFor(state, host);
    chrome.tabs.sendMessage(tab.id, { type: MSG.APPLY, pageState: ps }).catch(() => { /* tab without our script (e.g. store page) — expected */ });
  }
}

// ── cross-origin sheet cache (storage.session: gone on browser restart) ──
async function cacheGet(key) { try { const r = await chrome.storage.session.get(key); return r[key]; } catch (err) { return undefined; } }
async function cacheSet(key, value) {
  try {
    if (value.length > 400000) return; // don't bloat the 10 MB session quota with one giant sheet
    await chrome.storage.session.set({ [key]: value });
  } catch (err) { console.warn(TAG, 'session cache set failed:', err); }
}
async function fetchSheet(url, store, paletteId) {
  const themedKey = `t:${paletteId || ''}:${url}`;
  if (typeof store === 'string') { await cacheSet(themedKey, store); return { ok: true }; }
  const state = await getAll();
  const themed = await cacheGet(`t:${state.palette}:${url}`);
  if (themed) return { themed, text: '' };
  const raw = await cacheGet('r:' + url);
  if (raw) return { text: raw };
  try {
    const res = await fetch(url, { credentials: 'omit', cache: 'force-cache' });
    if (!res.ok) return { error: res.status };
    const text = await res.text();
    await cacheSet('r:' + url, text);
    return { text };
  } catch (err) { console.warn(TAG, 'fetchSheet failed:', url, err); return { error: String(err) }; }
}

// ── messages ─────────────────────────────────────────────────────────────
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (!msg || sender.id !== chrome.runtime.id) return;
  handle(msg, sender).then(sendResponse).catch((err) => { console.warn(TAG, 'handler failed:', msg.type, err); sendResponse({ error: true }); });
  return true;
});
async function handle(msg, sender) {
  switch (msg.type) {
    case MSG.GET_PAGE_STATE: {
      if (typeof msg.systemDark === 'boolean' && msg.systemDark !== systemDarkCache) {
        systemDarkCache = msg.systemDark;
        const s = await getAll(); if (s.schedule.mode === 'system') await syncRegistration(s);
      }
      return pageStateFor(await getAll(), msg.host || '');
    }
    case MSG.FETCH_SHEET: return fetchSheet(msg.url, msg.store, msg.paletteId);
    case MSG.REPORT_NATIVE_DARK: {
      const s = await getAll();
      const site = siteFor(s, msg.host);
      if (site.nativeDark === !!msg.nativeDark) return { ok: true };
      s.sites[msg.host] = { ...site, nativeDark: !!msg.nativeDark, seen: Date.now() };
      await set({ sites: s.sites });
      await syncRegistration(s);
      return { ok: true };
    }
    case MSG.PAGE_THEMED: {
      if (!sender.tab || sender.frameId !== 0) return { ok: true }; // count top frames only
      const s = await getAll();
      if (s.stats.lastResetDate !== localDate()) { s.stats.pagesToday = 0; s.stats.lastResetDate = localDate(); }
      s.stats.pagesToday++; s.stats.pagesTotal++;
      await set({ stats: s.stats });
      await updateBadge();
      return { ok: true };
    }
    case MSG.GET_STATE: {
      const s = await getAll();
      if (typeof msg.systemDark === 'boolean') systemDarkCache = msg.systemDark;
      const host = msg.host || '';
      return { ...s, host, site: siteFor(s, host), pageState: host ? await pageStateFor(s, host) : null, palettes: DMR.palettes.list() };
    }
    case MSG.SET_GLOBAL: {
      await set(msg.patch || {});
      const s = await getAll();
      await syncRegistration(s); await armScheduleAlarm(s); await updateBadge(); await broadcast(s);
      return { ok: true };
    }
    case MSG.SET_SITE: {
      const s = await getAll();
      s.sites[msg.host] = { ...siteFor(s, msg.host), ...(msg.patch || {}), seen: Date.now() };
      await set({ sites: s.sites });
      await syncRegistration(s); await broadcast(s);
      return { ok: true, site: s.sites[msg.host] };
    }
    case MSG.TOGGLE_SITE: return toggleSite(msg.host);
    case MSG.RESET: {
      await chrome.storage.local.clear();
      await set({ ...DMR.storage.DEFAULTS });
      const s = await getAll();
      await syncRegistration(s); await armScheduleAlarm(s); await updateBadge(); await broadcast(s);
      return { ok: true };
    }
    default: return { error: 'unknown message' };
  }
}
async function toggleSite(host) {
  if (!host) return { ok: false };
  const s = await getAll();
  const site = siteFor(s, host);
  const isOn = s.enabled && scheduleActive(s) && siteActive(s, host);
  s.sites[host] = { ...site, mode: isOn ? 'off' : 'on', seen: Date.now() };
  await set({ sites: s.sites });
  await syncRegistration(s); await broadcast(s);
  return { ok: true, site: s.sites[host] };
}

// ── keyboard command ─────────────────────────────────────────────────────
chrome.commands.onCommand.addListener(async (command) => {
  if (command !== 'toggle-site') return;
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab || !tab.url) return;
    await toggleSite(new URL(tab.url).hostname);
  } catch (err) { console.warn(TAG, 'toggle-site command failed:', err); }
});

// ── lifecycle ────────────────────────────────────────────────────────────
async function boot() {
  const s = await getAll();
  await set(s); // persist defaults
  await syncRegistration(s);
  await armScheduleAlarm(s);
  const daily = await chrome.alarms.get('dmr-daily');
  if (!daily) chrome.alarms.create('dmr-daily', { periodInMinutes: 60 });
  await dailyReset();
}
chrome.runtime.onInstalled.addListener(boot);
chrome.runtime.onStartup.addListener(boot);
