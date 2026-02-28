'use strict';

const MEDALS = [
  { name: 'Bronze',  emoji: '\u{1F949}', threshold: 5 },
  { name: 'Silver',  emoji: '\u{1F948}', threshold: 15 },
  { name: 'Gold',    emoji: '\u{1F947}', threshold: 30 },
  { name: 'Diamond', emoji: '\u{1F48E}', threshold: 50 },
  { name: 'Crown',   emoji: '\u{1F451}', threshold: 75 },
  { name: 'Ultra',   emoji: '\u{1FAB7}', threshold: 100 },
];

const els = {
  best:  document.getElementById('stat-best'),
  games: document.getElementById('stat-games'),
  avg:   document.getElementById('stat-avg'),
  pipes: document.getElementById('stat-pipes'),
  combo: document.getElementById('stat-combo'),
  near:  document.getElementById('stat-near'),
  medal: document.getElementById('stat-medal'),
  date:  document.getElementById('stat-date'),
};

function loadStats() {
  chrome.storage.local.get(
    ['bestScore', 'totalGames', 'totalScore', 'totalPipes', 'bestCombo', 'totalNearMisses', 'highestMedal', 'lastPlayed'],
    (data) => {
      els.best.textContent = data.bestScore || 0;
      els.games.textContent = data.totalGames || 0;
      const avg = data.totalGames > 0 ? ((data.totalScore || 0) / data.totalGames).toFixed(1) : '0';
      els.avg.textContent = avg;
      els.pipes.textContent = data.totalPipes || 0;
      els.combo.textContent = data.bestCombo || 0;
      els.near.textContent = data.totalNearMisses || 0;

      if (data.highestMedal) {
        const m = MEDALS.find(m => m.name === data.highestMedal);
        els.medal.textContent = m ? (m.emoji + ' ' + m.name) : data.highestMedal;
      } else {
        els.medal.textContent = '\u2014';
      }

      els.date.textContent = data.lastPlayed || '\u2014';
    }
  );
}

loadStats();

document.getElementById('play-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('game.html') });
});

const confirmDialog = document.getElementById('confirm-dialog');

document.getElementById('reset-btn').addEventListener('click', () => {
  confirmDialog.style.display = 'flex';
});

document.getElementById('confirm-no').addEventListener('click', () => {
  confirmDialog.style.display = 'none';
});

document.getElementById('confirm-yes').addEventListener('click', () => {
  chrome.storage.local.clear(() => {
    confirmDialog.style.display = 'none';
    loadStats();
  });
});
