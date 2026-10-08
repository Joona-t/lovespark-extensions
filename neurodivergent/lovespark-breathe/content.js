'use strict';

/* content.js — LoveSpark Breathe content script
   Handles comment dimming and step-back overlay on social media sites.
   NO innerHTML — all DOM via createElement/textContent. */

let dimmerActive = false;
let overlayElement = null;

const COMMENT_SELECTORS = {
  'twitter.com': ['[data-testid="reply"]', '[data-testid="cellInnerDiv"] [data-testid="tweet"]'],
  'x.com': ['[data-testid="reply"]', '[data-testid="cellInnerDiv"] [data-testid="tweet"]'],
  'reddit.com': ['.Comment', '[class*="comment"]', 'shreddit-comment'],
  'youtube.com': ['#comments', 'ytd-comments', '#comment'],
  'facebook.com': ['[role="article"]'],
  'instagram.com': ['[class*="comment"]', 'ul[class*="Comment"]']
};

const CALMING_MESSAGES = [
  'It is okay to step back.',
  'Take a moment for yourself.',
  'You are doing great.',
  'This feeling will pass.',
  'Breathe. You are safe here.',
  'One moment at a time.'
];

/* ── Comment Dimmer ─────────────────────────────────── */
function getCurrentSiteSelectors() {
  const host = window.location.hostname.replace('www.', '');
  for (const [site, selectors] of Object.entries(COMMENT_SELECTORS)) {
    if (host.includes(site)) return selectors;
  }
  return [];
}

function applyDimmer() {
  const selectors = getCurrentSiteSelectors();
  if (selectors.length === 0) return;

  selectors.forEach((selector) => {
    try {
      const elements = document.querySelectorAll(selector);
      elements.forEach((el) => {
        if (!el.dataset.lsBreathe) {
          el.dataset.lsBreathe = 'dimmed';
          el.classList.add('ls-breathe-dimmed');
        }
      });
    } catch (e) {
      /* Selector may be invalid on some sites — ignore */
    }
  });

  /* Add dimmed label if not already present */
  if (!document.getElementById('ls-breathe-dimmed-label')) {
    const label = document.createElement('div');
    label.id = 'ls-breathe-dimmed-label';
    label.className = 'ls-breathe-dimmed-label';

    const text = document.createElement('span');
    text.textContent = 'Comments dimmed ';
    label.appendChild(text);

    const heart = document.createElement('span');
    heart.textContent = '\uD83D\uDC95';
    heart.setAttribute('aria-hidden', 'true');
    label.appendChild(heart);

    document.body.appendChild(label);
  }
}

function removeDimmer() {
  document.querySelectorAll('.ls-breathe-dimmed').forEach((el) => {
    el.classList.remove('ls-breathe-dimmed');
    delete el.dataset.lsBreathe;
  });

  const label = document.getElementById('ls-breathe-dimmed-label');
  if (label) label.remove();
}

function toggleDimmer(enabled) {
  dimmerActive = enabled;
  if (enabled) {
    applyDimmer();
    startDimmerObserver();
  } else {
    removeDimmer();
    stopDimmerObserver();
  }
}

/* MutationObserver for dynamic content */
let dimmerObserver = null;
let dimmerDebounceTimer = null;

function startDimmerObserver() {
  if (dimmerObserver) return;
  dimmerObserver = new MutationObserver(() => {
    if (!dimmerActive) return;
    if (dimmerDebounceTimer) clearTimeout(dimmerDebounceTimer);
    dimmerDebounceTimer = setTimeout(applyDimmer, 250);
  });
  dimmerObserver.observe(document.body, { childList: true, subtree: true });
}

function stopDimmerObserver() {
  if (dimmerDebounceTimer) {
    clearTimeout(dimmerDebounceTimer);
    dimmerDebounceTimer = null;
  }
  if (dimmerObserver) {
    dimmerObserver.disconnect();
    dimmerObserver = null;
  }
}

