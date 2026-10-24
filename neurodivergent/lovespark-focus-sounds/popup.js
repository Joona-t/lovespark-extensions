'use strict';

LoveSparkTheme.init();

const volumeSlider = document.getElementById('volumeSlider');
const volumeValue = document.getElementById('volumeValue');
const playState = document.getElementById('playState');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

let audioCtx = null;
let activeNodes = [];
let currentSound = null;
let sessionLogged = false;

if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Focus Sounds] sendBg error:', err.message);
    return null;
  }
}

// ── Web Audio noise generators ──────────────
function getAudioCtx() {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function stopAll() {
  for (const node of activeNodes) {
    try { node.stop(); } catch (err) { console.warn('[lovespark-focus-sounds] stopAll:', err); }
    try { node.disconnect(); } catch (err) { console.warn('[lovespark-focus-sounds] stopAll:', err); }
  }
  activeNodes = [];
}

function createNoiseBuffer(ctx, type) {
  const sampleRate = ctx.sampleRate;
  const length = sampleRate * 2;
  const buffer = ctx.createBuffer(1, length, sampleRate);
  const data = buffer.getChannelData(0);

  if (type === 'white') {
    for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  } else if (type === 'brown') {
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.5;
    }
  } else if (type === 'pink') {
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }
  } else if (type === 'rain') {
    // Rain = filtered white noise with random amplitude modulation
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      const mod = 0.3 + 0.7 * Math.abs(Math.sin(i / sampleRate * 0.5));
      data[i] = white * mod * 0.6;
    }
  } else if (type === 'fire') {
    // Fire = brown noise with crackle bursts
    let last = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      const crackle = Math.random() > 0.998 ? (Math.random() * 2 - 1) * 0.8 : 0;
      data[i] = (last * 2.5 + crackle) * 0.7;
    }
  }

  return buffer;
}

function playSound(type, volume) {
  stopAll();
  const ctx = getAudioCtx();
  const buffer = createNoiseBuffer(ctx, type);
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;

  const gain = ctx.createGain();
  gain.gain.value = volume;

  source.connect(gain);
  gain.connect(ctx.destination);
  source.start();

  activeNodes.push(source);
  activeNodes._gain = gain;
  currentSound = type;

  playState.textContent = 'Playing: ' + type.charAt(0).toUpperCase() + type.slice(1) + ' noise';

  if (!sessionLogged) {
    sessionLogged = true;
    sendBg({ type: 'LOG_SESSION' });
  }
}

// ── Sound buttons ───────────────────────────
document.querySelectorAll('.sound-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const sound = btn.dataset.sound;

    // If clicking active sound, stop it
    if (currentSound === sound) {
      stopAll();
      currentSound = null;
      document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
      playState.textContent = 'Tap a sound to start';
      return;
    }

    document.querySelectorAll('.sound-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    playSound(sound, parseFloat(volumeSlider.value));
    sendBg({ type: 'SAVE_PREFS', sound, volume: parseFloat(volumeSlider.value) });
  });
});

// ── Volume control ──────────────────────────
volumeSlider.addEventListener('input', () => {
  const vol = parseFloat(volumeSlider.value);
  volumeValue.textContent = Math.round(vol * 100) + '%';
  if (activeNodes._gain) {
    activeNodes._gain.gain.value = vol;
  }
});

volumeSlider.addEventListener('change', () => {
  sendBg({ type: 'SAVE_PREFS', volume: parseFloat(volumeSlider.value) });
});

// ── Init ────────────────────────────────────
async function init() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    todayEl.textContent = data.sessionsToday || 0;
    totalEl.textContent = data.sessionsTotal || 0;
    volumeSlider.value = data.lastVolume || 0.5;
    volumeValue.textContent = Math.round((data.lastVolume || 0.5) * 100) + '%';
  }
}

init();
