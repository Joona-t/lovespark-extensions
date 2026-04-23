const DEFAULT_STATE = {
  schemaVersion: 1,
  globalEnabled: true,
  siteExclusions: [],
  modules: {
    "cursor-pack": {
      enabled: true,
      matches: ["*"],
      config: { activeTheme: "retro-pink" }
    }
  }
};

// DOM refs
const globalToggle = document.getElementById("globalToggle");
const cursorToggle = document.getElementById("cursorToggle");
const cursorSettings = document.getElementById("cursorSettings");
const themeGrid = document.getElementById("themeGrid");
const exclusionInput = document.getElementById("exclusionInput");
const addExclusionBtn = document.getElementById("addExclusion");
const exclusionList = document.getElementById("exclusionList");
const exportBtn = document.getElementById("exportBtn");
const importFile = document.getElementById("importFile");
const dataStatus = document.getElementById("dataStatus");

// ── State helpers ─────────────────────────────────────────────────────────────

async function getState() {
  const stored = await browser.storage.local.get(null);
  if (!stored || !stored.schemaVersion) return structuredClone(DEFAULT_STATE);
  return stored;
}

async function writeState(state) {
  await browser.storage.local.set(state);
}

// ── Render ────────────────────────────────────────────────────────────────────

function render(state) {
  // Global toggle
  globalToggle.setAttribute("aria-checked", String(state.globalEnabled));

  // Cursor pack toggle
  const cursorMod = state.modules?.["cursor-pack"];
  const cursorEnabled = cursorMod?.enabled ?? true;
  cursorToggle.setAttribute("aria-checked", String(cursorEnabled));

  // Show/hide cursor settings based on enabled state
  cursorSettings.style.display = cursorEnabled ? "block" : "none";

  // Theme swatches
  const activeTheme = cursorMod?.config?.activeTheme || "retro-pink";
  themeGrid.querySelectorAll(".theme-swatch").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.theme === activeTheme);
  });

  // Site exclusions
  renderExclusions(state.siteExclusions || []);
}

function renderExclusions(sites) {
  exclusionList.replaceChildren();
  for (const site of sites) {
    const li = document.createElement("li");
    li.className = "exclusion-item";

    const span = document.createElement("span");
    span.textContent = site;

    const btn = document.createElement("button");
    btn.className = "exclusion-remove";
    btn.textContent = "\u00D7";
    btn.title = "Remove";
    btn.addEventListener("click", () => removeExclusion(site));

    li.append(span, btn);
    exclusionList.appendChild(li);
  }
}

function showStatus(msg, type) {
  dataStatus.textContent = msg;
  dataStatus.className = "data-status " + type;
  setTimeout(() => { dataStatus.textContent = ""; dataStatus.className = "data-status"; }, 3000);
}

// ── Event handlers ────────────────────────────────────────────────────────────

globalToggle.addEventListener("click", async () => {
  const state = await getState();
  state.globalEnabled = !state.globalEnabled;
  await writeState(state);
  render(state);
});

cursorToggle.addEventListener("click", async () => {
  const state = await getState();
  if (!state.modules["cursor-pack"]) return;
  state.modules["cursor-pack"].enabled = !state.modules["cursor-pack"].enabled;
  await writeState(state);
  render(state);
});

themeGrid.addEventListener("click", async (e) => {
  const swatch = e.target.closest(".theme-swatch");
  if (!swatch) return;
  const theme = swatch.dataset.theme;
  const state = await getState();
  if (!state.modules["cursor-pack"]) return;
  if (!state.modules["cursor-pack"].config) state.modules["cursor-pack"].config = {};
  state.modules["cursor-pack"].config.activeTheme = theme;
  await writeState(state);
  render(state);
});

function sanitizeDomain(input) {
  let d = input.trim().toLowerCase();
  // Strip protocol
  d = d.replace(/^https?:\/\//, "");
  // Strip path
  d = d.split("/")[0];
  // Strip port
  d = d.split(":")[0];
  // Basic validation: must have at least one dot, no spaces
  if (!d || !d.includes(".") || d.includes(" ")) return null;
  return d;
}

async function addExclusion() {
  const domain = sanitizeDomain(exclusionInput.value);
  if (!domain) return;
  const state = await getState();
  if (!state.siteExclusions) state.siteExclusions = [];
  if (state.siteExclusions.includes(domain)) {
    exclusionInput.value = "";
    return;
  }
  state.siteExclusions.push(domain);
  await writeState(state);
  render(state);
  exclusionInput.value = "";
}

async function removeExclusion(site) {
  const state = await getState();
  state.siteExclusions = (state.siteExclusions || []).filter(s => s !== site);
  await writeState(state);
  render(state);
}

addExclusionBtn.addEventListener("click", addExclusion);
exclusionInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") addExclusion();
});

// ── Export / Import ───────────────────────────────────────────────────────────

exportBtn.addEventListener("click", async () => {
  const state = await getState();
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "lovespark-settings.json";
  a.click();
  URL.revokeObjectURL(url);
  showStatus("Settings exported", "success");
});

importFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const data = JSON.parse(text);
    if (!data.schemaVersion) {
      showStatus("Invalid settings file", "error");
      return;
    }
    await writeState(data);
    render(data);
    showStatus("Settings imported", "success");
  } catch {
    showStatus("Failed to parse file", "error");
  }
  importFile.value = "";
});

// ── Storage sync listener ─────────────────────────────────────────────────────

browser.storage.onChanged.addListener((changes, area) => {
  if (area !== "sync") return;
  getState().then(render);
});

// ── Init ──────────────────────────────────────────────────────────────────────

if (typeof LoveSparkTheme !== "undefined") LoveSparkTheme.init();
getState().then(render);
