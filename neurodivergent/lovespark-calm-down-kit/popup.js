'use strict';

LoveSparkTheme.init();

const rateSection = document.getElementById('rateSection');
const techniqueSection = document.getElementById('techniqueSection');
const intensitySlider = document.getElementById('intensitySlider');
const intensityNum = document.getElementById('intensityNum');
const getHelpBtn = document.getElementById('getHelpBtn');
const techLevel = document.getElementById('techLevel');
const techEmoji = document.getElementById('techEmoji');
const techName = document.getElementById('techName');
const techSteps = document.getElementById('techSteps');
const anotherBtn = document.getElementById('anotherBtn');
const backBtn = document.getElementById('backBtn');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

let currentIntensity = 5;

if (typeof LoveSparkFooter !== 'undefined') footerMount.innerHTML = LoveSparkFooter.render();

async function sendBg(msg) {
  try { return await chrome.runtime.sendMessage(msg); }
  catch (_) { return null; }
}

intensitySlider.addEventListener('input', () => {
  currentIntensity = parseInt(intensitySlider.value);
  intensityNum.textContent = currentIntensity;
});

async function showTechnique() {
  const result = await sendBg({ type: 'GET_TECHNIQUE', intensity: currentIntensity });
  if (!result || !result.technique) return;
  const levelLabels = { high: 'High intensity — crisis tools', medium: 'Medium — grounding tools', low: 'Low — reflection tools' };
  techLevel.textContent = levelLabels[result.level] || result.level;
  techEmoji.textContent = result.technique.emoji;
  techName.textContent = result.technique.name;
  techSteps.textContent = result.technique.steps;
  rateSection.hidden = true;
  techniqueSection.hidden = false;
  await refreshStats();
}

getHelpBtn.addEventListener('click', showTechnique);

anotherBtn.addEventListener('click', async () => {
  const result = await sendBg({ type: 'GET_TECHNIQUE', intensity: currentIntensity });
  if (result && result.technique) {
    techEmoji.textContent = result.technique.emoji;
    techName.textContent = result.technique.name;
    techSteps.textContent = result.technique.steps;
  }
});

backBtn.addEventListener('click', () => {
  techniqueSection.hidden = true;
  rateSection.hidden = false;
});

async function refreshStats() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    todayEl.textContent = data.usesToday || 0;
    totalEl.textContent = data.usesTotal || 0;
  }
}

refreshStats();
