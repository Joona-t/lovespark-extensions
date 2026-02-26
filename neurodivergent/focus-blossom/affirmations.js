const AFFIRMATIONS = [
  "You are not your urges. You are the garden that grows when you choose to stay.",
  "Every minute of resistance is a root growing deeper.",
  "The craving will pass. The garden will remain.",
  "You planted this. You\u2019re growing this. One breath at a time.",
  "What blooms from discipline is always more beautiful than what fades from impulse.",
  "This moment of discomfort is the soil your strength grows in.",
  "Your garden doesn\u2019t judge you. It just grows when you show up.",
  "The version of you that started this garden is cheering you on.",
  "Stillness is not weakness. It\u2019s the deepest kind of strength.",
  "Every flower here exists because you chose yourself.",
  "You are doing something hard. That means you\u2019re doing something real.",
  "This garden is proof that you can do hard things with grace.",
  "The urge is loud. But the garden is patient.",
  "You didn\u2019t come this far to come this far.",
  "What you resist today, you won\u2019t even miss tomorrow.",
  "Breathe. The flowers are still growing.",
  "Your presence here is the kindest thing you can do for yourself.",
  "Progress isn\u2019t always visible. But it\u2019s always happening beneath the surface.",
  "The garden remembers every moment you chose to stay.",
  "You are planting seeds you can\u2019t see yet. Trust the process.",
  "Recovery is not a straight line. But every moment you\u2019re here, you\u2019re moving forward.",
  "One day, you\u2019ll look at this garden and realize how strong you\u2019ve always been.",
  "The best time to plant a garden was yesterday. The second best time is now.",
  "Your future self is grateful you\u2019re here right now.",
  "This is what healing looks like \u2014 quiet, steady, and full of flowers."
];

function getDailyAffirmation() {
  const daysSinceEpoch = Math.floor(Date.now() / 86400000);
  return AFFIRMATIONS[daysSinceEpoch % AFFIRMATIONS.length];
}

function getRandomAffirmation() {
  return AFFIRMATIONS[Math.floor(Math.random() * AFFIRMATIONS.length)];
}
