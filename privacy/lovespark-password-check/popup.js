'use strict';

/* ── Theme ─────────────────────────────────────────── */
LoveSparkTheme.init();

/* ── DOM refs ──────────────────────────────────────── */
var statusIcon       = document.getElementById('statusIcon');
var statusText       = document.getElementById('statusText');
var cuteMsg          = document.getElementById('cuteMsg');
var todayEl          = document.getElementById('todayCount');
var totalEl          = document.getElementById('totalCount');
var passwordInput    = document.getElementById('passwordInput');
var toggleVisibility = document.getElementById('toggleVisibility');
var meterFill        = document.getElementById('meterFill');
var meterLabel       = document.getElementById('meterLabel');
var meterWrap        = meterFill.closest('[role="progressbar"]');
var feedbackSection  = document.getElementById('feedbackSection');
var feedbackList     = document.getElementById('feedbackList');

/* ── State ─────────────────────────────────────────── */
var prevToday = 0;
var prevTotal = 0;
var checkDebounce = null;

var STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];
var STRENGTH_ICONS  = ['\uD83D\uDD12', '\uD83D\uDD34', '\uD83D\uDFE0', '\uD83D\uDFE2', '\uD83D\uDFE2'];

/* ── Password strength calculator (pure local) ─────── */
function calculateStrength(pw) {
  var score = 0;
  var feedback = [];

  /* Length checks */
  if (pw.length >= 8) {
    score++;
    feedback.push({ text: '8+ characters', pass: true });
  } else {
    feedback.push({ text: '8+ characters needed (has ' + pw.length + ')', pass: false });
  }

  if (pw.length >= 12) {
    score++;
    feedback.push({ text: '12+ characters (great!)', pass: true });
  } else if (pw.length >= 8) {
    feedback.push({ text: '12+ characters recommended', pass: false });
  }

  /* Character variety */
  var hasLower = /[a-z]/.test(pw);
  var hasUpper = /[A-Z]/.test(pw);
  var hasDigit = /[0-9]/.test(pw);
  var hasSpecial = /[^a-zA-Z0-9]/.test(pw);

  if (hasLower && hasUpper) {
    feedback.push({ text: 'Mixed case', pass: true });
  } else {
    feedback.push({ text: 'Mix upper & lowercase', pass: false });
  }

  if (hasDigit) {
    feedback.push({ text: 'Contains numbers', pass: true });
  } else {
    feedback.push({ text: 'Add numbers', pass: false });
  }

  if (hasSpecial) {
    feedback.push({ text: 'Contains special characters', pass: true });
  } else {
    feedback.push({ text: 'Add special characters (!@#$...)', pass: false });
  }

  var varietyCount = (hasLower ? 1 : 0) + (hasUpper ? 1 : 0) + (hasDigit ? 1 : 0) + (hasSpecial ? 1 : 0);
  if (varietyCount >= 3) score++;
  if (varietyCount >= 4 && pw.length >= 12) score++;

  /* Common pattern warnings */
  var lowerPw = pw.toLowerCase();
  var commonPatterns = ['password', '123456', 'qwerty', 'abc123', 'letmein', 'admin', 'welcome'];
  var hasCommon = false;
  for (var i = 0; i < commonPatterns.length; i++) {
    if (lowerPw.indexOf(commonPatterns[i]) !== -1) {
      hasCommon = true;
      break;
    }
  }
  if (hasCommon) {
    score = Math.max(score - 2, 1);
    feedback.push({ text: 'Contains a common pattern', pass: false });
  }

  /* Clamp to 1-4 */
  score = Math.max(1, Math.min(4, score));

  return { score: score, feedback: feedback };
}

/* ── Update meter UI ───────────────────────────────── */
function updateMeter(score) {
  var pct = (score / 4) * 100;
  meterFill.style.width = pct + '%';

  /* Remove old strength classes */
  for (var i = 0; i <= 4; i++) {
    meterFill.classList.remove('strength-' + i);
  }
  meterFill.classList.add('strength-' + score);

  meterLabel.textContent = STRENGTH_LABELS[score] || 'Enter a password';
  meterWrap.setAttribute('aria-valuenow', String(score));
}

/* ── Update feedback list (DOM API only, no innerHTML) */
function updateFeedback(items) {
  /* Clear existing items */
  while (feedbackList.firstChild) {
    feedbackList.removeChild(feedbackList.firstChild);
  }

  if (items.length === 0) {
    feedbackSection.classList.add('hidden');
    return;
  }

  feedbackSection.classList.remove('hidden');

  for (var i = 0; i < items.length; i++) {
    var li = document.createElement('li');
    li.className = 'feedback-item ' + (items[i].pass ? 'pass' : 'fail');
    li.textContent = items[i].text;
    feedbackList.appendChild(li);
  }
}

/* ── Input handler ─────────────────────────────────── */
passwordInput.addEventListener('input', function() {
  var pw = passwordInput.value;

  if (pw.length === 0) {
    updateMeter(0);
    meterLabel.textContent = 'Enter a password';
    statusText.textContent = 'Type a password to check';
    statusIcon.textContent = '\uD83D\uDD12';
    updateFeedback([]);
    return;
  }

  var result = calculateStrength(pw);
  updateMeter(result.score);
  updateFeedback(result.feedback);

  statusIcon.textContent = STRENGTH_ICONS[result.score] || '\uD83D\uDD12';
  statusText.textContent = STRENGTH_LABELS[result.score] + ' password';

  /* Debounce stat logging — only count once per typing session */
  clearTimeout(checkDebounce);
  checkDebounce = setTimeout(function() {
    chrome.runtime.sendMessage({ type: 'LOG_CHECK' });
  }, 2000);
});

/* ── Visibility toggle ─────────────────────────────── */
toggleVisibility.addEventListener('click', function() {
  var isPassword = passwordInput.type === 'password';
  passwordInput.type = isPassword ? 'text' : 'password';
  toggleVisibility.textContent = isPassword ? '\uD83D\uDE48' : '\uD83D\uDC41';
  toggleVisibility.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
});

/* ── UI update from storage ────────────────────────── */
function updateStats(data) {
  var today = data.checksToday || 0;
  var total = data.checksTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

chrome.storage.onChanged.addListener(function() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateStats);
});

/* ── Init ──────────────────────────────────────────── */
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateStats);

/* Focus the input on popup open */
passwordInput.focus();

/* ── Footer ────────────────────────────────────────── */
LoveSparkFooter.appendTo(document.body);
