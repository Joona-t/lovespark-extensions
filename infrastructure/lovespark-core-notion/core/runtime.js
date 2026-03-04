globalThis.__lovespark = globalThis.__lovespark || {};

(async function loveSparkRuntime() {
  const hostname = location.hostname;
  const { state, rules } = globalThis.__lovespark;

  const currentState = await state.getState();

  // Fast path: globally disabled
  if (!currentState.globalEnabled) return;

  // Fast path: site excluded
  if (currentState.siteExclusions.some(site =>
    hostname === site || hostname.endsWith("." + site)
  )) return;

  // Fast path: no enabled module matches this host
  let anyMatch = false;
  for (const mod of Object.values(currentState.modules || {})) {
    if (!mod.enabled) continue;
    if ((mod.matches || ["*"]).some(p =>
      p === "*" || hostname === p || hostname.endsWith("." + p)
    )) { anyMatch = true; break; }
  }
  if (!anyMatch) return;

  // Inject compiled CSS
  function inject(s) {
    document.querySelectorAll("style[data-lovespark-module]").forEach(el => el.remove());

    if (!s.globalEnabled) return;
    if (s.siteExclusions.some(site =>
      hostname === site || hostname.endsWith("." + site)
    )) return;

    const compiled = rules.compileRules(s, hostname);
    for (const rule of compiled) {
      for (const action of rule.actions) {
        if (action.type === "ApplyCSS") {
          const el = document.createElement("style");
          el.setAttribute("data-lovespark-module", rule.moduleId);
          el.textContent = action.css;
          (document.head || document.documentElement).appendChild(el);
        }
      }
    }
  }

  inject(currentState);

  // Live toggling via storage changes
  browser.storage.onChanged.addListener(async (changes, area) => {
    if (area !== "sync") return;
    const newState = await state.getState();
    inject(newState);
  });
})();
