'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  sentencesReadToday: 0,
  sentencesReadTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  speed: 1.0,
  speedPreset: 'flow',
  voiceURI: '',
  autoScroll: true,
  highlightEnabled: true,
  positions: {},
  theme: 'retro'
};

const CONTENT_SCRIPTS = [
  'content/reader.js',
  'content/speech.js',
  'content/highlighter.js',
  'content/controller.js'
];

// Track which tabs have content scripts injected
const injectedTabs = new Set();

const stats = LoveSparkStats.createAccumulator('sentencesReadToday', 'sentencesReadTotal',
  () => LoveSparkBadge.update('isEnabled', 'sentencesReadToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'sentencesReadToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('sentencesReadToday');
  await LoveSparkBadge.update('isEnabled', 'sentencesReadToday');
});

/**
 * Inject content scripts into a tab if not already injected.
 */
async function ensureContentScripts(tabId) {
  if (injectedTabs.has(tabId)) return true;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: CONTENT_SCRIPTS
    });
    injectedTabs.add(tabId);
    return true;
  } catch (err) {
    console.warn('[LoveSpark Read Aloud] Injection failed:', err.message);
    return false;
  }
}

/**
 * Send a message to content script in a tab, with retry after injection.
 */
async function sendToContent(tabId, message) {
  try {
    return await chrome.tabs.sendMessage(tabId, message);
  } catch (err) {
    // Content script might not be injected yet
    const injected = await ensureContentScripts(tabId);
    if (!injected) return { error: 'Could not inject content scripts.' };
    try {
      return await chrome.tabs.sendMessage(tabId, message);
    } catch (retryErr) {
      return { error: retryErr.message };
    }
  }
}

/**
 * Get the active tab in the current window.
 */
async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

/**
 * Save reading position for a URL. Prune old entries.
 */
async function savePosition(url, index) {
  const data = await chrome.storage.local.get('positions');
  const positions = data.positions || {};
  positions[url] = { sentenceIndex: index, timestamp: Date.now() };

  // Prune: keep max 100 entries, remove older than 30 days
  const maxAge = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const pruned = {};
  const entries = Object.entries(positions)
    .filter(([, v]) => (now - v.timestamp) < maxAge)
    .sort((a, b) => b[1].timestamp - a[1].timestamp)
    .slice(0, 100);
  for (const [k, v] of entries) {
    pruned[k] = v;
  }
  await chrome.storage.local.set({ positions: pruned });
}

/**
 * Get saved reading position for a URL.
 */
async function getPosition(url) {
  const data = await chrome.storage.local.get('positions');
  const positions = data.positions || {};
  return positions[url] || null;
}

// Clean up injected tab tracking when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
});

// Handle keyboard command
chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-reading') {
    const tab = await getActiveTab();
    if (!tab) return;
    await ensureContentScripts(tab.id);
    // Apply saved preferences
    const prefs = await chrome.storage.local.get(['speed', 'speedPreset', 'voiceURI', 'autoScroll', 'highlightEnabled']);
    await sendToContent(tab.id, { type: 'SET_SPEED', speed: prefs.speed || 1.0 });
    if (prefs.voiceURI) await sendToContent(tab.id, { type: 'SET_VOICE', voiceURI: prefs.voiceURI });
    await sendToContent(tab.id, { type: 'SET_AUTO_SCROLL', enabled: prefs.autoScroll !== false });
    await sendToContent(tab.id, { type: 'SET_HIGHLIGHT', enabled: prefs.highlightEnabled !== false });
    await sendToContent(tab.id, { type: 'TOGGLE_PLAY' });
  }
});

// Message handler
LoveSparkLifecycle.setupMessageHandler(async (msg, sender) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('sentencesReadToday');
      return chrome.storage.local.get([
        'sentencesReadToday', 'sentencesReadTotal', 'isEnabled',
        'speed', 'speedPreset', 'voiceURI', 'autoScroll', 'highlightEnabled'
      ]);
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'sentencesReadToday');
      return { ok: true };
    }

    // Content script injection + initialization for popup
    case 'INIT_TAB': {
      const tab = await getActiveTab();
      if (!tab) return { error: 'No active tab.' };
      const injected = await ensureContentScripts(tab.id);
      if (!injected) return { error: 'Cannot read this page (restricted URL).' };

      // Apply preferences
      const prefs = await chrome.storage.local.get(['speed', 'speedPreset', 'voiceURI', 'autoScroll', 'highlightEnabled']);
      await sendToContent(tab.id, { type: 'SET_SPEED', speed: prefs.speed || 1.0 });
      if (prefs.voiceURI) await sendToContent(tab.id, { type: 'SET_VOICE', voiceURI: prefs.voiceURI });
      await sendToContent(tab.id, { type: 'SET_AUTO_SCROLL', enabled: prefs.autoScroll !== false });
      await sendToContent(tab.id, { type: 'SET_HIGHLIGHT', enabled: prefs.highlightEnabled !== false });

      // Initialize reader
      const state = await sendToContent(tab.id, { type: 'INIT_READER' });

      // Restore position if available
      if (state && !state.error) {
        const pos = await getPosition(tab.url);
        if (pos && pos.sentenceIndex > 0) {
          await sendToContent(tab.id, { type: 'RESTORE_POSITION', index: pos.sentenceIndex });
          const updated = await sendToContent(tab.id, { type: 'GET_STATE' });
          return { ...updated, hasResume: true, resumeIndex: pos.sentenceIndex };
        }
      }
      return state;
    }

    // Relay messages from popup to content script
    case 'RELAY_TO_CONTENT': {
      const tab = await getActiveTab();
      if (!tab) return { error: 'No active tab.' };
      return sendToContent(tab.id, msg.payload);
    }

    // Get voices from content script
    case 'GET_VOICES': {
      const tab = await getActiveTab();
      if (!tab) return [];
      return sendToContent(tab.id, { type: 'GET_VOICES' });
    }

    // Stats bump from content script
    case 'BUMP_STAT': {
      await stats.bump(1);
      return { ok: true };
    }

    // Save position from content script
    case 'SAVE_POSITION': {
      await savePosition(msg.url, msg.index);
      return { ok: true };
    }

    // State update from content script (for badge)
    case 'STATE_UPDATE': {
      if (msg.state && msg.state.isPlaying) {
        chrome.action.setBadgeText({ text: '\u25B6' }); // play symbol
        chrome.action.setBadgeBackgroundColor({ color: '#D63466' });
      } else {
        await LoveSparkBadge.update('isEnabled', 'sentencesReadToday');
      }
      return { ok: true };
    }

    // Save preferences
    case 'SAVE_PREFS': {
      const allowed = ['speed', 'speedPreset', 'voiceURI', 'autoScroll', 'highlightEnabled'];
      const toSave = {};
      for (const key of allowed) {
        if (msg.prefs[key] !== undefined) toSave[key] = msg.prefs[key];
      }
      await chrome.storage.local.set(toSave);
      return { ok: true };
    }

    default:
      return { error: 'Unknown message type' };
  }
});
