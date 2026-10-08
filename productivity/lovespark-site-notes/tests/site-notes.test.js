'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const store = require('../lib/site-notes-store.js');

const ROOT = path.resolve(__dirname, '..');
const POPUP_SENDER = { id: 'test-extension', url: 'chrome-extension://test-extension/popup.html' };

function snapshot(value) { return JSON.parse(JSON.stringify(value)); }

function workerHarness(initial) {
  const data = Object.assign(Object.create(null), initial || {});
  if (data.siteNotes && Object.getPrototypeOf(data.siteNotes) !== null) {
    data.siteNotes = Object.assign(Object.create(null), data.siteNotes);
  }
  const events = Object.create(null);
  const trace = [];
  const controls = { failGet: 0, failSet: 0, getDelayMs: 0 };
  function event(name) { return { addListener(listener) { events[name] = listener; } }; }
  const chrome = {
    runtime: {
      id: 'test-extension', getURL: (file) => 'chrome-extension://test-extension/' + file,
      onInstalled: event('installed'), onStartup: event('startup'), onMessage: event('message'),
    },
    storage: {
      local: {
        async get(keys) {
          trace.push({ op: 'get', keys: [...keys] });
          if (controls.failGet > 0) { controls.failGet -= 1; throw new Error('injected get rejection'); }
          if (controls.getDelayMs) await new Promise((resolve) => setTimeout(resolve, controls.getDelayMs));
          const out = {};
          for (const key of keys) out[key] = data[key];
          return out;
        },
        async set(values) {
          trace.push({ op: 'set', values: snapshot(values) });
          if (controls.failSet > 0) { controls.failSet -= 1; throw new Error('injected set rejection'); }
          Object.assign(data, values);
        },
        async setAccessLevel(value) { trace.push({ op: 'access', value: snapshot(value) }); },
      },
      onChanged: event('storageChanged'),
    },
    action: { setBadgeText() {}, setBadgeBackgroundColor() {}, setBadgeTextColor() {} },
  };
  const context = vm.createContext({ chrome, Promise, URL, TextEncoder, Date, setTimeout, clearTimeout, console });
  context.globalThis = context;
  context.importScripts = (...files) => files.forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  });
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'background.js'), 'utf8'), context, { filename: 'background.js' });
  const send = (message, sender = POPUP_SENDER) => context.SiteNotesWorker.handleMessage(message, sender);
  return { controls, data, events, send, trace, worker: context.SiteNotesWorker };
}

test('URL handling is canonical, hostname-scoped, and HTTP(S)-only', () => {
  assert.equal(store.hostnameFromUrl('https://Example.COM/a'), 'example.com');
  assert.equal(store.hostnameFromUrl('http://example.com/other'), 'example.com');
  assert.equal(store.hostnameFromUrl('https://sub.example.com:8443/a'), 'sub.example.com');
  assert.throws(() => store.hostnameFromUrl('chrome://settings'), store.ValidationError);
  assert.throws(() => store.hostnameFromUrl('file:///tmp/note'), store.ValidationError);
  assert.throws(() => store.canonicalHostname('Example.COM'), store.ValidationError);
  assert.throws(() => store.canonicalHostname('__proto__'), store.ValidationError);
  assert.throws(() => store.canonicalHostname('example.com/path'), store.ValidationError);
});

