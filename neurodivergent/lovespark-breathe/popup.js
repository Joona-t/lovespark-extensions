'use strict';

/* popup.js — LoveSpark Breathe popup controller
   NO innerHTML — all DOM via createElement/textContent */

const PATTERNS = {
  box:  { name: 'Box',   phases: [
    { label: 'Breathe in...', type: 'inhale', duration: 4 },
    { label: 'Hold...', type: 'hold', duration: 4 },
    { label: 'Breathe out...', type: 'exhale', duration: 4 },
    { label: 'Hold...', type: 'hold', duration: 4 }
  ]},
  '478': { name: '4-7-8', phases: [
    { label: 'Breathe in...', type: 'inhale', duration: 4 },
    { label: 'Hold...', type: 'hold', duration: 7 },
    { label: 'Breathe out...', type: 'exhale', duration: 8 }
  ]},
  sigh: { name: 'Physiological Sigh', phases: [
    { label: 'Inhale...', type: 'inhale', duration: 2 },
    { label: 'Inhale again...', type: 'inhale', duration: 1 },
    { label: 'Long exhale...', type: 'exhale', duration: 6 }
  ]}
};

const GROUNDING_STEPS = [
  { count: 5, sense: 'things you can SEE' },
  { count: 4, sense: 'things you can TOUCH' },
  { count: 3, sense: 'things you can HEAR' },
  { count: 2, sense: 'things you can SMELL' },
  { count: 1, sense: 'thing you can TASTE' }
];

const SPARKY_MESSAGES = [
  'You are doing amazing today!',
  'Remember: progress, not perfection.',
  'Every breath is a fresh start.',
  'You showed up for yourself today.',
  'Small steps count. Always.',
  'Be gentle with your brain today.',
  'You deserve this moment of calm.'
];

let breatheTimer = null;
let currentPattern = 'box';
let currentCycle = 0;
let totalCycles = 5;
let currentPhaseIndex = 0;
let groundStep = 0;

/* ── Init ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  LoveSparkTheme.init();
  loadSettings();
  loadLog();
  bindEvents();
});

function loadSettings() {
  chrome.storage.local.get(['settings'], (data) => {
    const s = data.settings || {};
    currentPattern = s.defaultPattern || 'box';
    totalCycles = s.cycles || 5;

    const patternSel = document.getElementById('setting-pattern');
    const cyclesSel = document.getElementById('setting-cycles');
    const dimmerModeSel = document.getElementById('setting-dimmer-mode');
    const dimmerToggle = document.getElementById('dimmer-toggle');

    if (patternSel) patternSel.value = currentPattern;
    if (cyclesSel) cyclesSel.value = String(totalCycles);
    if (dimmerModeSel) dimmerModeSel.value = s.dimmerMode || 'manual';
    if (dimmerToggle) {
      dimmerToggle.checked = s.dimmerEnabled || false;
      updateDimmerStatus(dimmerToggle.checked);
    }

    /* Sync pattern selector buttons */
    document.querySelectorAll('.pattern-btn').forEach((btn) => {
      const isActive = btn.dataset.pattern === currentPattern;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', String(isActive));
    });
  });
}

function saveSettings() {
  const settings = {
    defaultPattern: document.getElementById('setting-pattern').value,
    cycles: parseInt(document.getElementById('setting-cycles').value, 10),
    dimmerMode: document.getElementById('setting-dimmer-mode').value,
    dimmerEnabled: document.getElementById('dimmer-toggle').checked
  };
  chrome.storage.local.set({ settings });
}

/* ── Log ────────────────────────────────────────────── */
function loadLog() {
  chrome.runtime.sendMessage({ action: 'get-log' }, (log) => {
    if (chrome.runtime.lastError || !log) {
      log = { breathing: 0, grounding: 0, stepBack: 0 };
    }
    renderLog(log);
  });
}

