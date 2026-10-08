'use strict';
importScripts('lib/site-notes-store.js', 'lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  notesToday: 0,
  notesTotal: 0,
  siteNotes: {},
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
};

const mutationQueue = { tail: Promise.resolve() };

function queueMutation(operation) {
  // Return failures to callers but keep the tail usable for the next action.
  const result = mutationQueue.tail.then(operation, operation);
  mutationQueue.tail = result.catch(() => undefined);
  return result;
}

function errorResult(code, message) { return { ok: false, code, error: message }; }

function storageFailure(action) {
  return errorResult('STORAGE_ERROR', 'Could not ' + action + '. Your existing notes were preserved. Please try again.');
}

function popupUrl() {
  if (chrome.runtime && typeof chrome.runtime.getURL === 'function') return chrome.runtime.getURL('popup.html');
  return 'chrome-extension://' + chrome.runtime.id + '/popup.html';
}

function isPopupSender(sender) {
  return !!sender && sender.id === chrome.runtime.id && sender.url === popupUrl();
}

function requirePopup(sender) {
  return isPopupSender(sender) ? null : errorResult('UNAUTHORIZED', 'This action is available only from the extension popup.');
}

async function restrictStorageToTrustedContexts() {
  try {
    if (chrome.storage.local && typeof chrome.storage.local.setAccessLevel === 'function') {
      await chrome.storage.local.setAccessLevel({ accessLevel: 'TRUSTED_CONTEXTS' });
    }
  } catch (_) { /* optional in Firefox and older Chromium */ }
}

async function init() {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  await restrictStorageToTrustedContexts();
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'notesToday');
}

if (chrome.runtime.onInstalled) chrome.runtime.onInstalled.addListener(() => init().catch(() => undefined));
if (chrome.runtime.onStartup) chrome.runtime.onStartup.addListener(() => {
  LoveSparkStats.checkDailyReset('notesToday').then(() => LoveSparkBadge.update('isEnabled', 'notesToday')).catch(() => undefined);
});

function unsupportedPage() { return errorResult('UNSUPPORTED_PAGE', 'This page is unavailable. Open an ordinary HTTP(S) page and try again.'); }

function safeHostname(url) {
  try { return SiteNotesStore.hostnameFromUrl(url); } catch (_) { return ''; }
}

function parseBackup(text) {
  try { return { ok: true, value: SiteNotesStore.parseBackup(text) }; }
  catch (error) { return { ok: false, code: 'INVALID_BACKUP', error: error.message }; }
}

async function readNotes() {
  const data = await chrome.storage.local.get(['siteNotes']);
  const result = SiteNotesStore.validateNotes(data.siteNotes === undefined ? {} : data.siteNotes);
  if (!result.ok) {
    const err = new Error(result.error);
    err.code = 'INVALID_STORAGE';
    throw err;
  }
  return result.notes;
}

async function readEnabled() {
  const data = await chrome.storage.local.get(['isEnabled']);
  return data.isEnabled !== false;
}

async function readStats() {
  const data = await chrome.storage.local.get(['notesToday', 'notesTotal', 'isEnabled', 'lastResetDate']);
  const today = LoveSparkStats.todayStr();
  if (data.lastResetDate !== today) {
    await chrome.storage.local.set({ notesToday: 0, lastResetDate: today });
    return { notesToday: 0, notesTotal: Number(data.notesTotal) || 0, isEnabled: data.isEnabled !== false };
  }
  return { notesToday: Number(data.notesToday) || 0, notesTotal: Number(data.notesTotal) || 0, isEnabled: data.isEnabled !== false };
}

function failureFrom(error, action) {
  if (error && error.code === 'INVALID_STORAGE') return errorResult('INVALID_STORAGE', 'Stored notes are invalid. Nothing was changed.');
  if (error && error.code && error.error) return errorResult(error.code, error.error);
  return storageFailure(action);
}

