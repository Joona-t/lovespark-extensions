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
  browser.storage.local.set({ theme: next });
}
browser.storage.local.get(['theme', 'darkMode']).then(({ theme, darkMode }) => {
  if (!theme && darkMode) theme = 'dark';
  applyTheme(theme || 'retro');
});
document.getElementById('themeTab').addEventListener('click', cycleTheme);

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
