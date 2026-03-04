'use strict';

/**
 * Sensory Shield — Service Worker
 *
 * Handles: default settings init, badge updates, message routing.
 * All state in browser.storage.local. No intervals, no alarms.
 */

const DEFAULT_DOMAIN_SETTINGS = {
  preset: 'calm',
  reduceMotion: true,
  tintEnabled: true,
  tintColor: '#FDCFE1',
  tintOpacity: 0.1,
  hideGifs: true,
  focusRuler: false,
  cursorSize: false,
  fontComfort: false,
};

const PRESETS = {
  calm:  { reduceMotion: true, tintEnabled: true, tintColor: '#FDCFE1', tintOpacity: 0.1, hideGifs: true, focusRuler: false, cursorSize: false, fontComfort: false },
  focus: { reduceMotion: true, tintEnabled: false, tintColor: '#FDCFE1', tintOpacity: 0.1, hideGifs: false, focusRuler: true, cursorSize: false, fontComfort: true },
  full:  { reduceMotion: true, tintEnabled: true, tintColor: '#FDCFE1', tintOpacity: 0.1, hideGifs: true, focusRuler: true, cursorSize: true, fontComfort: true },
};

// ── Install / Startup ───────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async function(details) {
  if (details.reason === 'install') {
    await browser.storage.local.set({
      globalEnabled: true,
      whitelistedDomains: [],
      customPreset: { ...DEFAULT_DOMAIN_SETTINGS, preset: 'custom' },
    });
  }
  chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
  updateBadge();
});

chrome.runtime.onStartup.addListener(function() {
  chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
  updateBadge();
});

// ── Badge ───────────────────────────────────────────────────────────────────

async function updateBadge() {
  const { globalEnabled } = await browser.storage.local.get('globalEnabled');
  const text = globalEnabled !== false ? 'ON' : '';
  chrome.action.setBadgeText({ text: text });
}

browser.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local') return;
  if (changes.globalEnabled) {
    updateBadge();
  }
});

// ── Message Handler ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener(function(msg, sender, sendResponse) {
  handleMessage(msg)
    .then(sendResponse)
    .catch(function(err) { sendResponse({ error: err.message }); });
  return true;
});

async function handleMessage(msg) {
  switch (msg.type) {
    case 'GET_SETTINGS': {
      const data = await browser.storage.local.get(null);
      return data;
    }

    case 'GET_DOMAIN_SETTINGS': {
      const domain = msg.domain;
      const data = await browser.storage.local.get([domain, 'globalEnabled', 'whitelistedDomains']);
      return {
        globalEnabled: data.globalEnabled !== false,
        whitelisted: (data.whitelistedDomains || []).includes(domain),
        domainSettings: data[domain] || null,
      };
    }

    case 'UPDATE_DOMAIN_SETTINGS': {
      const domain = msg.domain;
      const settings = msg.settings;
      await browser.storage.local.set({ [domain]: settings });
      return { ok: true };
    }

    case 'UPDATE_GLOBAL': {
      await browser.storage.local.set(msg.changes);
      return { ok: true };
    }

    case 'GET_PRESETS': {
      return { presets: PRESETS, defaultSettings: DEFAULT_DOMAIN_SETTINGS };
    }

    default:
      return { error: 'Unknown message type: ' + msg.type };
  }
}
