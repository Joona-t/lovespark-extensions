'use strict';

const Game = (() => {
  // ─── Config ───
  const FRAME_MS = 16.667;
  const MAX_DT = 33;
  const MAX_PARTICLES = 120;
  const REDUCED_MOTION = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ─── Medals ───
  const MEDALS = [
    { name: 'Bronze',  emoji: '\u{1F949}', threshold: 5,   color: '#CD7F32' },
    { name: 'Silver',  emoji: '\u{1F948}', threshold: 15,  color: '#C0C0C0' },
    { name: 'Gold',    emoji: '\u{1F947}', threshold: 30,  color: '#FFD700' },
    { name: 'Diamond', emoji: '\u{1F48E}', threshold: 50,  color: '#B9F2FF' },
    { name: 'Crown',   emoji: '\u{1F451}', threshold: 75,  color: '#FF69B4' },
    { name: 'Ultra',   emoji: '\u{1FAB7}', threshold: 100, color: '#FF00FF' },
  ];

  function getMedal(score) {
    let medal = null;
    for (const m of MEDALS) {
      if (score >= m.threshold) medal = m;
    }
    return medal;
  }

  function getMedalByName(name) {
    return MEDALS.find(m => m.name === name) || null;
  }

  // ─── DOM ───
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const overlay = document.getElementById('overlay');
  const startBtn = document.getElementById('start-btn');
  const scoreDisplay = document.getElementById('score-display');
  const bestNum = document.getElementById('best-num');
  const startContent = document.getElementById('start-content');
  const deathContent = document.getElementById('death-content');
  const finalScore = document.getElementById('final-score');
  const medalBadge = document.getElementById('medal-badge');
  const scoreDelta = document.getElementById('score-delta');
  const deathCombo = document.getElementById('death-combo');
  const deathNearMisses = document.getElementById('death-near-misses');

  // ─── Canvas DPR ───
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = 480 * dpr;
  canvas.height = 640 * dpr;
  ctx.scale(dpr, dpr);

  // ─── Game constants ───
  const C = {
    W: 480, H: 640,
    playerW: 40, playerH: 52, playerX: 100,
    pipeWidth: 64,
    pink: '#ff6eb4',
    pinkBright: '#ff9fd3',
    pinkDark: '#c2185b',
  };

  // ─── Physics (constant — difficulty comes from environment only) ───
  const GRAVITY = 0.32;
  const JUMP_FORCE = -7.8;
  const TERMINAL_VEL = 12;

  // ─── Difficulty curve ───
  const CURVE = [
    { score: 0,   pipeSpeed: 2.0, gapMin: 195, gapMax: 250, spawnMs: 2200 },
    { score: 5,   pipeSpeed: 2.3, gapMin: 185, gapMax: 240, spawnMs: 2100 },
    { score: 10,  pipeSpeed: 2.6, gapMin: 175, gapMax: 230, spawnMs: 2000 },
    { score: 15,  pipeSpeed: 2.9, gapMin: 165, gapMax: 220, spawnMs: 1900 },
    { score: 20,  pipeSpeed: 3.1, gapMin: 155, gapMax: 210, spawnMs: 1800 },
    { score: 30,  pipeSpeed: 3.4, gapMin: 145, gapMax: 200, spawnMs: 1700 },
    { score: 40,  pipeSpeed: 3.7, gapMin: 138, gapMax: 190, spawnMs: 1600 },
    { score: 55,  pipeSpeed: 4.0, gapMin: 130, gapMax: 180, spawnMs: 1550 },
    { score: 70,  pipeSpeed: 4.3, gapMin: 124, gapMax: 172, spawnMs: 1500 },
    { score: 90,  pipeSpeed: 4.6, gapMin: 118, gapMax: 165, spawnMs: 1450 },
    { score: 999, pipeSpeed: 5.0, gapMin: 112, gapMax: 158, spawnMs: 1400 },
  ];

  let _diffCache = null;
  let _diffScore = -1;

  function getDifficulty(score) {
    if (score === _diffScore) return _diffCache;
    let lo = CURVE[0], hi = CURVE[CURVE.length - 1];
    for (let i = 0; i < CURVE.length - 1; i++) {
      if (score >= CURVE[i].score && score < CURVE[i + 1].score) {
        lo = CURVE[i]; hi = CURVE[i + 1]; break;
      }
    }
    const s = lo.score === hi.score ? 1 : Math.min(1, (score - lo.score) / (hi.score - lo.score));
    const lerp = (a, b) => a + (b - a) * s;
    _diffCache = {
      pipeSpeed: lerp(lo.pipeSpeed, hi.pipeSpeed),
      gapMin:    lerp(lo.gapMin, hi.gapMin),
      gapMax:    lerp(lo.gapMax, hi.gapMax),
      spawnMs:   lerp(lo.spawnMs, hi.spawnMs),
    };
    _diffScore = score;
    return _diffCache;
  }

  // ─── Milestones ───
  const MILESTONES = {
    5:   '\u2728 WARMING UP!',
    10:  '\u{1F525} ON FIRE!',
    15:  '\u{1F496} UNSTOPPABLE!',
    20:  '\u26A1 LEGENDARY!',
    30:  '\u{1F338} GODLIKE!',
    50:  '\u{1F451} ASCENDED!',
    75:  '\u{1F430} QUEEN!',
    100: '\u{1FAB7} ULTRA WAIFU!',
  };

  // ─── Graze tiers (expanded near-miss) ───
  const GRAZE_TIERS = [
    { name: 'Perfect', threshold: 3,  hearts: 15, text: 'PERFECT!', color: '#FF69B4', sfxPitch: 1100 },
    { name: 'Graze',   threshold: 6,  hearts: 7,  text: 'GRAZE!',   color: '#FFD700', sfxPitch: 1000 },
    { name: 'Close',   threshold: 12, hearts: 3,  text: 'CLOSE!',   color: '#ffffff', sfxPitch: 900 },
  ];

  // ─── Hearts economy ───
  const HEART_REWARDS = {
    perPipe: 1, comboBonus5: 5, comboBonus10: 15, comboBonus20: 30,
    dailyChallenge: 50, streakDay3: 25, streakDay7: 75, streakDay14: 150, streakDay30: 300,
    newMedal: 100, newBest: 25,
  };

  // ─── Run grades ───
  const RUN_GRADES = [
    { grade: 'S', ratio: 0.95, color: '#FFD700' },
    { grade: 'A', ratio: 0.75, color: '#FF69B4' },
    { grade: 'B', ratio: 0.50, color: '#ff9fd3' },
    { grade: 'C', ratio: 0.25, color: '#A8D8FF' },
    { grade: 'D', ratio: 0,    color: '#ffffff' },
  ];

  // ─── Daily challenge pool ───
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

  // ─── Mastery tiers ───
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

  // ─── Streak config ───
  const STREAK_CONFIG = {
    stamps: ['\u{1F338}', '\u2728', '\u{1F496}', '\u2B50', '\u{1F319}', '\u{1F98B}', '\u{1F451}'],
    shieldThreshold: 7, shieldMax: 3, comebackWindowHours: 48,
  };

  // ─── Waifu speech lines ───
  const WAIFU_SPEECH = {
    start: ["Let's fly together! \u{1F495}", "Tap to flap, bestie! \u2728", "I believe in you! \u{1F338}", "Ready when you are! \u{1F496}"],
    firstDeath: ["Great first try! \u{1F495}", "One more try? I know you can do it! \u2728"],
    score0to2: ["We can do better! \u{1F4AA}", "Shake it off! \u2728", "Try again, bestie! \u{1F338}"],
    score3to9: ["Not bad! Let's go again! \u2728", "Getting warmer! \u{1F496}", "Nice effort! \u{1F338}"],
    score10to19: ["That was great! \u{1F495}", "You're flying! \u2728", "So good! \u{1F496}"],
    score20plus: ["Amazing run!! \u{1F338}", "Incredible! \u{1F496}\u{1F496}", "You're a star! \u{1F31F}"],
    newBest: ["NEW RECORD! I'm so proud! \u{1F496}\u{1F496}", "That's your BEST! \u2728\u{1F496}"],
    nearMissHeavy: ["Living on the edge! \u{1F62E}", "So close so many times! \u{1F496}"],
    comeback2: ["Welcome back! Here's a little gift \u{1F495}"],
    comeback7: ["I missed you! \u{1F496}"],
    comeback30: ["You're back!! I'm so happy! \u{1F338}\u{1F496}\u2728"],
  };

  const COMEBACK_BONUSES = [
    { daysAway: 30, hearts: 100, speechKey: 'comeback30' },
    { daysAway: 7,  hearts: 50,  speechKey: 'comeback7' },
    { daysAway: 2,  hearts: 20,  speechKey: 'comeback2' },
  ];

  // ─── Sound ───
  let audioCtx = null;
  let milestoneBuffer = null;
  let uwuBuffer = null;

  function initAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      loadMilestoneSound();
      loadUwuSound();
    } catch (_) {}
  }

  function loadMilestoneSound() {
    if (!audioCtx || milestoneBuffer) return;
    fetch('milestone.mp3')
      .then(r => r.arrayBuffer())
      .then(buf => audioCtx.decodeAudioData(buf))
      .then(decoded => { milestoneBuffer = decoded; })
      .catch(() => {});
  }

  function loadUwuSound() {
    if (!audioCtx || uwuBuffer) return;
    fetch('uwu.mp3')
      .then(r => r.arrayBuffer())
      .then(buf => audioCtx.decodeAudioData(buf))
      .then(decoded => { uwuBuffer = decoded; })
      .catch(() => {});
  }

  function sfxMilestoneMP3() {
    if (!audioCtx || audioCtx.state !== 'running' || !milestoneBuffer) return;
    const src = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    src.buffer = milestoneBuffer;
    gain.gain.value = 0.35;
    src.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(0);
  }

  function sfxUwu() {
    if (!audioCtx || audioCtx.state !== 'running' || !uwuBuffer) return;
    const src = audioCtx.createBufferSource();
    const gain = audioCtx.createGain();
    src.buffer = uwuBuffer;
    gain.gain.value = 0.4;
    src.connect(gain);
    gain.connect(audioCtx.destination);
    src.start(0);
  }

  function playTone(freq, dur, vol, type, freqEnd) {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const t = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (freqEnd) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(t);
    osc.stop(t + dur);
  }

  function sfxFlap() { playTone(380, 0.07, 0.08, 'sine', 520); }

  function sfxScore(comboCount, absScore) {
    const scorePitch = 523 + Math.min((absScore || 0) * 8, 800);
    const comboPitch = (comboCount - 1) * 30;
    const pitch = Math.min(scorePitch + comboPitch, 2200);
    playTone(pitch, 0.10, 0.10, 'sine', Math.min(pitch * 1.33, 2800));
  }

  function sfxDeath() {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;
    // Diminished chord: 3 triangle oscillators
    const freqs = [200, 240, 284];
    for (const f of freqs) {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now);
      osc.frequency.exponentialRampToValueAtTime(f * 0.4, now + 0.4);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(now);
      osc.stop(now + 0.45);
    }
    // Sub-bass thump
    const sub = audioCtx.createOscillator();
    const subGain = audioCtx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(60, now);
    sub.frequency.exponentialRampToValueAtTime(30, now + 0.2);
    subGain.gain.setValueAtTime(0.15, now);
    subGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    sub.connect(subGain);
    subGain.connect(audioCtx.destination);
    sub.start(now);
    sub.stop(now + 0.25);
  }

  function sfxNearMiss() {
    playTone(900, 0.06, 0.07, 'sine', 1300);
  }

  function sfxMilestone() {
    if (!audioCtx || audioCtx.state !== 'running') return;
    const now = audioCtx.currentTime;
    const notes = [523, 659, 784, 1047];
    for (let i = 0; i < notes.length; i++) {
      const start = now + i * 0.06;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = notes[i];
      gain.gain.setValueAtTime(0.1, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.1);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start(start);
      osc.stop(start + 0.12);
    }
  }

  // ─── Sprite ───
  const playerImg = new Image();
  playerImg.src = 'sprite.png';
  let spriteLoaded = false;
  playerImg.onload = () => { spriteLoaded = true; };

  // ─── State ───
  let state = {};
  let bestScore = 0;
  let lastTime = 0;
  let gameTime = 0;
  let spawnTimer = 0;
  let rafId = null;
  let loopActive = false;
  let particles = [];
  let milestone = null;
  let screenShake = 0;
  let lastMilestoneScore = -1;
  let deathTimer = 0;
  let overlayShown = false;
  let pendingRestart = false;

  // V2: Game feel
  let freezeTimer = 0;
  let freezeActive = false;
  let slowMoTimer = 0;
  let deathTimeScale = 1;
  let squashX = 1;
  let squashY = 1;
  let speedLines = [];
  const MAX_SPEED_LINES = 15;
  let trail = [];
  let trailIdx = 0;
  const TRAIL_SIZE = 5;

  // V2: Audio
  let pulseGain = null;
  let pulseInterval = null;
  let pulseBPM = 80;
  let audioLayers = { hihat: false, arp: false, bassDouble: false };
  let tensionOsc = null;
  let tensionGain = null;

  // V2: Flow & variety
  let pipesSinceRelief = 0;
  let nextReliefAt = 5 + ((Math.random() * 3) | 0);
  let zoneIntensity = 0;
  let zoneTime = 0;
  let pipesUntilBonus = 15 + ((Math.random() * 6) | 0);
  let sessionRuns = 0;
  let grazeStreak = 0;

  // Feedback systems
  let combo = 0;
  let runBestCombo = 0;
  let nearMissCount = 0;
  let nearMissFlash = 0;
  let floatingTexts = [];
  let newBestFlag = false;

  // Hearts & graze tracking (per-run)
  let runHearts = 0;
  let runGrazeClose = 0;
  let runGrazeGraze = 0;
  let runGrazePerfect = 0;
  let runGrade = 'D';
  let runHeartsBreakdown = {};
  let luckyRun = false;

  // Persistent state (loaded from storage)
  let hearts = 0;
  let heartsLifetime = 0;
  let streak = 0;
  let streakBest = 0;
  let streakShields = 0;
  let streakLastDate = '';
  let totalGamesLoaded = 0;
  let totalPipesLoaded = 0;
  let firstEverPipe = false;
  let dailyChallenge = null;
  let dailyChallengeProgress = 0;
  let dailyChallengeComplete = false;
  let comebackMsg = null;
  let comebackHearts = 0;
  let waifuSpeech = '';
  let newMedalFlag = false;

  // ─── Storage ───
  const useChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
  const STORAGE_KEYS = [
    'bestScore', 'totalGames', 'totalScore', 'totalPipes', 'bestCombo', 'totalNearMisses',
    'highestMedal', 'lastPlayed', 'hearts', 'heartsLifetime',
    'streak', 'streakBest', 'streakShields', 'streakLastDate',
    'dailyChallengeDate', 'dailyChallengeIdx', 'dailyChallengeProgress', 'dailyChallengeComplete',
    'totalGrazeClose', 'totalGrazeGraze', 'totalGrazePerfect',
  ];

  function hashDate(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = ((h << 5) - h + str.charCodeAt(i)) | 0;
    return Math.abs(h);
  }

  function getTodayStr() { return new Date().toISOString().slice(0, 10); }

  function pickDailyChallenge(dateStr, playerBest) {
    const pool = CHALLENGE_POOL.filter(c => {
      if (playerBest < 10) return c.diff === 'easy';
      if (playerBest < 30) return c.diff !== 'hard';
      return true;
    });
    const idx = hashDate(dateStr + 'flappywaifu') % pool.length;
    return pool[idx];
  }

  function getMastery(pipes) {
    let tier = MASTERY_TIERS[0];
    for (const t of MASTERY_TIERS) { if (pipes >= t.totalPipes) tier = t; }
    return tier;
  }

  function getRunGrade(score, best) {
    if (best <= 0) return score >= 5 ? RUN_GRADES[1] : RUN_GRADES[3];
    const ratio = score / best;
    for (const g of RUN_GRADES) { if (ratio >= g.ratio) return g; }
    return RUN_GRADES[RUN_GRADES.length - 1];
  }

  function pickRandom(arr) { return arr[(Math.random() * arr.length) | 0]; }

  function updateStreak(data) {
    const today = getTodayStr();
    const lastDate = data.streakLastDate || '';
    if (lastDate === today) return; // already counted today
    const last = lastDate ? new Date(lastDate + 'T12:00:00') : null;
    const now = new Date(today + 'T12:00:00');
    const diffHours = last ? (now - last) / 3600000 : 9999;
    if (diffHours <= STREAK_CONFIG.comebackWindowHours) {
      streak = (data.streak || 0) + 1;
    } else if ((data.streakShields || 0) > 0 && diffHours <= 96) {
      streak = (data.streak || 0) + 1;
      streakShields = (data.streakShields || 0) - 1;
    } else {
      streak = 1;
    }
    if (streak >= STREAK_CONFIG.shieldThreshold && streak % STREAK_CONFIG.shieldThreshold === 0) {
      streakShields = Math.min((streakShields || data.streakShields || 0) + 1, STREAK_CONFIG.shieldMax);
    }
    streakBest = Math.max(data.streakBest || 0, streak);
    streakLastDate = today;
  }

  function checkComeback(data) {
    const today = getTodayStr();
    const lastPlayed = data.lastPlayed || '';
    if (!lastPlayed) return;
    const last = new Date(lastPlayed + 'T12:00:00');
    const now = new Date(today + 'T12:00:00');
    const daysAway = Math.floor((now - last) / 86400000);
    for (const cb of COMEBACK_BONUSES) {
      if (daysAway >= cb.daysAway) {
        comebackHearts = cb.hearts;
        comebackMsg = pickRandom(WAIFU_SPEECH[cb.speechKey]);
        return;
      }
    }
  }

  function loadStats() {
    if (useChrome) {
      chrome.storage.local.get(STORAGE_KEYS, (data) => {
        bestScore = data.bestScore || 0;
        bestNum.textContent = bestScore;
        hearts = data.hearts || 0;
        heartsLifetime = data.heartsLifetime || 0;
        totalGamesLoaded = data.totalGames || 0;
        totalPipesLoaded = data.totalPipes || 0;
        firstEverPipe = (data.totalPipes || 0) === 0;
        streak = data.streak || 0;
        streakBest = data.streakBest || 0;
        streakShields = data.streakShields || 0;
        streakLastDate = data.streakLastDate || '';
        // Daily challenge
        const today = getTodayStr();
        if (data.dailyChallengeDate === today) {
          dailyChallenge = CHALLENGE_POOL[data.dailyChallengeIdx] || pickDailyChallenge(today, bestScore);
          dailyChallengeProgress = data.dailyChallengeProgress || 0;
          dailyChallengeComplete = data.dailyChallengeComplete || false;
        } else {
          dailyChallenge = pickDailyChallenge(today, bestScore);
          dailyChallengeProgress = 0;
          dailyChallengeComplete = false;
        }
        // Streak + comeback
        updateStreak(data);
        checkComeback(data);
        // Persist streak update
        chrome.storage.local.set({ streak, streakBest, streakShields, streakLastDate });
      });
    } else {
      bestScore = parseInt(localStorage.getItem('flappyWaifuBest')) || 0;
      bestNum.textContent = bestScore;
      dailyChallenge = pickDailyChallenge(getTodayStr(), bestScore);
    }
  }

  function saveStats() {
    const medal = getMedal(state.score);
    if (useChrome) {
      chrome.storage.local.get(STORAGE_KEYS, (data) => {
        const highMedal = getMedalByName(data.highestMedal);
        newMedalFlag = medal && (!highMedal || medal.threshold > highMedal.threshold);
        const newTotalPipes = (data.totalPipes || 0) + state.score;
        const newTotalGames = (data.totalGames || 0) + 1;
        totalGamesLoaded = newTotalGames;
        totalPipesLoaded = newTotalPipes;
        // Calculate hearts
        runHeartsBreakdown = { pipes: state.score * HEART_REWARDS.perPipe };
        runHearts = runHeartsBreakdown.pipes;
        // Graze hearts
        const grazeH = runGrazeClose * 3 + runGrazeGraze * 7 + runGrazePerfect * 15;
        if (grazeH > 0) { runHeartsBreakdown.graze = grazeH; runHearts += grazeH; }
        // V2: Golden pipe bonus hearts (count scored golden pipes × 2 extra)
        const goldenCount = state.pipes.filter(p => p.golden && p.scored).length;
        if (goldenCount > 0) { const gh = goldenCount * 2; runHeartsBreakdown.golden = gh; runHearts += gh; }
        // Combo bonus
        if (runBestCombo >= 20) { runHeartsBreakdown.combo = HEART_REWARDS.comboBonus20; runHearts += HEART_REWARDS.comboBonus20; }
        else if (runBestCombo >= 10) { runHeartsBreakdown.combo = HEART_REWARDS.comboBonus10; runHearts += HEART_REWARDS.comboBonus10; }
        else if (runBestCombo >= 5) { runHeartsBreakdown.combo = HEART_REWARDS.comboBonus5; runHearts += HEART_REWARDS.comboBonus5; }
        // New best bonus
        if (newBestFlag) { runHeartsBreakdown.newBest = HEART_REWARDS.newBest; runHearts += HEART_REWARDS.newBest; }
        // New medal bonus
        if (newMedalFlag) { runHeartsBreakdown.newMedal = HEART_REWARDS.newMedal; runHearts += HEART_REWARDS.newMedal; }
        // Lucky run (1 in 10)
        luckyRun = Math.random() < 0.1;
        if (luckyRun) { runHeartsBreakdown.lucky = runHearts; runHearts *= 2; }
        // Daily challenge progress
        updateDailyChallenge(data, state.score, runBestCombo, nearMissCount, runGrazePerfect, medal);
        // Streak hearts
        let streakH = 0;
        if (streak === 3) streakH = HEART_REWARDS.streakDay3;
        else if (streak === 7) streakH = HEART_REWARDS.streakDay7;
        else if (streak === 14) streakH = HEART_REWARDS.streakDay14;
        else if (streak === 30) streakH = HEART_REWARDS.streakDay30;
        if (streakH > 0 && newTotalGames > (data.totalGames || 0)) {
          runHeartsBreakdown.streak = streakH; runHearts += streakH;
        }
        // Run grade
        const gradeObj = getRunGrade(state.score, bestScore);
        runGrade = gradeObj.grade;
        // Persist
        const totalHearts = (data.hearts || 0) + runHearts + comebackHearts;
        hearts = totalHearts;
        const updated = {
          bestScore, lastPlayed: getTodayStr(),
          totalGames: newTotalGames,
          totalScore: (data.totalScore || 0) + state.score,
          totalPipes: newTotalPipes,
          bestCombo: Math.max(data.bestCombo || 0, runBestCombo),
          totalNearMisses: (data.totalNearMisses || 0) + nearMissCount,
          highestMedal: newMedalFlag ? medal.name : (data.highestMedal || ''),
          hearts: totalHearts,
          heartsLifetime: (data.heartsLifetime || 0) + runHearts + comebackHearts,
          totalGrazeClose: (data.totalGrazeClose || 0) + runGrazeClose,
          totalGrazeGraze: (data.totalGrazeGraze || 0) + runGrazeGraze,
          totalGrazePerfect: (data.totalGrazePerfect || 0) + runGrazePerfect,
          dailyChallengeDate: getTodayStr(),
          dailyChallengeIdx: CHALLENGE_POOL.indexOf(dailyChallenge),
          dailyChallengeProgress,
          dailyChallengeComplete,
          streak, streakBest, streakShields, streakLastDate,
        };
        chrome.storage.local.set(updated);
      });
    } else {
      try { localStorage.setItem('flappyWaifuBest', bestScore); } catch (_) {}
      // Minimal hearts calc for non-extension mode
      runHearts = state.score;
      runGrade = getRunGrade(state.score, bestScore).grade;
    }
  }

  function updateDailyChallenge(data, score, bestCombo, nearMisses, perfectGrazes, medal) {
    if (!dailyChallenge || dailyChallengeComplete) return;
    const c = dailyChallenge;
    let progress = dailyChallengeProgress;
    if (c.type === 'score' && score >= c.target) progress = c.target;
    else if (c.type === 'games') progress = Math.min((data.totalGames || 0) + 1 - (data._dcStartGames || data.totalGames || 0), c.target);
    else if (c.type === 'pipes') progress = Math.min(dailyChallengeProgress + score, c.target);
    else if (c.type === 'nearMiss' && nearMisses >= c.target) progress = c.target;
    else if (c.type === 'combo' && bestCombo >= c.target) progress = c.target;
    else if (c.type === 'graze' && perfectGrazes >= c.target) progress = c.target;
    else if (c.type === 'medal' && medal && medal.name === c.target) progress = 1;
    if (c.type === 'games') progress = Math.min(dailyChallengeProgress + 1, c.target);
    if (c.type === 'pipes') progress = Math.min(dailyChallengeProgress + score, c.target);
    dailyChallengeProgress = progress;
    if (progress >= c.target && !dailyChallengeComplete) {
      dailyChallengeComplete = true;
      runHeartsBreakdown.daily = c.hearts;
      runHearts += c.hearts;
    }
  }

  loadStats();

  // ─── Dynamic sky gradient (escalates with score) ───
  const SKY_STAGES = [
    { score: 0,   stops: [[91,163,230],[120,190,250],[168,216,255],[224,240,255],[200,230,201]] },
    { score: 40,  stops: [[230,140,80],[250,170,100],[255,200,140],[255,225,180],[220,210,170]] },
    { score: 70,  stops: [[150,60,180],[180,80,200],[200,110,220],[220,160,230],[180,140,200]] },
    { score: 100, stops: [[180,40,120],[200,60,150],[220,90,170],[230,130,190],[200,120,170]] },
  ];
  let skyCache = null;
  let skyCacheScore = -999;

  function lerpColor(a, b, t) {
    return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  }

  function rgbStr(c) { return 'rgb(' + (c[0] | 0) + ',' + (c[1] | 0) + ',' + (c[2] | 0) + ')'; }

  function getSkyGradient(score) {
    const rounded = Math.min(100, (score / 5 | 0) * 5);
    if (rounded === skyCacheScore && skyCache) return skyCache;
    let lo = SKY_STAGES[0], hi = SKY_STAGES[SKY_STAGES.length - 1];
    for (let i = 0; i < SKY_STAGES.length - 1; i++) {
      if (score >= SKY_STAGES[i].score && score < SKY_STAGES[i + 1].score) {
        lo = SKY_STAGES[i]; hi = SKY_STAGES[i + 1]; break;
      }
    }
    const s = lo.score === hi.score ? 1 : Math.min(1, (score - lo.score) / (hi.score - lo.score));
    const g = ctx.createLinearGradient(0, 0, 0, C.H);
    const positions = [0, 0.35, 0.7, 0.88, 1.0];
    for (let i = 0; i < 5; i++) {
      g.addColorStop(positions[i], rgbStr(lerpColor(lo.stops[i], hi.stops[i], s)));
    }
    skyCache = g;
    skyCacheScore = rounded;
    return g;
  }

  // Static sky for menu (score 0)
  const bgGrad = getSkyGradient(0);

  // ─── Cloud system ───
  const CLOUD_CONF = {
    far:  { count: 5, speedMin: 0.15, speedMax: 0.35, yMin: 20,  yMax: 280, scaleMin: 0.5,  scaleMax: 0.8,  alpha: 0.4 },
    near: { count: 4, speedMin: 0.5,  speedMax: 0.9,  yMin: 40,  yMax: 320, scaleMin: 0.8,  scaleMax: 1.3,  alpha: 0.85 },
  };
  let clouds = [];

  function spawnCloud(layer, conf, spread) {
    return {
      x: spread ? Math.random() * (C.W + 200) : C.W + 80 + Math.random() * 120,
      y: conf.yMin + Math.random() * (conf.yMax - conf.yMin),
      speed: conf.speedMin + Math.random() * (conf.speedMax - conf.speedMin),
      scale: conf.scaleMin + Math.random() * (conf.scaleMax - conf.scaleMin),
      alpha: conf.alpha * (0.7 + Math.random() * 0.3),
      layer, seed: Math.random(),
    };
  }

  function initClouds() {
    clouds = [];
    for (const [layer, conf] of Object.entries(CLOUD_CONF)) {
      for (let i = 0; i < conf.count; i++) clouds.push(spawnCloud(layer, conf, true));
    }
  }

  function updateClouds(t, pipeSpeedRatio) {
    const speedMult = 0.6 + pipeSpeedRatio * 0.4;
    for (let i = 0; i < clouds.length; i++) {
      const c = clouds[i];
      c.x -= c.speed * speedMult * t;
      if (c.x + 120 * c.scale < -20) {
        clouds[i] = spawnCloud(c.layer, CLOUD_CONF[c.layer], false);
      }
    }
  }

  function drawCloud(cloud) {
    ctx.save();
    ctx.globalAlpha = cloud.alpha;
    const s = cloud.scale, cx = cloud.x, cy = cloud.y;
    if (cloud.layer === 'near') {
      ctx.globalAlpha = cloud.alpha * 0.08;
      ctx.fillStyle = '#4A6FA5';
      ctx.beginPath();
      ctx.ellipse(cx + 4 * s, cy + 12 * s, 58 * s, 18 * s, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = cloud.alpha;
    }
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath(); ctx.ellipse(cx, cy, 60 * s, 28 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 32 * s, cy - 8 * s, 28 * s, 22 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx + 30 * s, cy - 6 * s, 26 * s, 20 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx - 2 * s, cy - 18 * s, 30 * s, 24 * s, 0, 0, Math.PI * 2); ctx.fill();
    if (cloud.seed > 0.4) {
      ctx.beginPath(); ctx.ellipse(cx + 18 * s, cy - 14 * s, 18 * s, 16 * s, 0, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  }

  // ─── Kawaii sparkle motes ───
  let bgSparkles = [];

  function initBgSparkles() {
    bgSparkles = [];
    for (let i = 0; i < 12; i++) {
      bgSparkles.push({
        x: Math.random() * C.W, y: Math.random() * C.H,
        size: 1 + Math.random() * 2, alpha: 0.15 + Math.random() * 0.25,
        phase: Math.random() * Math.PI * 2, speed: 0.05 + Math.random() * 0.1,
      });
    }
  }

  function updateBgSparkles(t) {
    for (const s of bgSparkles) {
      s.y -= s.speed * t;
      s.phase += 0.03 * t;
      if (s.y < -10) { s.y = C.H + 10; s.x = Math.random() * C.W; }
    }
  }

  function drawBgSparkles() {
    for (const s of bgSparkles) {
      const twinkle = 0.5 + 0.5 * Math.sin(s.phase);
      ctx.globalAlpha = s.alpha * twinkle;
      ctx.fillStyle = '#FFB6D9';
      const sz = s.size;
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - sz * 2);
      ctx.lineTo(s.x + sz * 0.5, s.y - sz * 0.5);
      ctx.lineTo(s.x + sz * 2, s.y);
      ctx.lineTo(s.x + sz * 0.5, s.y + sz * 0.5);
      ctx.lineTo(s.x, s.y + sz * 2);
      ctx.lineTo(s.x - sz * 0.5, s.y + sz * 0.5);
      ctx.lineTo(s.x - sz * 2, s.y);
      ctx.lineTo(s.x - sz * 0.5, s.y - sz * 0.5);
      ctx.closePath();
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  // ─── V2: Speed lines ───
  function updateSpeedLines(t, score) {
    if (REDUCED_MOTION || score < 25) return;
    const density = Math.min(MAX_SPEED_LINES, ((score - 25) / 50 * MAX_SPEED_LINES) | 0);
    while (speedLines.length < density && Math.random() < 0.3) {
      speedLines.push({
        x: C.W + Math.random() * 40,
        y: 20 + Math.random() * (C.H - 40),
        len: 30 + Math.random() * 60,
        speed: 6 + Math.random() * 8,
        alpha: 0.08 + Math.random() * 0.12,
      });
    }
    for (let i = speedLines.length - 1; i >= 0; i--) {
      speedLines[i].x -= speedLines[i].speed * t;
      if (speedLines[i].x + speedLines[i].len < 0) speedLines.splice(i, 1);
    }
  }

  function drawSpeedLines() {
    if (speedLines.length === 0) return;
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    for (const l of speedLines) {
      ctx.globalAlpha = l.alpha;
      ctx.beginPath();
      ctx.moveTo(l.x, l.y);
      ctx.lineTo(l.x + l.len, l.y);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // ─── V2: Player trail ───
  function recordTrail() {
    if (REDUCED_MOTION || state.score < 15) return;
    trail[trailIdx % TRAIL_SIZE] = { x: C.playerX, y: state.y, vel: state.vel };
    trailIdx++;
  }

  function drawTrail() {
    if (trail.length === 0 || state.score < 15) return;
    const count = Math.min(trail.length, TRAIL_SIZE);
    const alphaBase = Math.min(0.15, 0.02 + state.score * 0.002);
    for (let i = 0; i < count; i++) {
      const idx = ((trailIdx - count + i) % TRAIL_SIZE + TRAIL_SIZE) % TRAIL_SIZE;
      const t = trail[idx];
      if (!t) continue;
      const age = (count - i) / count;
      ctx.save();
      ctx.globalAlpha = alphaBase * (1 - age);
      const tilt = Math.max(-0.55, Math.min(0.38, t.vel * 0.042));
      ctx.translate(t.x + C.playerW / 2, t.y + C.playerH / 2);
      ctx.rotate(tilt);
      if (spriteLoaded) {
        ctx.drawImage(playerImg, -C.playerW * 0.95, -C.playerH * 1.05, C.playerW * 1.9, C.playerH * 2.1);
      }
      ctx.restore();
    }
  }

  // ─── V2: Enhanced flap particles ───
  function emitFlapParticles(x, y) {
    if (REDUCED_MOTION) return;
    const colors = [C.pink, C.pinkBright, '#fff', '#ffb3d9'];
    // Downward feathers
    for (let i = 0; i < 4; i++) {
      if (particles.length >= MAX_PARTICLES) break;
      particles.push({
        x: x - 8 + Math.random() * 16, y: y + 10 + Math.random() * 10,
        vx: -1 + Math.random() * 2,
        vy: 1 + Math.random() * 2,
        life: 1, decay: 0.015 + Math.random() * 0.01,
        size: 3 + Math.random() * 4,
        color: colors[(Math.random() * colors.length) | 0],
      });
    }
    // Upward sparkles
    for (let i = 0; i < 4; i++) {
      if (particles.length >= MAX_PARTICLES) break;
      const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.2;
      const speed = 2 + Math.random() * 3;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, decay: 0.025 + Math.random() * 0.02,
        size: 2 + Math.random() * 3,
        color: colors[(Math.random() * colors.length) | 0],
      });
    }
  }

  // ─── V2: Zone vignette ───
  function updateZone(t) {
    if (combo >= 8) {
      zoneTime += t;
      if (zoneTime > 180 && zoneIntensity < 1) zoneIntensity = Math.min(1, zoneIntensity + 0.003 * t);
    } else {
      zoneTime = 0;
      if (zoneIntensity > 0) zoneIntensity = Math.max(0, zoneIntensity - 0.01 * t);
    }
  }

  function drawZoneVignette() {
    if (REDUCED_MOTION || zoneIntensity <= 0) return;
    const alpha = 0.04 + zoneIntensity * 0.08;
    const pulse = 1 + Math.sin(gameTime / 400) * 0.15;
    const r = Math.min(C.W, C.H) * 0.6 * pulse;
    const grad = ctx.createRadialGradient(C.W / 2, C.H / 2, r, C.W / 2, C.H / 2, C.W * 0.9);
    grad.addColorStop(0, 'rgba(255,110,180,0)');
    grad.addColorStop(0.6, 'rgba(180,40,120,' + (alpha * 0.3) + ')');
    grad.addColorStop(1, 'rgba(180,40,120,' + alpha + ')');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, C.W, C.H);
  }

  // ─── V2: Lofi background music ───
  let lofiPlaying = false;
  let lofiMaster = null;
  let lofiChordTimeout = null;
  let lofiBeatTimeout = null;
  let lofiChordIdx = 0;
  const LOFI_BPM = 72;
  const LOFI_BEAT_MS = 60000 / LOFI_BPM;
  // Jazz chord progression: Cmaj7 → Am7 → Fmaj7 → G7 (all low octave for warmth)
  const LOFI_CHORDS = [
    [130.8, 164.8, 196.0, 246.9],  // Cmaj7
    [110.0, 130.8, 164.8, 196.0],  // Am7
    [87.3, 110.0, 130.8, 164.8],   // Fmaj7
    [98.0, 123.5, 146.8, 174.6],   // G7
  ];

  function startLofi() {
    if (!audioCtx || audioCtx.state !== 'running' || lofiPlaying) return;
    lofiPlaying = true;
    lofiChordIdx = 0;
    // Master bus with low-pass filter for warmth
    lofiMaster = audioCtx.createGain();
    lofiMaster.gain.value = 0.07;
    const lpf = audioCtx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 900;
    lpf.Q.value = 0.7;
    lofiMaster.connect(lpf);
    lpf.connect(audioCtx.destination);
    scheduleLofiChord();
    scheduleLofiBeat();
  }

  function scheduleLofiChord() {
    if (!audioCtx || !lofiPlaying || !lofiMaster) return;
    const now = audioCtx.currentTime;
    const chord = LOFI_CHORDS[lofiChordIdx % LOFI_CHORDS.length];
    const chordDur = LOFI_BEAT_MS * 4 / 1000; // 4 beats per chord
    for (const freq of chord) {
      const osc = audioCtx.createOscillator();
      const env = audioCtx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq * (0.998 + Math.random() * 0.004); // slight detune for warmth
      env.gain.setValueAtTime(0, now);
      env.gain.linearRampToValueAtTime(0.04, now + 0.15);
      env.gain.setValueAtTime(0.04, now + chordDur - 0.3);
      env.gain.exponentialRampToValueAtTime(0.001, now + chordDur);
      osc.connect(env);
      env.connect(lofiMaster);
      osc.start(now);
      osc.stop(now + chordDur + 0.05);
    }
    lofiChordIdx++;
    lofiChordTimeout = setTimeout(scheduleLofiChord, LOFI_BEAT_MS * 4);
  }

  function scheduleLofiBeat() {
    if (!audioCtx || !lofiPlaying || !lofiMaster) return;
    const now = audioCtx.currentTime;
    // Kick (low sine thump)
    const kick = audioCtx.createOscillator();
    const kickEnv = audioCtx.createGain();
    kick.type = 'sine';
    kick.frequency.setValueAtTime(100, now);
    kick.frequency.exponentialRampToValueAtTime(40, now + 0.08);
    kickEnv.gain.setValueAtTime(0.12, now);
    kickEnv.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
    kick.connect(kickEnv);
    kickEnv.connect(lofiMaster);
    kick.start(now);
    kick.stop(now + 0.12);
    // Hi-hat on off-beat (soft)
    const hatTime = LOFI_BEAT_MS / 2 / 1000;
    const hat = audioCtx.createOscillator();
    const hatEnv = audioCtx.createGain();
    hat.type = 'square';
    hat.frequency.value = 7000 + Math.random() * 3000;
    hatEnv.gain.setValueAtTime(0, now + hatTime);
    hatEnv.gain.linearRampToValueAtTime(0.008, now + hatTime + 0.002);
    hatEnv.gain.exponentialRampToValueAtTime(0.001, now + hatTime + 0.03);
    hat.connect(hatEnv);
    hatEnv.connect(lofiMaster);
    hat.start(now + hatTime);
    hat.stop(now + hatTime + 0.04);
    lofiBeatTimeout = setTimeout(scheduleLofiBeat, LOFI_BEAT_MS);
  }

  function stopLofi() {
    lofiPlaying = false;
    if (lofiChordTimeout) { clearTimeout(lofiChordTimeout); lofiChordTimeout = null; }
    if (lofiBeatTimeout) { clearTimeout(lofiBeatTimeout); lofiBeatTimeout = null; }
    if (lofiMaster) {
      try { lofiMaster.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.5); } catch (_) {}
      setTimeout(() => { try { lofiMaster.disconnect(); } catch (_) {} lofiMaster = null; }, 600);
    }
  }

  // Stubs for removed pulse/layer system (keep update calls from crashing)
  function startPulse() { startLofi(); }
  function stopPulse() { stopLofi(); }
  function updatePulseTempo() {}
  function updateAudioLayers() {}

  // Tension audio removed (was annoying whistling) — keep stubs
  function updateTensionAudio() {}
  function stopTensionAudio() {}

  // ─── Reset ───
  function reset() {
    state = {
      y: C.H / 2 - 30,
      vel: 0,
      pipes: [],
      score: 0,
      gameOver: false,
    };
    particles = [];
    milestone = null;
    screenShake = 0;
    lastMilestoneScore = -1;
    spawnTimer = 0;
    deathTimer = 0;
    overlayShown = false;
    pendingRestart = false;
    _diffScore = -1;
    combo = 0;
    runBestCombo = 0;
    nearMissCount = 0;
    nearMissFlash = 0;
    runHearts = 0;
    runGrazeClose = 0;
    runGrazeGraze = 0;
    runGrazePerfect = 0;
    runGrade = 'D';
    runHeartsBreakdown = {};
    luckyRun = false;
    newMedalFlag = false;
    // V2 resets
    freezeTimer = 0;
    freezeActive = false;
    slowMoTimer = 0;
    deathTimeScale = 1;
    squashX = 1;
    squashY = 1;
    speedLines = [];
    trail = [];
    trailIdx = 0;
    pipesSinceRelief = 0;
    nextReliefAt = 5 + ((Math.random() * 3) | 0);
    zoneIntensity = 0;
    zoneTime = 0;
    pipesUntilBonus = 15 + ((Math.random() * 6) | 0);
    grazeStreak = 0;
    skyCache = null;
    skyCacheScore = -999;
    initClouds();
    if (!REDUCED_MOTION) initBgSparkles();
    else bgSparkles = [];
    floatingTexts = [];
    newBestFlag = false;
    scoreDisplay.textContent = '0';
  }

  // ─── Spawn ───
  function spawnPipe() {
    const d = getDifficulty(state.score);
    let gap = d.gapMin + Math.random() * (d.gapMax - d.gapMin);
    // First-session hook: widen gaps for new players' first 3 pipes
    if (state.pipes.length < 3 && totalGamesLoaded < 4) {
      gap += Math.max(0, 40 - totalGamesLoaded * 10);
    }
    // V2: Breathing room — every 5-7 pipes, one wider gap (after score 10)
    let isRelief = false;
    if (state.score >= 10) {
      pipesSinceRelief++;
      if (pipesSinceRelief >= nextReliefAt) {
        gap += 35;
        pipesSinceRelief = 0;
        nextReliefAt = 5 + ((Math.random() * 3) | 0);
        isRelief = true;
      }
    }
    // V2: Golden bonus pipe — every 15-20 pipes (after score 8)
    let golden = false;
    if (state.score >= 8) {
      pipesUntilBonus--;
      if (pipesUntilBonus <= 0) {
        golden = true;
        pipesUntilBonus = 15 + ((Math.random() * 6) | 0);
      }
    }
    const minTop = 55;
    const maxTop = C.H - gap - 55;
    const topH = minTop + Math.random() * (maxTop - minTop);
    state.pipes.push({ x: C.W + 10, topH, gap, scored: false, golden });
  }

  // ─── Particles ───
  function emitParticles(x, y, count, color) {
    if (REDUCED_MOTION) return;
    const colors = [C.pink, C.pinkBright, '#fff', '#ffb3d9'];
    for (let i = 0; i < count; i++) {
      if (particles.length >= MAX_PARTICLES) break;
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3.5;
      particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        life: 1,
        decay: 0.02 + Math.random() * 0.03,
        size: 2 + Math.random() * 5,
        color: color || colors[(Math.random() * colors.length) | 0],
      });
    }
  }

  function emitMilestoneBurst(x, y) {
    emitParticles(x, y, 20, C.pinkBright);
    emitParticles(x, y, 10, '#ffffff');
    if (!REDUCED_MOTION) screenShake = 8;
  }

  // ─── Update particles ───
  function updateParticles(t) {
    for (const p of particles) {
      p.x += p.vx * t;
      p.y += p.vy * t;
      p.vy += 0.08 * t;
      p.life -= p.decay * t;
    }
    particles = particles.filter(p => p.life > 0);
  }

  // ─── Update floating texts ───
  function updateFloatingTexts(t) {
    for (const ft of floatingTexts) {
      ft.y += ft.vy * t;
      ft.alpha -= 0.02 * t;
    }
    floatingTexts = floatingTexts.filter(ft => ft.alpha > 0);
  }

  // ─── Update ───
  function update(dt) {
    const t = dt / FRAME_MS;
    const d = getDifficulty(state.score);

    // Death animation phase
    if (state.gameOver) {
      // V2: Freeze frame — everything stops for 120ms
      if (freezeActive) {
        freezeTimer -= dt;
        if (freezeTimer <= 0) {
          freezeActive = false;
          slowMoTimer = REDUCED_MOTION ? 0 : 350;
          deathTimeScale = REDUCED_MOTION ? 1 : 0.3;
          deathTimer = 200;
        }
        // Still draw but don't animate anything
        return;
      }
      // V2: Slow-mo death fall with gravity
      const effectiveDt = dt * deathTimeScale;
      const et = effectiveDt / FRAME_MS;
      if (slowMoTimer > 0) {
        slowMoTimer -= dt;
        if (slowMoTimer <= 0) deathTimeScale = 1;
      }
      // Apply gravity during death (player falls)
      state.vel += GRAVITY * et;
      state.vel = Math.min(state.vel, TERMINAL_VEL);
      state.y += state.vel * et;
      if (state.y + C.playerH >= C.H) state.y = C.H - C.playerH;
      if (screenShake > 0.5) screenShake *= Math.pow(0.85, et);
      else screenShake = 0;
      updateParticles(et);
      updateFloatingTexts(et);
      if (nearMissFlash > 0) nearMissFlash -= effectiveDt;
      if (milestone) {
        milestone.y -= 0.8 * et;
        milestone.alpha -= 0.008 * et;
        if (milestone.alpha <= 0) milestone = null;
      }
      if (!REDUCED_MOTION) { updateClouds(et, 1); updateBgSparkles(et); }
      deathTimer -= dt;
      if (deathTimer <= 0 && !overlayShown) showGameOverOverlay();
      return;
    }

    // V2: Record trail before physics
    if (!REDUCED_MOTION) recordTrail();

    // Physics
    state.vel += GRAVITY * t;
    state.vel = Math.min(state.vel, TERMINAL_VEL);
    state.y += state.vel * t;

    // V2: Squash & stretch lerp
    if (!REDUCED_MOTION) {
      const decay = Math.pow(0.88, t);
      squashX = 1 + (squashX - 1) * decay;
      squashY = 1 + (squashY - 1) * decay;
      // Velocity-driven stretch during fast fall
      if (state.vel > 3) {
        const str = Math.min((state.vel - 3) * 0.03, 0.15);
        squashX = Math.min(squashX, 1 - str * 0.5);
        squashY = Math.max(squashY, 1 + str);
      }
    }

    // Ceiling: hard stop
    if (state.y < 0) { state.y = 0; state.vel = 0; }
    // Floor: death
    if (state.y + C.playerH >= C.H) { triggerGameOver(); return; }

    // Pipe movement & scoring
    const pw = C.pipeWidth;
    for (const p of state.pipes) {
      p.x -= d.pipeSpeed * t;

      if (!p.scored && C.playerX + C.playerW > p.x + pw) {
        p.scored = true;
        state.score++;
        combo++;
        if (combo > runBestCombo) runBestCombo = combo;
        scoreDisplay.textContent = state.score;
        sfxScore(combo, state.score);
        // First-ever pipe: heart particles + "Yay!" reaction
        if (firstEverPipe && state.score === 1) {
          firstEverPipe = false;
          emitParticles(C.playerX + C.playerW / 2, state.y + C.playerH / 2, 8, '#FF69B4');
          floatingTexts.push({
            text: 'Yay! \u{1F496}', x: C.playerX + C.playerW + 10,
            y: state.y, alpha: 1, vy: -1.2, size: 18, color: '#FF69B4', centered: false,
          });
        } else {
          emitParticles(C.playerX + C.playerW / 2, state.y + C.playerH / 2, 8, null);
        }

        // V2: Golden pipe bonus scoring
        if (p.golden) {
          floatingTexts.push({
            text: 'BONUS! \u00D73', x: C.W / 2, y: state.y - 20,
            alpha: 1, vy: -1.5, size: 22, color: '#FFD700', centered: true,
          });
          emitParticles(C.playerX + C.playerW / 2, state.y + C.playerH / 2, 15, '#FFD700');
          playTone(880, 0.12, 0.12, 'sine', 1320);
        }

        // 3-tier graze detection
        const topClearance = (state.y + 8) - p.topH;
        const botClearance = (p.topH + p.gap) - (state.y + C.playerH - 8);
        const minClearance = Math.min(topClearance, botClearance);
        let wasGraze = false;
        if (minClearance >= 0) {
          for (const tier of GRAZE_TIERS) {
            if (minClearance < tier.threshold) {
              nearMissCount++;
              wasGraze = true;
              if (tier.name === 'Close') runGrazeClose++;
              else if (tier.name === 'Graze') runGrazeGraze++;
              else if (tier.name === 'Perfect') runGrazePerfect++;
              nearMissFlash = tier.name === 'Perfect' ? 120 : tier.name === 'Graze' ? 100 : 80;
              floatingTexts.push({
                text: tier.text, x: C.playerX + C.playerW + 10,
                y: state.y + C.playerH / 2, alpha: 1, vy: -1.5, size: tier.name === 'Perfect' ? 20 : 16, color: tier.color,
              });
              playTone(tier.sfxPitch, 0.06, tier.name === 'Perfect' ? 0.12 : 0.07, 'sine', tier.sfxPitch + 400);
              if (tier.name === 'Perfect') emitParticles(C.playerX + C.playerW / 2, state.y + C.playerH / 2, 12, '#FF69B4');
              break; // only trigger best tier
            }
          }
        }
        // V2: Graze streak reward
        if (wasGraze) {
          grazeStreak++;
          if (grazeStreak === 3) {
            floatingTexts.push({
              text: 'GRAZE STREAK!', x: C.W / 2, y: C.H / 2 - 50,
              alpha: 1, vy: -1.2, size: 20, color: '#FFD700', centered: true,
            });
            emitParticles(C.playerX + C.playerW / 2, state.y, 15, '#FFD700');
            if (!REDUCED_MOTION) screenShake = 5;
          }
        } else {
          grazeStreak = 0;
        }

        // Combo milestone celebrations
        if (combo === 5 || combo === 10 || combo === 15 || combo === 20) {
          floatingTexts.push({
            text: '\u00D7' + combo + ' COMBO!',
            x: C.W / 2, y: C.H / 2 - 30,
            alpha: 1, vy: -1.2, size: 22,
            color: combo >= 20 ? '#FF69B4' : combo >= 15 ? '#FF8C00' : combo >= 10 ? '#FFD700' : '#fff',
            centered: true,
          });
          emitMilestoneBurst(C.playerX + C.playerW / 2, state.y);
          if (!REDUCED_MOTION) screenShake = 6;
        }

        // Named milestones
        if (MILESTONES[state.score] && state.score !== lastMilestoneScore) {
          lastMilestoneScore = state.score;
          milestone = { text: MILESTONES[state.score], alpha: 1, y: C.H / 2 - 60 };
          emitMilestoneBurst(C.playerX + C.playerW / 2, state.y);
          sfxMilestone();
        }
        // UWU sound every 5 points
        if (state.score > 0 && state.score % 5 === 0) {
          sfxUwu();
          if (!MILESTONES[state.score] && state.score !== lastMilestoneScore) {
            emitMilestoneBurst(C.playerX + C.playerW / 2, state.y);
            lastMilestoneScore = state.score;
          }
        }
      }

      // Collision (8px inset = forgiving hitbox)
      const hitX = C.playerX + 8 < p.x + pw && C.playerX + C.playerW - 8 > p.x;
      const hitTop = state.y + 8 < p.topH;
      const hitBot = state.y + C.playerH - 8 > p.topH + p.gap;
      if (hitX && (hitTop || hitBot)) { triggerGameOver(); return; }
    }

    // Cull off-screen pipes
    state.pipes = state.pipes.filter(p => p.x + pw > -10);

    // Spawn timer
    spawnTimer += dt;
    if (spawnTimer >= d.spawnMs) {
      spawnTimer -= d.spawnMs;
      spawnPipe();
    }

    // Particles & floating texts
    updateParticles(t);
    updateFloatingTexts(t);
    if (nearMissFlash > 0) nearMissFlash -= dt;

    // Milestone float
    if (milestone) {
      milestone.y -= 0.8 * t;
      milestone.alpha -= 0.008 * t;
      if (milestone.alpha <= 0) milestone = null;
    }

    // Cloud + sparkle updates
    if (!REDUCED_MOTION) {
      const psr = d.pipeSpeed / getDifficulty(0).pipeSpeed;
      updateClouds(t, psr);
      updateBgSparkles(t);
    }

    // V2: Speed lines, zone vignette, tension audio, pulse tempo
    if (!REDUCED_MOTION) updateSpeedLines(t, state.score);
    updateZone(t);
    updateTensionAudio();
    updatePulseTempo(state.score);
    updateAudioLayers(state.score);

    // Shake decay
    if (screenShake > 0.5) screenShake *= Math.pow(0.85, t);
    else screenShake = 0;
  }

  // ─── Draw ───
  function drawBackground() {
    ctx.fillStyle = !loopActive && !state.gameOver ? bgGrad : getSkyGradient(state.score);
    ctx.fillRect(0, 0, C.W, C.H);
  }

  function drawGround() {
    const hazeGrad = ctx.createLinearGradient(0, C.H - 40, 0, C.H);
    hazeGrad.addColorStop(0, 'rgba(200,230,201,0)');
    hazeGrad.addColorStop(1, 'rgba(200,230,201,0.3)');
    ctx.fillStyle = hazeGrad;
    ctx.fillRect(0, C.H - 40, C.W, 40);
    ctx.fillStyle = '#7BC67E';
    ctx.fillRect(0, C.H - 4, C.W, 4);
  }

  function drawPipe(p) {
    const pw = C.pipeWidth;
    const grad = ctx.createLinearGradient(p.x, 0, p.x + pw, 0);
    if (p.golden) {
      // V2: Golden bonus pipe
      grad.addColorStop(0, '#8B6914');
      grad.addColorStop(0.25, '#DAA520');
      grad.addColorStop(0.5, '#FFFACD');
      grad.addColorStop(0.75, '#DAA520');
      grad.addColorStop(1, '#8B6914');
    } else {
      const intensity = Math.min(1, state.score / 60);
      const r = (180 + intensity * 30) | 0;
      const g = (60 + intensity * 20) | 0;
      const b = (100 + intensity * 20) | 0;
      grad.addColorStop(0, 'rgb(' + (r - 30) + ',' + (g - 15) + ',' + (b - 10) + ')');
      grad.addColorStop(0.3, 'rgb(' + r + ',' + g + ',' + b + ')');
      grad.addColorStop(0.5, 'rgb(' + (r + 20) + ',' + (g + 10) + ',' + (b + 15) + ')');
      grad.addColorStop(0.7, 'rgb(' + r + ',' + g + ',' + b + ')');
      grad.addColorStop(1, 'rgb(' + (r - 30) + ',' + (g - 15) + ',' + (b - 10) + ')');
    }
    ctx.save();
    ctx.shadowColor = p.golden ? '#FFD700' : '#E8457C';
    const intensity = Math.min(1, state.score / 60);
    ctx.shadowBlur = p.golden ? 12 : 6 + intensity * 3;
    ctx.fillStyle = grad;
    ctx.fillRect(p.x, 0, pw, p.topH);
    const botY = p.topH + p.gap;
    ctx.fillRect(p.x, botY, pw, C.H - botY);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(232,69,124,0.5)';
    ctx.fillRect(p.x - 4, p.topH - 22, pw + 8, 22);
    ctx.fillRect(p.x - 4, botY, pw + 8, 22);
    ctx.strokeStyle = 'rgba(232,69,124,0.55)';
    ctx.lineWidth = 2;
    ctx.strokeRect(p.x, 0, pw, p.topH);
    ctx.strokeRect(p.x, botY, pw, C.H - botY);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p.x + 8, 0); ctx.lineTo(p.x + 8, p.topH);
    ctx.moveTo(p.x + 8, botY); ctx.lineTo(p.x + 8, C.H);
    ctx.stroke();
    ctx.restore();
  }

  function drawPlayer() {
    // V2: Draw trail ghosts first
    if (!REDUCED_MOTION) drawTrail();
    const x = C.playerX, y = state.y, w = C.playerW, h = C.playerH;
    const tilt = Math.max(-0.55, Math.min(0.38, state.vel * 0.042));
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(tilt);
    // V2: Squash & stretch
    if (!REDUCED_MOTION) ctx.scale(squashX, squashY);
    const glowPulse = 28 + Math.sin(gameTime / 300) * 4 + Math.min(state.score, 50) * 0.3;
    ctx.shadowColor = C.pink;
    ctx.shadowBlur = glowPulse;
    if (spriteLoaded) {
      ctx.drawImage(playerImg, -w * 0.95, -h * 1.05, w * 1.9, h * 2.1);
    } else {
      const grad = ctx.createLinearGradient(-w / 2, -h / 2, w / 2, h / 2);
      grad.addColorStop(0, C.pinkBright);
      grad.addColorStop(1, C.pinkDark);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 8);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawParticles() {
    for (const p of particles) {
      ctx.globalAlpha = p.life * 0.9;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawMilestone() {
    if (!milestone) return;
    ctx.save();
    ctx.globalAlpha = milestone.alpha;
    ctx.font = "bold 28px 'Orbitron', monospace";
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff';
    ctx.shadowColor = C.pink;
    ctx.shadowBlur = 24;
    ctx.fillText(milestone.text, C.W / 2, milestone.y);
    ctx.restore();
  }

  function drawFloatingTexts() {
    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = ft.alpha;
      ctx.font = 'bold ' + ft.size + "px 'Orbitron', monospace";
      ctx.textAlign = ft.centered ? 'center' : 'left';
      ctx.fillStyle = ft.color;
      ctx.shadowColor = ft.color;
      ctx.shadowBlur = 8;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();
    }
  }

  function drawCombo() {
    if (combo < 3 || state.gameOver) return;
    let color;
    if (combo < 5) color = '#ffffff';
    else if (combo < 10) color = '#FFD700';
    else if (combo < 15) color = '#FF8C00';
    else if (combo < 20) color = '#FF69B4';
    else color = 'hsl(' + ((gameTime / 10) % 360) + ', 100%, 65%)';
    const scale = 1 + Math.min((combo - 3) * 0.05, 0.4);
    ctx.save();
    ctx.font = 'bold ' + ((20 * scale) | 0) + "px 'Orbitron', monospace";
    ctx.textAlign = 'center';
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 12;
    ctx.globalAlpha = 0.9;
    ctx.fillText('\u00D7' + combo, C.W / 2, 50);
    ctx.restore();
  }

  function drawNearMissFlash() {
    if (nearMissFlash <= 0) return;
    ctx.fillStyle = 'rgba(255,255,255,' + Math.min(nearMissFlash / 200, 0.4) + ')';
    ctx.fillRect(0, 0, C.W, C.H);
  }

  function drawDifficultyIndicator() {
    const tier = Math.min((state.score / 10) | 0, 9);
    if (tier === 0) return;
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.font = "10px 'Orbitron', monospace";
    ctx.fillStyle = C.pink;
    ctx.textAlign = 'right';
    ctx.fillText('LV.' + (tier + 1), C.W - 12, C.H - 12);
    ctx.restore();
  }

  function draw() {
    const shakeX = screenShake > 0.5 ? (Math.random() - 0.5) * screenShake : 0;
    const shakeY = screenShake > 0.5 ? (Math.random() - 0.5) * screenShake : 0;
    ctx.save();
    ctx.translate(shakeX, shakeY);
    drawBackground();
    drawGround();
    for (const c of clouds) { if (c.layer === 'far') drawCloud(c); }
    if (!REDUCED_MOTION) drawBgSparkles();
    if (!REDUCED_MOTION) drawSpeedLines();
    for (const p of state.pipes) drawPipe(p);
    for (const c of clouds) { if (c.layer === 'near') drawCloud(c); }
    drawParticles();
    drawPlayer();
    drawMilestone();
    drawFloatingTexts();
    drawCombo();
    drawDifficultyIndicator();
    drawNearMissFlash();
    drawZoneVignette();
    ctx.restore();
  }

  // ─── Game loop ───
  function loop(ts) {
    if (!loopActive) return;
    let dt = ts - lastTime;
    lastTime = ts;
    gameTime = ts;
    dt = Math.min(dt, MAX_DT);
    update(dt);
    draw();
    rafId = requestAnimationFrame(loop);
  }

  // ─── Input ───
  function flap() {
    state.vel = JUMP_FORCE;
    sfxFlap();
    // V2: Squash on flap
    if (!REDUCED_MOTION) { squashX = 1.25; squashY = 0.75; }
    // V2: Enhanced flap particles (feathers + sparkles)
    emitFlapParticles(C.playerX, state.y + C.playerH / 2);
  }

  function handleInput() {
    if (!audioCtx) initAudio();
    if (!loopActive && !state.gameOver) { startGame(); return; }
    if (state.gameOver && overlayShown) { startGame(); return; }
    if (state.gameOver) { pendingRestart = true; return; }
    if (loopActive) flap();
  }

  // ─── Game over ───
  function triggerGameOver() {
    state.gameOver = true;
    if (!REDUCED_MOTION) screenShake = 14;
    // V2: Freeze frame instead of immediate death timer
    if (!REDUCED_MOTION) {
      freezeActive = true;
      freezeTimer = 120;
      deathTimer = 0; // will be set after freeze ends
    } else {
      deathTimer = 200;
    }
    sfxDeath();
    // V2: Stop audio systems
    stopPulse();
    stopTensionAudio();
    newBestFlag = false;
    if (state.score > bestScore) {
      bestScore = state.score;
      bestNum.textContent = bestScore;
      newBestFlag = true;
    }
    // Pick waifu speech
    if (totalGamesLoaded === 0) {
      waifuSpeech = pickRandom(WAIFU_SPEECH.firstDeath);
    } else if (newBestFlag) {
      waifuSpeech = pickRandom(WAIFU_SPEECH.newBest);
    } else if (nearMissCount >= 3) {
      waifuSpeech = pickRandom(WAIFU_SPEECH.nearMissHeavy);
    } else if (state.score >= 20) {
      waifuSpeech = pickRandom(WAIFU_SPEECH.score20plus);
    } else if (state.score >= 10) {
      waifuSpeech = pickRandom(WAIFU_SPEECH.score10to19);
    } else if (state.score >= 3) {
      waifuSpeech = pickRandom(WAIFU_SPEECH.score3to9);
    } else {
      waifuSpeech = pickRandom(WAIFU_SPEECH.score0to2);
    }
    saveStats();
  }

  function showGameOverOverlay() {
    overlayShown = true;
    loopActive = false;
    cancelAnimationFrame(rafId);
    draw();

    startContent.style.display = 'none';
    deathContent.style.display = 'flex';

    // Title: softer for first game
    const deathTitle = document.getElementById('death-title');
    if (deathTitle) deathTitle.textContent = totalGamesLoaded <= 1 ? 'NICE TRY!' : 'GAME OVER';

    finalScore.textContent = state.score;

    const medal = getMedal(state.score);
    if (medal) {
      medalBadge.textContent = medal.emoji;
      medalBadge.style.display = 'block';
    } else {
      medalBadge.style.display = 'none';
    }

    // Score delta + micro-goal
    if (newBestFlag) {
      scoreDelta.textContent = 'NEW BEST!';
      scoreDelta.className = 'score-delta new-best';
    } else if (totalGamesLoaded <= 1) {
      // First game: show micro-goal
      const nextMedal = MEDALS.find(m => m.threshold > state.score);
      scoreDelta.textContent = nextMedal ? ('Next: Score ' + nextMedal.threshold + ' for ' + nextMedal.emoji) : '';
      scoreDelta.className = 'score-delta';
    } else {
      const delta = bestScore - state.score;
      const nextMedal = MEDALS.find(m => m.threshold > state.score && m.threshold <= state.score * 1.4);
      if (nextMedal) {
        scoreDelta.textContent = (nextMedal.threshold - state.score) + ' away from ' + nextMedal.emoji + ' ' + nextMedal.name + '!';
      } else {
        scoreDelta.textContent = delta > 0 ? (delta + ' away from best') : '';
      }
      scoreDelta.className = 'score-delta';
    }

    deathCombo.textContent = runBestCombo;
    deathNearMisses.textContent = nearMissCount;

    // Run grade
    const gradeEl = document.getElementById('death-grade');
    if (gradeEl) {
      const gradeObj = getRunGrade(state.score, bestScore);
      gradeEl.textContent = gradeObj.grade;
      gradeEl.style.color = gradeObj.color;
    }

    // Hearts breakdown
    const heartsEl = document.getElementById('death-hearts');
    if (heartsEl) {
      let html = '';
      if (runHeartsBreakdown.pipes) html += '<div class="hearts-row"><span>Pipes ' + state.score + '</span><span>+' + runHeartsBreakdown.pipes + ' \u{1F496}</span></div>';
      if (runHeartsBreakdown.graze) html += '<div class="hearts-row"><span>Grazes</span><span>+' + runHeartsBreakdown.graze + ' \u{1F496}</span></div>';
      if (runHeartsBreakdown.golden) html += '<div class="hearts-row hearts-bonus"><span>Golden Pipes</span><span>+' + runHeartsBreakdown.golden + ' \u{1F496}</span></div>';
      if (runHeartsBreakdown.combo) html += '<div class="hearts-row"><span>Combo</span><span>+' + runHeartsBreakdown.combo + ' \u{1F496}</span></div>';
      if (runHeartsBreakdown.newBest) html += '<div class="hearts-row hearts-bonus"><span>New Best!</span><span>+' + runHeartsBreakdown.newBest + ' \u{1F496}</span></div>';
      if (runHeartsBreakdown.newMedal) html += '<div class="hearts-row hearts-bonus"><span>New Medal!</span><span>+' + runHeartsBreakdown.newMedal + ' \u{1F496}</span></div>';
      if (runHeartsBreakdown.daily) html += '<div class="hearts-row hearts-bonus"><span>Daily \u2713</span><span>+' + runHeartsBreakdown.daily + ' \u{1F496}</span></div>';
      if (luckyRun) html += '<div class="hearts-row hearts-lucky"><span>LUCKY! 2x</span><span>+' + runHeartsBreakdown.lucky + ' \u{1F496}</span></div>';
      html += '<div class="hearts-total"><span>Total</span><span>' + runHearts + ' \u{1F496}</span></div>';
      heartsEl.innerHTML = html;
    }

    // Hearts balance
    const balanceEl = document.getElementById('death-balance');
    if (balanceEl) balanceEl.textContent = hearts + ' \u{1F496}';

    // Daily challenge progress
    const dailyEl = document.getElementById('death-daily');
    if (dailyEl && dailyChallenge) {
      const pct = Math.min(100, (dailyChallengeProgress / dailyChallenge.target) * 100);
      dailyEl.innerHTML = '<div class="daily-label">' + (dailyChallengeComplete ? '\u2713 ' : '') + dailyChallenge.desc + '</div>' +
        '<div class="daily-bar"><div class="daily-fill" style="width:' + pct + '%"></div></div>';
      dailyEl.style.display = 'block';
    } else if (dailyEl) {
      dailyEl.style.display = 'none';
    }

    // V2: Session counter
    const runCountEl = document.getElementById('death-run-count');
    if (runCountEl) runCountEl.textContent = 'Run #' + sessionRuns;

    // Waifu speech bubble
    const speechEl = document.getElementById('death-speech');
    if (speechEl) speechEl.textContent = waifuSpeech;

    startBtn.textContent = 'TRY AGAIN';
    overlay.classList.remove('hidden');

    if (pendingRestart) { pendingRestart = false; startGame(); }
  }

  // ─── Start ───
  function startGame() {
    if (!audioCtx) initAudio();
    // V2: Session counter
    sessionRuns++;
    // Show comeback bonus on first game of the session
    if (comebackMsg && comebackHearts > 0) {
      const speechEl = document.getElementById('start-speech');
      if (speechEl) speechEl.textContent = comebackMsg + ' (+' + comebackHearts + ' \u{1F496})';
      comebackMsg = null; comebackHearts = 0;
    }
    reset();
    startContent.style.display = 'block';
    deathContent.style.display = 'none';
    overlay.classList.add('hidden');
    loopActive = true;
    lastTime = performance.now();
    gameTime = lastTime;
    rafId = requestAnimationFrame(loop);
    spawnPipe();
    // V2: Start ambient pulse
    startPulse();
  }

  // ─── Events ───
  startBtn.addEventListener('click', e => {
    e.stopPropagation();
    if (!audioCtx) initAudio();
    startGame();
  });

  overlay.addEventListener('click', () => {
    if (state.gameOver && overlayShown) startGame();
  });

  canvas.addEventListener('click', handleInput);

  document.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.code === 'Space' || e.code === 'ArrowUp') {
      e.preventDefault();
      handleInput();
    }
  });

  canvas.addEventListener('touchstart', e => {
    e.preventDefault();
    handleInput();
  }, { passive: false });

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (loopActive) cancelAnimationFrame(rafId);
    } else {
      if (loopActive) {
        lastTime = performance.now();
        rafId = requestAnimationFrame(loop);
      }
    }
  });

  return { start: startGame };
})();
