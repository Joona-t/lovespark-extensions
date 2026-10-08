'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const STRETCHES = [
  { name: 'Neck Roll', emoji: '\u{1F9D8}', duration: '30s', steps: 'Slowly roll your head in a circle. 5 times clockwise, 5 times counter-clockwise. Drop shoulders away from ears.' },
  { name: 'Shoulder Shrug', emoji: '\u{1F4AA}', duration: '15s', steps: 'Raise both shoulders to your ears. Hold for 5 seconds. Drop them completely. Repeat 5 times.' },
  { name: 'Wrist Circles', emoji: '\u{270B}', duration: '20s', steps: 'Extend arms forward. Make circles with your wrists — 10 clockwise, 10 counter-clockwise.' },
  { name: 'Seated Twist', emoji: '\u{1F500}', duration: '20s', steps: 'Sit tall. Place right hand on left knee. Twist left. Hold 10 seconds. Switch sides.' },
  { name: 'Standing Stretch', emoji: '\u{1F9CD}', duration: '15s', steps: 'Stand up. Reach both arms overhead. Stretch to the left for 5 seconds, then right.' },
  { name: 'Eye Rest', emoji: '\u{1F441}', duration: '20s', steps: '20-20-20 rule: Look at something 20 feet away for 20 seconds. Blink slowly 5 times.' },
  { name: 'Chest Opener', emoji: '\u{1F64C}', duration: '15s', steps: 'Clasp hands behind your back. Squeeze shoulder blades together. Lift hands slightly. Hold 10 seconds.' },
  { name: 'Ankle Circles', emoji: '\u{1F9B6}', duration: '20s', steps: 'Lift one foot off the floor. Make 10 circles each direction. Switch feet.' },
  { name: 'Deep Breath', emoji: '\u{1F32C}', duration: '30s', steps: 'Breathe in through nose for 4 counts. Hold 4 counts. Out through mouth for 6 counts. Repeat 3 times.' },
  { name: 'Finger Spread', emoji: '\u{1F590}', duration: '10s', steps: 'Spread all fingers as wide as possible. Hold 5 seconds. Make fists. Hold 5 seconds. Repeat 5 times.' },
  { name: 'Hip Opener', emoji: '\u{1FA91}', duration: '20s', steps: 'Cross right ankle over left knee. Lean forward gently. Hold 10 seconds. Switch sides.' },
  { name: 'Wall Push-Up', emoji: '\u{1F9F1}', duration: '20s', steps: 'Stand arm-length from wall. Place palms flat. Do 10 push-ups against the wall. Gets blood flowing!' }
];

const DEFAULTS = {
  stretchesToday: 0,
  stretchesTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  lastStretchIdx: -1,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('stretchesToday', 'stretchesTotal',
  () => LoveSparkBadge.update('isEnabled', 'stretchesToday'));

function pickStretch(lastIdx) {
  let idx;
  do { idx = Math.floor(Math.random() * STRETCHES.length); } while (idx === lastIdx && STRETCHES.length > 1);
  return idx;
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'stretchesToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('stretchesToday');
  await LoveSparkBadge.update('isEnabled', 'stretchesToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('stretchesToday');
      const data = await chrome.storage.local.get(['stretchesToday', 'stretchesTotal', 'isEnabled', 'lastStretchIdx']);
      const idx = pickStretch(data.lastStretchIdx || -1);
      await chrome.storage.local.set({ lastStretchIdx: idx });
      return {
        stretchesToday: data.stretchesToday || 0,
        stretchesTotal: data.stretchesTotal || 0,
        isEnabled: data.isEnabled !== false,
        stretch: STRETCHES[idx]
      };
    }
    case 'NEXT_STRETCH': {
      const data = await chrome.storage.local.get('lastStretchIdx');
      const idx = pickStretch(data.lastStretchIdx || -1);
      await chrome.storage.local.set({ lastStretchIdx: idx });
      return { stretch: STRETCHES[idx] };
    }
    case 'LOG_DONE': {
      await stats.bump(1);
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'stretchesToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
