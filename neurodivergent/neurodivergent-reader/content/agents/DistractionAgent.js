'use strict';

/**
 * DistractionAgent — CSS-first element hiding with MutationObserver for dynamic content.
 *
 * Sub-toggles are mapped to individual data attributes on <html>:
 *   data-nr-hide-sidebars
 *   data-nr-hide-ads
 *   data-nr-hide-cookies
 *   data-nr-hide-floating
 *
 * CSS selectors in distraction-rules.css gate on these attributes.
 * MutationObserver catches dynamically injected auto-playing media.
 *
 * Observer config: { childList: true, subtree: true } only.
 * Debounced at 150ms to prevent callback storms on heavy SPA pages.
 */

// Map settings keys to HTML data attributes
const DISTRACTION_ATTRS = {
  hideSidebars:      'data-nr-hide-sidebars',
  hideAds:           'data-nr-hide-ads',
  hideCookieBanners: 'data-nr-hide-cookies',
  hideFloating:      'data-nr-hide-floating',
};

class DistractionAgent {
  constructor(bus) {
    this._bus = bus;
    this._enabled = false;
    this._settings = {
      hideSidebars: true,
      hideAds: true,
      hideCookieBanners: true,
      hideFloating: true,
    };
    this._observer = null;
    this._debounceTimer = null;
  }

  init() {
    this._bus.on(MSG.SETTINGS_UPDATED, (s) => this._onSettings(s));
    this._bus.on(MSG.DESTROY_ALL, () => this.destroy());
  }

  _onSettings(settings) {
    if (!settings || !settings.enabled || !settings.distractions || !settings.distractions.enabled) {
      this.disable();
      return;
    }

    this._settings = settings.distractions;

    if (!this._enabled) {
      this.enable();
    }

    // Update per-type data attributes
    this._syncAttributes();
  }

  enable() {
    if (this._enabled) return;
    this._enabled = true;

    this._syncAttributes();
    this._pauseAutoplayMedia();
    this._startObserver();
  }

  disable() {
    if (!this._enabled) return;
    this._enabled = false;

    this._stopObserver();
    this._clearAttributes();
  }

  destroy() {
    this.disable();
  }

  _syncAttributes() {
    const html = document.documentElement;

    for (const [key, attr] of Object.entries(DISTRACTION_ATTRS)) {
      if (this._settings[key]) {
        html.setAttribute(attr, '');
      } else {
        html.removeAttribute(attr);
      }
    }
  }

  _clearAttributes() {
    const html = document.documentElement;
    for (const attr of Object.values(DISTRACTION_ATTRS)) {
      html.removeAttribute(attr);
    }
  }

  _pauseAutoplayMedia() {
    const media = document.querySelectorAll('video[autoplay], audio[autoplay]');
    for (let i = 0; i < media.length; i++) {
      media[i].pause();
      media[i].removeAttribute('autoplay');
    }
  }

  _startObserver() {
    if (this._observer) return;
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => this._startObserver(), { once: true });
      return;
    }

    this._observer = new MutationObserver((mutations) => {
      let hasNewMedia = false;

      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== Node.ELEMENT_NODE) continue;

          if ((node.tagName === 'VIDEO' || node.tagName === 'AUDIO') && node.autoplay) {
            hasNewMedia = true;
          }
          if (node.querySelectorAll) {
            const nested = node.querySelectorAll('video[autoplay], audio[autoplay]');
            if (nested.length > 0) hasNewMedia = true;
          }
        }
      }

      if (hasNewMedia) {
        clearTimeout(this._debounceTimer);
        this._debounceTimer = setTimeout(() => {
          requestAnimationFrame(() => this._pauseAutoplayMedia());
        }, 150);
      }
    });

    this._observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  _stopObserver() {
    if (this._observer) {
      this._observer.disconnect();
      this._observer = null;
    }
    clearTimeout(this._debounceTimer);
    this._debounceTimer = null;
  }
}
