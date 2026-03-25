'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

// 60 affirmations — ADHD-specific, neurodivergent-positive, self-compassion focused
const AFFIRMATIONS = [
  { text: "Your brain works differently, not wrongly.", category: "identity" },
  { text: "Starting is the hardest part, and you already did it today.", category: "momentum" },
  { text: "You don't have to earn rest.", category: "rest" },
  { text: "Hyperfocus is a superpower when it finds the right target.", category: "strength" },
  { text: "Messy progress beats perfect paralysis.", category: "momentum" },
  { text: "Your worth isn't measured in productivity.", category: "worth" },
  { text: "It's okay to need more time. The deadline is not your identity.", category: "pace" },
  { text: "You're allowed to do things the unconventional way.", category: "identity" },
  { text: "Forgetting doesn't mean you don't care.", category: "compassion" },
  { text: "Every system you build to help yourself is an act of self-love.", category: "strength" },
  { text: "You've survived 100% of your worst days.", category: "resilience" },
  { text: "Small steps count. Micro-wins are real wins.", category: "momentum" },
  { text: "Your need for stimulation is valid, not a flaw.", category: "identity" },
  { text: "It's okay to ask for help. That's strength, not weakness.", category: "compassion" },
  { text: "You don't owe anyone an explanation for how your brain works.", category: "identity" },
  { text: "Resting is not the same as quitting.", category: "rest" },
  { text: "You are not lazy. You are navigating a world not built for you.", category: "compassion" },
  { text: "Celebrate what you did, not what you didn't.", category: "worth" },
  { text: "Your creativity comes from the same place as your chaos.", category: "strength" },
  { text: "You don't need to fix yourself. You need tools that fit.", category: "identity" },
  { text: "Being overwhelmed doesn't mean you're failing.", category: "compassion" },
  { text: "You're not behind. You're on your own timeline.", category: "pace" },
  { text: "It's okay to have a slow day. Speed isn't everything.", category: "pace" },
  { text: "Your feelings are valid, even when they feel too big.", category: "compassion" },
  { text: "You deserve the same kindness you give to others.", category: "worth" },
  { text: "Progress isn't always visible. Internal growth counts.", category: "momentum" },
  { text: "You're doing better than you think.", category: "resilience" },
  { text: "Every fresh start is a gift, not a failure.", category: "resilience" },
  { text: "Your energy is finite and precious. Spend it wisely.", category: "rest" },
  { text: "Rejection sensitivity lies. You are loved.", category: "compassion" },
  { text: "The task you're avoiding is probably 10 minutes long.", category: "momentum" },
  { text: "You don't have to be consistent to be making progress.", category: "pace" },
  { text: "Your attention is a gift. Give it to things that matter.", category: "strength" },
  { text: "Sensory needs are real needs. Honor them.", category: "identity" },
  { text: "You're allowed to change your mind. Flexibility is intelligence.", category: "strength" },
  { text: "One thing at a time is enough.", category: "pace" },
  { text: "You don't need to justify taking a break.", category: "rest" },
  { text: "Your brain's pattern recognition is extraordinary.", category: "strength" },
  { text: "Imperfect action beats perfect inaction every time.", category: "momentum" },
  { text: "You're not too much. The right people will celebrate you.", category: "worth" },
  { text: "Dopamine-seeking isn't a character flaw.", category: "identity" },
  { text: "You've already overcome so much to be here today.", category: "resilience" },
  { text: "It's okay to grieve the neurotypical life you thought you'd have.", category: "compassion" },
  { text: "Your hyperfixations bring you joy. That's valid.", category: "identity" },
  { text: "Boundaries protect your energy. Set them freely.", category: "rest" },
  { text: "You're not procrastinating. You're waiting for the right spark.", category: "momentum" },
  { text: "Time blindness doesn't make you irresponsible.", category: "compassion" },
  { text: "Your way of thinking solves problems others can't even see.", category: "strength" },
  { text: "You don't have to mask today.", category: "identity" },
  { text: "Every accommodation you use is a tool, not a crutch.", category: "identity" },
  { text: "You're allowed to take up space.", category: "worth" },
  { text: "Your brain craves novelty. Feed it on your terms.", category: "strength" },
  { text: "Starting over is not failure. It's practice.", category: "resilience" },
  { text: "You survived every moment you thought you couldn't.", category: "resilience" },
  { text: "The dishes can wait. You matter more.", category: "rest" },
  { text: "Your need for external structure doesn't make you childish.", category: "compassion" },
  { text: "Neurodivergent joy is revolutionary.", category: "worth" },
  { text: "You bring something unique to every room you enter.", category: "worth" },
  { text: "Today's enough is enough.", category: "pace" },
  { text: "Be gentle with yourself. You're doing a hard thing.", category: "compassion" }
];

