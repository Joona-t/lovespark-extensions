// Focus Blossom — Popup Dashboard

// Theme system
const THEMES = ['dark', 'retro', 'beige', 'slate'];
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const btn = document.getElementById('themeTab');
  if (btn) btn.textContent = t;
}
function cycleTheme() {
  const cur = THEMES.find(t => document.body.classList.contains('theme-' + t)) || 'retro';
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  applyTheme(next);
  chrome.storage.local.set({ theme: next });
}
chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
  if (!theme && darkMode) theme = 'dark';
  applyTheme(theme || 'retro');
});
document.getElementById('themeTab').addEventListener('click', cycleTheme);

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

  grid.innerHTML = "";

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
  meta.innerHTML = `
    <span class="garden-card-stage">${timeStr} ${garden.isBlocked ? "" : "(unblocked)"}</span>
    <span class="garden-card-emoji">${STAGE_EMOJIS[stage]}</span>
  `;

  // Details (shown when expanded)
  const details = document.createElement("div");
  details.className = "garden-card-details";

  const stageInfo = GROWTH_STAGES[stage];
  const streak = garden.streak || { currentDays: 0, longestDays: 0 };

  details.innerHTML = `
    <div class="detail-row">
      <span class="detail-label">Stage</span>
      <span class="detail-value">${stageInfo.label}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Flower</span>
      <span class="detail-value">${FLOWER_TYPES[garden.flowerType % FLOWER_TYPES.length].name}</span>
    </div>
    <div class="detail-row">
      <span class="detail-label">Streak</span>
      <span class="detail-value">${streak.currentDays}d (best: ${streak.longestDays}d)</span>
    </div>
    <div class="garden-actions">
      ${garden.isBlocked
        ? `<button class="btn-unblock-small" data-action="unblock" data-domain="${garden.domain}">Unblock</button>
           <button class="btn-remove-small" data-action="remove" data-domain="${garden.domain}">Remove</button>`
        : `<button class="btn-reblock-small" data-action="reblock" data-domain="${garden.domain}">Re-block</button>
           <button class="btn-remove-small" data-action="remove" data-domain="${garden.domain}">Remove</button>`
      }
    </div>
  `;

  card.appendChild(canvas);
  card.appendChild(domainEl);
  card.appendChild(meta);
  card.appendChild(details);

  // Click to expand/collapse
  card.addEventListener("click", (e) => {
    if (e.target.closest("button")) return; // don't toggle on button clicks
    expandedDomain = expandedDomain === garden.domain ? null : garden.domain;
    renderGardens();
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
