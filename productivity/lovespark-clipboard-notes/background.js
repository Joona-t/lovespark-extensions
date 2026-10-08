'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const RETENTION_DAYS = 7;

const DEFAULTS = {
  clipNotes: [],
  clipNotesToday: 0,
  clipNotesTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
};

const stats = LoveSparkStats.createAccumulator('clipNotesToday', 'clipNotesTotal',
  () => LoveSparkBadge.update('isEnabled', 'clipNotesToday'));

function pruneExpired(notes) {
  const cutoff = Date.now() - (RETENTION_DAYS * 24 * 60 * 60 * 1000);
  return notes.filter(n => new Date(n.createdAt).getTime() > cutoff);
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'clipNotesToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('clipNotesToday');
  await LoveSparkBadge.update('isEnabled', 'clipNotesToday');
  // Prune on startup
  const data = await chrome.storage.local.get(['clipNotes']);
  const pruned = pruneExpired(data.clipNotes || []);
  await chrome.storage.local.set({ clipNotes: pruned });
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('clipNotesToday');
      const data = await chrome.storage.local.get([
        'clipNotesToday', 'clipNotesTotal', 'isEnabled', 'clipNotes'
      ]);
      const pruned = pruneExpired(data.clipNotes || []);
      if (pruned.length !== (data.clipNotes || []).length) {
        await chrome.storage.local.set({ clipNotes: pruned });
      }
      return {
        clipNotesToday: data.clipNotesToday || 0,
        clipNotesTotal: data.clipNotesTotal || 0,
        isEnabled: data.isEnabled,
        clipNotes: pruned,
      };
    }
    case 'ADD_NOTE': {
      const text = (msg.text || '').trim();
      if (!text) return { error: 'Empty text' };
      const data = await chrome.storage.local.get(['clipNotes']);
      const notes = pruneExpired(data.clipNotes || []);
      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text: text,
        createdAt: new Date().toISOString(),
      };
      notes.unshift(entry);
      await chrome.storage.local.set({ clipNotes: notes });
      stats.bump(1);
      return { ok: true, entry };
    }
    case 'DELETE_NOTE': {
      const data = await chrome.storage.local.get(['clipNotes']);
      const notes = (data.clipNotes || []).filter(n => n.id !== msg.id);
      await chrome.storage.local.set({ clipNotes: notes });
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'clipNotesToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
