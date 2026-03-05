// Theme dropdown
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
  if (toggle && menu) {
    toggle.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      applyTheme(theme);
      browser.storage.local.set({ theme });
      menu.classList.remove('open');
    });
    document.addEventListener('click', () => menu.classList.remove('open'));
  }
  browser.storage.local.get(['theme', 'darkMode']).then(({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  });
}).catch(() => {});
})();
  if (!theme && darkMode) theme = 'dark';
  applyTheme(theme || 'retro');
});
document.getElementById('themeToggle');

const MESSAGES = [
  'No ads here, bestie! 💕',
  'Keeping Reddit sparkly! ✨',
  'Ad-free zone! 🛡️',
  'Blocked with love! 💖',
  'Browse in peace! 🌸',
];

const todayEl = document.getElementById('today-count');
const totalEl = document.getElementById('total-count');
const msgEl = document.getElementById('message');

function render(data) {
  const today = new Date().toISOString().slice(0, 10);
  const needsReset = data.lastResetDate !== today;
  todayEl.textContent = needsReset ? 0 : (data.hiddenToday || 0);
  totalEl.textContent = data.hiddenTotal || 0;
}

browser.storage.local.get(['hiddenToday', 'hiddenTotal', 'lastResetDate']).then(render);

browser.storage.onChanged.addListener((changes) => {
  if (changes.hiddenToday) todayEl.textContent = changes.hiddenToday.newValue || 0;
  if (changes.hiddenTotal) totalEl.textContent = changes.hiddenTotal.newValue || 0;
});

msgEl.textContent = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
