// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Blocked Page Script
// Extracted from inline <script> for MV3 CSP compliance
// ═══════════════════════════════════════════════════════════════════

// ── Safe sendMessage wrapper ──
function safeSend(message, callback) {
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Rewire Brain]', message.type, 'failed:', chrome.runtime.lastError.message);
        if (callback) callback({ error: chrome.runtime.lastError.message });
        return;
      }
      if (callback) callback(response);
    });
  } catch (err) {
    console.warn('[Rewire Brain] sendMessage threw for', message.type, err);
    if (callback) callback({ error: err.message });
  }
}

// ── URL validation (prevent javascript: XSS) ──
function isValidUrl(str) {
  try { const u = new URL(str); return u.protocol === 'http:' || u.protocol === 'https:'; }
  catch { return false; }
}

// ── Select and display a random categorized quote ──
const quote = (typeof getRandomQuote === 'function')
  ? getRandomQuote()
  : { text: 'You are stronger than your impulses.', author: null, category: 'neuroscience' };
const catDisplay = CATEGORY_DISPLAY[quote.category] || { emoji: '\u{1F338}', title: 'Pause & Breathe' };

document.getElementById('emoji').textContent = catDisplay.emoji;
document.getElementById('title').textContent = catDisplay.title;
document.getElementById('messageText').textContent = quote.text;

// Show author attribution if available
const authorEl = document.getElementById('quoteAuthor');
if (authorEl && quote.author) {
  authorEl.textContent = '\u2014 ' + quote.author;
}

// Show category badge
const catEl = document.getElementById('quoteCategory');
if (catEl) {
  const catInfo = QUOTE_CATEGORIES[quote.category];
  if (catInfo) {
    catEl.textContent = catInfo.emoji + ' ' + catInfo.label;
  }
}

// Get the blocked URL from query params
const params = new URLSearchParams(window.location.search);
const blockedUrl = params.get('url') || '';

// ── Floating hearts ──
const heartEmojis = ['\u{1F495}', '\u{1F338}', '\u2728', '\u{1F496}', '\u{1F98B}', '\u{1F9E0}', '\u2B50'];
const heartsContainer = document.getElementById('hearts');
for (let i = 0; i < 14; i++) {
  const span = document.createElement('span');
  span.className = 'heart';
  span.textContent = heartEmojis[Math.floor(Math.random() * heartEmojis.length)];
  span.style.left = (Math.random() * 100) + '%';
  span.style.animationDuration = (6 + Math.random() * 8) + 's';
  span.style.animationDelay = '-' + (Math.random() * 8) + 's';
  heartsContainer.appendChild(span);
}

// ── XP toast helper ──
function showXpToast(amount) {
  const toast = document.getElementById('xpToast');
  if (!toast) return;
  toast.textContent = '+' + amount + ' XP';
  toast.classList.add('visible');
  setTimeout(() => toast.classList.remove('visible'), 2000);
}

// ── Breathing phase text + XP tracking ──
const breathePhase = document.getElementById('breathePhase');
const phases = ['Breathe in\u2026', 'Hold\u2026', 'Breathe out\u2026', 'Rest\u2026'];
const phaseDurations = [2450, 2450, 2450, 0];
let phaseIdx = 0;
let breathCycles = 0;
let breathingXpAwarded = false;

function cycleBreathing() {
  breathePhase.textContent = phases[phaseIdx];
  const dur = phaseDurations[phaseIdx] || 1750;

  // Count completed cycles (full round = 4 phases)
  if (phaseIdx === 3) {
    breathCycles++;
    // Award XP after 3 full cycles (~21 seconds of breathing)
    if (breathCycles >= 3 && !breathingXpAwarded) {
      breathingXpAwarded = true;
      safeSend({ type: 'BREATHING_COMPLETED' }, (res) => {
        if (res && !res.error) showXpToast(15);
      });
    }
  }

  phaseIdx = (phaseIdx + 1) % phases.length;
  setTimeout(cycleBreathing, dur);
}
cycleBreathing();

// ── Load stats ──
let cooldownSec = 30;