async function handleMessage(msg, sender) {
  const type = msg && msg.type;
  const supported = ['GET_STATS', 'GET_NOTE', 'GET_ALL_NOTES', 'EXPORT_BACKUP', 'VALIDATE_BACKUP', 'SAVE_NOTE', 'DELETE_NOTE', 'RESTORE_BACKUP', 'SET_ENABLED'];
  if (!supported.includes(type)) return errorResult('UNKNOWN_MESSAGE', 'Unknown message type.');
  const auth = requirePopup(sender);
  if (auth) return auth;

  try {
    switch (type) {
      case 'GET_STATS': return { ok: true, ...(await readStats()) };
      case 'SET_ENABLED':
        return await queueMutation(async () => {
          await chrome.storage.local.set({ isEnabled: msg.enabled === true });
          try { await LoveSparkBadge.update('isEnabled', 'notesToday'); } catch (_) { /* non-critical */ }
          return { ok: true, isEnabled: msg.enabled === true };
        }).catch(() => storageFailure('save your enabled state'));
      case 'GET_NOTE': {
        const domain = safeHostname(msg.url);
        if (!domain) return { ...unsupportedPage(), note: '', domain: '' };
        const notes = await readNotes();
        return { ok: true, note: Object.prototype.hasOwnProperty.call(notes, domain) ? notes[domain] : '', domain };
      }
      case 'GET_ALL_NOTES': return { ok: true, notes: await readNotes() };
      case 'EXPORT_BACKUP': {
        const backup = SiteNotesStore.createBackup(await readNotes());
        return { ok: true, backup: backup.text, bytes: SiteNotesStore.utf8Length(backup.text), count: Object.keys(backup.backup.notes).length };
      }
      case 'VALIDATE_BACKUP': {
        if (!(await readEnabled())) return errorResult('PAUSED', 'Notes are paused. Re-enable notes to restore a backup.');
        const backup = parseBackup(msg.backup);
        return backup.ok ? { ok: true, count: Object.keys(backup.value.notes).length } : backup;
      }
      case 'SAVE_NOTE':
        return await queueMutation(async () => {
          if (!(await readEnabled())) return errorResult('PAUSED', 'Notes are paused. Re-enable notes to edit notes.');
          const domain = safeHostname(msg.url);
          if (!domain) return unsupportedPage();
          const current = await readNotes();
          const next = SiteNotesStore.putNote(current, domain, msg.note);
          if (!next.ok) return next;
          if (JSON.stringify(current) === JSON.stringify(next.notes)) return { ok: true, domain, isNew: false, deleted: !Object.prototype.hasOwnProperty.call(next.notes, domain) };
          const patch = { siteNotes: next.notes };
          if (next.isNew) {
            const stats = await chrome.storage.local.get(['notesToday', 'notesTotal', 'lastResetDate']);
            const today = LoveSparkStats.todayStr();
            patch.notesToday = (stats.lastResetDate === today ? Number(stats.notesToday) || 0 : 0) + 1;
            patch.notesTotal = (Number(stats.notesTotal) || 0) + 1;
            patch.lastResetDate = today;
          }
          await chrome.storage.local.set(patch);
          try { await LoveSparkBadge.update('isEnabled', 'notesToday'); } catch (_) { /* non-critical */ }
          return { ok: true, domain, isNew: next.isNew, deleted: next.deleted };
        }).catch((error) => failureFrom(error, 'save your note'));
      case 'DELETE_NOTE':
        return await queueMutation(async () => {
          if (!(await readEnabled())) return errorResult('PAUSED', 'Notes are paused. Re-enable notes to delete notes.');
          const domain = safeHostname(msg.url);
          if (!domain) return unsupportedPage();
          const current = await readNotes();
          if (!Object.prototype.hasOwnProperty.call(current, domain)) return { ok: true, domain, deleted: false };
          const next = Object.assign({}, current);
          delete next[domain];
          const valid = SiteNotesStore.validateNotes(next);
          if (!valid.ok) return valid;
          await chrome.storage.local.set({ siteNotes: valid.notes });
          return { ok: true, domain, deleted: true };
        }).catch((error) => failureFrom(error, 'delete your note'));
      case 'RESTORE_BACKUP':
        return await queueMutation(async () => {
          if (!(await readEnabled())) return errorResult('PAUSED', 'Notes are paused. Re-enable notes to restore a backup.');
          const backup = parseBackup(msg.backup);
          if (!backup.ok) return backup;
          // Restore changes only siteNotes in one successful storage write.
          await chrome.storage.local.set({ siteNotes: backup.value.notes });
          return { ok: true, count: Object.keys(backup.value.notes).length };
        }).catch((error) => failureFrom(error, 'restore your backup'));
    }
  } catch (error) {
    if (error && error.code === 'INVALID_STORAGE') return errorResult('INVALID_STORAGE', 'Stored notes are invalid. Nothing was changed.');
    return storageFailure('complete that action');
  }
}

LoveSparkLifecycle.setupMessageHandler(handleMessage);
if (typeof globalThis !== 'undefined') globalThis.SiteNotesWorker = { queueMutation, handleMessage, isPopupSender };
