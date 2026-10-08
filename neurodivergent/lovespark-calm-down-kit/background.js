'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const TECHNIQUES = {
  high: [
    { name: 'Ice Dive Breathing', emoji: '\u{1F9CA}', steps: 'Splash cold water on your face or hold ice. Breathe slowly through your nose for 30 seconds.' },
    { name: 'TIPP: Temperature', emoji: '\u{2744}', steps: 'Hold something cold (ice pack, frozen peas) against your face for 30 seconds. This triggers the dive reflex.' },
    { name: 'Intense Exercise', emoji: '\u{1F3C3}', steps: 'Do 20 jumping jacks, run in place, or push-ups. Burn the adrenaline. Move your body NOW.' },
    { name: 'Paced Breathing', emoji: '\u{1F32C}', steps: 'Breathe in for 4 counts. Hold for 7. Out for 8. Repeat 4 times. Slows your heart rate.' }
  ],
  medium: [
    { name: '5-4-3-2-1 Grounding', emoji: '\u{1F441}', steps: '5 things you see. 4 you can touch. 3 you hear. 2 you smell. 1 you taste.' },
    { name: 'Body Scan', emoji: '\u{1F9D8}', steps: 'Close your eyes. Start at your toes, notice tension. Move up slowly to your head. Breathe into tight spots.' },
    { name: 'Opposite Action', emoji: '\u{1F500}', steps: 'What does the emotion want you to do? Do the opposite. Anger says isolate? Call someone. Fear says hide? Take one step forward.' },
    { name: 'Self-Soothing', emoji: '\u{1F9F8}', steps: 'Wrap in a blanket. Make tea. Pet an animal. Put on a comfort show. Be gentle with yourself.' }
  ],
  low: [
    { name: 'Quick Journal', emoji: '\u{1F4DD}', steps: 'Write 3 sentences: What happened. How I feel. What I need right now.' },
    { name: 'Gratitude Shift', emoji: '\u{1F33B}', steps: 'Name 3 things you are grateful for right now, no matter how small.' },
    { name: 'Mindful Observation', emoji: '\u{1F343}', steps: 'Pick one object near you. Study it for 60 seconds. Notice every detail. Color, texture, weight.' },
    { name: 'Kind Self-Talk', emoji: '\u{1F496}', steps: 'Say to yourself: "This is hard, and I am handling it. I am allowed to feel this. I will be okay."' }
  ]
};

const DEFAULTS = {
  usesToday: 0,
  usesTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('usesToday', 'usesTotal',
  () => LoveSparkBadge.update('isEnabled', 'usesToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'usesToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('usesToday');
  await LoveSparkBadge.update('isEnabled', 'usesToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('usesToday');
      const data = await chrome.storage.local.get(['usesToday', 'usesTotal', 'isEnabled']);
      return { usesToday: data.usesToday || 0, usesTotal: data.usesTotal || 0, isEnabled: data.isEnabled !== false };
    }
    case 'GET_TECHNIQUE': {
      const intensity = parseInt(msg.intensity) || 5;
      let level;
      if (intensity >= 8) level = 'high';
      else if (intensity >= 4) level = 'medium';
      else level = 'low';
      const pool = TECHNIQUES[level];
      const technique = pool[Math.floor(Math.random() * pool.length)];
      await stats.bump(1);
      return { technique, level };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'usesToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
