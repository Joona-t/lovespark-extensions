'use strict';

LoveSparkTheme.init();

const MODE_META = {
  fen: {
    label: 'Paste a full FEN',
    placeholder: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1',
    help: 'Use the complete six-field FEN so the local engine sees the exact position.',
    empty: 'Paste a FEN first.',
  },
  pgn: {
    label: 'Paste a PGN',
    placeholder: '[Event \"Training\"]\n1. e4 e5 2. Nf3 Nc6 3. Bb5 a6',
    help: 'Headers and comments are okay. V1 reads the main line and analyzes the final position.',
    empty: 'Paste a PGN first.',
  },
};

const COACH_MESSAGES = [
  'Train locally. No remote engine, no tracking, no site scraping.',
  'Paste a position, get a move, and compare it to your own idea.',
  'Use FEN for exact boards or PGN for the game so far.',
  'Sparky says: train the pattern, not the panic.',
];

const modeButtons = Array.from(document.querySelectorAll('.mode-btn'));
const inputLabel = document.getElementById('inputLabel');
const notationInput = document.getElementById('notationInput');
const inputHelp = document.getElementById('inputHelp');
const analyzeBtn = document.getElementById('analyzeBtn');
const analyzeState = document.getElementById('analyzeState');
const validationMessage = document.getElementById('validationMessage');
const resultCard = document.getElementById('resultCard');
const bestMoveSan = document.getElementById('bestMoveSan');
const bestMoveUci = document.getElementById('bestMoveUci');
const evaluationValue = document.getElementById('evaluationValue');
const pvValue = document.getElementById('pvValue');
const fenValue = document.getElementById('fenValue');
const todayCount = document.getElementById('todayCount');
const totalCount = document.getElementById('totalCount');
const coachMessage = document.getElementById('coachMessage');

let currentMode = 'fen';
let worker = null;
let activeRequestId = 0;
let previousToday = 0;
let previousTotal = 0;

function syncThemeDropdownAria() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');

  if (!toggle || !menu) {
    return;
  }

  const sync = () => {
    toggle.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
  };

  toggle.addEventListener('click', () => {
    requestAnimationFrame(sync);
  });

  menu.addEventListener('click', () => {
    requestAnimationFrame(sync);
  });

  document.addEventListener('click', () => {
    requestAnimationFrame(sync);
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      menu.classList.remove('open');
      sync();
      toggle.focus();
    }
  });

  sync();
}

function safeGetWorker() {
  if (!worker) {
    worker = new Worker(chrome.runtime.getURL('worker.js'));
    worker.addEventListener('message', handleWorkerMessage);
    worker.addEventListener('error', handleWorkerError);
  }

  return worker;
}

async function safeSendMessage(message) {
  try {
    return await chrome.runtime.sendMessage(message);
  } catch (error) {
    console.warn('[LoveSpark Chess Coach] message failed:', error);
    return null;
  }
}

function setBusy(isBusy, message) {
  analyzeBtn.disabled = isBusy;
  analyzeBtn.textContent = isBusy ? 'Analyzing...' : 'Analyze Best Move';
  analyzeState.textContent = message || '';
}

function showValidation(message) {
  validationMessage.hidden = !message;
  validationMessage.textContent = message || '';
}

function clearResult() {
  resultCard.hidden = true;
  bestMoveSan.textContent = '--';
  bestMoveUci.textContent = '--';
  evaluationValue.textContent = '--';
  pvValue.textContent = '--';
  fenValue.textContent = '--';
}

function renderEvaluation(result) {
  if (typeof result.evaluationMate === 'number') {
    const side = result.evaluationMate > 0 ? 'White' : 'Black';
    return side + ' mates in ' + Math.abs(result.evaluationMate);
  }

  if (typeof result.evaluationCp === 'number') {
    if (result.evaluationCp === 0) {
      return 'Equal (0.00)';
    }

    const side = result.evaluationCp > 0 ? 'White' : 'Black';
    return side + ' +' + Math.abs(result.evaluationCp / 100).toFixed(2);
  }

  return 'Unknown';
}

