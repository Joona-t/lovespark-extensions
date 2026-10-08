// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Science-Backed Resource Links
// ═══════════════════════════════════════════════════════════════════

const RESOURCES = {
  science: [
    {
      title: 'Huberman Lab: Controlling Your Dopamine',
      url: 'https://hubermanlab.com/controlling-your-dopamine-for-motivation-focus-and-satisfaction/',
      emoji: '\u{1F9EA}',
      description: 'Ep 39 — dopamine baseline, peaks, and how to reset your reward system',
    },
    {
      title: 'Huberman Lab: Making & Breaking Habits',
      url: 'https://hubermanlab.com/the-science-of-making-and-breaking-habits/',
      emoji: '\u{1F9E0}',
      description: 'Neuroplasticity science — how habits form and how to break them',
    },
    {
      title: 'Huberman Lab: Dopamine Balance (with Dr. Lembke)',
      url: 'https://hubermanlab.com/dr-anna-lembke-understanding-and-treating-addiction/',
      emoji: '\u{2696}\uFE0F',
      description: 'How digital indulgences disrupt your pleasure-pain balance',
    },
    {
      title: 'Huberman Lab: Cold Exposure for Health',
      url: 'https://hubermanlab.com/the-science-and-use-of-cold-exposure-for-health-and-performance/',
      emoji: '\u{1F9CA}',
      description: '11 min/week cold exposure can elevate baseline dopamine by up to 2.5x',
    },
  ],

  books: [
    {
      title: 'Dopamine Nation — Dr. Anna Lembke',
      url: 'https://www.annalembke.com/dopamine-nation',
      emoji: '\u{1F4D5}',
      description: 'Stanford psychiatrist on pleasure-pain balance in an age of overindulgence',
    },
    {
      title: 'Your Brain on Porn — Gary Wilson',
      url: 'https://www.yourbrainonporn.com/',
      emoji: '\u{1F4D8}',
      description: 'Research-backed guide on how internet pornography affects the brain',
    },
    {
      title: 'The Molecule of More',
      url: 'https://www.themoleculeofmore.com/',
      emoji: '\u{1F4D7}',
      description: 'How dopamine drives love, ambition, creativity — and addiction',
    },
  ],

  recovery: [
    {
      title: 'Fight the New Drug',
      url: 'https://fightthenewdrug.org/',
      emoji: '\u{1F6E1}\uFE0F',
      description: 'Science-backed education on how pornography affects the brain, heart, and world',
    },
    {
      title: 'Fortify — Recovery Program',
      url: 'https://www.joinfortify.com/',
      emoji: '\u{1F4AA}',
      description: 'Free science-based recovery app with guided programs and community support',
    },
    {
      title: 'r/NoFap Community',
      url: 'https://www.reddit.com/r/NoFap/',
      emoji: '\u{1F91D}',
      description: 'Supportive community of people committed to overcoming compulsive behavior',
    },
    {
      title: 'SMART Recovery',
      url: 'https://www.smartrecovery.org/',
      emoji: '\u{1F31F}',
      description: 'Self-Management and Recovery Training — science-based addiction recovery',
    },
  ],

  articles: [
    {
      title: 'Neuroscience of Internet Pornography Addiction (PMC)',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC4600144/',
      emoji: '\u{1F52C}',
      description: 'Peer-reviewed review of how pornography changes brain structure and function',
    },
    {
      title: 'Brain Function Impact Study (Frontiers, 2025)',
      url: 'https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2025.1477914/full',
      emoji: '\u{1F4CA}',
      description: 'fNIRS study showing measurable prefrontal cortex changes from pornography use',
    },
    {
      title: 'Mindfulness for Compulsive Sexual Behavior (PMC)',
      url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC8969735/',
      emoji: '\u{1F9D8}',
      description: 'Clinical evidence that mindfulness-based interventions reduce compulsive behavior',
    },
  ],
};

/**
 * Get all resources as a flat array.
 * @returns {Array}
 */
function getAllResources() {
  return Object.values(RESOURCES).flat();
}

/**
 * Get resources by category key.
 * @param {string} category - 'science' | 'books' | 'recovery' | 'articles'
 * @returns {Array}
 */
function getResourcesByCategory(category) {
  return RESOURCES[category] || [];
}