test('note, count, aggregate, encoded-backup, and prototype boundaries fail closed', () => {
  assert.equal(store.validateNote('x'.repeat(store.MAX_NOTE_LENGTH)).length, store.MAX_NOTE_LENGTH);
  assert.throws(() => store.validateNote('x'.repeat(store.MAX_NOTE_LENGTH + 1)), store.ValidationError);
  const atCount = Object.create(null);
  for (let index = 0; index < store.MAX_NOTE_COUNT; index += 1) atCount['h' + index + '.example'] = '';
  assert.equal(Object.keys(store.validateNotesMap(atCount)).length, store.MAX_NOTE_COUNT);
  atCount['overflow.example'] = '';
  assert.throws(() => store.validateNotesMap(atCount), /count/);
  const atAggregate = Object.create(null);
  for (let index = 0; index < 100; index += 1) atAggregate['a' + index + '.example'] = 'x'.repeat(10000);
  assert.equal(Object.keys(store.validateNotesMap(atAggregate)).length, 100);
  atAggregate['over.example'] = 'x';
  assert.throws(() => store.validateNotesMap(atAggregate), /aggregate/);
  const escaped = Object.create(null);
  for (let index = 0; index < 100; index += 1) escaped['e' + index + '.example'] = '\u0000'.repeat(10000);
  assert.throws(() => store.validateNotesMap(escaped), /Backup exceeds/);
  assert.throws(() => store.validateNotesMap([]), /corrupt/);
  assert.throws(() => store.validateNotesMap(Object.assign(Object.create({ inherited: 'secret' }), { 'ok.example': 'ok' })), /corrupt/);
  assert.throws(() => store.validateNotesMap(JSON.parse('{"__proto__":"bad"}')), /Invalid hostname/);
});

test('versioned backup is sorted, exact for Unicode/multiline text, and strict', () => {
  const notes = { 'z.example': 'line 1\nline 2 😀', 'a.example': 'åäö' };
  const created = store.createBackup(notes, '2026-01-01T00:00:00.000Z');
  assert.ok(created.text.indexOf('a.example') < created.text.indexOf('z.example'));
  assert.deepEqual({ ...store.parseBackup(created.text).notes }, { 'a.example': 'åäö', 'z.example': 'line 1\nline 2 😀' });
  assert.throws(() => store.parseBackup('x'.repeat(store.MAX_BACKUP_BYTES + 1)), /size/);
  assert.throws(() => store.parseBackup('{not json'), /valid JSON/);
  assert.throws(() => store.parseBackup(JSON.stringify({ format: store.FORMAT, version: 2, exportedAt: '2026-01-01T00:00:00.000Z', notes: {} })), /version/);
  assert.throws(() => store.parseBackup(JSON.stringify({ format: store.FORMAT, version: 1, exportedAt: 'yesterday', notes: {} })), /timestamp/);
  assert.throws(() => store.parseBackup(JSON.stringify({ format: store.FORMAT, version: 1, exportedAt: '2026-01-01T00:00:00.000Z', notes: {}, extra: true })), /schema/);
});

test('worker CRUD persists by hostname and preserves counter lifecycle', async () => {
  const h = workerHarness({ theme: 'slate' });
  assert.equal((await h.send({ type: 'SAVE_NOTE', url: 'https://a.example/one', note: 'A' })).ok, true);
  assert.equal(h.data.notesToday, 1);
  assert.equal(h.data.notesTotal, 1);
  assert.equal((await h.send({ type: 'GET_NOTE', url: 'http://a.example/two' })).note, 'A');
  await h.send({ type: 'SAVE_NOTE', url: 'https://a.example/edit', note: 'A2' });
  assert.equal(h.data.notesToday, 1);
  assert.equal(h.data.notesTotal, 1);
  await h.send({ type: 'SAVE_NOTE', url: 'https://b.example/', note: 'B' });
  assert.equal(h.data.notesTotal, 2);
  assert.equal((await h.send({ type: 'GET_NOTE', url: 'https://a.example/' })).note, 'A2');
  assert.equal((await h.send({ type: 'GET_NOTE', url: 'https://b.example/' })).note, 'B');
  await h.send({ type: 'DELETE_NOTE', url: 'https://a.example/' });
  assert.equal(h.data.notesTotal, 2);
  assert.equal((await h.send({ type: 'GET_NOTE', url: 'https://a.example/' })).note, '');
  await h.send({ type: 'SAVE_NOTE', url: 'https://a.example/', note: 'A3' });
  assert.equal(h.data.notesTotal, 3);
  assert.equal(h.data.theme, 'slate');
});

