'use strict';

LoveSparkTheme.init();

var DEFAULTS = {
  debounceMs: 1500,
  minLength: 10,
  maxEntries: 200,
  maxAgeDays: 7
};

var debounceSlider = document.getElementById('debounceSlider');
var debounceValue = document.getElementById('debounceValue');
var minLengthSlider = document.getElementById('minLengthSlider');
var minLengthValue = document.getElementById('minLengthValue');
var maxEntriesSlider = document.getElementById('maxEntriesSlider');
var maxEntriesValue = document.getElementById('maxEntriesValue');
var maxAgeDaysSlider = document.getElementById('maxAgeDaysSlider');
var maxAgeDaysValue = document.getElementById('maxAgeDaysValue');
var saveBtn = document.getElementById('saveBtn');
var resetBtn = document.getElementById('resetBtn');
var saveStatus = document.getElementById('saveStatus');

function updateLabels() {
  var ms = Number(debounceSlider.value);
  debounceValue.textContent = (ms / 1000) + 's';
  minLengthValue.textContent = minLengthSlider.value + ' chars';
  maxEntriesValue.textContent = maxEntriesSlider.value;
  maxAgeDaysValue.textContent = maxAgeDaysSlider.value + (maxAgeDaysSlider.value === '1' ? ' day' : ' days');
}

function applySettings(s) {
  debounceSlider.value = s.debounceMs;
  minLengthSlider.value = s.minLength;
  maxEntriesSlider.value = s.maxEntries;
  maxAgeDaysSlider.value = s.maxAgeDays;
  updateLabels();
}

function currentSettings() {
  return {
    debounceMs: Number(debounceSlider.value),
    minLength: Number(minLengthSlider.value),
    maxEntries: Number(maxEntriesSlider.value),
    maxAgeDays: Number(maxAgeDaysSlider.value)
  };
}

function showStatus(msg) {
  saveStatus.textContent = msg;
  saveStatus.className = 'save-status success';
  setTimeout(function () {
    saveStatus.classList.add('fade');
    setTimeout(function () {
      saveStatus.textContent = '';
      saveStatus.className = 'save-status';
    }, 300);
  }, 2000);
}

debounceSlider.addEventListener('input', updateLabels);
minLengthSlider.addEventListener('input', updateLabels);
maxEntriesSlider.addEventListener('input', updateLabels);
maxAgeDaysSlider.addEventListener('input', updateLabels);

saveBtn.addEventListener('click', function () {
  chrome.storage.local.set({ inputGuardSettings: currentSettings() }, function () {
    showStatus('Settings saved!');
  });
});

resetBtn.addEventListener('click', function () {
  applySettings(DEFAULTS);
  chrome.storage.local.set({ inputGuardSettings: DEFAULTS }, function () {
    showStatus('Reset to defaults');
  });
});

chrome.storage.local.get(['inputGuardSettings'], function (data) {
  var s = data.inputGuardSettings || DEFAULTS;
  applySettings(s);
});
