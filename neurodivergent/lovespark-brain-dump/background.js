'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  dumpsToday: 0,
  dumpsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  thoughts: [],
  theme: 'retro'
};

const TAGS = {
  do:    { emoji: '\u{26A1}', label: 'Do',    color: '#E8457C' },
  think: { emoji: '\u{1F4AD}', label: 'Think', color: '#7C5CBF' },
  feel:  { emoji: '\u{1F496}', label: 'Feel',  color: '#E88745' }
};

const stats = LoveSparkStats.createAccumulator('dumpsToday', 'dumpsTotal',
  () => LoveSparkBadge.update('isEnabled', 'dumpsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'dumpsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('dumpsToday');
  await LoveSparkBadge.update('isEnabled', 'dumpsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('dumpsToday');
      const data = await chrome.storage.local.get([
        'dumpsToday', 'dumpsTotal', 'isEnabled', 'thoughts'
      ]);
      const thoughts = data.thoughts || [];
      const today = LoveSparkStats.todayStr();
      const todayThoughts = thoughts.filter(t => t.date === today);
      return {
        dumpsToday: data.dumpsToday || 0,
        dumpsTotal: data.dumpsTotal || 0,
        isEnabled: data.isEnabled !== false,
        thoughts: todayThoughts,
        totalThoughts: thoughts.length,
        tags: TAGS
      };
    }
    case 'ADD_THOUGHT': {
      const text = (msg.text || '').trim().slice(0, 280);
      if (!text) return { error: 'Empty thought' };
      const tag = TAGS[msg.tag] ? msg.tag : null;
      const data = await chrome.storage.local.get('thoughts');
      const thoughts = data.thoughts || [];
      const thought = {
        text,
        tag,
        date: LoveSparkStats.todayStr(),
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      };
      thoughts.push(thought);
      // Keep 7 days of thoughts
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 7);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      const pruned = thoughts.filter(t => t.date >= cutoffStr);
      await chrome.storage.local.set({ thoughts: pruned });
      await stats.bump(1);
      return { ok: true, thought };
    }
    case 'DELETE_THOUGHT': {
      const data = await chrome.storage.local.get('thoughts');
      const thoughts = (data.thoughts || []).filter(t => t.id !== msg.id);
      await chrome.storage.local.set({ thoughts });
      return { ok: true };
    }
    case 'CLEAR_TODAY': {
      const data = await chrome.storage.local.get('thoughts');
      const today = LoveSparkStats.todayStr();
      const thoughts = (data.thoughts || []).filter(t => t.date !== today);
      await chrome.storage.local.set({ thoughts });
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'dumpsToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