test('pause allows read/export, blocks mutations, and re-enables without data loss', async () => {
  const h = workerHarness({ siteNotes: { 'a.example': 'A' }, isEnabled: true, marker: 7 });
  await h.send({ type: 'SET_ENABLED', enabled: false });
  assert.equal((await h.send({ type: 'GET_NOTE', url: 'https://a.example/' })).note, 'A');
  assert.equal((await h.send({ type: 'EXPORT_BACKUP' })).ok, true);
  const before = snapshot(h.data);
  assert.equal((await h.send({ type: 'SAVE_NOTE', url: 'https://a.example/', note: 'changed' })).code, 'PAUSED');
  assert.equal((await h.send({ type: 'DELETE_NOTE', url: 'https://a.example/' })).code, 'PAUSED');
  const backup = store.createBackup({ 'b.example': 'B' }, '2026-01-01T00:00:00.000Z').text;
  assert.equal((await h.send({ type: 'VALIDATE_BACKUP', backup })).code, 'PAUSED');
  assert.equal((await h.send({ type: 'RESTORE_BACKUP', backup })).code, 'PAUSED');
  assert.deepEqual(snapshot(h.data), before);
  await h.send({ type: 'SET_ENABLED', enabled: true });
  assert.equal((await h.send({ type: 'SAVE_NOTE', url: 'https://a.example/', note: 'changed' })).ok, true);
});

test('corrupt storage blocks CRUD/export without mutation but valid restore recovers it', async () => {
  const h = workerHarness({ siteNotes: { 'bad path': 'secret' }, theme: 'retro', isEnabled: true });
  const before = snapshot(h.data);
  assert.equal((await h.send({ type: 'GET_NOTE', url: 'https://a.example/' })).code, 'INVALID_STORAGE');
  assert.equal((await h.send({ type: 'SAVE_NOTE', url: 'https://a.example/', note: 'A' })).code, 'INVALID_STORAGE');
  assert.equal((await h.send({ type: 'DELETE_NOTE', url: 'https://a.example/' })).code, 'INVALID_STORAGE');
  assert.equal((await h.send({ type: 'EXPORT_BACKUP' })).code, 'INVALID_STORAGE');
  assert.deepEqual(snapshot(h.data), before);
  const backup = store.createBackup({ 'a.example': 'Recovered' }, '2026-01-01T00:00:00.000Z').text;
  assert.deepEqual(snapshot(await h.send({ type: 'VALIDATE_BACKUP', backup })), { ok: true, count: 1 });
  assert.deepEqual(snapshot(await h.send({ type: 'RESTORE_BACKUP', backup })), { ok: true, count: 1 });
  assert.equal((await h.send({ type: 'GET_NOTE', url: 'https://a.example/' })).note, 'Recovered');
  assert.equal(h.data.theme, 'retro');
});

test('restore validates before one-key atomic replacement and recovers after set rejection', async () => {
  const h = workerHarness({ siteNotes: { 'old.example': 'Old' }, notesTotal: 4, theme: 'beige', isEnabled: true });
  const backup = store.createBackup({ 'new.example': 'New' }, '2026-01-01T00:00:00.000Z').text;
  const before = snapshot(h.data);
  assert.equal((await h.send({ type: 'RESTORE_BACKUP', backup: '{bad' })).code, 'INVALID_BACKUP');
  assert.deepEqual(snapshot(h.data), before);
  h.controls.failSet = 1;
  assert.equal((await h.send({ type: 'RESTORE_BACKUP', backup })).code, 'STORAGE_ERROR');
  assert.deepEqual(snapshot(h.data), before);
  const setTraceBefore = h.trace.filter((entry) => entry.op === 'set').length;
  assert.deepEqual(snapshot(await h.send({ type: 'RESTORE_BACKUP', backup })), { ok: true, count: 1 });
  const restoreSets = h.trace.filter((entry) => entry.op === 'set').slice(setTraceBefore);
  assert.equal(restoreSets.length, 1);
  assert.deepEqual(Object.keys(restoreSets[0].values), ['siteNotes']);
  assert.equal(h.data.notesTotal, 4);
  assert.equal(h.data.theme, 'beige');
});

