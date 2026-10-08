// Focus Blossom — Settings Page

// Theme dropdown (unified with popup — same `theme` storage key, same body.theme-* classes)
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
  chrome.storage.local.get(['theme'], ({ theme }) => {
    applyTheme(theme || 'retro');
  });
})();

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
      alert(chrome.i18n.getMessage("settingsImportInvalid"));
      return;
    }

    if (!confirm(chrome.i18n.getMessage("settingsImportConfirm"))) return;

    await chrome.storage.local.set(data);
    showToast();
    loadSettings();
  } catch (err) {
    alert(chrome.i18n.getMessage("settingsImportFailed", [err.message]));
  }

  importFile.value = "";
});

// --- Init ---

loadSettings();

// Dynamic version from manifest (the static "Part of the LoveSpark Suite" line is
// handled via data-i18n in settings.html and stays untouched here)
const versionEl = document.getElementById('aboutVersion');
if (versionEl) {
  const ver = chrome.runtime.getManifest().version;
  versionEl.textContent = chrome.i18n.getMessage("settingsAboutVersion", [ver]);
}