const CATEGORIES = {
  identity: { emoji: '\u{1F9E0}', label: 'Identity' },
  momentum: { emoji: '\u{1F680}', label: 'Momentum' },
  rest:     { emoji: '\u{1F33F}', label: 'Rest' },
  strength: { emoji: '\u{1F4AA}', label: 'Strength' },
  worth:    { emoji: '\u{1F496}', label: 'Worth' },
  compassion: { emoji: '\u{1F33B}', label: 'Compassion' },
  resilience: { emoji: '\u{1F525}', label: 'Resilience' },
  pace:     { emoji: '\u{1F422}', label: 'Pace' }
};

const DEFAULTS = {
  cardsSeenToday: 0,
  cardsSeenTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  favorites: [],
  lastCardIndex: -1,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('cardsSeenToday', 'cardsSeenTotal',
  () => LoveSparkBadge.update('isEnabled', 'cardsSeenToday'));

function pickCard(lastIndex) {
  let idx;
  do {
    idx = Math.floor(Math.random() * AFFIRMATIONS.length);
  } while (idx === lastIndex && AFFIRMATIONS.length > 1);
  return idx;
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'cardsSeenToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('cardsSeenToday');
  await LoveSparkBadge.update('isEnabled', 'cardsSeenToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('cardsSeenToday');
      const data = await chrome.storage.local.get([
        'cardsSeenToday', 'cardsSeenTotal', 'isEnabled', 'favorites', 'lastCardIndex'
      ]);
      const idx = pickCard(data.lastCardIndex || -1);
      const card = AFFIRMATIONS[idx];
      const cat = CATEGORIES[card.category] || {};
      const favorites = data.favorites || [];
      const isFav = favorites.some(f => f.text === card.text);
      await chrome.storage.local.set({ lastCardIndex: idx });
      await stats.bump(1);
      return {
        cardsSeenToday: (data.cardsSeenToday || 0) + 1,
        cardsSeenTotal: (data.cardsSeenTotal || 0) + 1,
        isEnabled: data.isEnabled !== false,
        card: { ...card, index: idx, categoryEmoji: cat.emoji, categoryLabel: cat.label, isFavorite: isFav },
        favoritesCount: favorites.length,
        totalCards: AFFIRMATIONS.length
      };
    }
    case 'NEXT_CARD': {
      const data = await chrome.storage.local.get(['lastCardIndex', 'favorites']);
      const idx = pickCard(data.lastCardIndex || -1);
      const card = AFFIRMATIONS[idx];
      const cat = CATEGORIES[card.category] || {};
      const favorites = data.favorites || [];
      const isFav = favorites.some(f => f.text === card.text);
      await chrome.storage.local.set({ lastCardIndex: idx });
      await stats.bump(1);
      return { card: { ...card, index: idx, categoryEmoji: cat.emoji, categoryLabel: cat.label, isFavorite: isFav } };
    }
    case 'TOGGLE_FAVORITE': {
      const data = await chrome.storage.local.get('favorites');
      const favorites = data.favorites || [];
      const card = AFFIRMATIONS[msg.index];
      if (!card) return { error: 'Invalid card index' };
      const existing = favorites.findIndex(f => f.text === card.text);
      if (existing >= 0) {
        favorites.splice(existing, 1);
        await chrome.storage.local.set({ favorites });
        return { ok: true, isFavorite: false, favoritesCount: favorites.length };
      }
      if (favorites.length >= 50) return { error: 'Maximum 50 favorites' };
      favorites.push({ text: card.text, category: card.category, savedAt: Date.now() });
      await chrome.storage.local.set({ favorites });
      return { ok: true, isFavorite: true, favoritesCount: favorites.length };
    }
    case 'GET_FAVORITES': {
      const data = await chrome.storage.local.get('favorites');
      const favorites = (data.favorites || []).map(f => {
        const cat = CATEGORIES[f.category] || {};
        return { ...f, categoryEmoji: cat.emoji, categoryLabel: cat.label };
      });
      return { favorites };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'cardsSeenToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