/* ── Step Back Overlay ──────────────────────────────── */
function showStepBackOverlay() {
  if (overlayElement) return;

  overlayElement = document.createElement('div');
  overlayElement.className = 'ls-breathe-overlay';
  overlayElement.setAttribute('role', 'dialog');
  overlayElement.setAttribute('aria-modal', 'true');
  overlayElement.setAttribute('aria-label', 'Step back — calming overlay');

  const content = document.createElement('div');
  content.className = 'ls-breathe-overlay-content';

  /* Sparky image */
  const img = document.createElement('img');
  img.src = chrome.runtime.getURL('mascot.png');
  img.alt = 'Sparky the LoveSpark mascot';
  img.className = 'ls-breathe-overlay-mascot';
  img.width = 80;
  img.height = 80;
  content.appendChild(img);

  /* Calming message */
  const msg = document.createElement('p');
  msg.className = 'ls-breathe-overlay-message';
  msg.textContent = CALMING_MESSAGES[Math.floor(Math.random() * CALMING_MESSAGES.length)];
  content.appendChild(msg);

  /* Dismiss button */
  const btn = document.createElement('button');
  btn.className = 'ls-breathe-overlay-btn';
  btn.textContent = 'I\'m ready';
  btn.addEventListener('click', dismissOverlay);
  content.appendChild(btn);

  /* Hint */
  const hint = document.createElement('p');
  hint.className = 'ls-breathe-overlay-hint';
  hint.textContent = 'Press Escape to dismiss';
  content.appendChild(hint);

  overlayElement.appendChild(content);
  document.body.appendChild(overlayElement);

  /* Focus the button */
  btn.focus();

  /* Escape key handler */
  document.addEventListener('keydown', overlayKeyHandler);
}

function dismissOverlay() {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
  document.removeEventListener('keydown', overlayKeyHandler);
}

function overlayKeyHandler(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    e.stopPropagation();
    dismissOverlay();
  }
}

/* ── Quick Breathe Overlay (from keyboard shortcut) ── */
function showQuickBreatheOverlay() {
  if (document.getElementById('ls-breathe-quick-overlay')) return;

  const overlay = document.createElement('div');
  overlay.id = 'ls-breathe-quick-overlay';
  overlay.className = 'ls-breathe-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Quick breathing exercise');

  const content = document.createElement('div');
  content.className = 'ls-breathe-overlay-content';

  const circle = document.createElement('div');
  circle.className = 'ls-breathe-quick-circle';
  content.appendChild(circle);

  const instruction = document.createElement('p');
  instruction.className = 'ls-breathe-overlay-message';
  instruction.textContent = 'Breathe in...';
  instruction.setAttribute('aria-live', 'assertive');
  content.appendChild(instruction);

  const counter = document.createElement('p');
  counter.className = 'ls-breathe-overlay-hint';
  counter.textContent = 'Cycle 1 of 3';
  content.appendChild(counter);

  const btn = document.createElement('button');
  btn.className = 'ls-breathe-overlay-btn';
  btn.textContent = 'Done';
  content.appendChild(btn);

  overlay.appendChild(content);
  document.body.appendChild(overlay);

  /* Run 3 cycles of box breathing */
  const phases = [
    { label: 'Breathe in...', cls: 'inhale', duration: 4 },
    { label: 'Hold...', cls: 'hold', duration: 4 },
    { label: 'Breathe out...', cls: 'exhale', duration: 4 },
    { label: 'Hold...', cls: 'hold', duration: 4 }
  ];

  let cycle = 1;
  let phaseIdx = 0;
  let timer = null;

  function runQuickPhase() {
    if (phaseIdx >= phases.length) {
      cycle++;
      phaseIdx = 0;
      if (cycle > 3) {
        instruction.textContent = 'Well done.';
        counter.textContent = '';
        setTimeout(closeQuick, 2000);
        return;
      }
      counter.textContent = 'Cycle ' + cycle + ' of 3';
    }
    const phase = phases[phaseIdx];
    instruction.textContent = phase.label;
    circle.className = 'ls-breathe-quick-circle ' + phase.cls;
    circle.style.setProperty('--breathe-duration', phase.duration + 's');
    timer = setTimeout(() => {
      phaseIdx++;
      runQuickPhase();
    }, phase.duration * 1000);
  }

  function closeQuick() {
    if (timer) clearTimeout(timer);
    overlay.remove();
    document.removeEventListener('keydown', quickKeyHandler);
  }

  function quickKeyHandler(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      closeQuick();
    }
  }

  btn.addEventListener('click', closeQuick);
  document.addEventListener('keydown', quickKeyHandler);

  runQuickPhase();
}

/* ── Message Listener ───────────────────────────────── */
chrome.runtime.onMessage.addListener((msg) => {
  try {
    if (msg.action === 'set-dimmer') {
      toggleDimmer(msg.enabled);
    } else if (msg.action === 'step-back') {
      showStepBackOverlay();
    } else if (msg.action === 'quick-breathe') {
      showQuickBreatheOverlay();
    }
  } catch (e) {
    /* Swallow errors — site DOM changes may cause issues */
  }
});

/* ── Init: check if dimmer should be on ─────────────── */
chrome.storage.local.get(['dimmerMode', 'dimmerEnabled'], (data) => {
  if (data.dimmerMode === 'always' || data.dimmerEnabled) {
    toggleDimmer(true);
  }
});
