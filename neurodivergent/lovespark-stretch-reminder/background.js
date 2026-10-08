'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const ALARM_NAME = 'stretch-reminder';

const STRETCHES = [
  { emoji: '\uD83E\uDDD8', text: 'Roll your shoulders back 5 times, then forward 5 times.' },
  { emoji: '\uD83D\uDCAA', text: 'Stand up and reach for the ceiling with both hands. Hold 10 seconds.' },
  { emoji: '\uD83E\uDD38', text: 'Tilt your head slowly to each side. Hold 10 seconds per side.' },
  { emoji: '\uD83D\uDEB6', text: 'Walk around for 1 minute. Get some water while you are up!' },
  { emoji: '\uD83D\uDE4C', text: 'Interlace your fingers and push palms out. Stretch your wrists.' },
  { emoji: '\uD83E\uDDD1\u200D\uD83E\uDD1D\u200D\uD83E\uDDD1', text: 'Stand and twist your torso gently left, then right.' },
  { emoji: '\uD83E\uDDBE', text: 'Extend one arm across your chest. Hold 15 seconds, then switch.' },
  { emoji: '\uD83D\uDC63', text: 'Rise on your toes 10 times. Good for circulation!' },
  { emoji: '\uD83D\uDC40', text: 'Look away from screen. Focus on something 20ft away for 20 seconds.' },
  { emoji: '\uD83E\uDD32', text: 'Open and close your hands 10 times. Shake them out gently.' },
];

const DEFAULTS = {
  stretchToday: 0,
  stretchTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  intervalMinutes: 30,
  lastStretchIdx: -1,
  nextAlarmTime: 0,
};

const stats = LoveSparkStats.createAccumulator('stretchToday', 'stretchTotal',
  () => updateBadgeCountdown());

async function startAlarm() {
  const data = await chrome.storage.local.get(['intervalMinutes', 'isEnabled']);
  if (data.isEnabled === false) {
    await chrome.alarms.clear(ALARM_NAME);
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#666666' });
    return;
  }
  const mins = data.intervalMinutes || 30;
  await chrome.alarms.create(ALARM_NAME, { delayInMinutes: mins, periodInMinutes: mins });
  const nextTime = Date.now() + mins * 60000;
  await chrome.storage.local.set({ nextAlarmTime: nextTime });
  updateBadgeCountdown();
}

async function updateBadgeCountdown() {
  const data = await chrome.storage.local.get(['isEnabled', 'nextAlarmTime']);
  if (data.isEnabled === false) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#666666' });
    return;
  }
  const remaining = Math.max(0, Math.ceil((data.nextAlarmTime - Date.now()) / 60000));
  chrome.action.setBadgeText({ text: remaining > 0 ? remaining + 'm' : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
  try { chrome.action.setBadgeTextColor({ color: '#FFFFFF' }); } catch (e) { /* Firefox */ }
}

function pickStretch(lastIdx) {
  let idx = Math.floor(Math.random() * STRETCHES.length);
  if (idx === lastIdx && STRETCHES.length > 1) {
    idx = (idx + 1) % STRETCHES.length;
  }
  return idx;
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name !== ALARM_NAME) return;
  const data = await chrome.storage.local.get(['isEnabled', 'lastStretchIdx', 'intervalMinutes']);
  if (data.isEnabled === false) return;

  const idx = pickStretch(data.lastStretchIdx);
  const stretch = STRETCHES[idx];
  const mins = data.intervalMinutes || 30;
  const nextTime = Date.now() + mins * 60000;

  await chrome.storage.local.set({ lastStretchIdx: idx, nextAlarmTime: nextTime });
  stats.bump(1);

  // Show notification if available
  try {
    chrome.notifications.create('stretch-' + Date.now(), {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Time to Stretch! ' + stretch.emoji,
      message: stretch.text,
    });
  } catch (e) {
    // notifications permission may not be present -- that is fine
  }
});

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await startAlarm();
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('stretchToday');
  await startAlarm();
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('stretchToday');
      const data = await chrome.storage.local.get([
        'stretchToday', 'stretchTotal', 'isEnabled',
        'intervalMinutes', 'lastStretchIdx', 'nextAlarmTime'
      ]);
      // Include stretch data for popup
      const idx = data.lastStretchIdx >= 0 ? data.lastStretchIdx : pickStretch(-1);
      data.currentStretch = STRETCHES[idx];
      data.stretches = STRETCHES;
      return data;
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await startAlarm();
      return { ok: true };
    }
    case 'SET_INTERVAL': {
      const mins = msg.minutes;
      if (![15, 30, 45, 60].includes(mins)) return { error: 'Invalid interval' };
      await chrome.storage.local.set({ intervalMinutes: mins });
      await startAlarm();
      return { ok: true };
    }
    case 'NEXT_STRETCH': {
      const data = await chrome.storage.local.get(['lastStretchIdx']);
      const idx = pickStretch(data.lastStretchIdx);
      await chrome.storage.local.set({ lastStretchIdx: idx });
      return { ok: true, stretch: STRETCHES[idx] };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
