'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  logsToday: 0,
  logsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  energyLogs: [],
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('logsToday', 'logsTotal',
  () => LoveSparkBadge.update('isEnabled', 'logsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'logsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('logsToday');
  await LoveSparkBadge.update('isEnabled', 'logsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('logsToday');
      const data = await chrome.storage.local.get([
        'logsToday', 'logsTotal', 'isEnabled', 'energyLogs'
      ]);
      const logs = data.energyLogs || [];
      const today = LoveSparkStats.todayStr();
      const todayLogs = logs.filter(l => l.date === today);
      const avgToday = todayLogs.length > 0
        ? Math.round(todayLogs.reduce((s, l) => s + l.level, 0) / todayLogs.length * 10) / 10
        : 0;
      return {
        logsToday: data.logsToday || 0,
        logsTotal: data.logsTotal || 0,
        isEnabled: data.isEnabled !== false,
        todayLogs,
        avgToday
      };
    }
    case 'LOG_ENERGY': {
      const level = Math.max(1, Math.min(5, Math.round(msg.level)));
      const data = await chrome.storage.local.get('energyLogs');
      const logs = data.energyLogs || [];
      const entry = {
        level,
        date: LoveSparkStats.todayStr(),
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        ts: Date.now()
      };
      logs.push(entry);
      const pruned = logs.slice(-500);
      await chrome.storage.local.set({ energyLogs: pruned });
      await stats.bump(1);
      return { ok: true, entry };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'logsToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
