'use strict';

class SensoryAgent {
  constructor(bus) {
    this._bus = bus;
    this._enabled = false;
    this._settings = {};
    this._gifObserver = null;
    this._autoplayObserver = null;
    this._debounceTimer = null;
    this._epoch = 0;
  }

  init() {
    this._bus.on(MSG.DESTROY_ALL, () => this.destroy());
  }

  apply(settings) {
    if (!settings || !settings.enabled || !settings.sensory || !settings.sensory.enabled) {
      this.disable();
      return;
    }

    this._enabled = true;
    this._settings = settings.sensory;
    const html = document.documentElement;

    // Freeze animations + reduce motion (CSS-gated)
    this._toggleAttr(html, 'data-cozy-reduce-motion',
      this._settings.freezeAnimations || this._settings.reduceMotion);

    // Hide GIFs (CSS-gated + MutationObserver for dynamic)
    this._toggleAttr(html, 'data-cozy-hide-gifs', this._settings.hideGifs);
    if (this._settings.hideGifs) {
      this._startGifObserver();
    } else {
      this._stopGifObserver();
      this._restoreGifs();
    }

    // Pause autoplay (MutationObserver)
    if (this._settings.pauseAutoplay) {
      this._pauseAutoplayMedia();
      this._startAutoplayObserver();
    } else {
      this._stopAutoplayObserver();
    }

    // Large cursor (CSS-gated)
    this._toggleAttr(html, 'data-cozy-cursor', this._settings.largeCursor);
  }

  disable() {
    if (!this._enabled) return;
    this._enabled = false;
    this._epoch++;

    const html = document.documentElement;
    html.removeAttribute('data-cozy-reduce-motion');
    html.removeAttribute('data-cozy-hide-gifs');
    html.removeAttribute('data-cozy-cursor');

    this._stopGifObserver();
    this._restoreGifs();
    this._stopAutoplayObserver();
  }

  destroy() { this.disable(); }

  _toggleAttr(el, attr, on) {
    if (on) el.setAttribute(attr, '');
    else el.removeAttribute(attr);
  }

  _startGifObserver() {
    this._hideGifImages(document.querySelectorAll('img'));
    if (this._gifObserver) return;

    this._gifObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.tagName === 'IMG') this._hideGifImages([node]);
          else if (node.querySelectorAll) {
            this._hideGifImages(node.querySelectorAll('img'));
          }
        }
      }
    });

    this._gifObserver.observe(document.documentElement, {
      childList: true, subtree: true,
    });
  }

  _stopGifObserver() {
    if (this._gifObserver) {
      this._gifObserver.disconnect();
      this._gifObserver = null;
    }
  }

  _hideGifImages(imgs) {
    for (const img of imgs) {
      const src = (img.src || img.dataset?.src || '').toLowerCase();
      if (src.includes('.gif')) {
        img.style.visibility = 'hidden';
        img.setAttribute('data-cozy-hidden', '');
      }
    }
  }

  _restoreGifs() {
    const hidden = document.querySelectorAll('[data-cozy-hidden]');
    for (const el of hidden) {
      el.style.visibility = '';
      el.removeAttribute('data-cozy-hidden');
    }
  }

  _pauseAutoplayMedia() {
    const media = document.querySelectorAll('video[autoplay], audio[autoplay]');
    for (const el of media) {
      el.pause();
      el.removeAttribute('autoplay');
    }
  }

  _startAutoplayObserver() {
    if (this._autoplayObserver) return;
    if (!document.body) {
      document.addEventListener('DOMContentLoaded', () => this._startAutoplayObserver(), { once: true });
      return;
    }

    this._autoplayObserver = new MutationObserver((mutations) => {
      let hasNew = false;
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          if ((node.tagName === 'VIDEO' || node.tagName === 'AUDIO') && node.autoplay) hasNew = true;
          if (node.querySelectorAll) {
            if (node.querySelectorAll('video[autoplay], audio[autoplay]').length) hasNew = true;
          }
        }
      }
      if (hasNew) {
        clearTimeout(this._debounceTimer);
        const epoch = this._epoch;
        this._debounceTimer = setTimeout(() => {
          if (this._epoch !== epoch) return;
          requestAnimationFrame(() => {
            if (this._epoch !== epoch) return;
            this._pauseAutoplayMedia();
          });
        }, 150);
      }
    });

    this._autoplayObserver.observe(document.body, { childList: true, subtree: true });
  }

  _stopAutoplayObserver() {
    if (this._autoplayObserver) {
      this._autoplayObserver.disconnect();
      this._autoplayObserver = null;
    }
    clearTimeout(this._debounceTimer);
  }
}
