'use strict';

// Dark mode
chrome.storage.local.get(['darkMode'], ({ darkMode }) => {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  const btn = document.getElementById('btnDarkMode');
  if (btn) btn.textContent = darkMode ? '☀️' : '🌙';
});
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  chrome.storage.local.set({ darkMode: !isDark });
  const btn = document.getElementById('btnDarkMode');
  if (btn) btn.textContent = isDark ? '🌙' : '☀️';
}
document.getElementById('btnDarkMode').addEventListener('click', toggleTheme);

const MEDALS = [
  { name: 'Bronze',  emoji: '\u{1F949}', threshold: 5 },
  { name: 'Silver',  emoji: '\u{1F948}', threshold: 15 },
  { name: 'Gold',    emoji: '\u{1F947}', threshold: 30 },
  { name: 'Diamond', emoji: '\u{1F48E}', threshold: 50 },
  { name: 'Crown',   emoji: '\u{1F451}', threshold: 75 },
  { name: 'Ultra',   emoji: '\u{1FAB7}', threshold: 100 },
];

const MASTERY_TIERS = [
  { name: 'Novice',      icon: '\u{1F331}', totalPipes: 0 },
  { name: 'Fledgling',   icon: '\u{1F423}', totalPipes: 100 },
  { name: 'Flapper',     icon: '\u{1F98B}', totalPipes: 500 },
  { name: 'Ace',         icon: '\u2B50',    totalPipes: 1500 },
  { name: 'Veteran',     icon: '\u{1F396}', totalPipes: 3000 },
  { name: 'Master',      icon: '\u{1F451}', totalPipes: 6000 },
  { name: 'Legend',       icon: '\u{1F31F}', totalPipes: 10000 },
  { name: 'Waifu Queen', icon: '\u{1F48E}', totalPipes: 20000 },
];

function getMastery(pipes) {
  let tier = MASTERY_TIERS[0];
  let nextTier = MASTERY_TIERS[1];
  for (let i = 0; i < MASTERY_TIERS.length; i++) {
    if (pipes >= MASTERY_TIERS[i].totalPipes) {
      tier = MASTERY_TIERS[i];
      nextTier = MASTERY_TIERS[i + 1] || null;
    }
  }
  return { tier, nextTier };
}

function loadStats() {
  chrome.storage.local.get(null, (data) => {
    document.getElementById('stat-best').textContent = data.bestScore || 0;
    document.getElementById('stat-games').textContent = data.totalGames || 0;
    const avg = data.totalGames > 0 ? ((data.totalScore || 0) / data.totalGames).toFixed(1) : '0';
    document.getElementById('stat-avg').textContent = avg;
    document.getElementById('stat-pipes').textContent = data.totalPipes || 0;
    document.getElementById('stat-combo').textContent = data.bestCombo || 0;
    document.getElementById('stat-near').textContent = data.totalNearMisses || 0;

    if (data.highestMedal) {
      const m = MEDALS.find(m => m.name === data.highestMedal);
      document.getElementById('stat-medal').textContent = m ? (m.emoji + ' ' + m.name) : data.highestMedal;
    } else {
      document.getElementById('stat-medal').textContent = '\u2014';
    }
    document.getElementById('stat-date').textContent = data.lastPlayed || '\u2014';

    // Graze stats
    document.getElementById('stat-graze-close').textContent = data.totalGrazeClose || 0;
    document.getElementById('stat-graze-graze').textContent = data.totalGrazeGraze || 0;
    document.getElementById('stat-graze-perfect').textContent = data.totalGrazePerfect || 0;

    // Streak & economy
    document.getElementById('stat-streak').textContent = data.streak || 0;
    document.getElementById('stat-streak-best').textContent = data.streakBest || 0;
    document.getElementById('stat-shields').textContent = data.streakShields || 0;
    document.getElementById('stat-hearts').textContent = (data.hearts || 0) + ' \u{1F496}';
    document.getElementById('stat-hearts-life').textContent = (data.heartsLifetime || 0) + ' \u{1F496}';

    // Mastery
    const pipes = data.totalPipes || 0;
    const { tier, nextTier } = getMastery(pipes);
    document.getElementById('mastery-icon').textContent = tier.icon;
    document.getElementById('mastery-hearts').textContent = (data.hearts || 0) + ' \u{1F496}';
    if (nextTier) {
      const progress = pipes - tier.totalPipes;
      const needed = nextTier.totalPipes - tier.totalPipes;
      const pct = Math.min(100, (progress / needed) * 100);
      document.getElementById('mastery-name').textContent = tier.name + ' \u2192 ' + nextTier.name;
      document.getElementById('mastery-fill').style.width = pct + '%';
      document.getElementById('mastery-pct').textContent = pipes + ' / ' + nextTier.totalPipes;
    } else {
      document.getElementById('mastery-name').textContent = tier.name + ' (MAX)';
      document.getElementById('mastery-fill').style.width = '100%';
      document.getElementById('mastery-pct').textContent = pipes + ' pipes';
    }
  });
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
