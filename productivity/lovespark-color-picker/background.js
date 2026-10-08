'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  picksToday: 0,
  picksTotal: 0,
  colorHistory: [],
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
};

const MAX_HISTORY = 10;

const stats = LoveSparkStats.createAccumulator('picksToday', 'picksTotal',
  () => LoveSparkBadge.update('isEnabled', 'picksToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'picksToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('picksToday');
  await LoveSparkBadge.update('isEnabled', 'picksToday');
});

function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return { r, g, b };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('picksToday');
      return chrome.storage.local.get(['picksToday', 'picksTotal', 'isEnabled']);
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'picksToday');
      return { ok: true };
    }
    case 'PICK_COLOR': {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return { error: 'No active tab' };
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            return new Promise((resolve) => {
              if (!window.EyeDropper) {
                resolve({ error: 'EyeDropper API not supported in this browser' });
                return;
              }
              const dropper = new window.EyeDropper();
              dropper.open().then((result) => {
                resolve({ color: result.sRGBHex });
              }).catch(() => {
                resolve({ error: 'Color pick cancelled' });
              });
            });
          },
        });
        const result = results && results[0] && results[0].result;
        if (!result || result.error) {
          return { error: (result && result.error) || 'Pick failed' };
        }
        const hex = result.color;
        const rgb = hexToRgb(hex);
        const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);

        const colorEntry = {
          hex: hex,
          rgb: 'rgb(' + rgb.r + ', ' + rgb.g + ', ' + rgb.b + ')',
          hsl: 'hsl(' + hsl.h + ', ' + hsl.s + '%, ' + hsl.l + '%)',
          timestamp: Date.now(),
        };

        const data = await chrome.storage.local.get(['colorHistory']);
        const history = data.colorHistory || [];
        history.unshift(colorEntry);
        if (history.length > MAX_HISTORY) history.length = MAX_HISTORY;
        await chrome.storage.local.set({ colorHistory: history });

        stats.bump(1);
        return colorEntry;
      } catch (e) {
        return { error: 'Cannot access this page' };
      }
    }
    case 'GET_HISTORY': {
      const data = await chrome.storage.local.get(['colorHistory']);
      return { history: data.colorHistory || [] };
    }
    case 'CLEAR_HISTORY': {
      await chrome.storage.local.set({ colorHistory: [] });
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
