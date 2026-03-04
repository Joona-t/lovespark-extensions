// Focus Blossom — Settings Page

// Dark mode
chrome.storage.local.get(['darkMode'], ({ darkMode }) => {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  const btn = document.getElementById('btnDarkMode');
  if (btn) btn.textContent = darkMode ? '☀️' : '🌙';
});
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  chrome.storage.local.set({ darkMode: !isDark });
  const btn = document.getElementById('btnDarkMode');
  if (btn) btn.textContent = isDark ? '🌙' : '☀️';
}
document.getElementById('btnDarkMode').addEventListener('click', toggleTheme);

const toggleAffirmations = document.getElementById("toggleAffirmations");
const toggleNotifications = document.getElementById("toggleNotifications");
const frictionSelect = document.getElementById("frictionLevel");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const savedToast = document.getElementById("savedToast");

// --- Load settings ---

async function loadSettings() {
  const resp = await chrome.runtime.sendMessage({ type: "getSettings" });
  const s = resp.settings;

  frictionSelect.value = s.unblockFriction || "high";

  if (s.showAffirmations !== false) {
    toggleAffirmations.classList.add("active");
    toggleAffirmations.setAttribute("aria-checked", "true");
  }

  if (s.showNotifications !== false) {
    toggleNotifications.classList.add("active");
    toggleNotifications.setAttribute("aria-checked", "true");
  }
}

// --- Save settings ---

async function saveSettings() {
  const settings = {
    isEnabled: true,
    showAffirmations: toggleAffirmations.classList.contains("active"),
    showNotifications: toggleNotifications.classList.contains("active"),
    unblockFriction: frictionSelect.value,
  };
  await chrome.runtime.sendMessage({ type: "updateSettings", settings });
  showToast();
}

function showToast() {
  savedToast.classList.add("visible");
  setTimeout(() => savedToast.classList.remove("visible"), 1200);
}

// --- Toggle clicks ---

function setupToggle(el) {
  function toggle() {
    el.classList.toggle("active");
    const active = el.classList.contains("active");
    el.setAttribute("aria-checked", active ? "true" : "false");
    saveSettings();
  }

  el.addEventListener("click", toggle);
  el.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });
}

setupToggle(toggleAffirmations);
setupToggle(toggleNotifications);

frictionSelect.addEventListener("change", saveSettings);

// --- Export ---

exportBtn.addEventListener("click", async () => {
  const data = await chrome.storage.local.get(null);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `focus-blossom-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
});

// --- Import ---

importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    // Validate structure
    if (!data.gardens || typeof data.gardens !== "object") {
      alert("Invalid backup file: missing gardens data.");
      return;
    }

    if (!confirm("This will replace all your current gardens and settings. Continue?")) return;

    await chrome.storage.local.set(data);
    showToast();
    loadSettings();
  } catch (err) {
    alert("Failed to read backup file: " + err.message);
  }

  importFile.value = "";
});

// --- Init ---

loadSettings();
