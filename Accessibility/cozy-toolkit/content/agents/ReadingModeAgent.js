'use strict';

class ReadingModeAgent {
  constructor(bus) {
    this._bus = bus;
    this._enabled = false;
    this._host = null;
    this._shadow = null;
  }

  init() {
    this._bus.on(MSG.DESTROY_ALL, () => this.destroy());
  }

  apply(settings) {
    if (!settings || !settings.enabled || !settings.readingMode || !settings.readingMode.enabled) {
      this.disable();
      return;
    }

    if (this._enabled) return;

    this._enabled = true;
    const rm = settings.readingMode;

    const content = this._extractContent();
    if (!content) {
      this.disable();
      return;
    }

    this._host = document.createElement('div');
    this._host.setAttribute('data-cozy-agent', 'ReadingModeAgent');
    this._shadow = this._host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial !important;
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483645 !important;
        overflow-y: auto !important;
        background: ${rm.bgColor || '#FFF8F0'} !important;
      }
      .reading-container {
        max-width: ${rm.maxWidth || 680}px;
        margin: 40px auto;
        padding: 32px;
        font-family: 'Georgia', serif;
        font-size: 18px;
        line-height: 1.8;
        color: #333;
      }
      .reading-container img { max-width: 100%; height: auto; }
      .reading-close {
        position: fixed;
        top: 16px;
        right: 16px;
        background: #E8457C;
        color: white;
        border: none;
        border-radius: 8px;
        padding: 8px 16px;
        font-size: 14px;
        cursor: pointer;
        z-index: 1;
      }
      .reading-close:hover { background: #D63466; }
      @media (prefers-reduced-motion: reduce) {
        .reading-close { transition: none; }
      }
    `;

    const container = document.createElement('div');
    container.className = 'reading-container';

    // Safe content insertion: clone the source element's children
    const sourceEl = this._getSourceElement();
    if (sourceEl) {
      const clone = sourceEl.cloneNode(true);
      // Remove scripts from cloned content
      const scripts = clone.querySelectorAll('script, style, iframe');
      for (const s of scripts) s.remove();
      while (clone.firstChild) {
        container.appendChild(clone.firstChild);
      }
    }

    const closeBtn = document.createElement('button');
    closeBtn.className = 'reading-close';
    closeBtn.textContent = '\u2715 Close';
    closeBtn.addEventListener('click', () => {
      this._bus.emit(MSG.FEATURE_TOGGLED, { feature: 'readingMode', enabled: false });
    });

    this._shadow.appendChild(style);
    this._shadow.appendChild(closeBtn);
    this._shadow.appendChild(container);

    document.documentElement.appendChild(this._host);
    document.documentElement.setAttribute('data-cozy-reading-mode', '');
  }

  _getSourceElement() {
    return document.querySelector('article')
      || document.querySelector('[role="main"]')
      || document.querySelector('main')
      || this._findLargestBlock();
  }

  _extractContent() {
    const el = this._getSourceElement();
    return el ? true : false;
  }

  _findLargestBlock() {
    const candidates = document.querySelectorAll('div, section');
    let best = null;
    let bestLen = 0;

    for (const el of candidates) {
      const text = el.textContent?.trim() || '';
      if (text.length > bestLen && text.length > 200) {
        best = el;
        bestLen = text.length;
      }
    }

    return best;
  }

  disable() {
    if (!this._enabled) return;
    this._enabled = false;

    if (this._host) {
      this._host.remove();
      this._host = null;
      this._shadow = null;
    }
    document.documentElement.removeAttribute('data-cozy-reading-mode');
  }

  destroy() { this.disable(); }
}
