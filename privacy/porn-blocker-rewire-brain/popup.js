// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Popup Script
// ═══════════════════════════════════════════════════════════════════

const AFFIRMATIONS = [
  '"You are building the version of yourself you\'ve always wanted to become."',
  '"Every small choice in the right direction compounds into something extraordinary."',
  '"Your attention is your most valuable resource. Spend it wisely."',
  '"Rest is not the same as giving in. Take care of yourself in healthy ways."',
  '"The discomfort of discipline is always less than the regret of giving up."',
  '"You are worthy of the life you\'re working toward."',
  '"Focus on what makes you feel genuinely proud of yourself."',
  '"Your brain is literally rewiring itself every time you resist. Keep going."',
  '"The urge will pass whether you act on it or not. Choose the version that builds you up."',
  '"Clarity, energy, confidence — that\'s what\'s on the other side of this."',
  '"You don\'t have to be perfect. You just have to keep showing up."',
  '"The chains of habit are too light to be felt until they are too heavy to be broken. Break them now."',
];

// ── Load state ──
chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (data) => {
  if (chrome.runtime.lastError || !data) return;

  document.getElementById('blockedCount').textContent = data.blockedCount || 0;
  document.getElementById('streakDays').textContent = data.streakDays || 0;

  const toggle = document.getElementById('enableToggle');
  const enabled = data.enabled !== false;
  toggle.checked = enabled;
  updateToggleUI(enabled);

  // Show pause info if currently paused
  if (data.pauseUntil) {
    const until = new Date(data.pauseUntil);
    if (until > new Date()) {
      showPauseInfo(until);
    }
  }
});

// ── Affirmation (changes daily) ──
const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
document.getElementById('affirmation').textContent = AFFIRMATIONS[dayOfYear % AFFIRMATIONS.length];

// ── Shield toggle ──
document.getElementById('enableToggle').addEventListener('change', (e) => {
  const enabled = e.target.checked;

  if (enabled) {
    chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: true });
    updateToggleUI(true);
    document.getElementById('pauseSection').classList.remove('visible');
    document.getElementById('pauseInfo').textContent = '';
  } else {
    // When turning off, show pause options instead of fully disabling
    e.target.checked = true; // Keep toggle on visually
    document.getElementById('pauseSection').classList.toggle('visible');
  }
});

// ── Pause buttons ──
document.querySelectorAll('.pause-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const minutes = parseInt(btn.dataset.minutes);
    chrome.runtime.sendMessage({ type: 'PAUSE_SHIELD', minutes }, (response) => {
      if (response && response.pauseUntil) {
        const toggle = document.getElementById('enableToggle');
        toggle.checked = false;
        updateToggleUI(false);
        showPauseInfo(new Date(response.pauseUntil));
      }
    });
  });
});

function showPauseInfo(until) {
  const pauseInfo = document.getElementById('pauseInfo');
  const update = () => {
    const remaining = Math.max(0, until - Date.now());
    if (remaining <= 0) {
      pauseInfo.textContent = 'Pause expired — shield re-enabled!';
      document.getElementById('enableToggle').checked = true;
      updateToggleUI(true);
      document.getElementById('pauseSection').classList.remove('visible');
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    pauseInfo.textContent = `⏸ Shield paused — auto-resumes in ${mins}m ${secs}s`;
  };
  update();
  setInterval(update, 1000);
}

function updateToggleUI(enabled) {
  const sub = document.getElementById('toggleStatus');
  sub.textContent = enabled ? 'Protecting your browsing ✓' : 'Shield is paused ⚠';
  sub.style.color = enabled ? '#e91e8c' : '#b06080';
}

// ── Quick Add ──
document.getElementById('quickAddBtn').addEventListener('click', quickAdd);
document.getElementById('quickAddInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') quickAdd();
});

function quickAdd() {
  const input = document.getElementById('quickAddInput');
  const feedback = document.getElementById('quickAddFeedback');
  const value = input.value.trim();

  if (!value) {
    feedback.textContent = 'Enter a domain or r/subreddit';
    return;
  }

  // Detect if it's a subreddit
  if (value.startsWith('r/') || value.startsWith('/r/')) {
    const sub = value.replace(/^\/r\//, '').replace(/^r\//, '').toLowerCase();
    chrome.runtime.sendMessage({ type: 'ADD_SUBREDDIT', subreddit: sub }, (res) => {
      if (chrome.runtime.lastError) {
        feedback.textContent = 'Error adding subreddit';
        return;
      }
      feedback.textContent = `✓ r/${sub} blocked`;
      input.value = '';
      setTimeout(() => { feedback.textContent = ''; }, 3000);
    });
  } else {
    chrome.runtime.sendMessage({ type: 'ADD_DOMAIN', domain: value }, (res) => {
      if (chrome.runtime.lastError) {
        feedback.textContent = 'Error adding domain';
        return;
      }
      const domains = res?.userDomains || [];
      const added = domains[domains.length - 1] || value;
      feedback.textContent = `✓ ${added} blocked`;
      input.value = '';
      setTimeout(() => { feedback.textContent = ''; }, 3000);
    });
  }
}

// ── Open settings ──
document.getElementById('openSettings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// ── Theme system ──
const THEMES = ['dark', 'retro', 'beige', 'slate'];
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const btn = document.getElementById('themeTab');
  if (btn) btn.textContent = t;
}
function cycleTheme() {
  const cur = THEMES.find(t => document.body.classList.contains('theme-' + t)) || 'retro';
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  applyTheme(next);
  chrome.storage.local.set({ theme: next });
}
chrome.storage.local.get(['theme'], ({ theme }) => {
  applyTheme(theme || 'retro');
});
document.getElementById('themeTab').addEventListener('click', cycleTheme);
