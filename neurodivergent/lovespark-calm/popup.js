'use strict';

/* LoveSpark Calm — Popup Script
   No innerHTML. All DOM built with createElement/textContent. */

(function () {
  /* ── DOM refs ──────────────────────────────────────── */
  var calmToggle = document.getElementById('calmToggle');
  var toggleStatus = document.getElementById('toggleStatus');
  var intensityBtns = document.querySelectorAll('.intensity-btn');
  var previewBlock = document.getElementById('previewBlock');
  var siteBtns = document.querySelectorAll('.site-btn');
  var siteCount = document.getElementById('siteCount');
  var defaultIntensity = document.getElementById('defaultIntensity');
  var autoEnableDomains = document.getElementById('autoEnableDomains');
  var autoDisableDomains = document.getElementById('autoDisableDomains');

  var currentIntensity = 'medium';
  var currentDomain = '';

  /* ── Init ──────────────────────────────────────────── */
  function init() {
    LoveSparkTheme.init();
    loadState();
    loadSettings();
    getCurrentDomain();
    bindEvents();
  }

  function loadState() {
    chrome.runtime.sendMessage({ action: 'getState' }, function (resp) {
      if (!resp) return;

      calmToggle.checked = resp.enabled;
      updateToggleStatus(resp.enabled);
      currentIntensity = resp.intensity || 'medium';
      updateIntensityUI(currentIntensity);
      updatePreview(currentIntensity);
      siteCount.textContent = String(resp.siteCount || 0);
    });
  }

  function loadSettings() {
    chrome.storage.local.get(
      ['defaultIntensity', 'autoEnableDomains', 'autoDisableDomains'],
      function (data) {
        if (data.defaultIntensity) {
          defaultIntensity.value = data.defaultIntensity;
        }
        if (data.autoEnableDomains) {
          autoEnableDomains.value = data.autoEnableDomains;
        }
        if (data.autoDisableDomains) {
          autoDisableDomains.value = data.autoDisableDomains;
        }
      }
    );
  }

  function getCurrentDomain() {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      if (tabs[0] && tabs[0].url) {
        try {
          currentDomain = new URL(tabs[0].url).hostname;
        } catch (e) {
          currentDomain = '';
        }
      }
      loadSiteOverride();
    });
  }

  function loadSiteOverride() {
    if (!currentDomain) return;
    chrome.storage.local.get(['siteOverrides'], function (data) {
      var overrides = data.siteOverrides || {};
      var mode = overrides[currentDomain] || 'default';
      updateSiteUI(mode);
    });
  }

  /* ── Bind Events ───────────────────────────────────── */
  function bindEvents() {
    /* Main toggle */
    calmToggle.addEventListener('change', function () {
      var enabled = calmToggle.checked;
      updateToggleStatus(enabled);
      chrome.runtime.sendMessage({
        action: 'toggleCalm',
        enabled: enabled,
        intensity: currentIntensity
      });
    });

    /* Intensity buttons */
    for (var i = 0; i < intensityBtns.length; i++) {
      intensityBtns[i].addEventListener('click', handleIntensityClick);
    }

    /* Site buttons */
    for (var j = 0; j < siteBtns.length; j++) {
      siteBtns[j].addEventListener('click', handleSiteClick);
    }

    /* Settings */
    defaultIntensity.addEventListener('change', function () {
      chrome.storage.local.set({ defaultIntensity: defaultIntensity.value });
    });

    autoEnableDomains.addEventListener('input', debounce(function () {
      chrome.storage.local.set({ autoEnableDomains: autoEnableDomains.value });
    }, 500));

    autoDisableDomains.addEventListener('input', debounce(function () {
      chrome.storage.local.set({ autoDisableDomains: autoDisableDomains.value });
    }, 500));
  }

  function handleIntensityClick(e) {
    var btn = e.currentTarget;
    var level = btn.getAttribute('data-level');
    currentIntensity = level;
    updateIntensityUI(level);
    updatePreview(level);
    chrome.runtime.sendMessage({
      action: 'changeIntensity',
      intensity: level
    });
  }

  function handleSiteClick(e) {
    var btn = e.currentTarget;
    var mode = btn.getAttribute('data-mode');
    updateSiteUI(mode);
    if (currentDomain) {
      chrome.runtime.sendMessage({
        action: 'setSiteOverride',
        domain: currentDomain,
        mode: mode
      });
    }
  }

  /* ── UI Update Helpers ─────────────────────────────── */
  function updateToggleStatus(enabled) {
    toggleStatus.textContent = enabled ? 'Active' : 'Off';
    if (enabled) {
      toggleStatus.classList.add('active');
    } else {
      toggleStatus.classList.remove('active');
    }
  }

  function updateIntensityUI(level) {
    for (var i = 0; i < intensityBtns.length; i++) {
      var btn = intensityBtns[i];
      var isActive = btn.getAttribute('data-level') === level;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    }
  }

  function updatePreview(level) {
    previewBlock.className = 'preview-block';
    previewBlock.classList.add('level-' + level);
  }

  function updateSiteUI(mode) {
    for (var i = 0; i < siteBtns.length; i++) {
      var btn = siteBtns[i];
      var isActive = btn.getAttribute('data-mode') === mode;
      btn.classList.toggle('active', isActive);
      btn.setAttribute('aria-checked', isActive ? 'true' : 'false');
    }
  }

  /* ── Utility ───────────────────────────────────────── */
  function debounce(fn, delay) {
    var timer = null;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(timer);
      timer = setTimeout(function () {
        fn.apply(ctx, args);
      }, delay);
    };
  }

  /* ── Start ─────────────────────────────────────────── */
  document.addEventListener('DOMContentLoaded', init);
})();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
