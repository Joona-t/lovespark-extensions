/**
 * Popup UI — settings management + stats display.
 */

// Theme dropdown — shared lib (lib/lovespark-theme.js)
LoveSparkTheme.init();

const DEFAULTS = {
  theme: 'dracula',
  artWidth: 120,
  fontSize: 8,
  convertedToday: 0,
  convertedTotal: 0,
  lastResetDate: '',
};

const MESSAGES = [
  'Code is art! 🌸',
  'Making pixels sparkle! ✨',
  'Browse in beauty! 💕',
  'Your images, reimagined! 💖',
  'Syntax never looked so good! 🎨',
  'Turning photos into poetry! ✨',
  'Art mode: activated! 💕',
  'Stay creative, bestie! 🌸',
];


// ── Init ────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.local.get(DEFAULTS);

  // Daily reset check
  const today = new Date().toISOString().slice(0, 10);
  if (data.lastResetDate !== today) {
    data.convertedToday = 0;
    data.lastResetDate = today;
    await chrome.storage.local.set({
      convertedToday: 0,
      lastResetDate: today,
    });
  }

  // Theme pills
  initPills('themeSelector', data.theme, value => {
    chrome.storage.local.set({ theme: value });
  });

  // Font size pills
  initPills('fontSizeSelector', String(data.fontSize), value => {
    chrome.storage.local.set({ fontSize: parseInt(value, 10) });
  });

  // Width slider
  const widthSlider = document.getElementById('widthSlider');
  const widthValue = document.getElementById('widthValue');
  widthSlider.value = data.artWidth;
  widthValue.textContent = data.artWidth + ' chars';

  widthSlider.addEventListener('input', () => {
    const val = parseInt(widthSlider.value, 10);
    widthValue.textContent = val + ' chars';
    chrome.storage.local.set({ artWidth: val });
  });

  // Stats
  document.getElementById('todayCount').textContent = data.convertedToday;
  document.getElementById('totalCount').textContent = data.convertedTotal;

  // Motivational message
  const msgEl = document.getElementById('motivational');
  msgEl.textContent = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
});


// ── Pill Selector ───────────────────────────────────────────────────

function initPills(containerId, activeValue, onChange) {
  const container = document.getElementById(containerId);
  const pills = container.querySelectorAll('.pill');

  pills.forEach(pill => {
    if (pill.dataset.value === activeValue) {
      pill.classList.add('active');
    }

    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      onChange(pill.dataset.value);
    });
  });
}

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
