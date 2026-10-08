'use strict';

LoveSparkTheme.init();

const CUTE_MSGS = ['Jot it down!', 'Notes make you smarter!', 'Stay sparkly!', 'Your brain will thank you!'];
const MAX_NOTE_LENGTH = 10000;
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const toggleEl = document.getElementById('enableToggle');
const statusIcon = document.getElementById('statusIcon');
const domainLabel = document.getElementById('domainLabel');
const cuteMsg = document.getElementById('cuteMsg');
const noteArea = document.getElementById('noteArea');
const saveBtn = document.getElementById('saveBtn');
const deleteBtn = document.getElementById('deleteBtn');
const exportBtn = document.getElementById('exportBtn');
const restoreBtn = document.getElementById('restoreBtn');
const restoreInput = document.getElementById('restoreInput');
const saveStatus = document.getElementById('saveStatus');
const errorStatus = document.getElementById('errorStatus');

let prevToday = 0;
let prevTotal = 0;
let currentUrl = '';
let currentDomain = '';
let isEnabled = true;
let isReady = false;
let statsReady = false;
let togglePending = false;
let statusTimer = null;

function setError(text) {
  errorStatus.textContent = text || '';
}

function showSaveStatus(text) {
  saveStatus.textContent = text || '';
  if (statusTimer) clearTimeout(statusTimer);
  if (text) statusTimer = setTimeout(function() { saveStatus.textContent = ''; }, 2500);
}

function updateControls() {
  const canEdit = isReady && statsReady && isEnabled && !!currentDomain;
  noteArea.disabled = !canEdit;
  saveBtn.disabled = !canEdit;
  deleteBtn.disabled = !canEdit;
  exportBtn.disabled = !isReady;
  restoreBtn.disabled = !canEdit;
  toggleEl.disabled = !statsReady || togglePending;
}

function updateStats(data) {
  if (!data || data.ok === false) {
    statsReady = false;
    updateControls();
    setError((data && data.error) || 'Could not load extension status. Please try again.');
    return;
  }
  statsReady = true;
  isEnabled = data.isEnabled !== false;
  const today = Number(data.notesToday) || 0;
  const total = Number(data.notesTotal) || 0;
  toggleEl.checked = isEnabled;
  statusIcon.classList.toggle('paused', !isEnabled);
  updateControls();
  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);
  prevToday = today;
  prevTotal = total;
}

function send(message) {
  try {
    return Promise.resolve(chrome.runtime.sendMessage(message)).catch(function() {
      return { ok: false, code: 'RUNTIME_ERROR', error: 'The extension could not complete that action. Please try again.' };
    });
  } catch (_) {
    return Promise.resolve({ ok: false, code: 'RUNTIME_ERROR', error: 'The extension could not complete that action. Please try again.' });
  }
}

function markUnavailable(message) {
  currentUrl = '';
  currentDomain = '';
  isReady = false;
  domainLabel.textContent = message || 'This page is unavailable';
  noteArea.value = '';
  updateControls();
}

function loadNote() {
  setError('');
  isReady = false;
  updateControls();
  Promise.resolve(chrome.tabs.query({ active: true, currentWindow: true })).then(function(tabs) {
    const tab = tabs && tabs[0];
    if (!tab || !tab.url) { markUnavailable('No active page'); return null; }
    currentUrl = tab.url;
    return send({ type: 'GET_NOTE', url: currentUrl });
  }).then(function(result) {
    if (!result) return;
    if (result.ok === false) { markUnavailable(result.error); setError(result.error); return; }
    currentDomain = result.domain || '';
    if (!currentDomain) { markUnavailable('This page is unavailable'); return; }
    domainLabel.textContent = currentDomain;
    noteArea.value = result.note || '';
    isReady = true;
    updateControls();
  }).catch(function() {
    markUnavailable('Could not read this page');
    setError('Could not load this note. Please try again.');
  });
}

saveBtn.addEventListener('click', function() {
  if (!isReady || !currentUrl || !isEnabled) return;
  if (noteArea.value.length > MAX_NOTE_LENGTH) { setError('Note is too long (maximum 10,000 characters).'); return; }
  const entered = noteArea.value;
  send({ type: 'SAVE_NOTE', url: currentUrl, note: entered }).then(function(result) {
    if (result && result.ok) { setError(''); showSaveStatus(result.deleted ? 'Note deleted' : 'Saved!'); }
    else setError((result && result.error) || 'Could not save this note. Please try again.');
  });
});

deleteBtn.addEventListener('click', function() {
  if (!isReady || !currentUrl || !isEnabled) return;
  send({ type: 'DELETE_NOTE', url: currentUrl }).then(function(result) {
    if (result && result.ok) { noteArea.value = ''; setError(''); showSaveStatus('Note deleted'); }
    else setError((result && result.error) || 'Could not delete this note. Please try again.');
  });
});

toggleEl.addEventListener('change', function() {
  const requested = toggleEl.checked;
  togglePending = true;
  updateControls();
  send({ type: 'SET_ENABLED', enabled: requested }).then(function(result) {
    togglePending = false;
    if (!result || !result.ok) {
      toggleEl.checked = isEnabled;
      setError((result && result.error) || 'Could not change the enabled state. Please try again.');
      updateControls();
      return;
    }
    isEnabled = requested;
    statusIcon.classList.toggle('paused', !isEnabled);
    setError('');
    updateControls();
  });
});

exportBtn.addEventListener('click', function() {
  if (!isReady) return;
  exportBtn.disabled = true;
  send({ type: 'EXPORT_BACKUP' }).then(function(result) {
    exportBtn.disabled = false;
    if (!result || !result.ok) { setError((result && result.error) || 'Could not create a backup. Please try again.'); return; }
    try {
      const blob = new Blob([result.backup], { type: 'application/json;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'lovespark-site-notes-backup.json';
      link.click();
      setTimeout(function() { URL.revokeObjectURL(url); }, 1000);
      setError('');
      showSaveStatus('Backup downloaded (plaintext)');
    } catch (_) { setError('Could not download the backup. Please try again.'); }
  });
});

restoreBtn.addEventListener('click', function() { if (isEnabled && isReady) restoreInput.click(); });
restoreInput.addEventListener('change', function() {
  const file = restoreInput.files && restoreInput.files[0];
  restoreInput.value = '';
  if (!file || !isEnabled || !isReady) return;
  file.text().then(function(text) {
    return send({ type: 'VALIDATE_BACKUP', backup: text }).then(function(result) { return { text, result }; });
  }).then(function(payload) {
    if (!payload.result || !payload.result.ok) { setError((payload.result && payload.result.error) || 'This backup is invalid. Nothing was changed.'); return; }
    if (!window.confirm('Replace your current notes with ' + payload.result.count + ' notes from this backup?')) { showSaveStatus('Restore cancelled'); return; }
    restoreBtn.disabled = true;
    return send({ type: 'RESTORE_BACKUP', backup: payload.text }).then(function(result) {
      restoreBtn.disabled = false;
      if (!result || !result.ok) { setError((result && result.error) || 'Could not restore the backup. Nothing was changed.'); return; }
      setError('');
      showSaveStatus('Restored ' + result.count + ' notes');
      loadNote();
    });
  }).catch(function() { restoreBtn.disabled = false; setError('Could not read the backup file. Nothing was changed.'); });
});

chrome.storage.onChanged.addListener(function() { send({ type: 'GET_STATS' }).then(updateStats); });
LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
updateControls();
send({ type: 'GET_STATS' }).then(updateStats);
loadNote();
