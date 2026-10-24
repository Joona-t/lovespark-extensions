/* lovespark-theme.js — Shared theme dropdown for LoveSpark extension popups
   Canonical source: Extensions/infrastructure/lovespark-shared-lib/
   Usage in popup.html: <script src="lib/lovespark-theme.js"></script> */
'use strict';

const LoveSparkTheme = (() => {
  const THEMES = ['retro', 'dark', 'beige', 'slate'];
  const THEME_NAMES = { retro: 'Retro Pink', dark: 'Dark', beige: 'Beige', slate: 'Slate' };

  function apply(theme) {
    THEMES.forEach(t => document.body.classList.remove('theme-' + t));
    document.body.classList.add('theme-' + theme);
    const label = document.getElementById('themeLabel') || document.getElementById('themeDropdownTrigger');
    if (label) label.textContent = THEME_NAMES[theme] || theme;
    document.querySelectorAll('.theme-option').forEach(opt => {
      opt.classList.toggle('active', opt.dataset.theme === theme);
    });
  }

  function init() {
    const toggle = document.getElementById('themeToggle') || document.getElementById('themeDropdownTrigger');
    const menu = document.getElementById('themeMenu') || document.getElementById('themeDropdownMenu');

    if (toggle && menu) {
      const setOpen = (open) => {
        menu.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
      };
      setOpen(false);
      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && menu.classList.contains('open')) {
          setOpen(false);
          toggle.focus();
        }
      });
      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!menu.classList.contains('open'));
      });

      menu.addEventListener('click', (e) => {
        const opt = e.target.closest('.theme-option');
        if (!opt) return;
        const theme = opt.dataset.theme;
        apply(theme);
        chrome.storage.local.set({ theme });
        setOpen(false);
      });

      document.addEventListener('click', () => setOpen(false));
    }

    chrome.storage.local.get(['theme'], ({ theme }) => {
      apply(theme || 'retro');
    });
  }

  return { apply, init, THEMES, THEME_NAMES };
})();

if (typeof globalThis !== 'undefined') globalThis.LoveSparkTheme = LoveSparkTheme;