function renderResult(result) {
  resultCard.hidden = false;
  bestMoveSan.textContent = result.bestMoveSan || result.bestMoveUci || '--';
  bestMoveUci.textContent = result.bestMoveUci || '--';
  evaluationValue.textContent = renderEvaluation(result);
  pvValue.textContent = result.pvSan && result.pvSan.length ? result.pvSan.join(' ') : 'No principal variation available.';
  fenValue.textContent = result.normalizedFen || '--';
}

function applyMode(mode, persist) {
  const meta = MODE_META[mode] || MODE_META.fen;
  currentMode = mode;

  modeButtons.forEach((button) => {
    const isActive = button.dataset.mode === mode;
    button.classList.toggle('active', isActive);
    button.setAttribute('aria-pressed', isActive ? 'true' : 'false');
  });

  inputLabel.textContent = meta.label;
  notationInput.placeholder = meta.placeholder;
  inputHelp.textContent = meta.help;
  showValidation('');
  analyzeState.textContent = '';

  if (persist) {
    chrome.storage.local.set({ lastInputMode: mode }).catch(() => {});
  }
}

function animateStats(data) {
  const today = data.analysesToday || 0;
  const total = data.analysesTotal || 0;

  LoveSparkPopup.animateCount(todayCount, previousToday, today);
  LoveSparkPopup.animateCount(totalCount, previousTotal, total);

  if (today > previousToday && previousToday > 0) {
    LoveSparkPopup.pop(todayCount);
  }

  previousToday = today;
  previousTotal = total;
}

async function loadStats() {
  const stats = await safeSendMessage({ type: 'GET_STATS' });
  if (stats) {
    animateStats(stats);
  }
}

async function loadPreferences() {
  try {
    const data = await chrome.storage.local.get(['lastInputMode']);
    const mode = data.lastInputMode === 'pgn' ? 'pgn' : 'fen';
    applyMode(mode, false);
  } catch (error) {
    console.warn('[LoveSpark Chess Coach] preference load failed:', error);
    applyMode('fen', false);
  }
}

async function handleAnalyzeClick() {
  const rawInput = notationInput.value.trim();

  clearResult();
  showValidation('');

  if (!rawInput) {
    showValidation(MODE_META[currentMode].empty);
    return;
  }

  activeRequestId += 1;
  setBusy(true, 'Running the local engine...');

  safeGetWorker().postMessage({
    type: 'ANALYZE',
    requestId: activeRequestId,
    payload: {
      inputType: currentMode,
      inputText: rawInput,
      movetimeMs: 1200,
    },
  });
}

async function handleWorkerMessage(event) {
  const { requestId, result } = event.data || {};

  if (requestId !== activeRequestId) {
    return;
  }

  setBusy(false, '');

  if (!result) {
    showValidation('No analysis result came back from the local engine.');
    return;
  }

  if (result.status === 'ok') {
    renderResult(result);
    analyzeState.textContent = 'Analysis ready.';
    await safeSendMessage({ type: 'LOG_ANALYSIS' });
    await loadStats();
    return;
  }

  clearResult();
  showValidation(result.errorMessage || 'Analysis failed.');
  analyzeState.textContent = result.status === 'invalid_input'
    ? 'Fix the notation and try again.'
    : 'Local engine failure.';
}

function handleWorkerError(error) {
  console.warn('[LoveSpark Chess Coach] worker error:', error);
  setBusy(false, '');
  clearResult();
  showValidation('The local engine crashed. Close and reopen the popup, then try again.');
}

modeButtons.forEach((button) => {
  button.addEventListener('click', () => applyMode(button.dataset.mode, true));
});

analyzeBtn.addEventListener('click', handleAnalyzeClick);

notationInput.addEventListener('keydown', (event) => {
  if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
    event.preventDefault();
    handleAnalyzeClick();
  }
});

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') {
    return;
  }

  if (changes.lastInputMode && !analyzeBtn.disabled) {
    const nextMode = changes.lastInputMode.newValue === 'pgn' ? 'pgn' : 'fen';
    if (nextMode !== currentMode) {
      applyMode(nextMode, false);
    }
  }

  if (changes.analysesToday || changes.analysesTotal) {
    loadStats();
  }
});

window.addEventListener('unload', () => {
  if (worker) {
    worker.terminate();
    worker = null;
  }
});

LoveSparkPopup.rotateMessages(coachMessage, COACH_MESSAGES, 4500);
syncThemeDropdownAria();
loadPreferences();
loadStats();
