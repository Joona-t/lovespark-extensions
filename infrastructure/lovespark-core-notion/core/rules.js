globalThis.__lovespark = globalThis.__lovespark || {};

function hostnameMatches(hostname, pattern) {
  if (pattern === "*") return true;
  return hostname === pattern || hostname.endsWith("." + pattern);
}

globalThis.__lovespark.rules = {
  compileRules(state, hostname) {
    if (!state.globalEnabled) return [];
    if (state.siteExclusions.some(site => hostnameMatches(hostname, site))) return [];

    const allRules = [];

    for (const [moduleId, mod] of Object.entries(state.modules || {})) {
      if (!mod.enabled) continue;

      const matchesHost = (mod.matches || ["*"]).some(p => hostnameMatches(hostname, p));
      if (!matchesHost) continue;

      const handler = globalThis.__lovespark.modules?.[moduleId];
      if (!handler?.getRules) continue;

      const rules = handler.getRules(mod.config || {});
      if (rules) allRules.push(...rules);
    }

    allRules.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return allRules;
  }
};
