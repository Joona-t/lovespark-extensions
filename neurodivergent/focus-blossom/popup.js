// Focus Blossom — Popup Dashboard

// Theme dropdown
const THEMES = ['retro', 'dark', 'beige', 'slate'];
const THEME_NAMES = { retro: 'Retro Pink', dark: 'Dark', beige: 'Beige', slate: 'Slate' };
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = THEME_NAMES[t] || t;
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === t);
  });
}
(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (toggle && menu) {
    function openMenu() { menu.classList.add('open'); toggle.setAttribute('aria-expanded', 'true'); }
    function closeMenu() { menu.classList.remove('open'); toggle.setAttribute('aria-expanded', 'false'); }
    toggle.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.contains('open') ? closeMenu() : openMenu(); });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      applyTheme(theme);
      chrome.storage.local.set({ theme });
      closeMenu();
      toggle.focus();
    });
    document.addEventListener('click', () => closeMenu());
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        closeMenu();
        toggle.focus();
      }
    });
  }
  chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  });
})();

const STAGE_EMOJIS = ["\ud83c\udf31", "\ud83c\udf3f", "\ud83c\udf37", "\ud83c\udf38", "\ud83c\udf3a"];

let expandedDomain = null;

async function renderGardens() {
  const [gardenResp, statsResp] = await Promise.all([
    chrome.runtime.sendMessage({ type: "getGardens" }),
    chrome.runtime.sendMessage({ type: "getStats" })
  ]);

  const gardens = gardenResp.gardens;
  const stats = statsResp.stats;
  const grid = document.getElementById("gardenGrid");
  const emptyState = document.getElementById("emptyState");

  const entries = Object.values(gardens);

  // Sort: blocked first (by stage descending), then unblocked
  entries.sort((a, b) => {
    if (a.isBlocked !== b.isBlocked) return a.isBlocked ? -1 : 1;
    return (b._displayTotalMs || 0) - (a._displayTotalMs || 0);
  });

  grid.replaceChildren();

  if (entries.length === 0) {
    emptyState.style.display = "block";
    grid.style.display = "none";
  } else {
    emptyState.style.display = "none";
    grid.style.display = "grid";

    for (const garden of entries) {
      grid.appendChild(createGardenCard(garden));
    }
  }

  // Stats
  const activeCount = entries.filter(g => g.isBlocked).length;
  document.getElementById("statGrowing").textContent = activeCount;

  const longestStreak = Math.max(stats.longestStreak, ...entries.map(g => g.streak?.longestDays || 0));
  document.getElementById("statStreak").textContent = longestStreak + "d";

  const totalHours = Math.floor(stats.totalBlockedTimeMs / 3600000);
  document.getElementById("statBlocked").textContent = totalHours >= 24
    ? Math.floor(totalHours / 24) + "d " + (totalHours % 24) + "h"
    : totalHours + "h";
}

