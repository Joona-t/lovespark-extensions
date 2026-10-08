'use strict';

(function () {
  var STORAGE_KEY = 'inputGuardEntries';

  var settings = {
    debounceMs: 1500,
    minLength: 10,
    maxEntries: 200,
    maxAgeDays: 7
  };

  var enabled = true;
  var timers = new WeakMap();

  function fieldId(el) {
    var parts = [el.tagName.toLowerCase()];
    if (el.id) parts.push('#' + el.id);
    if (el.name) parts.push('[name=' + el.name + ']');
    if (el.type && el.type !== 'text') parts.push('[type=' + el.type + ']');
    if (!el.id && !el.name && el.placeholder) {
      parts.push('[ph=' + el.placeholder.slice(0, 20) + ']');
    }
    return parts.join('');
  }

  function getText(el) {
    return el.isContentEditable ? el.innerText : el.value;
  }

  function save(el) {
    if (!enabled) return;
    var text = getText(el);
    if (!text || text.trim().length < settings.minLength) return;

    var key = location.hostname + '::' + fieldId(el);
    var entry = {
      id: key,
      url: location.href,
      title: document.title || location.hostname,
      hostname: location.hostname,
      text: text,
      timestamp: Date.now(),
      fieldType: el.tagName.toLowerCase() + (el.type ? ':' + el.type : '')
    };

    chrome.storage.local.get([STORAGE_KEY], function (data) {
      var entries = data[STORAGE_KEY] || [];
      var idx = -1;
      for (var i = 0; i < entries.length; i++) {
        if (entries[i].id === key) { idx = i; break; }
      }

      if (idx >= 0) {
        entries[idx] = entry;
      } else {
        entries.unshift(entry);
      }

      var cutoff = Date.now() - (settings.maxAgeDays * 86400000);
      entries = entries.filter(function (e) { return e.timestamp > cutoff; });
      if (entries.length > settings.maxEntries) {
        entries = entries.slice(0, settings.maxEntries);
      }

      chrome.storage.local.set({ inputGuardEntries: entries });

      try {
        chrome.runtime.sendMessage({ type: 'CONTENT_SAVED' });
      } catch (_err) {}
    });
  }

  function onInput(e) {
    if (!enabled) return;
    var el = e.target;
    var prev = timers.get(el);
    if (prev) clearTimeout(prev);
    timers.set(el, setTimeout(function () { save(el); }, settings.debounceMs));
  }

  function isTracked(el) {
    if (!el || !el.tagName) return false;
    if (el.type === 'password' || el.type === 'hidden') return false;
    if (el.tagName === 'TEXTAREA') return true;
    if (el.tagName === 'INPUT') {
      var textTypes = ['text', 'search', 'url', 'email', 'tel', ''];
      return textTypes.indexOf(el.type || '') >= 0;
    }
    if (el.isContentEditable && !el.closest('[data-lovespark]')) return true;
    return false;
  }

  function attach(el) {
    if (el.dataset.lsGuard) return;
    el.dataset.lsGuard = '1';
    el.addEventListener('input', onInput);
  }

  function scan(root) {
    if (!enabled || !root || !root.querySelectorAll) return;
    var fields = root.querySelectorAll(
      'textarea, input, [contenteditable="true"], [contenteditable=""]'
    );
    for (var i = 0; i < fields.length; i++) {
      if (isTracked(fields[i])) attach(fields[i]);
    }
  }

  function flushAll() {
    if (!enabled) return;
    var guarded = document.querySelectorAll('[data-ls-guard]');
    for (var i = 0; i < guarded.length; i++) {
      var el = guarded[i];
      var t = timers.get(el);
      if (t) {
        clearTimeout(t);
        timers.delete(el);
      }
      save(el);
    }
  }

  function init() {
    chrome.storage.local.get(['isEnabled', 'inputGuardSettings'], function (data) {
      enabled = data.isEnabled !== false;
      if (data.inputGuardSettings) {
        var s = data.inputGuardSettings;
        if (s.debounceMs) settings.debounceMs = s.debounceMs;
        if (s.minLength) settings.minLength = s.minLength;
        if (s.maxEntries) settings.maxEntries = s.maxEntries;
        if (s.maxAgeDays) settings.maxAgeDays = s.maxAgeDays;
      }
      if (!enabled) return;

      scan(document.body);

      var observer = new MutationObserver(function (mutations) {
        for (var m = 0; m < mutations.length; m++) {
          var added = mutations[m].addedNodes;
          for (var n = 0; n < added.length; n++) {
            var node = added[n];
            if (node.nodeType !== 1) continue;
            if (isTracked(node)) attach(node);
            scan(node);
          }
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    });

    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'hidden') flushAll();
    });

    window.addEventListener('beforeunload', flushAll);

    chrome.storage.onChanged.addListener(function (changes) {
      if (changes.isEnabled) {
        enabled = changes.isEnabled.newValue !== false;
        if (enabled) scan(document.body);
      }
      if (changes.inputGuardSettings && changes.inputGuardSettings.newValue) {
        var s = changes.inputGuardSettings.newValue;
        if (s.debounceMs) settings.debounceMs = s.debounceMs;
        if (s.minLength) settings.minLength = s.minLength;
        if (s.maxEntries) settings.maxEntries = s.maxEntries;
        if (s.maxAgeDays) settings.maxAgeDays = s.maxAgeDays;
      }
    });
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
