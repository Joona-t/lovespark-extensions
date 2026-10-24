'use strict';

LoveSparkTheme.init();

// DOM refs
const articleTitle = document.getElementById('articleTitle');
const articleByline = document.getElementById('articleByline');
const errorBox = document.getElementById('errorBox');
const errorText = document.getElementById('errorText');
const resumeBox = document.getElementById('resumeBox');
const resumeYes = document.getElementById('resumeYes');
const resumeNo = document.getElementById('resumeNo');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const btnPrev = document.getElementById('btnPrev');
const btnPlayPause = document.getElementById('btnPlayPause');
const playIcon = document.getElementById('playIcon');
const btnNext = document.getElementById('btnNext');
const btnStop = document.getElementById('btnStop');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const voiceSelect = document.getElementById('voiceSelect');
const autoScrollToggle = document.getElementById('autoScrollToggle');
const highlightToggle = document.getElementById('highlightToggle');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;
let totalSentences = 0;
let currentState = {};
let resumeIndex = 0;

// ── Footer ──────────────────────────────────
if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

// ── Safe message to background ──────────────
async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Read Aloud] sendBg error:', err.message);
    return null;
  }
}

// ── Relay message to content via background ─
async function relay(payload) {
  return sendBg({ type: 'RELAY_TO_CONTENT', payload });
}

// ── Update UI from reader state ─────────────
function updateReaderUI(state) {
  if (!state) return;
  currentState = state;

  if (state.error) {
    errorBox.hidden = false;
    errorText.textContent = state.error;
    setControlsEnabled(false);
    return;
  }

  errorBox.hidden = true;

  if (state.title) {
    articleTitle.textContent = state.title;
  }
  if (state.byline) {
    articleByline.textContent = 'by ' + state.byline;
  }

  totalSentences = state.totalSentences || 0;
  const idx = state.currentIndex || 0;
  const pct = totalSentences > 0 ? Math.round((idx / totalSentences) * 100) : 0;

  progressBar.style.width = pct + '%';
  progressBar.setAttribute('aria-valuenow', pct);
  progressText.textContent = idx + ' / ' + totalSentences;

  // Play/pause icon
  if (state.isPlaying) {
    playIcon.textContent = '\u275A\u275A'; // pause
    btnPlayPause.setAttribute('aria-label', 'Pause');
  } else {
    playIcon.textContent = '\u25B6'; // play
    btnPlayPause.setAttribute('aria-label', 'Play');
  }

  // Speed
  if (state.speed) {
    speedSlider.value = state.speed;
    speedValue.textContent = state.speed.toFixed(1) + 'x';
  }

  setControlsEnabled(totalSentences > 0);
}

function setControlsEnabled(enabled) {
  btnPrev.disabled = !enabled;
  btnNext.disabled = !enabled;
  btnStop.disabled = !enabled;
  btnPlayPause.disabled = !enabled;
}

// ── Update stats ────────────────────────────
function updateStats(data) {
  const today = data.sentencesReadToday || 0;
  const total = data.sentencesReadTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  // Restore prefs to UI
  if (data.autoScroll !== undefined) autoScrollToggle.checked = data.autoScroll !== false;
  if (data.highlightEnabled !== undefined) highlightToggle.checked = data.highlightEnabled !== false;
  if (data.speed !== undefined) {
    speedSlider.value = data.speed;
    speedValue.textContent = Number(data.speed).toFixed(1) + 'x';
  }
  if (data.speedPreset) {
    updatePresetButtons(data.speedPreset);
  }
}

function updatePresetButtons(preset) {
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === preset);
  });
}

// ── Populate voice list ─────────────────────
async function loadVoices() {
  const voices = await sendBg({ type: 'GET_VOICES' });
  if (!voices || !Array.isArray(voices)) return;

  voiceSelect.textContent = ''; // Clear — no innerHTML per KI-011
  const defaultOpt = document.createElement('option');
  defaultOpt.value = '';
  defaultOpt.textContent = 'Default';
  voiceSelect.appendChild(defaultOpt);

  for (const v of voices) {
    const opt = document.createElement('option');
    opt.value = v.voiceURI;
    opt.textContent = v.name + ' (' + v.lang + ')';
    voiceSelect.appendChild(opt);
  }

  // Restore saved voice
  const data = await chrome.storage.local.get('voiceURI');
  if (data.voiceURI) {
    voiceSelect.value = data.voiceURI;
  }
}

