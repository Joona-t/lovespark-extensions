const pomofocusInput = document.getElementById('pomofocus-id');
const mcUrlInput = document.getElementById('mc-url');
const saveBtn = document.getElementById('save-btn');
const syncBtn = document.getElementById('sync-btn');
const statusEl = document.getElementById('status');

function showStatus(msg, type) {
  statusEl.textContent = msg;
  statusEl.className = 'status ' + (type || '');
}

// Load saved settings
chrome.storage.local.get({ pomofocusId: '', mcUrl: 'http://localhost:3000', lastSyncAt: '', lastSyncStatus: '' }, (data) => {
  pomofocusInput.value = data.pomofocusId;
  mcUrlInput.value = data.mcUrl;
  if (data.lastSyncAt) {
    const time = new Date(data.lastSyncAt).toLocaleTimeString();
    showStatus(`Last sync: ${time} (${data.lastSyncStatus})`, data.lastSyncStatus === 'ok' ? 'ok' : 'err');
  }
});

saveBtn.addEventListener('click', () => {
  const pomofocusId = pomofocusInput.value.trim();
  const mcUrl = mcUrlInput.value.trim() || 'http://localhost:3000';

  chrome.storage.local.set({ pomofocusId, mcUrl }, () => {
    showStatus('Settings saved ✓', 'ok');
  });
});

syncBtn.addEventListener('click', () => {
  showStatus('Syncing...');
  chrome.runtime.sendMessage({ action: 'FORCE_SYNC' }, () => {
    setTimeout(() => {
      chrome.storage.local.get({ lastSyncAt: '', lastSyncStatus: '' }, (data) => {
        if (data.lastSyncAt) {
          const time = new Date(data.lastSyncAt).toLocaleTimeString();
          showStatus(`Synced: ${time} (${data.lastSyncStatus})`, data.lastSyncStatus === 'ok' ? 'ok' : 'err');
        }
      });
    }, 2000);
  });
});
