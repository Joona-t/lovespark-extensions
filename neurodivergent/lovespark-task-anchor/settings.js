'use strict';

// Theme init — shared lib looks for #themeToggle and #themeMenu
LoveSparkTheme.init();

// Wire aria-expanded on theme dropdown (KI-013)
const themeToggle = document.getElementById('themeToggle');
const themeMenu = document.getElementById('themeMenu');
if (themeToggle && themeMenu) {
  const observer = new MutationObserver(() => {
    const isOpen = themeMenu.classList.contains('open');
    themeToggle.setAttribute('aria-expanded', String(isOpen));
  });
  observer.observe(themeMenu, { attributes: true, attributeFilter: ['class'] });
}

const positionEl = document.getElementById('bannerPosition');
const autoHideEl = document.getElementById('autoHide');
const savedMsg = document.getElementById('savedMsg');

let saveTimer = null;

function showSaved() {
  savedMsg.textContent = 'Saved!';
  savedMsg.style.opacity = '1';
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    savedMsg.style.opacity = '0';
    saveTimer = setTimeout(() => { savedMsg.textContent = ''; }, 300);
  }, 1500);
}

function save() {
  chrome.storage.local.set({
    bannerPosition: positionEl.value,
    autoHide: Number(autoHideEl.value),
  }, showSaved);
}

// Load current settings
chrome.storage.local.get(['bannerPosition', 'autoHide'], (data) => {
  positionEl.value = data.bannerPosition || 'top';
  autoHideEl.value = String(data.autoHide || 0);
});

// Save on change
positionEl.addEventListener('change', save);
autoHideEl.addEventListener('change', save);
