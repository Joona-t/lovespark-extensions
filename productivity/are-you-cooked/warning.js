'use strict';

const DISMISS_MS = 5000;

const TITLES_MILD = [
  'Homie are you cooked?! 🔥',
  'Bestie what are you doing 💀',
  'Not again... 😭🔥',
  'Tab goblin mode activated 👹',
];

const TITLES_STRICT = [
  'BESTIE. YOU ARE COOKED. 🔥💀',
  'THIS IS AN INTERVENTION. 🚨',
  'WE NEED TO TALK. RIGHT NOW. 😤',
  'THE TABS HAVE WON. 💀🔥💀',
];

const DISMISS_COPY_MILD = [
  'Let me cook 🧑‍🍳',
  'I know I know... 😭',
  "I'm built different 💪",
  'OK OK I\'ll close some... eventually 😭',
];

const DISMISS_COPY_STRICT = [
  'I choose chaos 😈',
  "You can't stop me 💀",
  'Ignore (I\'m cooked) 🔥',
  'I live dangerously 👹',
];

const MINDFUL_COPY = [
  'You are right, let me be mindful 🌸',
  'OK bestie, close it for me 💕',
  'Save me from myself 😭✨',
  'I choose peace today 🧘',
];

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

const params = new URLSearchParams(location.search);
const count  = params.get('count') || '?';
const level  = params.get('level') || 'mild';
const tabId  = params.get('tabId');

const isStrict = level === 'strict';

if (isStrict) document.body.classList.add('strict');

document.getElementById('title').textContent = pick(isStrict ? TITLES_STRICT : TITLES_MILD);
document.getElementById('count').textContent = count;

const dismissBtn    = document.getElementById('dismissBtn');
const mindfulBtn    = document.getElementById('mindfulBtn');
const progressTrack = document.getElementById('progressTrack');

if (isStrict) {
  dismissBtn.textContent = pick(DISMISS_COPY_STRICT);
  mindfulBtn.textContent = pick(MINDFUL_COPY);
  progressTrack.style.display = 'none';

  mindfulBtn.addEventListener('click', () => {
    if (tabId) {
      chrome.runtime.sendMessage({ action: 'closeTab', tabId: Number(tabId) });
    }
    window.close();
  });
} else {
  dismissBtn.textContent = pick(DISMISS_COPY_MILD);
  setTimeout(() => window.close(), DISMISS_MS);
}

dismissBtn.addEventListener('click', () => window.close());
