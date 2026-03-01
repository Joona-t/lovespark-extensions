'use strict';

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

const CHALLENGE_POOL = [
  { type: 'score',    target: 5,  desc: 'Score 5 in one run',          hearts: 40,  diff: 'easy' },
  { type: 'games',    target: 3,  desc: 'Play 3 games',                hearts: 30,  diff: 'easy' },
  { type: 'pipes',    target: 15, desc: 'Clear 15 pipes today',        hearts: 35,  diff: 'easy' },
  { type: 'score',    target: 15, desc: 'Score 15 in one run',         hearts: 60,  diff: 'medium' },
  { type: 'nearMiss', target: 3,  desc: 'Get 3 close calls in one run',hearts: 55,  diff: 'medium' },
  { type: 'combo',    target: 8,  desc: 'Reach an 8-combo',            hearts: 65,  diff: 'medium' },
  { type: 'score',    target: 30, desc: 'Score 30 in one run',         hearts: 100, diff: 'hard' },
  { type: 'graze',    target: 2,  desc: 'Get 2 Perfect grazes',        hearts: 90,  diff: 'hard' },
  { type: 'combo',    target: 15, desc: 'Reach a 15-combo',            hearts: 100, diff: 'hard' },
  { type: 'medal',    target: 'Gold', desc: 'Earn Gold medal or higher',hearts: 80, diff: 'hard' },
];

const STREAK_STAMPS = ['\u{1F338}', '\u2728', '\u{1F496}', '\u2B50', '\u{1F319}', '\u{1F98B}', '\u{1F451}'];

function hashDate(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function getMastery(pipes) {
  let tier = MASTERY_TIERS[0];
  for (const t of MASTERY_TIERS) { if (pipes >= t.totalPipes) tier = t; }
  return tier;
}

function pickDailyChallenge(dateStr, playerBest) {
  const pool = CHALLENGE_POOL.filter(c => {
    if (playerBest < 10) return c.diff === 'easy';
    if (playerBest < 30) return c.diff !== 'hard';
    return true;
  });
  return pool[hashDate(dateStr + 'flappywaifu') % pool.length];
}

const playBtn = document.getElementById('play-btn');
const settingsLink = document.getElementById('settings-link');

playBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('game.html') });
});

settingsLink.addEventListener('click', (e) => {
  e.preventDefault();
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

chrome.storage.local.get(null, (data) => {
  // Basic stats
  document.getElementById('stat-best').textContent = data.bestScore || 0;
  document.getElementById('stat-games').textContent = data.totalGames || 0;
  document.getElementById('stat-combo').textContent = data.bestCombo || 0;

  // Hearts
  document.getElementById('hearts-badge').innerHTML = (data.hearts || 0) + ' <span class="heart-icon">&hearts;</span>';

  // Mastery
  const mastery = getMastery(data.totalPipes || 0);
  document.getElementById('mastery-tag').textContent = mastery.icon + ' ' + mastery.name;

  // Waifu mood
  const today = new Date().toISOString().slice(0, 10);
  const moodEl = document.getElementById('mood-text');
  if (data.lastPlayed !== today) {
    moodEl.textContent = 'Play with me? \u{1F4A4}';
  } else if (data.dailyChallengeComplete) {
    moodEl.textContent = 'Great job today! \u{1F496}';
  } else {
    moodEl.textContent = "Let's do the challenge! \u2728";
  }

  // Daily challenge
  const challenge = data.dailyChallengeDate === today
    ? CHALLENGE_POOL[data.dailyChallengeIdx] || pickDailyChallenge(today, data.bestScore || 0)
    : pickDailyChallenge(today, data.bestScore || 0);
  const progress = data.dailyChallengeDate === today ? (data.dailyChallengeProgress || 0) : 0;
  const complete = data.dailyChallengeDate === today && data.dailyChallengeComplete;

  document.getElementById('daily-desc').textContent = (complete ? '\u2713 ' : '') + challenge.desc;
  document.getElementById('daily-reward').textContent = '+' + challenge.hearts + ' \u{1F496}';
  const pct = Math.min(100, (progress / challenge.target) * 100);
  document.getElementById('daily-fill').style.width = pct + '%';
  document.getElementById('daily-pct').textContent = complete ? 'Done!' : Math.round(pct) + '%';

  // Streak
  const streak = data.streak || 0;
  document.getElementById('streak-count').textContent = streak;
  const stampsEl = document.getElementById('streak-stamps');
  const dayInCycle = streak % 7;
  let stampsHtml = '';
  for (let i = 0; i < 7; i++) {
    const filled = i < dayInCycle || (dayInCycle === 0 && streak > 0);
    stampsHtml += '<span class="stamp' + (filled ? ' stamp-filled' : '') + '">' +
      (filled ? STREAK_STAMPS[i] : '\u25CB') + '</span>';
  }
  stampsEl.innerHTML = stampsHtml;
});
