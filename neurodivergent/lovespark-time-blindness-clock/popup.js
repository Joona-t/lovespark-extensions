'use strict';

LoveSparkTheme.init();

const bigTimeEl = document.getElementById('bigTime');
const bigDateEl = document.getElementById('bigDate');
const markersListEl = document.getElementById('markersList');
const dayBar = document.getElementById('dayBar');
const dayPct = document.getElementById('dayPct');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

let markers = [];

if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Time Blindness Clock] sendBg error:', err.message);
    return null;
  }
}

function updateClock() {
  const now = new Date();
  const hours = now.getHours();
  const mins = now.getMinutes();
  bigTimeEl.textContent = String(hours).padStart(2, '0') + ':' + String(mins).padStart(2, '0');
  bigDateEl.textContent = now.toLocaleDateString('en', { weekday: 'long', month: 'long', day: 'numeric' });

  // Day progress (6 AM to 10 PM = 16 hour day)
  const dayStart = 6;
  const dayEnd = 22;
  const dayHours = dayEnd - dayStart;
  const currentHour = hours + mins / 60;
  const dayProgress = Math.max(0, Math.min(100, Math.round(((currentHour - dayStart) / dayHours) * 100)));
  dayBar.style.width = dayProgress + '%';
  dayBar.setAttribute('aria-valuenow', dayProgress);
  dayPct.textContent = dayProgress + '%';
}

function renderMarkers() {
  markersListEl.textContent = '';
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  for (const marker of markers) {
    const parts = marker.time.split(':');
    const markerMins = parseInt(parts[0]) * 60 + parseInt(parts[1]);
    const diff = markerMins - nowMins;

    const item = document.createElement('div');
    item.className = 'marker-item';
    item.setAttribute('role', 'listitem');

    const label = document.createElement('span');
    label.className = 'marker-label';
    label.textContent = marker.label;

    const until = document.createElement('span');
    if (diff > 0) {
      const h = Math.floor(diff / 60);
      const m = diff % 60;
      until.className = 'marker-until';
      until.textContent = 'in ' + (h > 0 ? h + 'h ' : '') + m + 'm';
    } else if (diff > -30) {
      until.className = 'marker-until';
      until.textContent = 'now';
    } else {
      until.className = 'marker-until marker-past';
      until.textContent = 'passed';
    }

    item.appendChild(label);
    item.appendChild(until);
    markersListEl.appendChild(item);
  }
}

async function init() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    todayEl.textContent = data.checksToday || 0;
    totalEl.textContent = data.checksTotal || 0;
    markers = data.markers || [];
    renderMarkers();
  }
  updateClock();

  // Update clock every second
  const tickId = setInterval(() => {
    updateClock();
    renderMarkers();
  }, 10000);
}

init();
