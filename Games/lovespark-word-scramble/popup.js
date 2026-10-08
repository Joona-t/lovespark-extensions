'use strict';

/* LoveSpark Word Scramble -- Unscramble neurodivergent-themed words */

LoveSparkTheme.init();

/* -- Theme dropdown wiring -------------------------------- */
(function initDropdown() {
  var trigger = document.getElementById('themeDropdownTrigger');
  var menu = document.getElementById('themeDropdownMenu');
  if (!trigger || !menu) return;
  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    var open = menu.classList.toggle('open');
    trigger.setAttribute('aria-expanded', String(open));
  });
  menu.addEventListener('click', function (e) {
    var opt = e.target.closest('.theme-option');
    if (!opt) return;
    var theme = opt.dataset.theme;
    LoveSparkTheme.apply(theme);
    chrome.storage.local.set({ theme: theme });
    menu.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
    trigger.textContent = opt.textContent.toLowerCase();
  });
  document.addEventListener('click', function () {
    menu.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  });
})();

/* -- Footer ------------------------------------------------ */
var footerMount = document.getElementById('footerMount');
if (typeof LoveSparkFooter !== 'undefined' && footerMount) {
  LoveSparkFooter.render(footerMount);
}

/* -- Word list --------------------------------------------- */
var WORDS = [
  { word: 'FOCUS', hint: 'Concentrating on one thing' },
  { word: 'DOPAMINE', hint: 'The reward neurotransmitter' },
  { word: 'HYPERFOCUS', hint: 'When you cannot stop concentrating' },
  { word: 'STIM', hint: 'Self-stimulatory behavior' },
  { word: 'SENSORY', hint: 'Related to the five senses' },
  { word: 'MASKING', hint: 'Hiding neurodivergent traits' },
  { word: 'ROUTINE', hint: 'A regular sequence of actions' },
  { word: 'CALM', hint: 'Peaceful and quiet state' },
  { word: 'FIDGET', hint: 'Small movements to stay focused' },
  { word: 'TIMER', hint: 'Helps track time on tasks' },
  { word: 'BREATHE', hint: 'In and out, slowly' },
  { word: 'SPARK', hint: 'A sudden burst of inspiration' },
  { word: 'NEURON', hint: 'A brain cell' },
  { word: 'ENERGY', hint: 'The fuel for your brain' },
  { word: 'RHYTHM', hint: 'A regular repeated pattern' },
  { word: 'DREAM', hint: 'What happens when you sleep' },
  { word: 'GENTLE', hint: 'Soft and kind' },
  { word: 'PAUSE', hint: 'A temporary stop' },
  { word: 'BLOOM', hint: 'To grow and flourish' },
  { word: 'COZY', hint: 'Warm and comfortable' },
  { word: 'BRAIN', hint: 'The organ that makes you think' },
  { word: 'PIXEL', hint: 'Smallest unit of a digital image' },
  { word: 'RELAX', hint: 'To become less tense' },
  { word: 'SPARKLE', hint: 'To shine with flashes of light' },
  { word: 'COMFORT', hint: 'A state of physical ease' },
  { word: 'MINDFUL', hint: 'Being aware of the present moment' },
  { word: 'PATTERN', hint: 'A repeated design or sequence' },
  { word: 'CREATIVE', hint: 'Having the ability to make new things' },
  { word: 'BALANCE', hint: 'Equal distribution of weight' },
  { word: 'REFRESH', hint: 'To restore strength and energy' }
];

/* -- DOM refs ---------------------------------------------- */
var scrambledEl = document.getElementById('scrambledWord');
var guessInput = document.getElementById('guessInput');
var submitBtn = document.getElementById('submitBtn');
var hintBtn = document.getElementById('hintBtn');
var skipBtn = document.getElementById('skipBtn');
var hintTextEl = document.getElementById('hintText');
var feedbackEl = document.getElementById('feedback');
var todayEl = document.getElementById('todayCount');
var totalEl = document.getElementById('totalCount');
var streakEl = document.getElementById('streakDisplay');

/* -- Game state -------------------------------------------- */
var currentWord = null;
var hintUsed = false;

function sendBg(msg) {
  return chrome.runtime.sendMessage(msg).catch(function () { return null; });
}

/* -- Scramble function ------------------------------------- */
function scramble(word) {
  var arr = word.split('');
  /* Shuffle until different from original */
  var attempts = 0;
  do {
    for (var i = arr.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = arr[i];
      arr[i] = arr[j];
      arr[j] = tmp;
    }
    attempts++;
  } while (arr.join('') === word && attempts < 20);
  return arr.join('');
}

/* -- Pick new word ----------------------------------------- */
function pickWord() {
  currentWord = WORDS[Math.floor(Math.random() * WORDS.length)];
  hintUsed = false;
  hintTextEl.hidden = true;
  hintTextEl.textContent = '';
  feedbackEl.textContent = '';
  feedbackEl.className = 'feedback';
  guessInput.value = '';
  guessInput.disabled = false;
  submitBtn.disabled = false;

  scrambledEl.textContent = scramble(currentWord.word);
  guessInput.focus();
}

/* -- Check guess ------------------------------------------- */
function checkGuess() {
  var guess = guessInput.value.trim().toUpperCase();
  if (guess.length === 0) return;

  if (guess === currentWord.word) {
    feedbackEl.textContent = 'Correct!';
    feedbackEl.className = 'feedback correct';
    guessInput.disabled = true;
    submitBtn.disabled = true;
    sendBg({ type: 'WORD_SOLVED' }).then(function () {
      refreshStats();
    });
    /* Auto-load next word after delay */
    setTimeout(pickWord, 1200);
  } else {
    feedbackEl.textContent = 'Not quite, try again!';
    feedbackEl.className = 'feedback wrong';
    sendBg({ type: 'STREAK_BROKEN' });
    guessInput.value = '';
    guessInput.focus();
  }
}

/* -- Show hint --------------------------------------------- */
function showHint() {
  if (!currentWord) return;
  hintTextEl.textContent = currentWord.hint;
  hintTextEl.hidden = false;
  hintUsed = true;
}

/* -- Skip word --------------------------------------------- */
function skipWord() {
  feedbackEl.textContent = 'Skipped! The word was: ' + currentWord.word;
  feedbackEl.className = 'feedback wrong';
  sendBg({ type: 'STREAK_BROKEN' });
  setTimeout(pickWord, 1200);
}

/* -- Stats ------------------------------------------------- */
function refreshStats() {
  sendBg({ type: 'GET_STATS' }).then(function (data) {
    if (!data) return;
    todayEl.textContent = String(data.wordsSolvedToday || 0);
    totalEl.textContent = String(data.wordsSolvedTotal || 0);
    streakEl.textContent = String(data.currentStreak || 0);
  });
}

/* -- Event listeners --------------------------------------- */
submitBtn.addEventListener('click', checkGuess);
guessInput.addEventListener('keydown', function (e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    checkGuess();
  }
});
hintBtn.addEventListener('click', showHint);
skipBtn.addEventListener('click', skipWord);

/* -- Init -------------------------------------------------- */
pickWord();
refreshStats();
