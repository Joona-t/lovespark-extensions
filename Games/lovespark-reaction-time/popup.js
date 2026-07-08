'use strict';

LoveSparkTheme.init();

const zone = document.getElementById('reactionZone');
const textEl = document.getElementById('reactionText');
const timeEl = document.getElementById('reactionTime');
const resultEl = document.getElementById('resultMessage');
const bestEl = document.getElementById('bestDisplay');
const avgEl = document.getElementById('avgDisplay');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');

let state = 'idle'; // idle | waiting | ready | result | early
let startTime = 0;
let waitTimer = null;

const RESULT_MSGS = [
  'Lightning fast!', 'Great reflexes!', 'Nice one!',
  'Keep it up!', 'Sparky approves!', 'Try to beat that!'
];

function setState(newState, text) {
  zone.className = 'reaction-zone state-' + newState;
  textEl.textContent = text;
  state = newState;
}

function showTime(ms) {
  timeEl.hidden = false;
  timeEl.textContent = ms + ' ms';
}

function hideTime() {
  timeEl.hidden = true;
  timeEl.textContent = '';
}

function randomMsg() {
  return RESULT_MSGS[Math.floor(Math.random() * RESULT_MSGS.length)];
}

async function loadStats() {
  try {
    const data = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
    if (!data) return;
    const best = data.bestTime || 0;
    const avg = data.dailyAvg || 0;
    bestEl.textContent = best > 0 ? best + ' ms' : '--';
    avgEl.textContent = avg > 0 ? avg + ' ms' : '--';
    todayEl.textContent = data.attemptsToday || 0;
    totalEl.textContent = data.attemptsTotal || 0;
  } catch (_) { /* popup closed or SW inactive */ }
}

function handleClick() {
  if (state === 'idle' || state === 'result' || state === 'early') {
    // Start waiting
    hideTime();
    resultEl.textContent = '';
    setState('waiting', 'Wait for green...');
    const delay = 1500 + Math.random() * 3000; // 1.5-4.5s
    waitTimer = setTimeout(() => {
      startTime = performance.now();
      setState('ready', 'CLICK NOW!');
    }, delay);
  } else if (state === 'waiting') {
    // Clicked too early
    clearTimeout(waitTimer);
    waitTimer = null;
    setState('early', 'Too early!');
    resultEl.textContent = 'Wait for the green screen before clicking.';
  } else if (state === 'ready') {
    // Got it!
    const elapsed = Math.round(performance.now() - startTime);
    setState('result', 'Click to try again');
    showTime(elapsed);
    resultEl.textContent = randomMsg();
    chrome.runtime.sendMessage({ type: 'LOG_ATTEMPT', time: elapsed }).catch(() => {});
    loadStats();
  }
}

zone.addEventListener('click', handleClick);
zone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    handleClick();
  }
});

chrome.storage.onChanged.addListener(() => loadStats());
loadStats();

/* -- Footer -- */
const footerMount = document.getElementById('footerMount');
footerMount.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
