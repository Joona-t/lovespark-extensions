'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  checksToday: 0,
  checksTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  markers: [
    { label: 'Lunch', time: '12:00' },
    { label: 'End of work', time: '17:00' },
    { label: 'Bedtime', time: '22:00' }
  ],
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('checksToday', 'checksTotal',
  () => LoveSparkBadge.update('isEnabled', 'checksToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'checksToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('checksToday');
  await LoveSparkBadge.update('isEnabled', 'checksToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('checksToday');
      const data = await chrome.storage.local.get([
        'checksToday', 'checksTotal', 'isEnabled', 'markers'
      ]);
      await stats.bump(1);
      return {
        checksToday: (data.checksToday || 0) + 1,
        checksTotal: (data.checksTotal || 0) + 1,
        isEnabled: data.isEnabled !== false,
        markers: data.markers || DEFAULTS.markers
      };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'checksToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
