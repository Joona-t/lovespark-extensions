// LoveSpark Focus Pro — sounds.js
// Web Audio API ambient sound generator. All sounds are procedurally generated.
// No audio files needed — pure synthesis.
'use strict';

const AmbientSounds = (() => {
  let ctx = null;
  let masterGain = null;
  let activeNodes = [];
  let activeType = null;
  let _volume = 0.5;

  function init() {
    if (ctx && ctx.state !== 'closed') return;
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = _volume;
    masterGain.connect(ctx.destination);
  }

  function ensureContext() {
    if (!ctx || ctx.state === 'closed') {
      init();
    }
    if (ctx.state === 'suspended') {
      ctx.resume();
    }
  }

  // Create a buffer of white noise samples
  function createNoiseBuffer(seconds) {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * seconds;
    const buffer = ctx.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      for (let i = 0; i < length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
    }
    return buffer;
  }

  // Create a buffer of brownian (red) noise — random walk
  function createBrownianBuffer(seconds) {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * seconds;
    const buffer = ctx.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
      let last = 0;
      for (let i = 0; i < length; i++) {
        const white = Math.random() * 2 - 1;
        last = (last + 0.02 * white) / 1.02;
        data[i] = last * 3.5; // Amplify
      }
    }
    return buffer;
  }

  // Create pink noise buffer (1/f spectrum approximation)
  function createPinkBuffer(seconds) {
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * seconds;
    const buffer = ctx.createBuffer(2, length, sampleRate);
    for (let ch = 0; ch < 2; ch++) {
      const data = buffer.getChannelData(ch);
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
    }
    return buffer;
  }

  function stopAll() {
    for (const node of activeNodes) {
      try {
        if (node.stop) node.stop();
        if (node.disconnect) node.disconnect();
      } catch (e) { /* already stopped */ }
    }
    activeNodes = [];
    activeType = null;
  }

  function track(node) {
    activeNodes.push(node);
    return node;
  }

  // ── Rain: brownian noise base + filtered drips ────────────────────────────

  function playRain() {
    ensureContext();

    // Brownian noise base (rumble of rain)
    const noiseBuffer = createBrownianBuffer(4);
    const noise = ctx.createBufferSource();
    noise.buffer = noiseBuffer;
    noise.loop = true;

    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 800;
    lpf.Q.value = 0.7;

    const noiseGain = ctx.createGain();
    noiseGain.gain.value = 0.6;

    noise.connect(lpf);
    lpf.connect(noiseGain);
    noiseGain.connect(masterGain);
    noise.start();
    track(noise);

    // Higher frequency layer (rain patter on window)
    const patterBuffer = createNoiseBuffer(3);
    const patter = ctx.createBufferSource();
    patter.buffer = patterBuffer;
    patter.loop = true;

    const hpf = ctx.createBiquadFilter();
    hpf.type = 'bandpass';
    hpf.frequency.value = 2500;
    hpf.Q.value = 0.5;

    const patterGain = ctx.createGain();
    patterGain.gain.value = 0.15;

    // Slow amplitude modulation for natural variation
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.15;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.08;
    lfo.connect(lfoGain);
    lfoGain.connect(patterGain.gain);
    lfo.start();
    track(lfo);

    patter.connect(hpf);
    hpf.connect(patterGain);
    patterGain.connect(masterGain);
    patter.start();
    track(patter);
  }

  // ── Cafe: pink noise + subtle low hum + gentle chatter texture ────────────

  function playCafe() {
    ensureContext();

    // Pink noise base (ambient murmur)
    const pinkBuffer = createPinkBuffer(4);
    const pink = ctx.createBufferSource();
    pink.buffer = pinkBuffer;
    pink.loop = true;

    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 600;
    bpf.Q.value = 0.3;

    const pinkGain = ctx.createGain();
    pinkGain.gain.value = 0.45;

    pink.connect(bpf);
    bpf.connect(pinkGain);
    pinkGain.connect(masterGain);
    pink.start();
    track(pink);

    // Low hum (coffee machine / AC)
    const hum = ctx.createOscillator();
    hum.type = 'sine';
    hum.frequency.value = 85;
    const humGain = ctx.createGain();
    humGain.gain.value = 0.04;
    hum.connect(humGain);
    humGain.connect(masterGain);
    hum.start();
    track(hum);

    // Higher chatter texture
    const chatterBuffer = createNoiseBuffer(3);
    const chatter = ctx.createBufferSource();
    chatter.buffer = chatterBuffer;
    chatter.loop = true;

    const chatterBpf = ctx.createBiquadFilter();
    chatterBpf.type = 'bandpass';
    chatterBpf.frequency.value = 1800;
    chatterBpf.Q.value = 1.2;

    const chatterGain = ctx.createGain();
    chatterGain.gain.value = 0.06;

    // Slow modulation for natural feel
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.03;
    lfo.connect(lfoGain);
    lfoGain.connect(chatterGain.gain);
    lfo.start();
    track(lfo);

    chatter.connect(chatterBpf);
    chatterBpf.connect(chatterGain);
    chatterGain.connect(masterGain);
    chatter.start();
    track(chatter);
  }

  // ── Lofi: filtered sawtooth chord + gentle LFO + vinyl crackle ────────────

  function playLofi() {
    ensureContext();

    // Chord: sawtooth oscillators detuned and filtered
    const notes = [261.63, 329.63, 392.00, 493.88]; // C4, E4, G4, B4
    for (const freq of notes) {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      // Slight detune for warmth
      osc.detune.value = (Math.random() - 0.5) * 12;

      const lpf = ctx.createBiquadFilter();
      lpf.type = 'lowpass';
      lpf.frequency.value = 800;
      lpf.Q.value = 2;

      // LFO on filter cutoff for movement
      const lfo = ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 0.1 + Math.random() * 0.05;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 200;
      lfo.connect(lfoGain);
      lfoGain.connect(lpf.frequency);
      lfo.start();
      track(lfo);

      const oscGain = ctx.createGain();
      oscGain.gain.value = 0.06;

      osc.connect(lpf);
      lpf.connect(oscGain);
      oscGain.connect(masterGain);
      osc.start();
      track(osc);
    }

    // Vinyl crackle layer
    const crackleBuffer = createNoiseBuffer(2);
    const crackle = ctx.createBufferSource();
    crackle.buffer = crackleBuffer;
    crackle.loop = true;

    const crackleHpf = ctx.createBiquadFilter();
    crackleHpf.type = 'highpass';
    crackleHpf.frequency.value = 5000;

    const crackleGain = ctx.createGain();
    crackleGain.gain.value = 0.03;

    crackle.connect(crackleHpf);
    crackleHpf.connect(crackleGain);
    crackleGain.connect(masterGain);
    crackle.start();
    track(crackle);
  }

  // ── White noise: flat spectrum ────────────────────────────────────────────

  function playWhite() {
    ensureContext();

    const buffer = createNoiseBuffer(4);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    // Slight low-cut to remove rumble
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 40;

    const gain = ctx.createGain();
    gain.gain.value = 0.35;

    source.connect(hpf);
    hpf.connect(gain);
    gain.connect(masterGain);
    source.start();
    track(source);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  function play(type) {
    stop();
    ensureContext();
    activeType = type;

    switch (type) {
      case 'rain':  playRain();  break;
      case 'cafe':  playCafe();  break;
      case 'lofi':  playLofi();  break;
      case 'white': playWhite(); break;
      default: return;
    }
  }

  function stop() {
    stopAll();
  }

  function setVolume(v) {
    // v is 0-100
    _volume = Math.max(0, Math.min(1, v / 100));
    if (masterGain) {
      masterGain.gain.value = _volume;
    }
  }

  function getActiveType() {
    return activeType;
  }

  function isPlaying() {
    return activeType !== null && activeNodes.length > 0;
  }

  return { play, stop, setVolume, getActiveType, isPlaying };
})();

if (typeof globalThis !== 'undefined') globalThis.AmbientSounds = AmbientSounds;