function renderLog(log) {
  const el = document.getElementById('log-stats');
  el.textContent = '';

  const parts = [];
  if (log.breathing > 0) parts.push(log.breathing + ' breathing session' + (log.breathing > 1 ? 's' : ''));
  if (log.grounding > 0) parts.push(log.grounding + ' grounding session' + (log.grounding > 1 ? 's' : ''));
  if (log.stepBack > 0) parts.push(log.stepBack + ' step-back' + (log.stepBack > 1 ? 's' : ''));

  if (parts.length === 0) {
    el.textContent = 'No sessions yet today. Take a moment for yourself.';
  } else {
    el.textContent = parts.join(', ') + ' today';
  }

  const total = (log.breathing || 0) + (log.grounding || 0) + (log.stepBack || 0);
  const msgEl = document.getElementById('sparky-text');
  if (total >= 3) {
    msgEl.textContent = 'You are really taking care of yourself today!';
  } else if (total >= 1) {
    msgEl.textContent = SPARKY_MESSAGES[Math.floor(Math.random() * SPARKY_MESSAGES.length)];
  } else {
    msgEl.textContent = 'I am here whenever you need me.';
  }
}

/* ── Events ─────────────────────────────────────────── */
function bindEvents() {
  /* Quick actions */
  document.getElementById('btn-breathe').addEventListener('click', () => showScreen('breathe'));
  document.getElementById('btn-ground').addEventListener('click', () => showScreen('ground'));
  document.getElementById('btn-stepback').addEventListener('click', triggerStepBack);

  /* Breathing controls */
  document.getElementById('btn-breathe-done').addEventListener('click', () => {
    stopBreathing();
    showScreen('main');
  });

  document.querySelectorAll('.pattern-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentPattern = btn.dataset.pattern;
      document.querySelectorAll('.pattern-btn').forEach((b) => {
        const isActive = b === btn;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-checked', String(isActive));
      });
      /* Restart if currently running */
      if (!document.getElementById('screen-breathe').classList.contains('hidden')) {
        stopBreathing();
        startBreathing();
      }
    });
  });

  /* Grounding controls */
  document.getElementById('btn-ground-next').addEventListener('click', advanceGround);
  document.getElementById('btn-ground-done').addEventListener('click', () => {
    showScreen('main');
  });

  /* Comment dimmer */
  document.getElementById('dimmer-toggle').addEventListener('change', (e) => {
    const enabled = e.target.checked;
    updateDimmerStatus(enabled);
    chrome.runtime.sendMessage({ action: 'toggle-dimmer', enabled });
    saveSettings();
  });

  /* Settings changes */
  document.getElementById('setting-pattern').addEventListener('change', () => {
    currentPattern = document.getElementById('setting-pattern').value;
    saveSettings();
  });
  document.getElementById('setting-cycles').addEventListener('change', () => {
    totalCycles = parseInt(document.getElementById('setting-cycles').value, 10);
    saveSettings();
  });
  document.getElementById('setting-dimmer-mode').addEventListener('change', saveSettings);
}

function updateDimmerStatus(enabled) {
  const status = document.getElementById('dimmer-status');
  if (enabled) {
    status.textContent = 'Active on Twitter/X, Reddit, YouTube, Facebook, Instagram';
  } else {
    status.textContent = 'Off — comments are fully visible';
  }
}

/* ── Screen management ──────────────────────────────── */
function showScreen(name) {
  document.getElementById('screen-main').classList.toggle('hidden', name !== 'main');
  document.getElementById('screen-breathe').classList.toggle('hidden', name !== 'breathe');
  document.getElementById('screen-ground').classList.toggle('hidden', name !== 'ground');

  if (name === 'breathe') {
    startBreathing();
  } else if (name === 'ground') {
    startGrounding();
  }
}

/* ── Breathing Engine ───────────────────────────────── */
function startBreathing() {
  stopBreathing();
  currentCycle = 1;
  currentPhaseIndex = 0;
  updateBreathCounter();
  runPhase();
}

