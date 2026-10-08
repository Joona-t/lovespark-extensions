'use strict';

const DISMISS_MS = 5000;

const TITLES_MILD = [
  'Homie are you cooked?! \u{1F525}',
  'Bestie what are you doing \u{1F480}',
  'Not again... \u{1F62D}\u{1F525}',
  'Tab goblin mode activated \u{1F479}',
];

const TITLES_STRICT = [
  'BESTIE. YOU ARE COOKED. \u{1F525}\u{1F480}',
  'THIS IS AN INTERVENTION. \u{1F6A8}',
  'WE NEED TO TALK. RIGHT NOW. \u{1F624}',
  'THE TABS HAVE WON. \u{1F480}\u{1F525}\u{1F480}',
];

const DISMISS_COPY_MILD = [
  'Let me cook \u{1F9D1}\u{200D}\u{1F373}',
  'I know I know... \u{1F62D}',
  "I'm built different \u{1F4AA}",
  'OK OK I\'ll close some... eventually \u{1F62D}',
];

const DISMISS_COPY_STRICT = [
  'I choose chaos \u{1F608}',
  "You can't stop me \u{1F480}",
  'Ignore (I\'m cooked) \u{1F525}',
  'I live dangerously \u{1F479}',
];

const MINDFUL_COPY = [
  'You are right, let me be mindful \u{1F338}',
  'OK bestie, close it for me \u{1F495}',
  'Save me from myself \u{1F62D}\u{2728}',
  'I choose peace today \u{1F9D8}',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const params = new URLSearchParams(location.search);
const count  = params.get('count') || '?';
const level  = params.get('level') || 'mild';
const tabId  = params.get('tabId');
const numericTabId = tabId ? Number(tabId) : null;

const isStrict = level === 'strict';

// Theme init — read both the new `theme` key and the legacy `darkMode` bool.
chrome.storage.local.get(['theme', 'darkMode']).then(({ theme, darkMode }) => {
  const resolved = theme || (darkMode ? 'dark' : 'retro');
  document.documentElement.setAttribute('data-theme', resolved);
}).catch(err => console.warn('[AYC] theme load', err));

if (isStrict) document.body.classList.add('strict');

document.getElementById('title').textContent = pick(isStrict ? TITLES_STRICT : TITLES_MILD);
document.getElementById('count').textContent = count;

// Couple progress bar animation duration to JS constant
document.documentElement.style.setProperty('--dismiss-duration', DISMISS_MS + 'ms');

const dismissBtn    = document.getElementById('dismissBtn');
const mindfulBtn    = document.getElementById('mindfulBtn');
const progressTrack = document.getElementById('progressTrack');

if (isStrict) {
  dismissBtn.textContent = pick(DISMISS_COPY_STRICT);
  mindfulBtn.textContent = pick(MINDFUL_COPY);
  progressTrack.style.display = 'none';

  mindfulBtn.addEventListener('click', () => {
    if (numericTabId && numericTabId > 0) {
      try {
        chrome.runtime.sendMessage({ action: 'closeTab', tabId: numericTabId })
          .catch(err => console.warn('[AYC] sendMessage', err));
      } catch (err) {
        console.warn('[AYC] sendMessage', err);
      }
    }
    window.close();
  });

  dismissBtn.addEventListener('click', () => window.close());
  mindfulBtn.focus();
} else {
  dismissBtn.textContent = pick(DISMISS_COPY_MILD);
  const timer = setTimeout(() => window.close(), DISMISS_MS);

  dismissBtn.addEventListener('click', () => {
    clearTimeout(timer);
    window.close();
  });
  dismissBtn.focus();
}

// ESC closes the dialog at any tier.
window.addEventListener('keydown', e => { if (e.key === 'Escape') window.close(); });
