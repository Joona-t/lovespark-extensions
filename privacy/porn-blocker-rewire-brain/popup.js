// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Popup Script
// ═══════════════════════════════════════════════════════════════════

// ── Safe sendMessage wrapper ──
// Wraps chrome.runtime.sendMessage in try/catch + lastError check.
// Survives extension context invalidation gracefully.
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

// ── Tab switching ──
document.querySelectorAll('.popup-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.popup-tab').forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.tab-panel').forEach(p => {
      p.classList.remove('active');
    });
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    const panel = document.getElementById(tab.getAttribute('aria-controls'));
    if (panel) panel.classList.add('active');
  });
});

// ── Open dashboard in new tab ──
document.getElementById('openDashboard').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  window.close();
});

// ── Load state ──
safeSend({ type: 'GET_SETTINGS' }, (data) => {
  if (chrome.runtime.lastError || !data) return;

  // If onboarding never completed, redirect to it
  if (!data.onboardingComplete) {
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
    window.close();
    return;
  }

  document.getElementById('blockedCount').textContent = data.blockedCount || 0;
  document.getElementById('imagesBlurredCount').textContent = data.imagesBlurredCount || 0;

  // Image Blur toggle (default ON)
  const blurToggle = document.getElementById('blurToggle');
  const blurEnabled = data.imageBlurEnabled !== false;
  blurToggle.checked = blurEnabled;
  document.getElementById('blurStatus').textContent = blurEnabled
    ? 'Hiding NSFW images on every site'
    : 'Image blur disabled';

  // Live sobriety timer
  const sobrietyStart = data.sobrietyStartTime;
  if (sobrietyStart) {
    const timerEl = document.getElementById('sobrietyTimer');
    function updateSobrietyTimer() {
      const elapsed = Date.now() - new Date(sobrietyStart).getTime();
      if (elapsed < 0) { timerEl.textContent = '0d 0h 0m'; return; }
      const days = Math.floor(elapsed / 86400000);
      const hours = Math.floor((elapsed % 86400000) / 3600000);
      const mins = Math.floor((elapsed % 3600000) / 60000);
      const secs = Math.floor((elapsed % 60000) / 1000);
      timerEl.textContent = days + 'd ' + hours + 'h ' + mins + 'm ' + secs + 's';
    }
    updateSobrietyTimer();
    setInterval(updateSobrietyTimer, 1000);
  }

  // XP display
  if (typeof getXpProgress === 'function') {
    const xp = data.xp || 0;
    const progress = getXpProgress(xp);
    document.getElementById('xpLevel').textContent =
      'Lv ' + progress.level + ' \u2014 ' + progress.name;
    document.getElementById('xpAmount').textContent = xp + ' XP';
    document.getElementById('xpBarFill').style.width = progress.percent + '%';
  }

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

// ── Affirmation (changes daily, uses quotes.js) ──
if (typeof getDailyAffirmation === 'function') {
  const daily = getDailyAffirmation();
  const el = document.getElementById('affirmation');
  if (el) {
    let display = '\u201C' + daily.text + '\u201D';
    if (daily.author) display += ' \u2014 ' + daily.author;
    el.textContent = display;
  }
}

// ── Image Blur toggle ──
document.getElementById('blurToggle').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.storage.local.set({ imageBlurEnabled: enabled });
  document.getElementById('blurStatus').textContent = enabled
    ? 'Hiding NSFW images on every site'
    : 'Image blur disabled';
});

// ── Shield toggle ──
document.getElementById('enableToggle').addEventListener('change', (e) => {
  const enabled = e.target.checked;

  if (enabled) {
    safeSend({ type: 'SET_ENABLED', enabled: true });
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
    safeSend({ type: 'PAUSE_SHIELD', minutes }, (response) => {
      if (response && response.pauseUntil) {
        const toggle = document.getElementById('enableToggle');
        toggle.checked = false;
        updateToggleUI(false);
        showPauseInfo(new Date(response.pauseUntil));
      }
    });
  });
});

let pauseIntervalId = null;

