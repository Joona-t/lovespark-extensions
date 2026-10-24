'use strict';

// ── Theme ─────────────────────────────────────────────────────────
const THEMES = ['retro', 'dark', 'beige', 'slate'];
const THEME_NAMES = { retro: 'Retro Pink', dark: 'Dark', beige: 'Beige', slate: 'Slate' };

function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = THEME_NAMES[t] || t;
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === t);
  });
}

(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  menu.addEventListener('click', (e) => {
    const opt = e.target.closest('.theme-option');
    if (!opt) return;
    const theme = opt.dataset.theme;
    applyTheme(theme);
    chrome.storage.local.set({ theme });
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('open')) return;
    const opts = [...menu.querySelectorAll('.theme-option')];
    const focused = document.activeElement;
    const idx = opts.indexOf(focused);

    if (e.key === 'Escape') {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      const next = idx < opts.length - 1 ? idx + 1 : 0;
      opts[next].focus();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      const prev = idx > 0 ? idx - 1 : opts.length - 1;
      opts[prev].focus();
      e.preventDefault();
    }
  });

  chrome.storage.local.get(['theme'], ({ theme }) => {
    applyTheme(theme || 'retro');
  });
})();

// ── Messages ──────────────────────────────────────────────────────
const MESSAGES = [
  'Ready to digest! 💕',
  'Skip the fluff! ✨',
  'Your time is precious! 🌸',
  'TL;DW coming right up! 💖',
  'Sparky saves the day! 🐾',
];

// ── DOM refs ──────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const elVideoInfo    = $('videoInfo');
const elVideoTitle   = $('videoTitle');
const elVideoChannel = $('videoChannel');
const elToday        = $('val-today');
const elTotal        = $('val-total');
const footerMsg      = $('footer-message');

const states = {
  notYoutube:  $('stateNotYoutube'),
  noCaptions:  $('stateNoCaptions'),
  noKey:       $('stateNoKey'),
  live:        $('stateLive'),
  ready:       $('stateReady'),
  loading:     $('stateLoading'),
  done:        $('stateDone'),
  error:       $('stateError'),
};

const btnSummarize   = $('btnSummarize');
const btnViewFull    = $('btnViewFull');
const btnRetry       = $('btnRetry');
const btnGoSettings  = $('btnGoSettings');
const settingsBtn    = $('settings-btn');
const summaryPreview = $('summaryPreview');
const errorMessage   = $('errorMessage');

let currentVideoId = null;

// ── Helpers ───────────────────────────────────────────────────────
function showState(name) {
  Object.values(states).forEach(el => { if (el) el.style.display = 'none'; });
  if (states[name]) states[name].style.display = 'block';
}

function animateTo(el, target) {
  const start = parseInt(el.textContent, 10) || 0;
  if (start === target) return;
  const diff = target - start;
  const steps = Math.min(Math.abs(diff), 20);
  const stepSize = diff / steps;
  let current = start;
  let step = 0;
  const interval = setInterval(() => {
    step++;
    current += stepSize;
    el.textContent = Math.round(current);
    if (step >= steps) {
      clearInterval(interval);
      el.textContent = target;
    }
  }, 18);
}

function extractKeyPoints(markdown) {
  const match = markdown.match(/## Key Points\s*([\s\S]*?)(?=\n## |$)/);
  if (!match) return markdown.slice(0, 200) + '...';
  return match[1].trim();
}

function renderPreview(text) {
  // Build preview using safe DOM methods — no innerHTML
  summaryPreview.textContent = '';
  const lines = text.split('\n');
  for (const line of lines) {
    if (!line.trim()) continue;
    const p = document.createElement('p');
    p.style.margin = '2px 0';
    // Handle bold: **text** → <strong>
    const parts = line.split(/\*\*(.+?)\*\*/g);
    for (let i = 0; i < parts.length; i++) {
      if (i % 2 === 0) {
        // Plain text — replace leading "- " with "• "
        const cleaned = parts[i].replace(/^- /, '• ');
        p.appendChild(document.createTextNode(cleaned));
      } else {
        const strong = document.createElement('strong');
        strong.textContent = parts[i];
        p.appendChild(strong);
      }
    }
    summaryPreview.appendChild(p);
  }
}

// ── Collapsible groups ────────────────────────────────────────────
document.querySelectorAll('.group-header').forEach(btn => {
  btn.addEventListener('click', () => {
    const group = btn.dataset.group;
    const body = document.getElementById('group-' + group);
    const chevron = btn.querySelector('.group-chevron');
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', !expanded);
    body.classList.toggle('collapsed', expanded);
    chevron.textContent = expanded ? '▸' : '▾';
  });
});

// ── Load stats ────────────────────────────────────────────────────
function loadStats() {
  chrome.runtime.sendMessage({ action: 'getStats' }, (data) => {
    if (chrome.runtime.lastError || !data) return;
    animateTo(elToday, data.digestsToday || 0);
    animateTo(elTotal, data.digestsTotal || 0);
  });
}

// ── Main flow ─────────────────────────────────────────────────────
function init() {
  loadStats();
  footerMsg.textContent = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (!tab?.url?.includes('youtube.com/watch')) {
      showState('notYoutube');
      return;
    }

    chrome.tabs.sendMessage(tab.id, { action: 'getPageInfo' }, (info) => {
      if (chrome.runtime.lastError || !info?.videoId) {
        showState('notYoutube');
        return;
      }

      currentVideoId = info.videoId;

      if (info.title) {
        elVideoTitle.textContent = info.title;
        elVideoChannel.textContent = info.channel || '';
        elVideoInfo.style.display = 'block';
      }

      chrome.runtime.sendMessage({ action: 'getVideoStatus', videoId: info.videoId }, (resp) => {
        if (chrome.runtime.lastError || !resp) {
          showState('error');
          errorMessage.textContent = 'Could not connect to background.';
          return;
        }

        if (resp.isLive) {
          showState('live');
          return;
        }

        if (resp.status === 'done') {
          showSummaryPreview(resp.data);
          return;
        }

        chrome.storage.local.get(['apiKey'], ({ apiKey }) => {
          if (!apiKey) {
            showState('noKey');
            return;
          }
          showState('ready');
        });
      });
    });
  });
}

function showSummaryPreview(data) {
  showState('done');
  const preview = extractKeyPoints(data.summary || '');
  renderPreview(preview);
}

// ── Summarize ─────────────────────────────────────────────────────
function doSummarize() {
  if (!currentVideoId) return;
  showState('loading');

  chrome.runtime.sendMessage({ action: 'summarize', videoId: currentVideoId }, (resp) => {
    if (chrome.runtime.lastError) {
      showState('error');
      errorMessage.textContent = 'Connection lost. Try again.';
      return;
    }

    if (resp?.error) {
      showState('error');
      errorMessage.textContent = resp.error;
      return;
    }

    if (resp?.success && resp.data) {
      showSummaryPreview(resp.data);
      loadStats();
    }
  });
}

// ── Event listeners ───────────────────────────────────────────────
btnSummarize.addEventListener('click', doSummarize);
btnRetry.addEventListener('click', doSummarize);

btnViewFull.addEventListener('click', () => {
  if (!currentVideoId) return;
  chrome.tabs.create({ url: chrome.runtime.getURL('digest.html?v=' + currentVideoId) });
  window.close();
});

btnGoSettings.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  window.close();
});

settingsBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  window.close();
});

// ── Author footer ─────────────────────────────────────────────────
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());

// ── Init ──────────────────────────────────────────────────────────
init();
