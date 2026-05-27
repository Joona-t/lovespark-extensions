// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Categorized Quote Database
// ═══════════════════════════════════════════════════════════════════

const QUOTES = {
  stoic: [
    { text: "You have power over your mind — not outside events. Realize this, and you will find strength.", author: "Marcus Aurelius", source: "Meditations" },
    { text: "No man is free who is not master of himself.", author: "Epictetus", source: "Discourses" },
    { text: "It is not that we have a short time to live, but that we waste a great deal of it.", author: "Seneca", source: "On the Shortness of Life" },
    { text: "The happiness of your life depends upon the quality of your thoughts.", author: "Marcus Aurelius", source: "Meditations" },
    { text: "First say to yourself what you would be; and then do what you have to do.", author: "Epictetus", source: "Discourses" },
    { text: "We suffer more often in imagination than in reality.", author: "Seneca", source: "Letters to Lucilius" },
    { text: "Waste no more time arguing about what a good man should be. Be one.", author: "Marcus Aurelius", source: "Meditations" },
    { text: "How long are you going to wait before you demand the best for yourself?", author: "Epictetus", source: "Enchiridion" },
    { text: "It is not because things are difficult that we do not dare; it is because we do not dare that they are difficult.", author: "Seneca", source: "Letters to Lucilius" },
    { text: "The soul becomes dyed with the colour of its thoughts.", author: "Marcus Aurelius", source: "Meditations" },
    { text: "Make the best use of what is in your power, and take the rest as it happens.", author: "Epictetus", source: "Discourses" },
    { text: "True happiness is to enjoy the present, without anxious dependence upon the future.", author: "Seneca", source: "On the Happy Life" },
    { text: "Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", author: "Marcus Aurelius", source: "Meditations" },
  ],

  mindfulness: [
    { text: "The present moment is the only moment available to us, and it is the door to all moments.", author: "Thich Nhat Hanh", source: null },
    { text: "You can't stop the waves, but you can learn to surf.", author: "Jon Kabat-Zinn", source: "Wherever You Go, There You Are" },
    { text: "Feelings come and go like clouds in a windy sky. Conscious breathing is my anchor.", author: "Thich Nhat Hanh", source: null },
    { text: "In today's rush, we all think too much, seek too much, want too much, and forget about the joy of just being.", author: "Eckhart Tolle", source: null },
    { text: "Between stimulus and response there is a space. In that space is our power to choose our response.", author: "Viktor Frankl", source: "Man's Search for Meaning" },
    { text: "The mind is everything. What you think you become.", author: "Buddha", source: "Dhammapada" },
    { text: "Observe the urge. Name it. Let it pass. You are not your cravings — you are the awareness behind them.", author: null, source: "Mindfulness practice" },
    { text: "Urges are like ocean waves. They build, crest, and then naturally recede. You only need to ride them out.", author: null, source: "Urge surfing technique" },
    { text: "When you own your breath, nobody can steal your peace.", author: null, source: "Meditation teaching" },
    { text: "The root of suffering is attachment. Let go of the attachment, and you let go of the suffering.", author: "Buddha", source: "Dhammapada" },
    { text: "Awareness is the greatest agent for change.", author: "Eckhart Tolle", source: "A New Earth" },
    { text: "Do not dwell in the past, do not dream of the future, concentrate the mind on the present moment.", author: "Buddha", source: null },
  ],

  philosophical: [
    { text: "Knowing yourself is the beginning of all wisdom.", author: "Aristotle", source: null },
    { text: "He who conquers himself is the mightiest warrior.", author: "Confucius", source: "Analects" },
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs", source: "Stanford Commencement, 2005" },
    { text: "Freedom is not the absence of commitments, but the ability to choose yours.", author: "Paulo Coelho", source: null },
    { text: "Mastering others is strength. Mastering yourself is true power.", author: "Lao Tzu", source: "Tao Te Ching" },
    { text: "A journey of a thousand miles begins with a single step.", author: "Lao Tzu", source: "Tao Te Ching" },
    { text: "The unexamined life is not worth living.", author: "Socrates", source: "Apology (Plato)" },
    { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant", source: "The Story of Philosophy" },
    { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela", source: null },
    { text: "Character cannot be developed in ease and quiet. Only through trial and suffering is the soul strengthened.", author: "Helen Keller", source: null },
    { text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.", author: "Ralph Waldo Emerson", source: null },
    { text: "The struggle you're in today is developing the strength you need for tomorrow.", author: null, source: null },
  ],

  neuroscience: [
    { text: "You are more than your impulses. Take three deep breaths and return to what truly matters.", author: null, source: null },
    { text: "Every moment is a fresh start. Your goals are waiting for you — and they're worth it.", author: null, source: null },
    { text: "What are you really looking for right now? Rest, connection, or excitement? There are better ways to find it.", author: null, source: null },
    { text: "The version of you an hour from now will thank you for choosing differently today.", author: null, source: null },
    { text: "Discomfort is temporary. The strength you build by redirecting your attention is permanent.", author: null, source: null },
    { text: "Your mind and your time are precious. Spend them on things that build you up.", author: null, source: null },
    { text: "Whatever you're building, whatever you're dreaming — that's where your energy belongs right now.", author: null, source: null },
    { text: "True freedom isn't doing whatever feels good in the moment. It's building the life you actually want.", author: null, source: null },
    { text: "Every time you choose differently, you're literally building new neural pathways. This moment is rewiring your brain for the better.", author: null, source: null },
    { text: "Urges are like waves — they rise, peak, and fall. You don't have to act on them. Just wait.", author: null, source: null },
    { text: "You've been doing so well. Don't trade a streak you're proud of for a moment you'll regret.", author: null, source: null },
    { text: "You are stronger than the habit. Every time you resist, you prove it to yourself.", author: null, source: null },
    { text: "Your dopamine baseline resets when you give your brain time to recover. Every day of abstinence is neurochemical healing.", author: null, source: "Dopamine neuroscience" },
    { text: "The prefrontal cortex — your brain's decision-maker — gets stronger every time you override an impulse. You're training it right now.", author: null, source: "Neuroscience of self-control" },
    { text: "High dopamine spikes create proportionally deeper crashes below baseline. That's the cycle you're breaking.", author: null, source: "Huberman Lab insights" },
    { text: "Neuroplasticity works both ways. The same brain that formed the habit can rewire itself to break it.", author: null, source: "Neuroplasticity research" },
  ],
};

const QUOTE_CATEGORIES = {
  stoic: { label: 'Stoic', emoji: '\u{1F3DB}\uFE0F' },          // classical building
  mindfulness: { label: 'Mindfulness', emoji: '\u{1F9D8}' },     // person in lotus
  philosophical: { label: 'Philosophical', emoji: '\u{1F4D6}' }, // open book
  neuroscience: { label: 'Neuroscience', emoji: '\u{1F9E0}' },   // brain
};

// Category → title + emoji for blocked page display
const CATEGORY_DISPLAY = {
  stoic: { emoji: '\u{1F3DB}\uFE0F', title: 'Strength Through Discipline' },
  mindfulness: { emoji: '\u{1F33F}', title: 'Return to the Present' },
  philosophical: { emoji: '\u2728', title: 'The Examined Life' },
  neuroscience: { emoji: '\u{1F9E0}', title: 'Rewire Your Brain' },
};

/**
 * Get a random quote with weighted category distribution (25% each).
 * @returns {{ text: string, author: string|null, source: string|null, category: string }}
 */
function getRandomQuote() {
  const categories = Object.keys(QUOTES);
  const cat = categories[Math.floor(Math.random() * categories.length)];
  const quotes = QUOTES[cat];
  const quote = quotes[Math.floor(Math.random() * quotes.length)];
  return { ...quote, category: cat };
}

/**
 * Get a daily affirmation that rotates by day-of-year.
 * @returns {{ text: string, author: string|null, source: string|null, category: string }}
 */
function getDailyAffirmation() {
  const all = [];
  for (const [cat, quotes] of Object.entries(QUOTES)) {
    quotes.forEach(q => all.push({ ...q, category: cat }));
  }
  const dayOfYear = Math.floor(
    (Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000
  );
  return all[dayOfYear % all.length];
}