function createGardenCard(garden) {
  const card = document.createElement("div");
  card.className = "garden-card" + (expandedDomain === garden.domain ? " expanded" : "");
  card.tabIndex = 0;
  card.setAttribute("role", "button");
  card.setAttribute("aria-label", garden.domain + " garden");
  if (!garden.isBlocked) card.style.opacity = "0.6";

  const totalMs = garden._displayTotalMs || garden.totalBlockedMs;
  const stage = garden._displayStage ?? garden.growthStage;
  const days = Math.floor(totalMs / 86400000);
  const hours = Math.floor((totalMs % 86400000) / 3600000);

  let timeStr;
  if (days >= 1) timeStr = `Day ${days}`;
  else if (hours >= 1) timeStr = `${hours}h`;
  else timeStr = `${Math.max(1, Math.floor(totalMs / 60000))}m`;

  // Canvas thumbnail
  const canvas = document.createElement("canvas");
  const dpr = window.devicePixelRatio || 1;
  canvas.width = 150 * dpr;
  canvas.height = 80 * dpr;
  canvas.getContext("2d").scale(dpr, dpr);

  const renderer = new GardenRenderer(canvas, garden.flowerType, true);
  renderer.renderStatic(totalMs, stage);

  // Card content
  const domainEl = document.createElement("div");
  domainEl.className = "garden-card-domain";
  domainEl.textContent = garden.domain;

  const meta = document.createElement("div");
  meta.className = "garden-card-meta";
  const stageSpan = document.createElement("span");
  stageSpan.className = "garden-card-stage";
  stageSpan.textContent = timeStr + (garden.isBlocked ? "" : " (unblocked)");
  const emojiSpan = document.createElement("span");
  emojiSpan.className = "garden-card-emoji";
  emojiSpan.textContent = STAGE_EMOJIS[stage];
  meta.appendChild(stageSpan);
  meta.appendChild(emojiSpan);

  // Details (shown when expanded)
  const details = document.createElement("div");
  details.className = "garden-card-details";

  const stageInfo = GROWTH_STAGES[stage];
  const streak = garden.streak || { currentDays: 0, longestDays: 0 };

  function addDetailRow(parent, label, value) {
    const row = document.createElement("div");
    row.className = "detail-row";
    const lbl = document.createElement("span");
    lbl.className = "detail-label";
    lbl.textContent = label;
    const val = document.createElement("span");
    val.className = "detail-value";
    val.textContent = value;
    row.appendChild(lbl);
    row.appendChild(val);
    parent.appendChild(row);
  }

  addDetailRow(details, "Stage", stageInfo.label);
  addDetailRow(details, "Flower", FLOWER_TYPES[garden.flowerType % FLOWER_TYPES.length].name);
  addDetailRow(details, "Streak", `${streak.currentDays}d (best: ${streak.longestDays}d)`);

  const actions = document.createElement("div");
  actions.className = "garden-actions";
  if (garden.isBlocked) {
    const unblockBtn = document.createElement("button");
    unblockBtn.className = "btn-unblock-small";
    unblockBtn.dataset.action = "unblock";
    unblockBtn.dataset.domain = garden.domain;
    unblockBtn.textContent = "Unblock";
    actions.appendChild(unblockBtn);
  } else {
    const reblockBtn = document.createElement("button");
    reblockBtn.className = "btn-reblock-small";
    reblockBtn.dataset.action = "reblock";
    reblockBtn.dataset.domain = garden.domain;
    reblockBtn.textContent = "Re-block";
    actions.appendChild(reblockBtn);
  }
  const removeBtn = document.createElement("button");
  removeBtn.className = "btn-remove-small";
  removeBtn.dataset.action = "remove";
  removeBtn.dataset.domain = garden.domain;
  removeBtn.textContent = "Remove";
  actions.appendChild(removeBtn);
  details.appendChild(actions);

  card.appendChild(canvas);
  card.appendChild(domainEl);
  card.appendChild(meta);
  card.appendChild(details);

  // Click/keyboard to expand/collapse
  function toggleCard(e) {
    if (e.target.closest("button")) return;
    expandedDomain = expandedDomain === garden.domain ? null : garden.domain;
    renderGardens();
  }
  card.addEventListener("click", toggleCard);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggleCard(e);
    }
  });

  // Action buttons
  details.addEventListener("click", async (e) => {
    const btn = e.target.closest("button[data-action]");
    if (!btn) return;
    e.stopPropagation();

    const action = btn.dataset.action;
    const domain = btn.dataset.domain;

    if (action === "unblock") {
      if (!confirm(`Unblock ${domain}? Your garden will lose 50% growth.`)) return;
      await chrome.runtime.sendMessage({ type: "unblockSite", domain });
    } else if (action === "reblock") {
      await chrome.runtime.sendMessage({ type: "blockSite", domain });
    } else if (action === "remove") {
      if (!confirm(`Remove ${domain} completely? This deletes the garden.`)) return;
      await chrome.runtime.sendMessage({ type: "removeSite", domain });
    }

    expandedDomain = null;
    renderGardens();
  });

  return card;
}

// --- Add site ---

function normalizeDomain(input) {
  return input.trim().toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "");
}

document.getElementById("addBtn").addEventListener("click", addSite);
document.getElementById("siteInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") addSite();
});

async function addSite() {
  const input = document.getElementById("siteInput");
  const domain = normalizeDomain(input.value);
  if (!domain || !domain.includes(".")) return;

  await chrome.runtime.sendMessage({ type: "blockSite", domain });
  input.value = "";
  renderGardens();
}

// --- Preset buttons (empty state quick-add) ---

document.addEventListener("click", async (e) => {
  const preset = e.target.closest(".btn-preset[data-domain]");
  if (!preset) return;
  const domain = preset.dataset.domain;
  await chrome.runtime.sendMessage({ type: "blockSite", domain });
  renderGardens();
});

// --- Settings link ---

document.getElementById("settingsLink").addEventListener("click", () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("settings.html") });
});

// --- Affirmation ---

document.getElementById("affirmation").textContent = `\u201c${getDailyAffirmation()}\u201d`;

// --- Init ---

renderGardens();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