safeSend({ type: 'GET_SETTINGS' }, (data) => {
  if (chrome.runtime.lastError || !data) return;

  const streak = data.streakDays || 0;
  const blocked = data.blockedCount || 0;
  cooldownSec = data.bypassCooldownSec || 30;

  document.getElementById('streakBadge').textContent = '\u{1F525} ' + streak + ' day' + (streak !== 1 ? 's' : '');
  document.getElementById('blockedBadge').textContent = '\u{1F6E1} ' + blocked + ' blocked';

  // Show redirect button if custom URL is set and valid
  const redirectUrl = data.redirectUrl;
  if (redirectUrl && isValidUrl(redirectUrl)) {
    const btn = document.getElementById('btnRedirect');
    btn.style.display = 'block';
    btn.addEventListener('click', () => {
      window.location.href = redirectUrl;
    });
  }
});

// ── Back button (+ bypass-resisted XP) ──
let bypassStarted = false;
document.getElementById('btnBack').addEventListener('click', () => {
  if (bypassStarted) {
    safeSend({ type: 'BYPASS_RESISTED' }, (res) => {
      if (res && !res.error) showXpToast(25);
    });
  }
  if (window.history.length > 2) {
    window.history.go(-2);
  } else {
    window.location.href = 'https://joona-t.github.io';
  }
});

// ── Report a site ──
document.getElementById('reportToggle').addEventListener('click', () => {
  document.getElementById('reportForm').classList.toggle('visible');
});

document.getElementById('reportSubmit').addEventListener('click', () => {
  const url = document.getElementById('reportUrl').value.trim();
  if (!url) return;
  safeSend({ type: 'REPORT_SITE', url }, () => {
    document.getElementById('reportMsg').classList.add('visible');
    document.getElementById('reportUrl').value = '';
    setTimeout(() => {
      document.getElementById('reportMsg').classList.remove('visible');
      document.getElementById('reportForm').classList.remove('visible');
    }, 3000);
  });
});

// ── Render resources section ──
function renderBlockedResources() {
  const grid = document.getElementById('resourcesGrid');
  if (!grid || typeof RESOURCES === 'undefined') return;

  // Curated subset: 2 science, 2 recovery, 1 book
  const featured = [
    ...RESOURCES.science.slice(0, 2),
    ...RESOURCES.recovery.slice(0, 2),
    ...RESOURCES.books.slice(0, 1),
  ];

  featured.forEach(item => {
    const a = document.createElement('a');
    a.className = 'resource-card';
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', item.title + ' \u2014 opens in new tab');

    const emojiSpan = document.createElement('span');
    emojiSpan.className = 'rc-emoji';
    emojiSpan.textContent = item.emoji;

    const infoDiv = document.createElement('div');

    const titleDiv = document.createElement('div');
    titleDiv.className = 'rc-title';
    titleDiv.textContent = item.title;

    const descDiv = document.createElement('div');
    descDiv.className = 'rc-desc';
    descDiv.textContent = item.description;

    infoDiv.appendChild(titleDiv);
    infoDiv.appendChild(descDiv);
    a.appendChild(emojiSpan);
    a.appendChild(infoDiv);
    grid.appendChild(a);
  });
}
renderBlockedResources();

// ── Bypass with timed cooldown ──
let countdownInterval = null;

document.getElementById('dismissBtn').addEventListener('click', () => {
  const countdown = document.getElementById('bypassCountdown');
  const reason = document.getElementById('bypassReason');

  if (countdown.classList.contains('visible')) {
    countdown.classList.remove('visible');
    if (countdownInterval) clearInterval(countdownInterval);
    return;
  }

  countdown.classList.add('visible');
  reason.classList.add('visible');
  bypassStarted = true;

  let remaining = cooldownSec;
  const timerEl = document.getElementById('countdownTimer');
  const fillEl = document.getElementById('countdownFill');
  const confirmBtn = document.getElementById('bypassConfirm');

  timerEl.textContent = remaining;
  fillEl.style.width = '0%';
  confirmBtn.classList.remove('visible');

  countdownInterval = setInterval(() => {
    remaining--;
    timerEl.textContent = remaining;
    fillEl.style.width = ((cooldownSec - remaining) / cooldownSec * 100) + '%';

    if (remaining <= 0) {
      clearInterval(countdownInterval);
      timerEl.textContent = '\u2713';
      confirmBtn.classList.add('visible');
    }
  }, 1000);
});

document.getElementById('bypassConfirm').addEventListener('click', () => {
  const reason = document.getElementById('bypassReason').value.trim();

  safeSend({
    type: 'LOG_BYPASS',
    url: blockedUrl,
    reason: reason
  });

  if (blockedUrl && isValidUrl(blockedUrl)) {
    window.location.href = blockedUrl;
  } else {
    window.history.back();
  }
});
