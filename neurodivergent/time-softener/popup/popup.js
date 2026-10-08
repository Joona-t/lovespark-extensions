'use strict';

LoveSparkTheme.init();

const CUTE_MSGS = [
  'Discipline should feel like tending a garden.',
  'No shame, just gentle intention.',
  'You\u2019re doing amazing, bestie.',
  'A pause is a gift, not a punishment.',
  'The internet will still be there.',
  'Breathe. Choose. Bloom.',
];

const masterToggle = document.getElementById('master-toggle');
const todayEl = document.getElementById('today-count');
const totalEl = document.getElementById('total-count');
const pauseSlider = document.getElementById('pause-duration');
const pauseValue = document.getElementById('pause-value');
const cooldownSlider = document.getElementById('cooldown-duration');
const cooldownValue = document.getElementById('cooldown-value');
const siteInput = document.getElementById('site-input');
const addSiteBtn = document.getElementById('add-site-btn');
const siteList = document.getElementById('site-list');
const cuteMsgEl = document.getElementById('cute-msg');

let sites = [];

async function init() {
  var data = await chrome.storage.local.get(['enabled', 'sites', 'pauseDuration', 'cooldownMinutes', 'todaySoftened', 'totalSoftened']);

  masterToggle.checked = data.enabled !== false;
  todayEl.textContent = data.todaySoftened || 0;
  totalEl.textContent = data.totalSoftened || 0;

  pauseSlider.value = data.pauseDuration || 5;
  pauseValue.textContent = pauseSlider.value + 's';

  cooldownSlider.value = data.cooldownMinutes || 15;
  cooldownValue.textContent = cooldownSlider.value + 'm';

  sites = data.sites || [];
  renderSites();
  rotateMsgs();
}

function renderSites() {
  siteList.textContent = '';
  if (sites.length === 0) {
    var empty = document.createElement('li');
    empty.className = 'site-empty';
    empty.textContent = 'No sites added yet';
    siteList.appendChild(empty);
    return;
  }
  for (var i = 0; i < sites.length; i++) {
    var li = document.createElement('li');
    li.className = 'site-item';

    var span = document.createElement('span');
    span.textContent = sites[i];

    var btn = document.createElement('button');
    btn.className = 'site-remove';
    btn.textContent = '\u00D7';
    btn.title = 'Remove ' + sites[i];
    btn.dataset.site = sites[i];
    btn.addEventListener('click', function() {
      sites = sites.filter(function(s) { return s !== this.dataset.site; }.bind(this));
      chrome.storage.local.set({ sites: sites });
      renderSites();
    });

    li.appendChild(span);
    li.appendChild(btn);
    siteList.appendChild(li);
  }
}

masterToggle.addEventListener('change', function() {
  chrome.storage.local.set({ enabled: masterToggle.checked });
});

pauseSlider.addEventListener('input', function() {
  pauseValue.textContent = pauseSlider.value + 's';
  chrome.storage.local.set({ pauseDuration: parseInt(pauseSlider.value, 10) });
});

cooldownSlider.addEventListener('input', function() {
  cooldownValue.textContent = cooldownSlider.value + 'm';
  chrome.storage.local.set({ cooldownMinutes: parseInt(cooldownSlider.value, 10) });
});

function addSite() {
  var raw = siteInput.value.trim().toLowerCase();
  if (!raw) return;
  var domain = raw;
  try {
    if (raw.includes('://')) domain = new URL(raw).hostname;
  } catch (err) { console.warn('[popup] addSite:', err); }
  domain = domain.replace(/^www\./, '');
  if (!domain || domain.indexOf('.') === -1) return;
  if (sites.indexOf(domain) !== -1) { siteInput.value = ''; return; }
  sites.push(domain);
  chrome.storage.local.set({ sites: sites });
  siteInput.value = '';
  renderSites();
}

addSiteBtn.addEventListener('click', addSite);
siteInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') addSite();
});

function rotateMsgs() {
  var idx = 0;
  setInterval(function() {
    idx = (idx + 1) % CUTE_MSGS.length;
    cuteMsgEl.style.opacity = '0';
    setTimeout(function() {
      cuteMsgEl.textContent = CUTE_MSGS[idx];
      cuteMsgEl.style.opacity = '1';
    }, 200);
  }, 3500);
}

chrome.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local') return;
  if (changes.todaySoftened) todayEl.textContent = changes.todaySoftened.newValue || 0;
  if (changes.totalSoftened) totalEl.textContent = changes.totalSoftened.newValue || 0;
  if (changes.enabled) masterToggle.checked = changes.enabled.newValue !== false;
});

init();

document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
