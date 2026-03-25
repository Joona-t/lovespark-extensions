// LoveSpark Bridge — syncs PomoFocus data to Mission Control
// Polls LoveSpark Focus via EXPORT_STATE and POSTs to MC's /api/study-planner/sync

const DEFAULTS = {
  pomofocusId: '',
  mcUrl: 'http://localhost:3000',
};

const SYNC_INTERVAL_MINUTES = 1;

async function getSettings() {
  const data = await chrome.storage.local.get(DEFAULTS);
  return data;
}

async function syncToMC() {
  const { pomofocusId, mcUrl } = await getSettings();

  if (!pomofocusId) {
    console.log('[Bridge] No PomoFocus ID configured — skipping sync');
    return;
  }

  let exportData = null;
  let available = false;

  try {
    exportData = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(pomofocusId, { action: 'EXPORT_STATE' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
    available = true;
  } catch (err) {
    console.log('[Bridge] PomoFocus unreachable:', err.message);
  }

  const payload = {
    source: 'pomofocus',
    timestamp: new Date().toISOString(),
    available,
    data: exportData,
  };

  try {
    const res = await fetch(`${mcUrl}/api/study-planner/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.log('[Bridge] MC sync failed:', res.status);
    } else {
      console.log('[Bridge] Synced to MC', available ? '(PomoFocus online)' : '(PomoFocus offline)');
    }
  } catch (err) {
    console.log('[Bridge] MC unreachable:', err.message);
  }

  await chrome.storage.local.set({
    lastSyncAt: payload.timestamp,
    lastSyncStatus: available ? 'ok' : 'pomofocus-offline',
  });
}

// Set up recurring alarm
chrome.alarms.create('sync', { periodInMinutes: SYNC_INTERVAL_MINUTES });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'sync') syncToMC();
});

// Sync immediately on install
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(DEFAULTS, (data) => {
    if (!data.pomofocusId) {
      chrome.storage.local.set(DEFAULTS);
    }
  });
  syncToMC();
});

// Sync on startup
chrome.runtime.onStartup.addListener(() => syncToMC());

// Manual sync from popup
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'FORCE_SYNC') syncToMC();
});
