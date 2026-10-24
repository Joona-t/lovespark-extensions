'use strict';

LoveSparkTheme.init();

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const cardTextEl = document.getElementById('cardText');
const cardCategoryEl = document.getElementById('cardCategory');
const cardEl = document.getElementById('card');
const favBtn = document.getElementById('favBtn');
const favIcon = document.getElementById('favIcon');
const nextBtn = document.getElementById('nextBtn');
const favCountEl = document.getElementById('favCount');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;
let currentCard = null;

if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

// ── Safe message to background ──────────────
async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Affirmation Cards] sendBg error:', err.message);
    return null;
  }
}

// ── Display a card ──────────────────────────
function showCard(card) {
  if (!card) return;
  currentCard = card;

  cardCategoryEl.textContent = (card.categoryEmoji || '') + ' ' + (card.categoryLabel || '');
  cardTextEl.textContent = card.text;

  // Animate card entrance
  cardEl.classList.remove('card-entering');
  void cardEl.offsetWidth;
  cardEl.classList.add('card-entering');

  // Update favorite button
  updateFavButton(card.isFavorite);
}

function updateFavButton(isFav) {
  if (isFav) {
    favIcon.textContent = '\u2665'; // filled heart
    favBtn.classList.add('is-fav');
    favBtn.setAttribute('aria-label', 'Remove from favorites');
  } else {
    favIcon.textContent = '\u2661'; // empty heart
    favBtn.classList.remove('is-fav');
    favBtn.setAttribute('aria-label', 'Save to favorites');
  }
}

// ── Update stats ────────────────────────────
function updateStats(data) {
  const today = data.cardsSeenToday || 0;
  const total = data.cardsSeenTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  favCountEl.textContent = (data.favoritesCount || 0) + ' favorites saved';
}

// ── Next card ───────────────────────────────
nextBtn.addEventListener('click', async () => {
  const result = await sendBg({ type: 'NEXT_CARD' });
  if (result && result.card) {
    showCard(result.card);
  }
  // Refresh stats
  const stats = await sendBg({ type: 'GET_STATS' });
  if (stats) updateStats(stats);
});

// ── Toggle favorite ─────────────────────────
favBtn.addEventListener('click', async () => {
  if (!currentCard) return;
  const result = await sendBg({ type: 'TOGGLE_FAVORITE', index: currentCard.index });
  if (result && !result.error) {
    updateFavButton(result.isFavorite);
    favCountEl.textContent = (result.favoritesCount || 0) + ' favorites saved';

    // Pop animation on heart
    LoveSparkPopup.pop(favBtn);
  }
});

// ── Keyboard shortcuts ──────────────────────
document.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowRight' || e.key === ' ') {
    e.preventDefault();
    nextBtn.click();
  }
  if (e.key === 'f' || e.key === 'F') {
    favBtn.click();
  }
});

// ── Init ────────────────────────────────────
async function initPopup() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    updateStats(data);
    if (data.card) {
      showCard(data.card);
    }
  }
}

initPopup();
