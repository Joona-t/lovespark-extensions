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

  // ─── Sound ───
  let audioCtx = null;

  function initAudio() {
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === 'suspended') audioCtx.resume();
    } catch (_) {}
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

  function sfxScore(comboCount) {
    const pitch = Math.min(660 + (comboCount - 1) * 40, 1200);
    playTone(pitch, 0.10, 0.10, 'sine', Math.min(pitch * 1.33, 1600));
  }

  function sfxDeath() { playTone(200, 0.25, 0.15, 'triangle', 80); }

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

  // New feedback systems
  let combo = 0;
  let runBestCombo = 0;
  let nearMissCount = 0;
  let nearMissFlash = 0;
  let floatingTexts = [];
  let newBestFlag = false;

  // ─── Storage ───
  const useChrome = typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;

  function loadStats() {
    if (useChrome) {
      chrome.storage.local.get(['bestScore'], (data) => {
        bestScore = data.bestScore || 0;
        bestNum.textContent = bestScore;
      });
    } else {
      bestScore = parseInt(localStorage.getItem('flappyWaifuBest')) || 0;
      bestNum.textContent = bestScore;
    }
  }

  function saveStats() {
    const medal = getMedal(state.score);
    if (useChrome) {
      chrome.storage.local.get(
        ['bestScore', 'totalGames', 'totalScore', 'totalPipes', 'bestCombo', 'totalNearMisses', 'highestMedal'],
        (data) => {
          const highMedal = getMedalByName(data.highestMedal);
          const updated = {
            bestScore: bestScore,
            totalGames: (data.totalGames || 0) + 1,
            totalScore: (data.totalScore || 0) + state.score,
            totalPipes: (data.totalPipes || 0) + state.score,
            bestCombo: Math.max(data.bestCombo || 0, runBestCombo),
            totalNearMisses: (data.totalNearMisses || 0) + nearMissCount,
            highestMedal: medal && (!highMedal || medal.threshold > highMedal.threshold) ? medal.name : (data.highestMedal || ''),
            lastPlayed: new Date().toISOString().slice(0, 10),
          };
          chrome.storage.local.set(updated);
        }
      );
    } else {
      try { localStorage.setItem('flappyWaifuBest', bestScore); } catch (_) {}
    }
  }

  loadStats();

  // ─── Cached background gradient ───
  const bgGrad = (() => {
    const g = ctx.createLinearGradient(0, 0, 0, C.H);
    g.addColorStop(0, '#0d0a12');
    g.addColorStop(1, '#1a0828');
    return g;
  })();

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
    floatingTexts = [];
    newBestFlag = false;
    scoreDisplay.textContent = '0';
  }

  // ─── Spawn ───
  function spawnPipe() {
    const d = getDifficulty(state.score);
    const gap = d.gapMin + Math.random() * (d.gapMax - d.gapMin);
    const minTop = 55;
    const maxTop = C.H - gap - 55;
    const topH = minTop + Math.random() * (maxTop - minTop);
    state.pipes.push({ x: C.W + 10, topH, gap, scored: false });
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
      if (screenShake > 0.5) screenShake *= Math.pow(0.85, t);
      else screenShake = 0;
      updateParticles(t);
      updateFloatingTexts(t);
      if (nearMissFlash > 0) nearMissFlash -= dt;
      if (milestone) {
        milestone.y -= 0.8 * t;
        milestone.alpha -= 0.008 * t;
        if (milestone.alpha <= 0) milestone = null;
      }
      deathTimer -= dt;
      if (deathTimer <= 0 && !overlayShown) showGameOverOverlay();
      return;
    }

    // Physics
    state.vel += GRAVITY * t;
    state.vel = Math.min(state.vel, TERMINAL_VEL);
    state.y += state.vel * t;

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
        sfxScore(combo);
        emitParticles(C.playerX + C.playerW / 2, state.y + C.playerH / 2, 8, null);

        // Near-miss detection
        const topClearance = (state.y + 8) - p.topH;
        const botClearance = (p.topH + p.gap) - (state.y + C.playerH - 8);
        const minClearance = Math.min(topClearance, botClearance);
        if (minClearance >= 0 && minClearance < 12) {
          nearMissCount++;
          nearMissFlash = 80;
          floatingTexts.push({
            text: 'CLOSE!', x: C.playerX + C.playerW + 10,
            y: state.y + C.playerH / 2, alpha: 1, vy: -1.5, size: 16, color: '#fff',
          });
          sfxNearMiss();
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
        } else if (state.score > 0 && state.score % 10 === 0 && state.score !== lastMilestoneScore) {
          // Every-10 celebration (burst + sound, no text)
          lastMilestoneScore = state.score;
          emitMilestoneBurst(C.playerX + C.playerW / 2, state.y);
          sfxMilestone();
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

    // Shake decay
    if (screenShake > 0.5) screenShake *= Math.pow(0.85, t);
    else screenShake = 0;
  }

  // ─── Draw ───
  function drawBackground() {
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, C.W, C.H);
    const gridAlpha = 0.04 + Math.min(state.score / 200, 0.06);
    ctx.strokeStyle = 'rgba(255,110,180,' + gridAlpha + ')';
    ctx.lineWidth = 1;
    for (let x = 0; x < C.W; x += 40) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, C.H); ctx.stroke();
    }
    for (let y = 0; y < C.H; y += 40) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(C.W, y); ctx.stroke();
    }
  }

  function drawPipe(p) {
    const pw = C.pipeWidth;
    const intensity = Math.min(1, state.score / 60);
    const pipeR = (26 + intensity * 40) | 0;
    const grad = ctx.createLinearGradient(p.x, 0, p.x + pw, 0);
    grad.addColorStop(0, 'rgb(' + pipeR + ',15,46)');
    grad.addColorStop(0.5, 'rgb(' + (pipeR + 14) + ',16,64)');
    grad.addColorStop(1, 'rgb(' + pipeR + ',15,46)');
    ctx.save();
    ctx.shadowColor = C.pink;
    ctx.shadowBlur = 8 + intensity * 4;
    ctx.fillStyle = grad;
    ctx.fillRect(p.x, 0, pw, p.topH);
    const botY = p.topH + p.gap;
    ctx.fillRect(p.x, botY, pw, C.H - botY);
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff6eb455';
    ctx.fillRect(p.x - 4, p.topH - 22, pw + 8, 22);
    ctx.fillRect(p.x - 4, botY, pw + 8, 22);
    ctx.strokeStyle = '#ff6eb488';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(p.x, 0, pw, p.topH);
    ctx.strokeRect(p.x, botY, pw, C.H - botY);
    ctx.restore();
  }

  function drawPlayer() {
    const x = C.playerX, y = state.y, w = C.playerW, h = C.playerH;
    const tilt = Math.max(-0.55, Math.min(0.38, state.vel * 0.042));
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.rotate(tilt);
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
    for (const p of state.pipes) drawPipe(p);
    drawParticles();
    drawPlayer();
    drawMilestone();
    drawFloatingTexts();
    drawCombo();
    drawDifficultyIndicator();
    drawNearMissFlash();
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
    emitParticles(C.playerX, state.y + C.playerH / 2, 5, null);
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
    deathTimer = 400;
    sfxDeath();
    newBestFlag = false;
    if (state.score > bestScore) {
      bestScore = state.score;
      bestNum.textContent = bestScore;
      newBestFlag = true;
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

    finalScore.textContent = state.score;

    const medal = getMedal(state.score);
    if (medal) {
      medalBadge.textContent = medal.emoji;
      medalBadge.style.display = 'block';
    } else {
      medalBadge.style.display = 'none';
    }

    if (newBestFlag) {
      scoreDelta.textContent = 'NEW BEST!';
      scoreDelta.className = 'score-delta new-best';
    } else {
      const delta = bestScore - state.score;
      scoreDelta.textContent = delta > 0 ? (delta + ' away from best') : '';
      scoreDelta.className = 'score-delta';
    }

    deathCombo.textContent = runBestCombo;
    deathNearMisses.textContent = nearMissCount;

    startBtn.textContent = 'TRY AGAIN';
    overlay.classList.remove('hidden');

    if (pendingRestart) { pendingRestart = false; startGame(); }
  }

  // ─── Start ───
  function startGame() {
    if (!audioCtx) initAudio();
    reset();
    startContent.style.display = 'block';
    deathContent.style.display = 'none';
    overlay.classList.add('hidden');
    loopActive = true;
    lastTime = performance.now();
    gameTime = lastTime;
    rafId = requestAnimationFrame(loop);
    spawnPipe();
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
