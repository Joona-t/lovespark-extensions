'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULT_STIMS = [
  { id: 'stretch', label: 'Stretch for 30 seconds', icon: '\u{1F9D8}' },
  { id: 'water', label: 'Drink a glass of water', icon: '\u{1F4A7}' },
  { id: 'outside', label: 'Look outside for 1 minute', icon: '\u{1F333}' },
  { id: 'pet', label: 'Pet an animal (or a plushie)', icon: '\u{1F431}' },
  { id: 'song', label: 'Listen to one song', icon: '\u{1F3B5}' },
  { id: 'breathe', label: 'Take 5 deep breaths', icon: '\u{1F32C}\u{FE0F}' },
  { id: 'snack', label: 'Eat a healthy snack', icon: '\u{1F34E}' },
  { id: 'dance', label: 'Dance for 30 seconds', icon: '\u{1F483}' },
  { id: 'doodle', label: 'Doodle something quick', icon: '\u{270F}\u{FE0F}' },
  { id: 'wash', label: 'Wash your face with cold water', icon: '\u{1F9CA}' }
];

const DEFAULTS = {
  stimsToday: 0,
  stimsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  stimLog: [],
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('stimsToday', 'stimsTotal',
  () => LoveSparkBadge.update('isEnabled', 'stimsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'stimsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('stimsToday');
  await LoveSparkBadge.update('isEnabled', 'stimsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('stimsToday');
      const data = await chrome.storage.local.get([
        'stimsToday', 'stimsTotal', 'isEnabled', 'stimLog'
      ]);
      const log = data.stimLog || [];
      const today = LoveSparkStats.todayStr();
      const todayDone = log.filter(e => e.date === today).map(e => e.stimId);
      return {
        stimsToday: data.stimsToday || 0,
        stimsTotal: data.stimsTotal || 0,
        isEnabled: data.isEnabled !== false,
        stims: DEFAULT_STIMS,
        todayDone
      };
    }
    case 'COMPLETE_STIM': {
      const stimId = msg.stimId;
      if (!stimId) return { error: 'Missing stimId' };
      const data = await chrome.storage.local.get('stimLog');
      const log = data.stimLog || [];
      log.push({
        stimId,
        date: LoveSparkStats.todayStr(),
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        ts: Date.now()
      });
      const pruned = log.slice(-500);
      await chrome.storage.local.set({ stimLog: pruned });
      await stats.bump(1);
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'stimsToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
