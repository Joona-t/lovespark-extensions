/* lovespark-theme.js — Shared theme dropdown for LoveSpark extension popups
   Canonical source: Extensions/infrastructure/lovespark-shared-lib/
   Usage in popup.html: <script src="lib/lovespark-theme.js"></script> */
'use strict';

const LoveSparkTheme = (() => {
  // One list for the whole fleet (2026-10-25). The menu is built from it, so a
  // popup's hand-written <button class="theme-option"> list is replaced and new
  // themes reach every popup with one sync. Token values: lovespark-tokens.css;
  // ornaments: lovespark-base.css.
  const LIST = [
    { id: 'seoul', name: 'Seoul Y2K', hangul: '서울' },
    { id: 'gingham', name: 'Gingham Sticker', hangul: '깅엄' },
    { id: 'holo', name: 'Holo Mochi', hangul: '모찌' },
    { id: 'neon', name: 'Neon Usagi', hangul: '네온' },
    { id: 'bubblegum', name: 'Bubblegum' },
    { id: 'retro', name: 'Retro Pink' },
    { id: 'dark', name: 'Dark' },
    { id: 'beige', name: 'Beige' },
    { id: 'slate', name: 'Slate' },
  ];
  // New installs start in Seoul Y2K (Joona, 2026-10-25); a saved choice wins.
  const DEFAULT = 'seoul';
  const THEMES = LIST.map(t => t.id);
  // Neon is a dark theme: also set theme-dark so every popup's existing
  // body.theme-dark rules (headers, footers, cards) apply under it.
  const FAMILY = { neon: 'dark' };
  const THEME_NAMES = Object.fromEntries(LIST.map(t => [t.id, t.name]));

  function apply(theme) {
    const id = THEMES.includes(theme) ? theme : DEFAULT;
    THEMES.forEach(t => document.body.classList.remove('theme-' + t));
    document.body.classList.add('theme-' + id);
    if (FAMILY[id]) document.body.classList.add('theme-' + FAMILY[id]);
    const label = document.getElementById('themeLabel');
    if (label) label.textContent = THEME_NAMES[id];
    document.querySelectorAll('.theme-option').forEach(opt => {
      const on = opt.dataset.theme === id;
      opt.classList.toggle('active', on);
      opt.setAttribute('aria-checked', String(on));
    });
    return id;
  }

  /** Replace whatever options the popup hard-codes with the fleet list. */
  function renderMenu(menu) {
    menu.querySelectorAll('.theme-option').forEach(o => o.remove());
    menu.setAttribute('role', 'menu');
    LIST.forEach(t => {
      const opt = document.createElement('button');
      opt.type = 'button';
      opt.className = 'theme-option';
      opt.dataset.theme = t.id;
      opt.setAttribute('role', 'menuitemradio');
      opt.setAttribute('aria-checked', 'false');
      opt.append(t.name);
      if (t.hangul) {
        const h = document.createElement('span');
        h.className = 'theme-hangul';
        h.lang = 'ko';
        h.textContent = t.hangul;
        opt.append(' ', h);
      }
      menu.appendChild(opt);
    });
  }

  /** Crossfade where View Transitions exist and motion is allowed. */
  function switchTo(theme) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (document.startViewTransition && !reduce) {
      let id = theme;
      document.startViewTransition(() => { id = apply(theme); });
      return id;
    }
    return apply(theme);
  }

  function init() {
    const toggle = document.getElementById('themeToggle');
    const menu = document.getElementById('themeMenu');

    if (toggle && menu) {
      renderMenu(menu);
      const setOpen = (open) => {
        menu.classList.toggle('open', open);
        toggle.setAttribute('aria-expanded', String(open));
      };

      toggle.addEventListener('click', (e) => {
        e.stopPropagation();
        setOpen(!menu.classList.contains('open'));
      });

      menu.addEventListener('click', (e) => {
        const opt = e.target.closest('.theme-option');
        if (!opt) return;
        e.stopPropagation();
        const theme = THEMES.includes(opt.dataset.theme) ? opt.dataset.theme : DEFAULT;
        switchTo(theme);
        chrome.storage.local.set({ theme });
        setOpen(false);
        toggle.focus();
      });

      document.addEventListener('click', () => setOpen(false));
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && menu.classList.contains('open')) {
          setOpen(false);
          toggle.focus();
        }
      });
    }

    chrome.storage.local.get(['theme'], ({ theme }) => {
      apply(theme || DEFAULT);
    });
  }

  return { apply, init, THEMES, THEME_NAMES, DEFAULT };
})();

if (typeof globalThis !== 'undefined') globalThis.LoveSparkTheme = LoveSparkTheme;
