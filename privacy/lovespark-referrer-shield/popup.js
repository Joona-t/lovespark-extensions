'use strict';

// Theme dropdown
function applyTheme(t) {
  // Delegate to the shared lib (lib/lovespark-theme.js) for class + label + active state.
  LoveSparkTheme.apply(t);
}
(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  if (toggle && menu) {
    toggle.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!menu.classList.contains('open')); });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      applyTheme(theme);
      chrome.storage.local.set({ theme });
      setOpen(false);
    });
    document.addEventListener('click', () => setOpen(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setOpen(false); });
  }
  chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  });
})();

const CUTE_MSGS = [
  'Browse in peace! 💕',
  'Your path is hidden! ✨',
  'Privacy first, bestie! 🌸',
  'Stay sparkly & safe! 💖',
  'No one knows where you were! 🛡️',
  'Referrers? Not today! 🌙',
];

const MODE_LABELS = {
  strip: 'Strip all',
  origin: 'Origin only',
  off: 'Off'
};

let msgIndex = 0;

// ── DOM refs ──────────────────────────────────────────────────────────────────

const modeRadios     = document.querySelectorAll('input[name="mode"]');
const statusIcon     = document.getElementById('status-icon');
const statusText     = document.getElementById('status-text');
const streakValue    = document.getElementById('streak-value');
const modeValue      = document.getElementById('mode-value');
const cuteMsgEl      = document.getElementById('cute-msg');
const whitelistList  = document.getElementById('whitelist-list');
const whitelistEmpty = document.getElementById('whitelist-empty');
const wlInput        = document.getElementById('wl-input');
const wlAddBtn       = document.getElementById('wl-add-btn');

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const data = await chrome.runtime.sendMessage({ type: 'GET_STATE' });
  applyState(data);
  setInterval(rotateCuteMsg, 3500);
}

function applyState(data) {
  const mode = data.mode || 'origin';

  // Radio buttons
  for (const radio of modeRadios) {
    radio.checked = radio.value === mode;
  }

  // Status card
  updateStatusUI(mode);

  // Streak
  const days = data.currentStreakDays || 0;
  streakValue.textContent = days === 1 ? '1 day' : `${days} days`;
  if (mode === 'off') streakValue.classList.add('off');
  else streakValue.classList.remove('off');

  // Mode label
  modeValue.textContent = MODE_LABELS[mode];

  // Whitelist
  renderWhitelist(data.whitelistedDomains || []);
}

function updateStatusUI(mode) {
  if (mode === 'off') {
    statusIcon.textContent = '⏸️';
    statusText.textContent = 'Shield off';
    statusText.classList.add('off');
  } else {
    statusIcon.textContent = '🛡️';
    statusText.textContent = 'Shield active';
    statusText.classList.remove('off');
  }
}

// ── Mode switching ────────────────────────────────────────────────────────────

for (const radio of modeRadios) {
  radio.addEventListener('change', async (e) => {
    const mode = e.target.value;
    await chrome.runtime.sendMessage({ type: 'SET_MODE', mode });
    updateStatusUI(mode);
    modeValue.textContent = MODE_LABELS[mode];

    if (mode === 'off') {
      streakValue.textContent = '0 days';
      streakValue.classList.add('off');
    } else {
      streakValue.classList.remove('off');
    }
  });
}

// ── Whitelist ─────────────────────────────────────────────────────────────────

function renderWhitelist(domains) {
  whitelistList.replaceChildren();
  whitelistEmpty.style.display = domains.length ? 'none' : 'block';

  for (const domain of domains) {
    const li = document.createElement('li');
    li.className = 'whitelist-item';

    const span = document.createElement('span');
    span.className = 'domain-text';
    span.textContent = domain;

    const btn = document.createElement('button');
    btn.className = 'wl-remove-btn';
    btn.textContent = '\u00d7';
    btn.title = 'Remove';
    btn.setAttribute('aria-label', `Remove ${domain} from whitelist`);
    btn.addEventListener('click', () => removeDomain(domain));

    li.append(span, btn);
    whitelistList.appendChild(li);
  }
}

async function addDomain() {
  const raw = wlInput.value.trim().toLowerCase()
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .replace(/\/.*$/, '');

  if (!raw || !raw.includes('.')) return;

  const result = await chrome.runtime.sendMessage({ type: 'ADD_WHITELIST', domain: raw });
  if (result.domains) renderWhitelist(result.domains);
  wlInput.value = '';
}

async function removeDomain(domain) {
  const result = await chrome.runtime.sendMessage({ type: 'REMOVE_WHITELIST', domain });
  if (result.domains) renderWhitelist(result.domains);
}

wlAddBtn.addEventListener('click', addDomain);
wlInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addDomain();
});

// ── Cute message rotation ─────────────────────────────────────────────────────

function rotateCuteMsg() {
  msgIndex = (msgIndex + 1) % CUTE_MSGS.length;
  cuteMsgEl.style.opacity = '0';
  setTimeout(() => {
    cuteMsgEl.textContent = CUTE_MSGS[msgIndex];
    cuteMsgEl.style.opacity = '1';
  }, 200);
}

// ── Start ─────────────────────────────────────────────────────────────────────

init();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
