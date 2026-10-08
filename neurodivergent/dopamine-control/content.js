// Dopamine Control — Content Script
// Injected on youtube.com. Tracks video watch time, shows floating timer,
// injects block overlay when limit is hit.
// Assumes shared/utils.js and shared/constants.js loaded before this file.

(function () {
  'use strict';

  // ============================================================
  // STATE
  // ============================================================

  let videoEl = null;
  let isPlaying = false;
  let isBlocked = false;
  let isOverriding = false;
  let localCount = 0;          // seconds accumulated since last flush
  let syncInterval = null;
  let currentStatus = null;
  let blockOverlayEl = null;
  let floatingTimerEl = null;
  let initialized = false;

  // ============================================================
  // PAGE HELPERS
  // ============================================================

  function isWatchPage() {
    return window.location.pathname === '/watch';
  }

  function isShortsPage() {
    return window.location.pathname.startsWith('/shorts/');
  }

  // ============================================================
  // VIDEO TRACKING
  // ============================================================

  function attachVideoListeners(video) {
    if (video._dcAttached) return;
    video._dcAttached = true;

    video.addEventListener('play', onPlay);
    video.addEventListener('playing', onPlay);
    video.addEventListener('pause', onPause);
    video.addEventListener('ended', onPause);
    video.addEventListener('waiting', onPause);

    // Resume if already playing
    if (!video.paused && !video.ended) onPlay();
  }

  function onPlay() {
    if (isBlocked && !isOverriding) {
      videoEl && videoEl.pause();
      return;
    }
    isPlaying = true;
    startCounting();
  }

  function onPause() {
    isPlaying = false;
    stopCounting();
    flushTime();
  }

  function startCounting() {
    if (syncInterval) return;
    syncInterval = setInterval(() => {
      if (!isPlaying || document.hidden) return;
      localCount++;
      updateFloatingTimer();
      if (localCount % 5 === 0) flushTime();
    }, 1000);
  }

  function stopCounting() {
    if (syncInterval) {
      clearInterval(syncInterval);
      syncInterval = null;
    }
  }

  function flushTime() {
    if (localCount <= 0) return;
    const seconds = localCount;
    localCount = 0;

    chrome.runtime.sendMessage(
      { type: 'TIME_UPDATE', payload: { seconds, isWhitelisted: false, isShorts: isShortsPage() } },
      (response) => {
        if (chrome.runtime.lastError) {
          // Service worker was sleeping — re-queue so we don't lose time
          localCount += seconds;
        } else if (response?.ok) {
          requestStatus();
        }
      }
    );
  }

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (isPlaying) flushTime();
    }
  });

  window.addEventListener('beforeunload', () => {
    if (localCount > 0) flushTime();
  });

  // ============================================================
  // YOUTUBE SPA NAVIGATION
  // ============================================================

  function onYouTubeNavigate() {
    stopCounting();
    isPlaying = false;
    localCount = 0;

    if (videoEl) {
      videoEl._dcAttached = false;
      videoEl = null;
    }

    removeBlockOverlay();

    // YouTube SPA needs a moment for the DOM to update
    setTimeout(() => {
      initVideoTracking();
      requestStatus();
    }, 1200);
  }

  document.addEventListener('yt-navigate-finish', onYouTubeNavigate);

  // ============================================================
  // FLOATING TIMER
  // ============================================================

  function createFloatingTimer() {
    if (floatingTimerEl) return;

    floatingTimerEl = document.createElement('div');
    floatingTimerEl.id = 'dc-floating-timer';
    floatingTimerEl.innerHTML = `
      <span class="dc-ft-brain">🧠</span>
      <span class="dc-ft-text">Loading...</span>
    `;

    makeDraggable(floatingTimerEl);
    document.body.appendChild(floatingTimerEl);
  }

  function updateFloatingTimer() {
    if (!floatingTimerEl || !currentStatus) return;

    const used = (currentStatus.watchTime || 0) + localCount; // include unsent local time
    const remaining = Math.max(0, currentStatus.limit - used);
    const pct = Math.min(100, (used / currentStatus.limit) * 100);

    const textEl = floatingTimerEl.querySelector('.dc-ft-text');
    if (textEl) {
      if (currentStatus.isBlocked && !currentStatus.isOverriding) {
        textEl.textContent = "Time's up 😴";
      } else {
        textEl.textContent = `${formatTime(remaining)} left · ${Math.round(pct)}%`;
      }
    }

    floatingTimerEl.className = 'dc-ft-safe';
    if (pct >= 95) floatingTimerEl.className = 'dc-ft-danger-deep';
    else if (pct >= 80) floatingTimerEl.className = 'dc-ft-danger';
    else if (pct >= 60) floatingTimerEl.className = 'dc-ft-caution';

    // Re-add id
    floatingTimerEl.id = 'dc-floating-timer';
  }

  function makeDraggable(el) {
    let dragging = false;
    let startX, startY, startRight, startBottom;

    el.addEventListener('mousedown', (e) => {
      dragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      startRight = window.innerWidth - rect.right;
      startBottom = window.innerHeight - rect.bottom;
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const newRight = clamp(startRight - dx, 10, window.innerWidth - el.offsetWidth - 10);
      const newBottom = clamp(startBottom - dy, 10, window.innerHeight - el.offsetHeight - 10);
      el.style.right = newRight + 'px';
      el.style.bottom = newBottom + 'px';
      el.style.left = 'auto';
    });

    document.addEventListener('mouseup', () => { dragging = false; });
  }

  // ============================================================
  // BLOCK OVERLAY
  // ============================================================

  function showBlockOverlay(payload) {
    if (blockOverlayEl) return; // already shown

    isBlocked = true;
    isOverriding = false;

    if (videoEl) videoEl.pause();
    document.addEventListener('play', preventVideoPlay, true);

    const { watchTime, limit, streak, level, weeklyTotal, quote } = payload;

    blockOverlayEl = document.createElement('div');
    blockOverlayEl.id = 'dc-block-overlay';
    blockOverlayEl.innerHTML = `
      <div class="dc-block-card">
        <div class="dc-block-dopa">😴</div>
        <h1 class="dc-block-title">Time's up for today!</h1>
        <p class="dc-block-msg">
          Dopa is resting and so should you.<br>
          You watched <strong>${formatTime(watchTime)}</strong> today — that's enough.<br>
          Go touch grass. 🌿
        </p>

        <div class="dc-block-stats">
          <div class="dc-bs-row">🔥 Current Streak: <strong>${streak} day${streak !== 1 ? 's' : ''}</strong></div>
          <div class="dc-bs-row">⭐ Level <strong>${level}</strong></div>
          <div class="dc-bs-row">📊 This week: <strong>${formatTime(weeklyTotal)}</strong> total</div>
        </div>

        <div id="dc-override-wrap">
          <button class="dc-override-btn" id="dc-override-btn">Override for 15 min ⚠️</button>
          <p class="dc-override-note">This will break your streak</p>
        </div>

        <div id="dc-confirm-wrap" class="dc-hidden">
          <p class="dc-confirm-q">Are you sure? Your ${streak}-day streak will reset to 0.</p>
          <div class="dc-confirm-row">
            <button class="dc-btn-yes" id="dc-confirm-yes">Yes, override</button>
            <button class="dc-btn-no" id="dc-confirm-no">Cancel</button>
          </div>
        </div>

        <blockquote class="dc-block-quote">"${quote}"</blockquote>
      </div>
    `;

    document.body.appendChild(blockOverlayEl);

    document.getElementById('dc-override-btn').addEventListener('click', () => {
      document.getElementById('dc-override-wrap').classList.add('dc-hidden');
      document.getElementById('dc-confirm-wrap').classList.remove('dc-hidden');
    });

    document.getElementById('dc-confirm-no').addEventListener('click', () => {
      document.getElementById('dc-confirm-wrap').classList.add('dc-hidden');
      document.getElementById('dc-override-wrap').classList.remove('dc-hidden');
    });

    document.getElementById('dc-confirm-yes').addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'CONFIRM_OVERRIDE' }, (res) => {
        if (res?.success) {
          isOverriding = true;
          isBlocked = false;
          document.removeEventListener('play', preventVideoPlay, true);
          removeBlockOverlay();
        }
      });
    });
  }

  function preventVideoPlay(e) {
    if (isBlocked && !isOverriding) {
      e.stopPropagation();
      e.preventDefault();
      if (e.target?.tagName === 'VIDEO') e.target.pause();
    }
  }

  function removeBlockOverlay() {
    if (blockOverlayEl) {
      blockOverlayEl.remove();
      blockOverlayEl = null;
    }
    if (!isOverriding) isBlocked = false;
  }

  // ============================================================
  // STATUS REQUEST
  // ============================================================

  function requestStatus() {
    chrome.runtime.sendMessage({ type: 'REQUEST_STATUS' }, (response) => {
      if (chrome.runtime.lastError || !response) return;

      currentStatus = response;
      updateFloatingTimer();

      if (response.isBlocked && !blockOverlayEl) {
        chrome.runtime.sendMessage({ type: 'GET_FULL_STATUS' }, (full) => {
          if (!full) return;
          showBlockOverlay({
            watchTime: full.watchTime,
            limit: full.limit,
            streak: full.streak,
            level: full.level,
            weeklyTotal: 0,
            quote: MOTIVATIONAL_QUOTES[getDayOfYear() % MOTIVATIONAL_QUOTES.length]
          });
        });
      }
    });
  }

  // Refresh status every 30s even when video is idle
  setInterval(requestStatus, 30000);

  // ============================================================
  // MESSAGES FROM BACKGROUND
  // ============================================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.type) {
      case 'BLOCK_NOW':
        showBlockOverlay(message.payload);
        sendResponse({ ok: true });
        break;

      case 'UNBLOCK':
        isBlocked = false;
        isOverriding = true;
        document.removeEventListener('play', preventVideoPlay, true);
        removeBlockOverlay();
        sendResponse({ ok: true });
        break;

      case 'STATUS_UPDATE':
        currentStatus = message.payload;
        updateFloatingTimer();
        sendResponse({ ok: true });
        break;
    }
    return true;
  });

  // ============================================================
  // VIDEO ELEMENT DETECTION
  // ============================================================

  function initVideoTracking() {
    videoEl = document.querySelector('video');

    if (videoEl) {
      attachVideoListeners(videoEl);
    } else {
      // Watch for video element being added to DOM
      const observer = new MutationObserver(() => {
        videoEl = document.querySelector('video');
        if (videoEl) {
          observer.disconnect();
          attachVideoListeners(videoEl);
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }
  }

  // ============================================================
  // INIT
  // ============================================================

  function init() {
    if (initialized) return;
    initialized = true;

    createFloatingTimer();
    requestStatus();
    initVideoTracking();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