// ── Event listeners ─────────────────────────

btnPlayPause.addEventListener('click', async () => {
  const state = await relay({ type: 'TOGGLE_PLAY' });
  updateReaderUI(state);
});

btnPrev.addEventListener('click', async () => {
  const state = await relay({ type: 'SKIP_BACKWARD' });
  updateReaderUI(state);
});

btnNext.addEventListener('click', async () => {
  const state = await relay({ type: 'SKIP_FORWARD' });
  updateReaderUI(state);
});

btnStop.addEventListener('click', async () => {
  const state = await relay({ type: 'STOP' });
  updateReaderUI(state);
});

speedSlider.addEventListener('input', () => {
  const val = parseFloat(speedSlider.value);
  speedValue.textContent = val.toFixed(1) + 'x';
  // Find matching preset
  const presets = { 0.8: 'chill', 1.0: 'flow', 1.5: 'turbo', 2.0: 'hyperfocus' };
  const preset = presets[val] || '';
  updatePresetButtons(preset);
});

speedSlider.addEventListener('change', async () => {
  const val = parseFloat(speedSlider.value);
  const presets = { 0.8: 'chill', 1.0: 'flow', 1.5: 'turbo', 2.0: 'hyperfocus' };
  const preset = presets[val] || 'custom';
  await sendBg({ type: 'SAVE_PREFS', prefs: { speed: val, speedPreset: preset } });
  await relay({ type: 'SET_SPEED', speed: val });
});

document.querySelectorAll('.btn-preset').forEach(btn => {
  btn.addEventListener('click', async () => {
    const preset = btn.dataset.preset;
    const speeds = { chill: 0.8, flow: 1.0, turbo: 1.5, hyperfocus: 2.0 };
    const speed = speeds[preset];
    speedSlider.value = speed;
    speedValue.textContent = speed.toFixed(1) + 'x';
    updatePresetButtons(preset);
    await sendBg({ type: 'SAVE_PREFS', prefs: { speed, speedPreset: preset } });
    await relay({ type: 'SET_PRESET', preset });
  });
});

voiceSelect.addEventListener('change', async () => {
  const uri = voiceSelect.value;
  await relay({ type: 'SET_VOICE', voiceURI: uri });
  await sendBg({ type: 'SAVE_PREFS', prefs: { voiceURI: uri } });
});

autoScrollToggle.addEventListener('change', async () => {
  const enabled = autoScrollToggle.checked;
  await relay({ type: 'SET_AUTO_SCROLL', enabled });
  await sendBg({ type: 'SAVE_PREFS', prefs: { autoScroll: enabled } });
});

highlightToggle.addEventListener('change', async () => {
  const enabled = highlightToggle.checked;
  await relay({ type: 'SET_HIGHLIGHT', enabled });
  await sendBg({ type: 'SAVE_PREFS', prefs: { highlightEnabled: enabled } });
});

// Resume buttons
resumeYes.addEventListener('click', async () => {
  resumeBox.hidden = true;
  await relay({ type: 'SEEK_TO', index: resumeIndex });
  const state = await relay({ type: 'TOGGLE_PLAY' });
  updateReaderUI(state);
});

resumeNo.addEventListener('click', async () => {
  resumeBox.hidden = true;
  await relay({ type: 'SEEK_TO', index: 0 });
  const state = await relay({ type: 'TOGGLE_PLAY' });
  updateReaderUI(state);
});

// ── Listen for state updates from content ───
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'STATE_UPDATE' && msg.state) {
    updateReaderUI(msg.state);
  }
});

// ── Periodic stats refresh ──────────────────
chrome.storage.onChanged.addListener(() => {
  sendBg({ type: 'GET_STATS' }).then(data => {
    if (data) updateStats(data);
  });
});

// ── Initialize ──────────────────────────────
async function initPopup() {
  // Load stats + prefs
  const stats = await sendBg({ type: 'GET_STATS' });
  if (stats) updateStats(stats);

  // Load voices
  await loadVoices();

  // Initialize the reader on the active tab
  const state = await sendBg({ type: 'INIT_TAB' });
  if (state) {
    updateReaderUI(state);

    // Show resume prompt if there's a saved position
    if (state.hasResume && state.resumeIndex > 0) {
      resumeIndex = state.resumeIndex;
      resumeBox.hidden = false;
    }
  }
}

initPopup();
