'use strict';

LoveSparkTheme.init();

var CUTE_MSGS = [
  "Can't decide? Let Sparky help!",
  'No wrong answers here!',
  'Trust the wheel!',
  'Flip it and forget it!'
];

var todayEl = document.getElementById('todayCount');
var totalEl = document.getElementById('totalCount');
var cuteMsg = document.getElementById('cuteMsg');
var spinBtn = document.getElementById('spinBtn');
var flipBtn = document.getElementById('flipBtn');
var optionInput = document.getElementById('optionInput');
var addBtn = document.getElementById('addBtn');
var optionsList = document.getElementById('optionsList');
var wheelCanvas = document.getElementById('wheelCanvas');
var coinEl = document.getElementById('coin');
var resultBox = document.getElementById('resultBox');
var resultText = document.getElementById('resultText');
var confettiLayer = document.getElementById('confettiLayer');

var tabWheel = document.getElementById('tabWheel');
var tabCoin = document.getElementById('tabCoin');
var panelWheel = document.getElementById('panelWheel');
var panelCoin = document.getElementById('panelCoin');

var options = [];
var spinning = false;
var prevToday = 0;
var prevTotal = 0;

var WHEEL_COLORS = ['#e8457c', '#d63466', '#7c3aed', '#0d9488', '#818cf8', '#f48caf'];

/* -- Tab switching -- */
function switchTab(mode) {
  var isWheel = mode === 'wheel';
  tabWheel.classList.toggle('active', isWheel);
  tabCoin.classList.toggle('active', !isWheel);
  tabWheel.setAttribute('aria-selected', String(isWheel));
  tabCoin.setAttribute('aria-selected', String(!isWheel));
  panelWheel.classList.toggle('hidden', !isWheel);
  panelCoin.classList.toggle('hidden', isWheel);
  resultBox.classList.add('hidden');
}

tabWheel.addEventListener('click', function() { switchTab('wheel'); });
tabCoin.addEventListener('click', function() { switchTab('coin'); });

/* -- Options management -- */
function renderOptions() {
  while (optionsList.firstChild) {
    optionsList.removeChild(optionsList.firstChild);
  }
  options.forEach(function(opt, i) {
    var chip = document.createElement('div');
    chip.className = 'option-chip';

    var label = document.createElement('span');
    label.textContent = opt;
    chip.appendChild(label);

    var removeBtn = document.createElement('button');
    removeBtn.className = 'option-chip-remove';
    removeBtn.setAttribute('aria-label', 'Remove ' + opt);
    removeBtn.textContent = '\u00D7';
    removeBtn.addEventListener('click', function() {
      options.splice(i, 1);
      renderOptions();
      drawWheel();
    });
    chip.appendChild(removeBtn);
    optionsList.appendChild(chip);
  });

  spinBtn.disabled = options.length < 2;
  drawWheel();
}

function addOption() {
  var val = optionInput.value.trim();
  if (!val || options.length >= 6) return;
  options.push(val);
  optionInput.value = '';
  renderOptions();
  optionInput.focus();
}

addBtn.addEventListener('click', addOption);
optionInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') addOption();
});

/* -- Wheel drawing -- */
var ctx = wheelCanvas.getContext('2d');
var wheelRotation = 0;

function drawWheel(rotation) {
  rotation = rotation || 0;
  var cx = 100, cy = 100, r = 95;
  ctx.clearRect(0, 0, 200, 200);

  if (options.length < 2) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.fill();
    ctx.fillStyle = getComputedStyle(document.body).getPropertyValue('--ls-text-muted').trim() || '#9e4d6e';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Add 2+ options', cx, cy);
    return;
  }

  var sliceAngle = (Math.PI * 2) / options.length;

  options.forEach(function(opt, i) {
    var startAngle = rotation + i * sliceAngle;
    var endAngle = startAngle + sliceAngle;

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = WHEEL_COLORS[i % WHEEL_COLORS.length];
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + sliceAngle / 2);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var labelText = opt.length > 10 ? opt.slice(0, 9) + '...' : opt;
    ctx.fillText(labelText, r * 0.55, 0);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.9)';
  ctx.fill();
}

/* -- Spin logic -- */
function spin() {
  if (spinning || options.length < 2) return;
  spinning = true;
  resultBox.classList.add('hidden');
  spinBtn.disabled = true;

  var totalRotation = Math.PI * 2 * (5 + Math.random() * 5);
  var duration = 3000;
  var startTime = performance.now();
  var startRotation = wheelRotation;

  function animate(now) {
    var elapsed = now - startTime;
    var t = Math.min(elapsed / duration, 1);
    var eased = 1 - Math.pow(1 - t, 3);
    var currentRotation = startRotation + totalRotation * eased;
    drawWheel(currentRotation);

    if (t < 1) {
      requestAnimationFrame(animate);
    } else {
      wheelRotation = currentRotation % (Math.PI * 2);
      spinning = false;
      spinBtn.disabled = options.length < 2;

      var sliceAngle = (Math.PI * 2) / options.length;
      var pointerAngle = (Math.PI * 2 - (wheelRotation % (Math.PI * 2)) + Math.PI * 1.5) % (Math.PI * 2);
      var winnerIdx = Math.floor(pointerAngle / sliceAngle) % options.length;

      showResult(options[winnerIdx]);
      chrome.runtime.sendMessage({ type: 'DECISION_MADE' });
    }
  }
  requestAnimationFrame(animate);
}

spinBtn.addEventListener('click', spin);

/* -- Coin flip logic -- */
function flipCoin() {
  if (spinning) return;
  spinning = true;
  resultBox.classList.add('hidden');
  flipBtn.disabled = true;

  var isHeads = Math.random() < 0.5;

  coinEl.classList.remove('show-tails', 'flipping');
  void coinEl.offsetWidth;
  coinEl.style.animation = 'none';
  void coinEl.offsetWidth;

  if (isHeads) {
    coinEl.style.animation = 'coinFlip 1s ease-out';
  } else {
    coinEl.style.animation = 'coinFlipTails 1s ease-out';
  }
  coinEl.classList.add('flipping');

  setTimeout(function() {
    coinEl.style.animation = '';
    coinEl.classList.remove('flipping');
    coinEl.classList.toggle('show-tails', !isHeads);
    coinEl.setAttribute('aria-label', 'Coin showing ' + (isHeads ? 'heads' : 'tails'));
    spinning = false;
    flipBtn.disabled = false;
    showResult(isHeads ? 'Heads!' : 'Tails!');
    chrome.runtime.sendMessage({ type: 'DECISION_MADE' });
  }, 1000);
}

flipBtn.addEventListener('click', flipCoin);

/* -- Result + confetti -- */
function showResult(text) {
  resultText.textContent = text;
  resultBox.classList.remove('hidden');
  spawnConfetti();
}

function spawnConfetti() {
  while (confettiLayer.firstChild) {
    confettiLayer.removeChild(confettiLayer.firstChild);
  }
  var colors = ['#e8457c', '#7c3aed', '#0d9488', '#f48caf', '#818cf8', '#ffd700'];
  for (var i = 0; i < 20; i++) {
    var piece = document.createElement('div');
    piece.className = 'confetti-piece';
    piece.style.left = Math.random() * 100 + '%';
    piece.style.backgroundColor = colors[i % colors.length];
    piece.style.animationDelay = (Math.random() * 0.4) + 's';
    confettiLayer.appendChild(piece);
  }
}

/* -- Stats -- */
function updateUI(data) {
  var today = data.decisionHelperToday || 0;
  var total = data.decisionHelperTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

chrome.storage.onChanged.addListener(function() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
drawWheel();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