test('storage get/set failures preserve data and do not poison serialized mutations', async () => {
  const h = workerHarness({ siteNotes: { 'old.example': 'Old' }, isEnabled: true, marker: 'keep' });
  let before = snapshot(h.data);
  h.controls.failGet = 1;
  assert.equal((await h.send({ type: 'SAVE_NOTE', url: 'https://a.example/', note: 'A' })).code, 'STORAGE_ERROR');
  assert.deepEqual(snapshot(h.data), before);
  assert.equal((await h.send({ type: 'SAVE_NOTE', url: 'https://a.example/', note: 'A' })).ok, true);
  before = snapshot(h.data);
  h.controls.failSet = 1;
  const failed = await h.send({ type: 'SAVE_NOTE', url: 'https://b.example/', note: 'B' });
  assert.equal(failed.code, 'STORAGE_ERROR');
  assert.match(failed.error, /save your note/);
  assert.deepEqual(snapshot(h.data), before);
  assert.equal((await h.send({ type: 'SAVE_NOTE', url: 'https://b.example/', note: 'B' })).ok, true);
  assert.equal(h.data.siteNotes['a.example'], 'A');
  assert.equal(h.data.siteNotes['b.example'], 'B');
});

test('concurrent mutations are serialized and retain unrelated hosts', async () => {
  const h = workerHarness({ siteNotes: {}, isEnabled: true });
  h.controls.getDelayMs = 5;
  const [first, second] = await Promise.all([
    h.send({ type: 'SAVE_NOTE', url: 'https://a.example/', note: 'A' }),
    h.send({ type: 'SAVE_NOTE', url: 'https://b.example/', note: 'B' }),
  ]);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.deepEqual(snapshot(h.data.siteNotes), { 'a.example': 'A', 'b.example': 'B' });
});

test('only the exact popup is authorized and install restricts local storage', async () => {
  const h = workerHarness();
  assert.equal((await h.send({ type: 'GET_ALL_NOTES' }, { id: 'test-extension', url: 'https://page.example/', tab: { id: 1 } })).code, 'UNAUTHORIZED');
  assert.equal((await h.send({ type: 'GET_ALL_NOTES' }, { id: 'test-extension', url: POPUP_SENDER.url + '?spoof' })).code, 'UNAUTHORIZED');
  assert.equal((await h.send({ type: 'GET_ALL_NOTES' }, { id: 'other-extension', url: POPUP_SENDER.url })).code, 'UNAUTHORIZED');
  h.events.installed();
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.ok(h.trace.some((entry) => entry.op === 'access' && entry.value.accessLevel === 'TRUSTED_CONTEXTS'));
  assert.deepEqual(snapshot(h.data.siteNotes), {});
});

test('manifest and popup preserve least privilege, locality, and accessible recovery', () => {
  const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'manifest.json'), 'utf8'));
  assert.equal(manifest.manifest_version, 3);
  assert.deepEqual(manifest.permissions, ['storage', 'activeTab']);
  assert.equal(Object.prototype.hasOwnProperty.call(manifest, 'host_permissions'), false);
  assert.match(manifest.browser_specific_settings.gecko.data_collection_permissions.justification, /stores notes and hostnames locally/);
  assert.match(manifest.browser_specific_settings.gecko.data_collection_permissions.justification, /does not collect or transmit/);
  const html = fs.readFileSync(path.join(ROOT, 'popup.html'), 'utf8');
  const popup = fs.readFileSync(path.join(ROOT, 'popup.js'), 'utf8');
  const worker = fs.readFileSync(path.join(ROOT, 'background.js'), 'utf8');
  assert.match(html, /maxlength="10000"/);
  assert.match(html, /role="alert"/);
  assert.match(html, /Backups are plaintext/);
  assert.match(html, /Download backup/);
  assert.match(html, /Restore backup/);
  assert.doesNotMatch(popup + worker, /fetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon|storage\.sync|console\.(?:log|info|debug)/);
  assert.doesNotMatch(popup, /innerHTML|insertAdjacentHTML/);
});
