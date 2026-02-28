'use strict';

const playBtn = document.getElementById('play-btn');
const settingsLink = document.getElementById('settings-link');
const statBest = document.getElementById('stat-best');
const statGames = document.getElementById('stat-games');
const statCombo = document.getElementById('stat-combo');

playBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('game.html') });
});

settingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

chrome.storage.local.get(['bestScore', 'totalGames', 'bestCombo'], (data) => {
  statBest.textContent = data.bestScore || 0;
  statGames.textContent = data.totalGames || 0;
  statCombo.textContent = data.bestCombo || 0;
});