function stopBreathing() {
  if (breatheTimer) {
    clearTimeout(breatheTimer);
    breatheTimer = null;
  }
  const circle = document.getElementById('breathe-circle');
  circle.className = 'breathe-circle';
  circle.style.removeProperty('--breathe-duration');
}

function runPhase() {
  const pattern = PATTERNS[currentPattern];
  if (!pattern) return;

  if (currentPhaseIndex >= pattern.phases.length) {
    currentCycle++;
    currentPhaseIndex = 0;
    if (currentCycle > totalCycles) {
      finishBreathing();
      return;
    }
    updateBreathCounter();
  }

  const phase = pattern.phases[currentPhaseIndex];
  const circle = document.getElementById('breathe-circle');
  const instruction = document.getElementById('breathe-instruction');
  const fallback = document.getElementById('breathe-text-fallback');

  instruction.textContent = phase.label;

  /* Text fallback for reduced motion */
  if (fallback) {
    fallback.textContent = phase.label + ' (' + phase.duration + 's)';
  }

  /* Animate circle */
  circle.className = 'breathe-circle';
  circle.style.setProperty('--breathe-duration', phase.duration + 's');

  /* Force reflow before adding class */
  void circle.offsetWidth;
  circle.classList.add(phase.type);

  breatheTimer = setTimeout(() => {
    currentPhaseIndex++;
    runPhase();
  }, phase.duration * 1000);
}

function updateBreathCounter() {
  const counter = document.getElementById('breathe-counter');
  counter.textContent = 'Cycle ' + currentCycle + ' of ' + totalCycles;
}

function finishBreathing() {
  const instruction = document.getElementById('breathe-instruction');
  const circle = document.getElementById('breathe-circle');
  const fallback = document.getElementById('breathe-text-fallback');

  instruction.textContent = 'Well done. You did it.';
  if (fallback) fallback.textContent = 'Well done. You did it.';
  circle.className = 'breathe-circle';

  chrome.runtime.sendMessage({ action: 'log-session', type: 'breathing' }, () => {
    loadLog();
  });

  setTimeout(() => showScreen('main'), 3000);
}

/* ── Grounding Engine ───────────────────────────────── */
function startGrounding() {
  groundStep = 0;
  renderGroundStep();
}

function renderGroundStep() {
  const step = GROUNDING_STEPS[groundStep];
  const screenEl = document.getElementById('screen-ground');

  document.getElementById('ground-number').textContent = String(step.count);
  document.getElementById('ground-sense').textContent = step.sense;
  screenEl.setAttribute('data-step', String(groundStep));

  /* Update progress dots */
  const dots = document.querySelectorAll('#ground-progress .dot');
  dots.forEach((dot, i) => {
    dot.classList.toggle('active', i === groundStep);
    dot.classList.toggle('done', i < groundStep);
    if (i === groundStep) {
      dot.setAttribute('aria-label', 'Step ' + (i + 1) + ' of 5, current');
    } else if (i < groundStep) {
      dot.setAttribute('aria-label', 'Step ' + (i + 1) + ' of 5, completed');
    } else {
      dot.setAttribute('aria-label', 'Step ' + (i + 1) + ' of 5');
    }
  });

  /* Update button text */
  const nextBtn = document.getElementById('btn-ground-next');
  if (groundStep === GROUNDING_STEPS.length - 1) {
    nextBtn.textContent = 'Finish';
  } else {
    nextBtn.textContent = 'Tap when ready';
  }
}

function advanceGround() {
  if (groundStep >= GROUNDING_STEPS.length - 1) {
    chrome.runtime.sendMessage({ action: 'log-session', type: 'grounding' }, () => {
      loadLog();
    });
    showScreen('main');
    return;
  }
  groundStep++;
  renderGroundStep();
}

/* ── Step Back ──────────────────────────────────────── */
function triggerStepBack() {
  chrome.runtime.sendMessage({ action: 'step-back' });
  chrome.runtime.sendMessage({ action: 'log-session', type: 'stepBack' }, () => {
    loadLog();
  });
}
