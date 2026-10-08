(function initRulesetPlanner(scope) {
  'use strict';

  const TIER_ORDER = { ads: 0, tracking: 1, annoyances: 2 };

  function allowedTiers(intensity) {
    if (intensity === 'light') return new Set(['ads']);
    if (intensity === 'strong') return new Set(['ads', 'tracking', 'annoyances']);
    return new Set(['ads', 'tracking']);
  }

  function select(index, resources, intensity, capacity, maxEnabled = 50) {
    const allowed = allowedTiers(intensity);
    const eligible = resources
      .map(({ id }) => ({ id, ...(index[id] || {}) }))
      .filter(({ tier, count }) => allowed.has(tier) && Number.isInteger(count) && count > 0);
    const core = eligible.filter(({ core: isCore }) => isCore);
    const supplemental = eligible.filter(({ core: isCore }) => !isCore).sort((a, b) => {
      const tierDelta = TIER_ORDER[a.tier] - TIER_ORDER[b.tier];
      if (tierDelta) return tierDelta;
      const number = (id) => Number(id.match(/_extra_(\d+)$/)?.[1] || 0);
      return number(a.id) - number(b.id);
    });

    const chosen = [];
    let used = 0;
    for (const entry of [...core, ...supplemental]) {
      if (chosen.length >= maxEnabled || used + entry.count > capacity) continue;
      chosen.push(entry.id);
      used += entry.count;
    }
    return { ids: chosen, used, capacity };
  }

  scope.LoveSparkRulesetPlanner = { select };
})(globalThis);