function showPauseInfo(until) {
  if (pauseIntervalId) clearInterval(pauseIntervalId);
  const pauseInfo = document.getElementById('pauseInfo');
  const update = () => {
    const remaining = Math.max(0, until - Date.now());
    if (remaining <= 0) {
      if (pauseIntervalId) { clearInterval(pauseIntervalId); pauseIntervalId = null; }
      pauseInfo.textContent = 'Pause expired \u2014 shield re-enabled!';
      document.getElementById('enableToggle').checked = true;
      updateToggleUI(true);
      document.getElementById('pauseSection').classList.remove('visible');
      return;
    }
    const mins = Math.floor(remaining / 60000);
    const secs = Math.floor((remaining % 60000) / 1000);
    pauseInfo.textContent = '\u23F8 Shield paused \u2014 auto-resumes in ' + mins + 'm ' + secs + 's';
  };
  update();
  pauseIntervalId = setInterval(update, 1000);
}

function updateToggleUI(enabled) {
  const sub = document.getElementById('toggleStatus');
  sub.textContent = enabled ? 'Protecting your browsing \u2713' : 'Shield is paused \u26A0';
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
    safeSend({ type: 'ADD_SUBREDDIT', subreddit: sub }, (res) => {
      if (chrome.runtime.lastError) {
        feedback.textContent = 'Error adding subreddit';
        return;
      }
      feedback.textContent = '\u2713 r/' + sub + ' blocked';
      input.value = '';
      setTimeout(() => { feedback.textContent = ''; }, 3000);
    });
  } else {
    safeSend({ type: 'ADD_DOMAIN', domain: value }, (res) => {
      if (chrome.runtime.lastError) {
        feedback.textContent = 'Error adding domain';
        return;
      }
      const domains = res?.userDomains || [];
      const added = domains[domains.length - 1] || value;
      feedback.textContent = '\u2713 ' + added + ' blocked';
      input.value = '';
      setTimeout(() => { feedback.textContent = ''; }, 3000);
    });
  }
}

// ── Open settings ──
document.getElementById('openSettings').addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// ── Render resources tab ──
function renderResources() {
  const container = document.getElementById('resourcesScroll');
  if (!container || typeof RESOURCES === 'undefined') return;

  const sections = [
    { key: 'science', label: '\u{1F9EA} Science' },
    { key: 'books', label: '\u{1F4DA} Books' },
    { key: 'recovery', label: '\u{1F4AA} Recovery Tools' },
    { key: 'articles', label: '\u{1F52C} Research Articles' },
  ];

  sections.forEach(({ key, label }) => {
    const items = RESOURCES[key] || [];
    if (items.length === 0) return;

    const header = document.createElement('div');
    header.className = 'res-header';
    header.textContent = label;
    container.appendChild(header);

    items.forEach(item => {
      const a = document.createElement('a');
      a.className = 'res-card';
      a.href = item.url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      a.setAttribute('aria-label', item.title + ' \u2014 opens in new tab');

      const emojiSpan = document.createElement('span');
      emojiSpan.className = 'res-emoji';
      emojiSpan.textContent = item.emoji;

      const infoDiv = document.createElement('div');

      const titleDiv = document.createElement('div');
      titleDiv.className = 'res-title';
      titleDiv.textContent = item.title;

      const descDiv = document.createElement('div');
      descDiv.className = 'res-desc';
      descDiv.textContent = item.description;

      infoDiv.appendChild(titleDiv);
      infoDiv.appendChild(descDiv);
      a.appendChild(emojiSpan);
      a.appendChild(infoDiv);
      container.appendChild(a);
    });
  });
}
renderResources();

// ── Theme dropdown ──
const THEMES = ['retro', 'dark', 'beige', 'slate'];
const THEME_NAMES = { retro: 'Retro Pink', dark: 'Dark', beige: 'Beige', slate: 'Slate' };
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = THEME_NAMES[t] || t;
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === t);
  });
}
(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      applyTheme(theme);
      chrome.storage.local.set({ theme });
      menu.classList.remove('open');
    });
    document.addEventListener('click', () => menu.classList.remove('open'));
  }
  chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  });
})();

// Footer is custom-built in popup.html — no shared footer needed
