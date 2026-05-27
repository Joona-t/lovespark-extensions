// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — XP + Level System
// Science-backed progression with neuroscience milestone labels
// ═══════════════════════════════════════════════════════════════════

const LEVELS = [
  { level: 1,  xp: 0,     name: 'Seedling' },
  { level: 2,  xp: 100,   name: 'Sprouting' },
  { level: 3,  xp: 300,   name: 'Taking Root' },
  { level: 4,  xp: 600,   name: 'Growing Strong' },
  { level: 5,  xp: 1000,  name: 'Branching Out' },
  { level: 6,  xp: 1500,  name: 'Full Canopy' },
  { level: 7,  xp: 2500,  name: 'Deep Roots' },
  { level: 8,  xp: 4000,  name: 'Ancient Oak' },
  { level: 9,  xp: 6000,  name: 'Forest Guardian' },
  { level: 10, xp: 10000, name: 'Rewired' },
];

const MILESTONES = [
  { days: 1,   label: 'Day One \u2014 The Hardest Step' },
  { days: 3,   label: 'Building Momentum' },
  { days: 7,   label: 'Withdrawal Stabilizing' },
  { days: 14,  label: 'Cravings Declining' },
  { days: 30,  label: 'Dopamine Recalibration Beginning' },
  { days: 60,  label: 'Receptor Restoration Accelerating' },
  { days: 90,  label: 'Neural Baseline Restored' },
  { days: 180, label: 'Long-term Recovery Solidifying' },
  { days: 365, label: 'Brain Fully Healed' },
];

const MILESTONE_BONUS_DAYS = [7, 14, 30, 60, 90, 180, 365];

const XP_RULES = {
  BLOCK: 5,
  DAILY_STREAK: 10,
  BREATHING: 15,
  BYPASS_RESISTED: 25,
  MILESTONE_BONUS: 100,
  DAILY_BLOCK_CAP: 50,
};

/**
 * Calculate level from total XP.
 * @param {number} xp
 * @returns {{ level: number, name: string, currentXp: number, neededXp: number, percent: number }}
 */
function getXpProgress(xp) {
  let current = LEVELS[0];
  let next = LEVELS[1];

  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].xp) {
      current = LEVELS[i];
      next = LEVELS[i + 1] || null;
      break;
    }
  }

  if (!next) {
    return { level: current.level, name: current.name, currentXp: xp, neededXp: current.xp, percent: 100 };
  }

  const inLevel = xp - current.xp;
  const span = next.xp - current.xp;
  const percent = Math.min(100, Math.round((inLevel / span) * 100));

  return {
    level: current.level,
    name: current.name,
    currentXp: xp,
    neededXp: next.xp,
    percent: percent,
    xpInLevel: inLevel,
    xpSpan: span,
  };
}

/**
 * Get the current neuroscience milestone label for a streak day count.
 * @param {number} days
 * @returns {{ days: number, label: string }}
 */
function getMilestoneLabel(days) {
  let best = MILESTONES[0];
  for (const m of MILESTONES) {
    if (days >= m.days) best = m;
  }
  return best;
}

/**
 * Get the next milestone the user hasn't reached yet.
 * @param {number} days
 * @returns {{ days: number, label: string } | null}
 */
function getNextMilestone(days) {
  for (const m of MILESTONES) {
    if (days < m.days) return m;
  }
  return null;
}

/**
 * Check if a streak day count just crossed a milestone bonus threshold.
 * @param {number} oldDays
 * @param {number} newDays
 * @returns {number|null} The milestone day crossed, or null
 */
function checkMilestoneBonus(oldDays, newDays) {
  for (const d of MILESTONE_BONUS_DAYS) {
    if (oldDays < d && newDays >= d) return d;
  }
  return null;
}

/**
 * Get the tree stage (1-10) for the brain visualization.
 * @param {number} level
 * @returns {number}
 */
function getTreeStage(level) {
  return Math.max(1, Math.min(10, level));
}
