(() => {
  if (window.__LOVE_SPARK_COMFORT_MODE__) {
    return;
  }
  window.__LOVE_SPARK_COMFORT_MODE__ = { initialized: true };

  const STORAGE_KEY = "loveSparkSettings";
  const TRANSITION_DEBOUNCE_MS = 300;

  const AD_STATES = Object.freeze({
    UNKNOWN: "UNKNOWN",
    CONTENT: "CONTENT",
    AD: "AD",
  });

  const DEFAULT_SETTINGS = Object.freeze({
    comfortModeDefaultEnabled: true,
    autoMuteEnabled: true,
    lowVolumeEnabled: false,
    lowVolumePercent: 10,
    dimOverlayEnabled: true,
  });

  const AD_INDICATOR_SELECTORS = [
    ".ad-showing",
    ".ad-interrupting",
    ".video-ads .ytp-ad-module",
    ".ytp-ad-player-overlay",
    ".ytp-ad-duration-remaining",
    ".ytp-ad-skip-button",
    ".ytp-ad-skip-button-modern",
    ".ytp-ad-simple-ad-badge",
    ".ytp-ad-text",
    ".ytp-ad-preview-container",
    ".ytp-ad-preview-text",
    ".ytp-ad-overlay-container",
  ];

  // Observe -> infer ad state -> apply effects -> restore on ad exit.
  class LoveSparkComfortController {
    constructor() {
      this.settings = { ...DEFAULT_SETTINGS };
      this.comfortModeEnabled = true;

      this.adState = AD_STATES.UNKNOWN;
      this.pendingState = null;
      this.transitionTimer = null;
      this.evaluationQueued = false;

      this.lastUrl = location.href;

      this.video = null;
      this.player = null;
      this.pageObserver = null;
      this.playerObserver = null;

      this.session = {
        baselineMuted: null,
        baselineVolume: null,
        adActive: false,
        effectApplied: false,
        userOverrideDuringAd: false,
        programmaticVolumeWrites: 0,
      };

      this.ui = {
        styleEl: null,
        overlayEl: null,
        badgeEl: null,
      };

      this.boundVideoSignalHandler = this.onVideoSignal.bind(this);
      this.boundVolumeHandler = this.onVideoVolumeChange.bind(this);
      this.boundNavigationHandler = this.handlePotentialNavigation.bind(this);
    }

    async init() {
      await this.loadSettings();
      this.comfortModeEnabled = this.settings.comfortModeDefaultEnabled;

      this.bindRuntimeEvents();
      this.bindStorageEvents();
      this.bindNavigationEvents();
      this.startObservers();
      this.ensureVideoBinding();
      this.evaluateAdState("init");
      this.reportComfortMode();
    }

    async loadSettings() {
      try {
        const stored = await chrome.storage.local.get(STORAGE_KEY);
        this.settings = normalizeSettings(stored?.[STORAGE_KEY]);
      } catch (_error) {
        this.settings = { ...DEFAULT_SETTINGS };
      }
    }

    bindRuntimeEvents() {
      chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
        if (!message || typeof message !== "object") {
          return;
        }

        if (message.type === "LS_PING") {
          sendResponse({
            ok: true,
            enabled: this.comfortModeEnabled,
            adState: this.adState,
          });
          return;
        }

        if (message.type === "LS_SET_COMFORT_MODE") {
          const enabled =
            typeof message.enabled === "boolean"
              ? message.enabled
              : this.comfortModeEnabled;
          this.setComfortModeEnabled(enabled);
          sendResponse({
            ok: true,
            enabled: this.comfortModeEnabled,
            adState: this.adState,
          });
          return;
        }

        if (message.type === "LS_TOGGLE_COMFORT_MODE") {
          this.setComfortModeEnabled(!this.comfortModeEnabled);
          sendResponse({
            ok: true,
            enabled: this.comfortModeEnabled,
            adState: this.adState,
          });
        }
      });
    }

    bindStorageEvents() {
      chrome.storage.onChanged.addListener((changes, areaName) => {
        if (areaName !== "sync" || !changes[STORAGE_KEY]) {
          return;
        }

        this.settings = normalizeSettings(changes[STORAGE_KEY].newValue);
        this.handleSettingsUpdate();
      });
    }

    bindNavigationEvents() {
      document.addEventListener(
        "yt-navigate-finish",
        this.boundNavigationHandler,
        true
      );
      document.addEventListener(
        "yt-page-data-updated",
        this.boundNavigationHandler,
        true
      );
      window.addEventListener("popstate", this.boundNavigationHandler, true);
      window.addEventListener("hashchange", this.boundNavigationHandler, true);
    }

    startObservers() {
      // Watch #movie_player container for ad-related DOM changes.
      // Falls back to a scoped body observer only until the player appears.
      this.waitForPlayer();
    }

    waitForPlayer() {
      const player = document.querySelector("#movie_player");
      if (player) {
        this.ensureVideoBinding();
        return;
      }

      // Scoped observer: watch body's direct children for the player to appear
      this.pageObserver = new MutationObserver(() => {
        const found = document.querySelector("#movie_player");
        if (found) {
          this.pageObserver.disconnect();
          this.pageObserver = null;
          this.ensureVideoBinding();
        }
      });

      this.pageObserver.observe(document.body || document.documentElement, {
        childList: true,
        subtree: true,
      });
    }

    handlePotentialNavigation() {
      if (location.href === this.lastUrl) {
        return;
      }

      this.lastUrl = location.href;
      this.ensureVideoBinding(true);
      this.scheduleEvaluation("navigation");

      // Re-wait for player if it doesn't exist yet (SPA navigation)
      if (!document.querySelector("#movie_player")) {
        this.waitForPlayer();
      }
    }

    ensureVideoBinding(forceRebind = false) {
      const context = findMainPlayerContext();
      const nextVideo = context.video || null;
      const nextPlayer = context.player || null;

      const videoChanged = this.video !== nextVideo;
      const playerChanged = this.player !== nextPlayer;

      if (!forceRebind && !videoChanged && !playerChanged) {
        return;
      }

      if (videoChanged || forceRebind) {
        this.detachVideoListeners();
      }

      if (this.playerObserver) {
        this.playerObserver.disconnect();
        this.playerObserver = null;
      }

      if ((videoChanged || playerChanged) && this.session.adActive) {
        this.exitAdMode({ skipRestore: true });
      }

      this.video = nextVideo;
      this.player = nextPlayer;

      if (this.video) {
        this.attachVideoListeners();
        this.captureBaseline();
      }

      this.observeCurrentPlayer();
      this.removeUi();
    }

    observeCurrentPlayer() {
      if (!this.player) {
        return;
      }

      this.playerObserver = new MutationObserver((mutations) => {
        let needsEval = false;
        for (const mutation of mutations) {
          if (mutation.type === "attributes" && mutation.attributeName === "class") {
            needsEval = true;
            break;
          }
          if (mutation.type === "childList") {
            needsEval = true;
            break;
          }
        }
        if (needsEval) {
          this.scheduleEvaluation("player-mutation");
        }
        if (this.session.adActive) {
          this.updateBadgeText();
        }
      });

      this.playerObserver.observe(this.player, {
        attributes: true,
        childList: true,
        subtree: true,
        attributeFilter: ["class", "style", "hidden"],
      });
    }

    attachVideoListeners() {
      if (!this.video) {
        return;
      }

      this.video.addEventListener("play", this.boundVideoSignalHandler);
      this.video.addEventListener("pause", this.boundVideoSignalHandler);
      this.video.addEventListener("ended", this.boundVideoSignalHandler);
      this.video.addEventListener("timeupdate", this.boundVideoSignalHandler);
      this.video.addEventListener(
        "durationchange",
        this.boundVideoSignalHandler
      );
      this.video.addEventListener(
        "loadedmetadata",
        this.boundVideoSignalHandler
      );
      this.video.addEventListener("volumechange", this.boundVolumeHandler);
    }

    detachVideoListeners() {
      if (!this.video) {
        return;
      }

      this.video.removeEventListener("play", this.boundVideoSignalHandler);
      this.video.removeEventListener("pause", this.boundVideoSignalHandler);
      this.video.removeEventListener("ended", this.boundVideoSignalHandler);
      this.video.removeEventListener("timeupdate", this.boundVideoSignalHandler);
      this.video.removeEventListener(
        "durationchange",
        this.boundVideoSignalHandler
      );
      this.video.removeEventListener(
        "loadedmetadata",
        this.boundVideoSignalHandler
      );
      this.video.removeEventListener("volumechange", this.boundVolumeHandler);
    }

    onVideoSignal() {
      this.scheduleEvaluation("video-event");
      if (this.session.adActive) {
        this.updateBadgeText();
      }
    }

    onVideoVolumeChange() {
      if (!this.video || this.session.programmaticVolumeWrites > 0) {
        return;
      }

      this.session.baselineMuted = this.video.muted;
      this.session.baselineVolume = this.video.volume;

      if (this.session.adActive) {
        // Treat manual volume/mute changes during ads as user intent.
        this.session.userOverrideDuringAd = true;
        this.session.effectApplied = false;
      }
    }

    scheduleEvaluation(reason) {
      if (this.evaluationQueued) {
        return;
      }

      this.evaluationQueued = true;

      window.setTimeout(() => {
        this.evaluationQueued = false;
        this.evaluateAdState(reason);
      }, 60);
    }

    evaluateAdState(_reason) {
      try {
        const inferredState = this.inferAdState();
        this.queueTransition(inferredState);

        if (this.session.adActive) {
          this.updateBadgeText();
        }
      } catch (_error) {
        // Fail silently when inference cannot run safely.
      }
    }

    inferAdState() {
      if (!this.video) {
        return AD_STATES.UNKNOWN;
      }

      if (this.hasAdIndicators()) {
        return AD_STATES.AD;
      }

      if (this.video.readyState > 0) {
        return AD_STATES.CONTENT;
      }

      return AD_STATES.UNKNOWN;
    }

    hasAdIndicators() {
      if (!this.player) {
        return false;
      }

      if (
        this.player.classList.contains("ad-showing") ||
        this.player.classList.contains("ad-interrupting")
      ) {
        return true;
      }

      for (const selector of AD_INDICATOR_SELECTORS) {
        if (this.player.querySelector(selector)) {
          return true;
        }
      }

      const adsContainer = this.player.querySelector(".video-ads");
      return Boolean(adsContainer && adsContainer.childElementCount > 0);
    }

    queueTransition(nextState) {
      if (nextState === this.adState) {
        this.pendingState = null;
        if (this.transitionTimer) {
          window.clearTimeout(this.transitionTimer);
          this.transitionTimer = null;
        }
        return;
      }

      if (this.pendingState === nextState) {
        return;
      }

      this.pendingState = nextState;
      if (this.transitionTimer) {
        window.clearTimeout(this.transitionTimer);
      }

      this.transitionTimer = window.setTimeout(() => {
        const targetState = this.pendingState;
        this.pendingState = null;
        this.transitionTimer = null;

        if (!targetState || targetState === this.adState) {
          return;
        }

        const previousState = this.adState;
        this.adState = targetState;
        // Debounced transitions avoid UI/audio flicker from transient signals.
        this.handleTransition(previousState, targetState);
      }, TRANSITION_DEBOUNCE_MS);
    }

    handleTransition(_previousState, targetState) {
      if (targetState === AD_STATES.AD) {
        this.enterAdMode();
        return;
      }

      if (targetState === AD_STATES.CONTENT) {
        this.exitAdMode({ skipRestore: false });
        return;
      }

      if (
        targetState === AD_STATES.UNKNOWN &&
        this.session.adActive &&
        !this.hasAdIndicators()
      ) {
        this.exitAdMode({ skipRestore: false });
      }
    }

    enterAdMode() {
      if (!this.video || !this.player || !this.comfortModeEnabled) {
        return;
      }

      if (!this.session.adActive) {
        this.captureBaseline(true);
        this.session.adActive = true;
        this.session.effectApplied = false;
        this.session.userOverrideDuringAd = false;
      }

      this.applyAdEffects();
      this.renderUi();
      this.updateBadgeText();
    }

    exitAdMode({ skipRestore }) {
      if (!this.session.adActive) {
        this.removeUi();
        return;
      }

      if (!skipRestore && this.video && this.session.effectApplied) {
        this.restoreBaseline();
      }

      this.session.adActive = false;
      this.session.effectApplied = false;
      this.session.userOverrideDuringAd = false;

      this.removeUi();

      if (this.video) {
        this.captureBaseline(true);
      }
    }

    handleSettingsUpdate() {
      if (!this.comfortModeEnabled) {
        return;
      }

      if (!this.session.adActive) {
        this.renderUi();
        return;
      }

      if (!this.settings.autoMuteEnabled && !this.settings.lowVolumeEnabled) {
        if (this.session.effectApplied) {
          this.restoreBaseline();
        }
        this.session.effectApplied = false;
      } else if (!this.session.userOverrideDuringAd) {
        this.applyAdEffects();
      }

      this.renderUi();
      this.updateBadgeText();
    }

    setComfortModeEnabled(enabled) {
      this.comfortModeEnabled = Boolean(enabled);

      if (!this.comfortModeEnabled) {
        this.exitAdMode({ skipRestore: false });
      } else if (this.adState === AD_STATES.AD) {
        this.enterAdMode();
      }

      this.reportComfortMode();
    }

    applyAdEffects() {
      if (!this.video || !this.comfortModeEnabled) {
        return;
      }

      if (!this.settings.autoMuteEnabled && !this.settings.lowVolumeEnabled) {
        return;
      }

      if (this.session.userOverrideDuringAd) {
        return;
      }

      if (this.settings.lowVolumeEnabled) {
        const lowVolume = clamp(this.settings.lowVolumePercent / 100, 0, 0.3);
        this.withProgrammaticVolumeWrite(() => {
          if (this.session.baselineMuted) {
            this.video.muted = true;
          } else {
            this.video.muted = false;
            this.video.volume = lowVolume;
          }
        });
        this.session.effectApplied = true;
        return;
      }

      if (this.settings.autoMuteEnabled) {
        this.withProgrammaticVolumeWrite(() => {
          this.video.muted = true;
        });
        this.session.effectApplied = true;
      }
    }

    restoreBaseline() {
      if (
        !this.video ||
        this.session.baselineMuted == null ||
        this.session.baselineVolume == null
      ) {
        return;
      }

      this.withProgrammaticVolumeWrite(() => {
        this.video.muted = Boolean(this.session.baselineMuted);
        this.video.volume = clamp(this.session.baselineVolume, 0, 1);
      });
    }

    captureBaseline(force = false) {
      if (!this.video) {
        return;
      }

      if (!force && this.session.adActive) {
        return;
      }

      this.session.baselineMuted = this.video.muted;
      this.session.baselineVolume = this.video.volume;
    }

    withProgrammaticVolumeWrite(fn) {
      this.session.programmaticVolumeWrites += 1;
      try {
        fn();
      } finally {
        this.session.programmaticVolumeWrites = Math.max(
          0,
          this.session.programmaticVolumeWrites - 1
        );
      }
    }

    renderUi() {
      if (!this.session.adActive || !this.comfortModeEnabled || !this.shouldRenderUi()) {
        this.removeUi();
        return;
      }

      this.ensureStyle();
      this.ensureUiElements();

      if (this.ui.overlayEl) {
        this.ui.overlayEl.style.display = this.settings.dimOverlayEnabled
          ? "block"
          : "none";
      }

      if (this.ui.badgeEl) {
        this.ui.badgeEl.style.display = "inline-flex";
      }
    }

    shouldRenderUi() {
      if (!this.player || !this.video) {
        return false;
      }

      if (this.video.closest("#movie_player") !== this.player) {
        return false;
      }

      if (this.player.classList.contains("ytp-player-minimized")) {
        return false;
      }

      if (this.player.closest("ytd-miniplayer")) {
        return false;
      }

      if (document.pictureInPictureElement === this.video) {
        return false;
      }

      return true;
    }

    ensureStyle() {
      if (this.ui.styleEl?.isConnected) {
        return;
      }

      const styleEl = document.createElement("style");
      styleEl.id = "ls-comfort-style";
      styleEl.textContent = `
        :root {
          --ls-hot-pink: #ff4f9d;
          --ls-bubblegum: #ff9dc5;
          --ls-bg: rgba(33, 9, 22, 0.35);
          --ls-text: #fff7fc;
          --ls-shadow: rgba(255, 79, 157, 0.35);
        }

        #movie_player .ls-comfort-overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(255, 157, 197, 0.12) 0%, var(--ls-bg) 100%);
          pointer-events: none;
          border-radius: 10px;
          z-index: 22;
        }

        #movie_player .ls-comfort-badge {
          position: absolute;
          left: 14px;
          bottom: 14px;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 10px;
          border-radius: 999px;
          background: rgba(20, 6, 13, 0.76);
          border: 1px solid rgba(255, 157, 197, 0.5);
          color: var(--ls-text);
          font: 600 12px/1.2 "Trebuchet MS", "Avenir Next", sans-serif;
          letter-spacing: 0.01em;
          box-shadow: 0 6px 16px var(--ls-shadow);
          pointer-events: none;
          z-index: 23;
        }

        #movie_player .ls-comfort-badge::before {
          content: "";
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--ls-hot-pink);
          box-shadow: 0 0 10px var(--ls-hot-pink);
          flex-shrink: 0;
        }
      `;

      document.head.appendChild(styleEl);
      this.ui.styleEl = styleEl;
    }

    ensureUiElements() {
      if (!this.player) {
        return;
      }

      const computedStyle = window.getComputedStyle(this.player);
      if (computedStyle.position === "static") {
        this.player.dataset.lsPositionPatch = "true";
        this.player.style.position = "relative";
      }

      if (!this.ui.overlayEl || !this.ui.overlayEl.isConnected) {
        const overlayEl = document.createElement("div");
        overlayEl.className = "ls-comfort-overlay";
        this.player.appendChild(overlayEl);
        this.ui.overlayEl = overlayEl;
      }

      if (!this.ui.badgeEl || !this.ui.badgeEl.isConnected) {
        const badgeEl = document.createElement("div");
        badgeEl.className = "ls-comfort-badge";
        badgeEl.textContent = "Ad playing";
        this.player.appendChild(badgeEl);
        this.ui.badgeEl = badgeEl;
      }
    }

    removeUi() {
      if (this.ui.overlayEl?.isConnected) {
        this.ui.overlayEl.remove();
      }
      if (this.ui.badgeEl?.isConnected) {
        this.ui.badgeEl.remove();
      }

      this.ui.overlayEl = null;
      this.ui.badgeEl = null;

      if (this.player?.dataset.lsPositionPatch === "true") {
        this.player.style.removeProperty("position");
        delete this.player.dataset.lsPositionPatch;
      }
    }

    updateBadgeText() {
      if (!this.ui.badgeEl || !this.session.adActive) {
        return;
      }

      const countdown = this.getCountdownLabel();
      this.ui.badgeEl.textContent = countdown
        ? `Ad playing · ${countdown}`
        : "Ad playing";
    }

    getCountdownLabel() {
      if (!this.player) {
        return "";
      }

      const directCountdown = this.player.querySelector(".ytp-ad-duration-remaining");
      const fromDirect = extractTimeToken(directCountdown?.textContent || "");
      if (fromDirect) {
        return fromDirect;
      }

      const previewText = this.player.querySelector(".ytp-ad-preview-text");
      const fromPreview = extractTimeToken(previewText?.textContent || "");
      if (fromPreview) {
        return fromPreview;
      }

      if (
        this.video &&
        Number.isFinite(this.video.duration) &&
        Number.isFinite(this.video.currentTime) &&
        this.video.duration > 0 &&
        this.video.duration < 360
      ) {
        const remainingSeconds = Math.max(
          0,
          Math.round(this.video.duration - this.video.currentTime)
        );
        if (remainingSeconds > 0) {
          return formatDuration(remainingSeconds);
        }
      }

      return "";
    }

    reportComfortMode() {
      try {
        chrome.runtime.sendMessage(
          {
            type: "LS_REPORT_COMFORT_MODE",
            enabled: this.comfortModeEnabled,
          },
          () => {
            void chrome.runtime.lastError;
          }
        );
      } catch (_error) {
        // Service worker may be unavailable temporarily.
      }
    }
  }

  function normalizeSettings(rawSettings) {
    const source =
      rawSettings && typeof rawSettings === "object" ? rawSettings : {};

    return {
      comfortModeDefaultEnabled: source.comfortModeDefaultEnabled !== false,
      autoMuteEnabled: source.autoMuteEnabled !== false,
      lowVolumeEnabled: Boolean(source.lowVolumeEnabled),
      lowVolumePercent: clamp(
        Number.isFinite(Number(source.lowVolumePercent))
          ? Number(source.lowVolumePercent)
          : DEFAULT_SETTINGS.lowVolumePercent,
        0,
        30
      ),
      dimOverlayEnabled: source.dimOverlayEnabled !== false,
    };
  }

  function findMainPlayerContext() {
    const moviePlayer = document.querySelector("#movie_player");
    if (moviePlayer) {
      const playerVideo = moviePlayer.querySelector("video");
      if (playerVideo) {
        return { player: moviePlayer, video: playerVideo };
      }
    }

    const fallbackVideo = document.querySelector(
      "ytd-player video.html5-main-video, ytd-player video, video.html5-main-video, video"
    );
    if (!fallbackVideo) {
      return { player: null, video: null };
    }

    return {
      player: fallbackVideo.closest("#movie_player"),
      video: fallbackVideo,
    };
  }

  function containsNodeOfInterest(nodeList) {
    for (const node of nodeList) {
      if (!(node instanceof Element)) {
        continue;
      }

      if (
        node.matches?.("video, #movie_player, ytd-player, .video-ads, .ytp-ad-module") ||
        node.querySelector?.(
          "video, #movie_player, ytd-player, .video-ads, .ytp-ad-module"
        )
      ) {
        return true;
      }
    }
    return false;
  }

  function extractTimeToken(text) {
    const match = text.match(/(?:\d{1,2}:)?\d{1,2}:\d{2}/);
    return match ? match[0] : "";
  }

  function formatDuration(seconds) {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(safeSeconds / 3600);
    const minutes = Math.floor((safeSeconds % 3600) / 60);
    const remainderSeconds = safeSeconds % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, "0")}:${String(
        remainderSeconds
      ).padStart(2, "0")}`;
    }

    return `${minutes}:${String(remainderSeconds).padStart(2, "0")}`;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  const controller = new LoveSparkComfortController();
  void controller.init();
})();
