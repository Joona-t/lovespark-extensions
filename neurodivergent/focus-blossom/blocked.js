// Focus Blossom — Blocked Page Logic

(async () => {
  const params = new URLSearchParams(window.location.search);
  const domain = params.get("domain");
  if (!domain) return;

  const stageEmojis = ["\ud83c\udf31", "\ud83c\udf3f", "\ud83c\udf37", "\ud83c\udf38", "\ud83c\udf3a"];

  // Fetch garden data + settings from background
  const [gardenResp, settingsResp] = await Promise.all([
    chrome.runtime.sendMessage({ type: "getGardens" }),
    chrome.runtime.sendMessage({ type: "getSettings" })
  ]);

  const garden = gardenResp.gardens[domain];
  if (!garden) return;

  const settings = settingsResp.settings;
  let totalMs = garden._displayTotalMs;
  let stage = garden._displayStage;

  // Hide loading, show main
  document.getElementById("loadingState").style.display = "none";
  document.getElementById("mainContainer").style.display = "flex";

  // --- Canvas setup ---
  const canvas = document.getElementById("gardenCanvas");
  const wrap = canvas.parentElement;
  const dpr = window.devicePixelRatio || 1;

  function sizeCanvas() {
    const rect = wrap.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    canvas.getContext("2d").scale(dpr, dpr);
    // Store logical size for renderer
    canvas._logicalW = rect.width;
    canvas._logicalH = rect.height;
  }
  sizeCanvas();

  const renderer = new GardenRenderer(canvas, garden.flowerType);
  renderer.render(totalMs, stage);

  // --- Info panel (called on load + polled every 30s for live updates) ---
  function renderInfoPanel(currentTotalMs, currentStage) {
    const stageInfo = GROWTH_STAGES[currentStage];

    document.getElementById("stageEmoji").textContent = stageEmojis[currentStage];
    document.getElementById("domainName").textContent = domain;

    // Day count
    const days = Math.floor(currentTotalMs / 86400000);
    const hours = Math.floor((currentTotalMs % 86400000) / 3600000);
    let timeStr;
    if (days >= 1) {
      timeStr = chrome.i18n.getMessage("dayLabel", [String(days)]);
    } else if (hours >= 1) {
      timeStr = `${hours}h`;
    } else {
      const mins = Math.max(1, Math.floor(currentTotalMs / 60000));
      timeStr = `${mins}m`;
    }
    document.getElementById("dayCount").textContent = `\u2014 ${timeStr}`;
    document.getElementById("stageLabel").textContent = stageLabel(currentStage);

    // Progress bar — progress within current stage toward next
    const nextStage = GROWTH_STAGES[currentStage + 1];
    let progressPct = 100;
    if (nextStage) {
      const range = nextStage.minMs - stageInfo.minMs;
      progressPct = Math.min(100, Math.round(((currentTotalMs - stageInfo.minMs) / range) * 100));
    }
    document.getElementById("progressBar").style.width = progressPct + "%";
    document.getElementById("progressText").textContent = progressPct + "%";
  }
  renderInfoPanel(totalMs, stage);

  // Poll every 30s to keep progress live without requiring reload
  setInterval(async () => {
    const resp = await chrome.runtime.sendMessage({ type: "getGardens" });
    const g = resp.gardens && resp.gardens[domain];
    if (!g) return;
    totalMs = g._displayTotalMs;
    stage = g._displayStage;
    renderInfoPanel(totalMs, stage);
  }, 30000);

  // Affirmation
  if (settings.showAffirmations) {
    document.getElementById("affirmation").textContent = `\u201c${getDailyAffirmation()}\u201d`;
  }

  // --- Back button ---
  document.getElementById("backBtn").addEventListener("click", () => {
    if (history.length > 1) {
      history.back();
    } else {
      window.close();
    }
  });

  // --- Unblock friction ---
  const unblockLink = document.getElementById("unblockLink");
  function openFriction() {
    startFriction(domain, garden, settings.unblockFriction, stage, totalMs);
  }
  unblockLink.addEventListener("click", openFriction);
  unblockLink.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openFriction();
    }
  });

  // Escape key closes friction overlay
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      const overlay = document.getElementById("frictionOverlay");
      if (overlay.style.display !== "none") {
        overlay.style.display = "none";
      }
    }
  });
})();

function startFriction(domain, garden, level, stage, totalMs) {
  const overlay = document.getElementById("frictionOverlay");
  overlay.style.display = "flex";

  const confirmBtn = document.getElementById("frictionConfirm");
  const cancelBtn = document.getElementById("frictionCancel");
  const timerEl = document.getElementById("frictionTimer");
  const timerCount = document.getElementById("timerCount");
  const inputWrap = document.getElementById("frictionInputWrap");
  const input = document.getElementById("frictionInput");

  // Reset state
  confirmBtn.disabled = true;
  input.value = "";

  // Friction preview canvas — show destruction
  const fCanvas = document.getElementById("frictionCanvas");
  const dpr = window.devicePixelRatio || 1;
  fCanvas.width = 280 * dpr;
  fCanvas.height = 160 * dpr;
  fCanvas.getContext("2d").scale(dpr, dpr);
  const fRenderer = new GardenRenderer(fCanvas, garden.flowerType, false);
  fRenderer.renderStatic(totalMs, stage);

  let timerDone = false;
  let inputDone = false;
  let waitSeconds = 0;

  function renderTimer(seconds) {
    timerEl.textContent = chrome.i18n.getMessage("blockedFrictionWait", [String(seconds)]);
  }

  if (level === "low") {
    timerDone = true;
    inputDone = true;
    confirmBtn.disabled = false;
    confirmBtn.textContent = chrome.i18n.getMessage("blockedFrictionConfirmLow");
  } else if (level === "medium") {
    waitSeconds = 10;
    inputDone = true;
    timerEl.style.display = "block";
    inputWrap.style.display = "none";
    // Start destruction preview
    fRenderer.startDestruction(() => {});
  } else {
    // High
    waitSeconds = 30;
    timerEl.style.display = "block";
    inputWrap.style.display = "block";
    document.getElementById("frictionInputLabel").textContent =
      chrome.i18n.getMessage("blockedFrictionInputLabel", [domain]);
    confirmBtn.textContent = chrome.i18n.getMessage("blockedFrictionConfirm");
    fRenderer.startDestruction(() => {});
  }

  // Timer countdown
  let interval = null;
  const inputAC = new AbortController();
  if (waitSeconds > 0) {
    renderTimer(waitSeconds);
    interval = setInterval(() => {
      waitSeconds--;
      renderTimer(waitSeconds);
      if (waitSeconds <= 0) {
        clearInterval(interval);
        interval = null;
        timerDone = true;
        timerEl.style.display = "none";
        checkReady();
      }
    }, 1000);
  }

  // Input validation (high friction)
  if (level === "high") {
    input.addEventListener("input", () => {
      inputDone = input.value.trim().toLowerCase() === domain.toLowerCase();
      checkReady();
    }, { signal: inputAC.signal });
  }

  function checkReady() {
    confirmBtn.disabled = !(timerDone && inputDone);
  }

  // Cancel — clean up timer and input listener
  cancelBtn.addEventListener("click", () => {
    overlay.style.display = "none";
    if (interval) clearInterval(interval);
    inputAC.abort();
    fRenderer.stop();
  }, { once: true });

  // Confirm unblock
  confirmBtn.addEventListener("click", async () => {
    if (confirmBtn.disabled) return;
    await chrome.runtime.sendMessage({ type: "unblockSite", domain });
    // Navigate to the site
    window.location.href = `https://${domain}`;
  }, { once: true });
}
