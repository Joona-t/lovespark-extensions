'use strict';

LoveSparkTheme.init();

const siteNameEl = document.getElementById('siteName');
const siteTimeEl = document.getElementById('siteTime');
const siteEmojiEl = document.getElementById('siteEmoji');
const alertBox = document.getElementById('alertBox');
const dismissBtn = document.getElementById('dismissBtn');
const thresholdSelect = document.getElementById('thresholdSelect');
const toggleEl = document.getElementById('enableToggle');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Hyperfocus Guard] sendBg error:', err.message);
    return null;
  }
}

function updateUI(data) {
  todayEl.textContent = data.alertsToday || 0;
  totalEl.textContent = data.alertsTotal || 0;
  toggleEl.checked = data.isEnabled !== false;
  thresholdSelect.value = String(data.thresholdMin || 30);

  if (data.currentSite) {
    siteNameEl.textContent = data.currentSite;
    siteTimeEl.textContent = data.elapsed + ' min';
    siteEmojiEl.textContent = data.elapsed >= (data.thresholdMin || 30) ? '\u{1F6A8}' : '\u{1F310}';
  } else {
    siteNameEl.textContent = 'No site tracked';
    siteTimeEl.textContent = '0 min';
    siteEmojiEl.textContent = '\u{1F310}';
  }

  alertBox.hidden = !data.alerted;
}

thresholdSelect.addEventListener('change', async () => {
  await sendBg({ type: 'SET_THRESHOLD', minutes: parseInt(thresholdSelect.value) });
});

toggleEl.addEventListener('change', async () => {
  await sendBg({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

dismissBtn.addEventListener('click', async () => {
  await sendBg({ type: 'DISMISS_ALERT' });
  alertBox.hidden = true;
  siteEmojiEl.textContent = '\u{1F310}';
});

async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateUI(data);
}

chrome.storage.onChanged.addListener(() => refreshData());
refreshData();
