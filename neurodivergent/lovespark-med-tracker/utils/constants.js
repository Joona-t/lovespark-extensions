export const STORAGE_KEYS = {
  MEDICATIONS: 'mt_medications',
  DOSES: 'mt_doses',
  SETTINGS: 'mt_settings',
};

export const TIME_SLOTS = [
  { id: 'morning',   label: 'Morning',   emoji: '🌅', defaultTime: '08:00' },
  { id: 'afternoon', label: 'Afternoon', emoji: '☀️',  defaultTime: '13:00' },
  { id: 'evening',   label: 'Evening',   emoji: '🌆', defaultTime: '18:00' },
  { id: 'bedtime',   label: 'Bedtime',   emoji: '🌙', defaultTime: '22:00' },
];

export const FREQUENCIES = [
  { id: 'daily',       label: 'Once daily' },
  { id: 'twice_daily', label: 'Twice daily' },
  { id: 'three_daily', label: 'Three times daily' },
  { id: 'as_needed',   label: 'As needed' },
];

export const MED_TYPES = [
  { id: 'stimulant_ir',  label: 'Stimulant (IR)',  onset: 30,   peak: 90,  duration: 300 },
  { id: 'stimulant_xr',  label: 'Stimulant (XR)',  onset: 60,   peak: 300, duration: 720 },
  { id: 'non_stimulant',  label: 'Non-stimulant',   onset: null, peak: null, duration: 1440 },
  { id: 'supplement',     label: 'Supplement',       onset: null, peak: null, duration: null },
  { id: 'other',          label: 'Other',            onset: null, peak: null, duration: null },
];

export const MED_COLORS = [
  '#E8457C', '#7C3AED', '#0D9488', '#818CF8',
  '#F59E0B', '#EC4899', '#6366F1', '#14B8A6',
];

export const MED_EMOJIS = ['💊', '💉', '🩹', '🧬', '🫀', '☕', '🧪', '🌿'];

export const COMMON_MEDS = [
  'Adderall', 'Adderall XR', 'Vyvanse', 'Concerta', 'Ritalin',
  'Strattera', 'Wellbutrin', 'Guanfacine', 'Elvanse', 'Dexedrine',
];

export const MESSAGES = {
  taken: [
    'Dose logged! You got this! 💕',
    'Nice one, bestie! ✨',
    'Taking care of yourself! 🌸',
    'Logged with love! 💖',
  ],
  allDone: [
    'All meds taken today! 💕',
    'Perfect day, bestie! ✨',
    "You're amazing! 🌸",
    '100%! Stay sparkly! 💖',
  ],
  greeting: [
    'Good morning, bestie! 🌅',
    'Hope you feel great today! ✨',
    'Take care of yourself! 💕',
    'You got this! 🌸',
  ],
  empty: [
    "Let's get you set up! 💊",
    'Add your meds to start tracking! ✨',
  ],
};

export const DEFAULT_SETTINGS = {
  darkMode: false,
  remindersEnabled: false,
  reminderTimes: {
    morning: '08:00',
    afternoon: '13:00',
    evening: '18:00',
    bedtime: '22:00',
  },
  reminderLeadMinutes: 15,
  missedDosePrompt: true,
  onboardingComplete: false,
  lastResetDate: null,
  showTimeline: true,
};
