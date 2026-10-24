'use strict';

LoveSparkTheme.init();

const stretchEmoji = document.getElementById('stretchEmoji');
const stretchName = document.getElementById('stretchName');
const stretchDuration = document.getElementById('stretchDuration');
const stretchSteps = document.getElementById('stretchSteps');
const doneBtn = document.getElementById('doneBtn');
const skipBtn = document.getElementById('skipBtn');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

if (typeof LoveSparkFooter !== 'undefined') footerMount.innerHTML = LoveSparkFooter.render();

async function sendBg(msg) {
  try { return await chrome.runtime.sendMessage(msg); }
  catch (_) { return null; }
}

function showStretch(stretch) {
  if (!stretch) return;
  stretchEmoji.textContent = stretch.emoji;
  stretchName.textContent = stretch.name;
  stretchDuration.textContent = stretch.duration;
  stretchSteps.textContent = stretch.steps;
}

doneBtn.addEventListener('click', async () => {
  await sendBg({ type: 'LOG_DONE' });
  const result = await sendBg({ type: 'NEXT_STRETCH' });
  if (result && result.stretch) showStretch(result.stretch);
  await refreshStats();
  LoveSparkPopup.pop(doneBtn);
});

skipBtn.addEventListener('click', async () => {
  const result = await sendBg({ type: 'NEXT_STRETCH' });
  if (result && result.stretch) showStretch(result.stretch);
});

async function refreshStats() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    todayEl.textContent = data.stretchesToday || 0;
    totalEl.textContent = data.stretchesTotal || 0;
    if (data.stretch) showStretch(data.stretch);
  }
}

refreshStats();
