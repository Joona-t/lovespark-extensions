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
  playerImg.src = 'data:image/png;base64,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';
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
