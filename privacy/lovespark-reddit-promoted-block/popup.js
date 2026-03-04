// Dark mode
browser.storage.local.get(['darkMode']).then(({ darkMode }) => {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  const btn = document.getElementById('btnDarkMode');
  if (btn) btn.textContent = darkMode ? '☀️' : '🌙';
});
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  browser.storage.local.set({ darkMode: !isDark });
  const btn = document.getElementById('btnDarkMode');
  if (btn) btn.textContent = isDark ? '🌙' : '☀️';
}
document.getElementById('btnDarkMode').addEventListener('click', toggleTheme);

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
