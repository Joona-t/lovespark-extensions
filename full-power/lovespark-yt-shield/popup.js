'use strict';

// ============================================================
// LoveSpark YouTube Shield — Popup Controller
// Reads stats from storage, handles enable/disable toggle.
// ============================================================

// Theme dropdown (shared lib)
LoveSparkTheme.init();
(function initAriaExpanded() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (toggle && menu) {
    const observer = new MutationObserver(() => {
      toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
    });
    observer.observe(menu, { attributes: true, attributeFilter: ['class'] });
  }
})();

// ---- Messages ----

const MESSAGES = [
  'Ad-free vibes only 💕',
  'No ads here, bestie! ✨',
  'Shielded with love! 💖',
  'Browse in peace! 🌸',
  'Your time is sacred! ✨',
];

const $ = (sel) => document.querySelector(sel);

const todayEl = $('#todayCount');
const totalEl = $('#totalCount');
const toggleEl = $('#enableToggle');
const statusDot = $('#statusDot');
const statusText = $('#statusText');
const footerMsg = $('#footerMsg');

// Random motivational message
footerMsg.textContent = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

// ---- Load stats ----

function loadStats() {
  try {
    chrome.storage.local.get(
      ['adsNeutralizedToday', 'adsNeutralizedTotal', 'isEnabled'],
      (data) => {
        animateValue(todayEl, data.adsNeutralizedToday || 0);
        animateValue(totalEl, data.adsNeutralizedTotal || 0);

        const enabled = data.isEnabled !== false;
        updateToggleUI(enabled);
      }
    );
  } catch (err) { console.warn('[lovespark-yt-shield] unknown:', err); }
}

// ---- Counter animation ----

function animateValue(el, target) {
  const current = parseInt(el.textContent, 10) || 0;
  if (current === target) return;

  el.textContent = target;
  el.classList.add('bump');
  setTimeout(() => el.classList.remove('bump'), 200);
}

// ---- Toggle ----

function updateToggleUI(enabled) {
  if (enabled) {
    toggleEl.classList.add('active');
    statusDot.classList.remove('disabled');
    statusText.textContent = 'Shield Active';
  } else {
    toggleEl.classList.remove('active');
    statusDot.classList.add('disabled');
    statusText.textContent = 'Shield Paused';
  }

  // Update layer indicators
  document.querySelectorAll('.layer-indicator').forEach((dot) => {
    if (enabled) {
      dot.classList.add('active');
    } else {
      dot.classList.remove('active');
    }
  });
}

toggleEl.addEventListener('click', () => {
  const isActive = toggleEl.classList.contains('active');
  const newState = !isActive;

  try {
    chrome.storage.local.set({ isEnabled: newState });
  } catch (err) { console.warn('[lovespark-yt-shield] unknown:', err); }

  updateToggleUI(newState);
});

// ---- Live counter updates ----

try {
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.adsNeutralizedToday) {
      animateValue(todayEl, changes.adsNeutralizedToday.newValue || 0);
    }
    if (changes.adsNeutralizedTotal) {
      animateValue(totalEl, changes.adsNeutralizedTotal.newValue || 0);
    }
  });
} catch (err) { console.warn('[lovespark-yt-shield] unknown:', err); }

// ---- Init ----

loadStats();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
