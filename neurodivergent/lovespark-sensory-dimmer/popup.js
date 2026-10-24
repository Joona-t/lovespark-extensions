'use strict';

LoveSparkTheme.init();

const toggleEl = document.getElementById('enableToggle');
const statusText = document.getElementById('statusText');
const brightnessSlider = document.getElementById('brightnessSlider');
const contrastSlider = document.getElementById('contrastSlider');
const saturationSlider = document.getElementById('saturationSlider');
const brightnessVal = document.getElementById('brightnessVal');
const contrastVal = document.getElementById('contrastVal');
const saturationVal = document.getElementById('saturationVal');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

if (typeof LoveSparkFooter !== 'undefined') footerMount.innerHTML = LoveSparkFooter.render();

async function sendBg(msg) {
  try { return await chrome.runtime.sendMessage(msg); }
  catch (err) { return null; }
}

function updateSliderLabels() {
  brightnessVal.textContent = brightnessSlider.value + '%';
  contrastVal.textContent = contrastSlider.value + '%';
  saturationVal.textContent = saturationSlider.value + '%';
}

toggleEl.addEventListener('change', async () => {
  await sendBg({ type: 'SET_ENABLED', enabled: toggleEl.checked });
  statusText.textContent = toggleEl.checked ? 'Dimming active' : 'Dimming off';
});

[brightnessSlider, contrastSlider, saturationSlider].forEach(s => {
  s.addEventListener('input', updateSliderLabels);
  s.addEventListener('change', async () => {
    await sendBg({
      type: 'SET_LEVELS',
      brightness: parseInt(brightnessSlider.value),
      contrast: parseInt(contrastSlider.value),
      saturation: parseInt(saturationSlider.value)
    });
  });
});

async function init() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    todayEl.textContent = data.dimsToday || 0;
    totalEl.textContent = data.dimsTotal || 0;
    toggleEl.checked = data.isEnabled !== false;
    statusText.textContent = data.isEnabled !== false ? 'Dimming active' : 'Dimming off';
    brightnessSlider.value = data.brightness || 70;
    contrastSlider.value = data.contrast || 85;
    saturationSlider.value = data.saturation || 60;
    updateSliderLabels();
  }
}

init();
