'use strict';

/* LoveSpark Color Match -- 4x3 color tile memory game */

LoveSparkTheme.init();

/* -- Footer ------------------------------------------------ */
var footerMount = document.getElementById('footerMount');
if (typeof LoveSparkFooter !== 'undefined' && footerMount) {
  footerMount.innerHTML = LoveSparkFooter.render();
}

/* -- DOM refs ---------------------------------------------- */
var boardEl = document.getElementById('gameBoard');
var timerEl = document.getElementById('timerDisplay');
var movesEl = document.getElementById('movesDisplay');
var newGameBtn = document.getElementById('newGameBtn');
var winMsgEl = document.getElementById('winMessage');
var todayEl = document.getElementById('todayCount');
var totalEl = document.getElementById('totalCount');
var bestTimeEl = document.getElementById('bestTimeDisplay');

/* -- Color pairs (6 pairs for 4x3 = 12 tiles) ------------- */
var COLORS = [
  '#E8457C', '#FF6B9D', '#D63466',
  '#9B59B6', '#3498DB', '#2ECC71',
  '#F39C12', '#E74C3C', '#1ABC9C',
  '#8E44AD', '#2980B9', '#27AE60'
];

/* -- Game state -------------------------------------------- */
var tiles = [];
var flipped = [];
var matched = 0;
var moves = 0;
var timerSec = 0;
var timerId = null;
var locked = false;

function sendBg(msg) {
  return chrome.runtime.sendMessage(msg).catch(function () { return null; });
}

/* -- Timer ------------------------------------------------- */
function startTimer() {
  stopTimer();
  timerSec = 0;
  timerEl.textContent = '0:00';
  timerId = setInterval(function () {
    timerSec++;
    var m = Math.floor(timerSec / 60);
    var s = timerSec % 60;
    timerEl.textContent = m + ':' + (s < 10 ? '0' : '') + s;
  }, 1000);
}

function stopTimer() {
  if (timerId !== null) {
    clearInterval(timerId);
    timerId = null;
  }
}

/* -- Shuffle ----------------------------------------------- */
function shuffle(arr) {
  for (var i = arr.length - 1; i > 0; i--) {
    var j = Math.floor(Math.random() * (i + 1));
    var tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  return arr;
}

/* -- Build board ------------------------------------------- */
function newGame() {
  stopTimer();
  winMsgEl.hidden = true;
  winMsgEl.textContent = '';
  matched = 0;
  moves = 0;
  flipped = [];
  locked = false;
  movesEl.textContent = '0 moves';
  timerEl.textContent = '0:00';

  /* Pick 6 random colors and duplicate for pairs */
  var picked = shuffle(COLORS.slice()).slice(0, 6);
  var pairs = shuffle(picked.concat(picked));

  /* Clear board */
  while (boardEl.firstChild) {
    boardEl.removeChild(boardEl.firstChild);
  }
  tiles = [];

  pairs.forEach(function (color, idx) {
    var tile = document.createElement('button');
    tile.className = 'tile';
    tile.setAttribute('role', 'gridcell');
    tile.setAttribute('aria-label', 'Tile ' + (idx + 1) + ' face down');
    tile.dataset.color = color;
    tile.dataset.index = String(idx);

    var inner = document.createElement('div');
    inner.className = 'tile-inner';
    inner.style.backgroundColor = color;
    tile.appendChild(inner);

    tile.addEventListener('click', function () { flipTile(tile); });
    boardEl.appendChild(tile);
    tiles.push(tile);
  });
}

/* -- Flip logic -------------------------------------------- */
function flipTile(tile) {
  if (locked) return;
  if (tile.classList.contains('flipped') || tile.classList.contains('matched')) return;
  if (flipped.length >= 2) return;

  /* Start timer on first flip */
  if (moves === 0 && flipped.length === 0 && timerId === null) {
    startTimer();
  }

  tile.classList.add('flipped');
  tile.setAttribute('aria-label', 'Tile ' + (Number(tile.dataset.index) + 1) + ' showing color');
  flipped.push(tile);

  if (flipped.length === 2) {
    moves++;
    movesEl.textContent = moves + (moves === 1 ? ' move' : ' moves');
    checkMatch();
  }
}

function checkMatch() {
  var a = flipped[0];
  var b = flipped[1];

  if (a.dataset.color === b.dataset.color) {
    a.classList.add('matched');
    b.classList.add('matched');
    a.setAttribute('aria-label', 'Matched pair');
    b.setAttribute('aria-label', 'Matched pair');
    flipped = [];
    matched += 2;

    if (matched === tiles.length) {
      gameWon();
    }
  } else {
    locked = true;
    setTimeout(function () {
      a.classList.remove('flipped');
      b.classList.remove('flipped');
      a.setAttribute('aria-label', 'Tile ' + (Number(a.dataset.index) + 1) + ' face down');
      b.setAttribute('aria-label', 'Tile ' + (Number(b.dataset.index) + 1) + ' face down');
      flipped = [];
      locked = false;
    }, 700);
  }
}

function gameWon() {
  stopTimer();
  winMsgEl.hidden = false;
  var m = Math.floor(timerSec / 60);
  var s = timerSec % 60;
  var timeStr = m + ':' + (s < 10 ? '0' : '') + s;
  winMsgEl.textContent = 'Matched in ' + timeStr + ' with ' + moves + ' moves!';
  sendBg({ type: 'GAME_WON', time: timerSec }).then(function () { refreshStats(); });
}

/* -- Stats ------------------------------------------------- */
function refreshStats() {
  sendBg({ type: 'GET_STATS' }).then(function (data) {
    if (!data) return;
    todayEl.textContent = String(data.gamesWonToday || 0);
    totalEl.textContent = String(data.gamesWonTotal || 0);
    if (data.bestTime > 0) {
      var bm = Math.floor(data.bestTime / 60);
      var bs = data.bestTime % 60;
      bestTimeEl.textContent = bm + ':' + (bs < 10 ? '0' : '') + bs;
    } else {
      bestTimeEl.textContent = '--';
    }
  });
}

/* -- Init -------------------------------------------------- */
newGameBtn.addEventListener('click', newGame);
newGame();
refreshStats();
