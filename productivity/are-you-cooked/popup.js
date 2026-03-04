'use strict';

const TIERS = [
  { max:  4, verdict: "you're fine bestie \u{1F338}",                     state: 'fine',   panic: 0 },
  { max:  9, verdict: "getting spicy in here \u{1F336}\u{FE0F}",          state: 'spicy',  panic: 1 },
  { max: 14, verdict: "bestie... this is a lot \u{1F440}",                state: 'spicy',  panic: 2 },
  { max: 19, verdict: "ok we need to talk \u{1F928}",                     state: 'cooked', panic: 3 },
  { max: 24, verdict: "you're getting cooked bestie \u{1F525}",           state: 'cooked', panic: 4 },
  { max: 29, verdict: "BESTIE. PUT THE TABS DOWN. \u{1F480}",             state: 'cooked', panic: 5 },
  { max: Infinity, verdict: "call 911. this is not a drill \u{1F480}\u{1F525}", state: '911', panic: 6 },
];

(async () => {
  // Theme system
  const THEMES = ['dark', 'retro', 'beige', 'slate'];
  function applyTheme(t) {
    THEMES.forEach(n => document.body.classList.remove('theme-' + n));
    document.body.classList.add('theme-' + t);
    const btn = document.getElementById('themeTab');
    if (btn) btn.textContent = t;
  }
  function cycleTheme() {
    const cur = THEMES.find(t => document.body.classList.contains('theme-' + t)) || 'retro';
    const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
    applyTheme(next);
    chrome.storage.local.set({ theme: next });
  }
  try {
    const themeData = await chrome.storage.local.get(['theme', 'darkMode']);
    let theme = themeData.theme;
    if (!theme && themeData.darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  } catch {}
  document.getElementById('themeTab').addEventListener('click', cycleTheme);

  // Tab count
  let tabs;
  try { tabs = await chrome.tabs.query({ windowType: 'normal' }); } catch { return; }
  const count = tabs.length;

  document.getElementById('tabCount').textContent = count;

  const tier = TIERS.find(t => count <= t.max);

  document.getElementById('verdict').textContent = tier.verdict;
  document.body.classList.add(`state-${tier.state}`);

  const mascot = document.getElementById('mascot');
  mascot.className = `mascot panic-${tier.panic}`;
})();
