// Focus Blossom — Blocked Page Logic

(async () => {
  const params = new URLSearchParams(window.location.search);
  const domain = params.get("domain");
  if (!domain) return;

  // Fetch garden data + settings from background
  const [gardenResp, settingsResp] = await Promise.all([
    chrome.runtime.sendMessage({ type: "getGardens" }),
    chrome.runtime.sendMessage({ type: "getSettings" })
  ]);

  const garden = gardenResp.gardens[domain];
  if (!garden) return;

  const settings = settingsResp.settings;
  const totalMs = garden._displayTotalMs;
  const stage = garden._displayStage;

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

  // --- Info panel ---
  const stageInfo = GROWTH_STAGES[stage];
  const stageEmojis = ["\ud83c\udf31", "\ud83c\udf3f", "\ud83c\udf37", "\ud83c\udf38", "\ud83c\udf3a"];

  document.getElementById("stageEmoji").textContent = stageEmojis[stage];
  document.getElementById("domainName").textContent = domain;

  // Day count
  const days = Math.floor(totalMs / 86400000);
  const hours = Math.floor((totalMs % 86400000) / 3600000);
  let timeStr;
  if (days >= 1) {
    timeStr = `Day ${days}`;
  } else if (hours >= 1) {
    timeStr = `${hours}h`;
  } else {
    const mins = Math.max(1, Math.floor(totalMs / 60000));
    timeStr = `${mins}m`;
  }
  document.getElementById("dayCount").textContent = `\u2014 ${timeStr}`;
  document.getElementById("stageLabel").textContent = stageInfo.label;

  // Progress bar — progress within current stage toward next
  const nextStage = GROWTH_STAGES[stage + 1];
  let progressPct = 100;
  if (nextStage) {
    const range = nextStage.minMs - stageInfo.minMs;
    progressPct = Math.min(100, Math.round(((totalMs - stageInfo.minMs) / range) * 100));
  }
  document.getElementById("progressBar").style.width = progressPct + "%";
  document.getElementById("progressText").textContent = progressPct + "%";

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
  document.getElementById("unblockLink").addEventListener("click", () => {
    startFriction(domain, garden, settings.unblockFriction, stage, totalMs);
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

  if (level === "low") {
    timerDone = true;
    inputDone = true;
    confirmBtn.disabled = false;
    confirmBtn.textContent = "Unblock";
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
    document.getElementById("frictionInputLabel").textContent = `Type "${domain}" to confirm:`;
    confirmBtn.textContent = "I understand, unblock";
    fRenderer.startDestruction(() => {});
  }

  // Timer countdown
  if (waitSeconds > 0) {
    timerCount.textContent = waitSeconds;
    const interval = setInterval(() => {
      waitSeconds--;
      timerCount.textContent = waitSeconds;
      if (waitSeconds <= 0) {
        clearInterval(interval);
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
    });
  }

  function checkReady() {
    confirmBtn.disabled = !(timerDone && inputDone);
  }

  // Cancel
  cancelBtn.addEventListener("click", () => {
    overlay.style.display = "none";
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
