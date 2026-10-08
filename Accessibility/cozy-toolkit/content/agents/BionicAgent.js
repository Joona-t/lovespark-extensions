'use strict';

class BionicAgent {
  constructor(bus) {
    this._bus = bus;
    this._enabled = false;
    this._intensity = 2;
    this._observer = null;
    this._styleEl = null;
  }

  init() {
    this._bus.on(MSG.DESTROY_ALL, () => this.destroy());
  }

  apply(settings) {
    if (!settings || !settings.enabled || !settings.bionic || !settings.bionic.enabled) {
      this.disable();
      return;
    }

    const newIntensity = settings.bionic.intensity || 2;
    const intensityChanged = this._intensity !== newIntensity;
    this._intensity = newIntensity;

    if (this._enabled && intensityChanged) {
      this._revert();
    }

    this._enabled = true;
    this._ensureStyle();
    this._processBody();
    this._startObserver();
  }

  disable() {
    if (!this._enabled) return;
    this._enabled = false;
    this._stopObserver();
    this._revert();
    if (this._styleEl) {
      this._styleEl.remove();
      this._styleEl = null;
    }
  }

  destroy() { this.disable(); }

  _ensureStyle() {
    if (this._styleEl) return;
    this._styleEl = document.createElement('style');
    this._styleEl.id = 'cozy-bionic-style';
    this._styleEl.setAttribute('data-cozy-agent', 'BionicAgent');
    this._styleEl.textContent = 'b.cozy-bionic { font-weight: 700 !important; }';
    (document.head || document.documentElement).appendChild(this._styleEl);
  }

  _processBody() {
    if (!document.body) return;
    this._processSubtree(document.body);
  }

  _processSubtree(root) {
    const SKIP_TAGS = new Set([
      'SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'SELECT', 'CODE', 'PRE',
      'KBD', 'SAMP', 'SVG', 'MATH', 'NOSCRIPT', 'IFRAME',
    ]);

    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          const parent = node.parentElement;
          if (!parent) return NodeFilter.FILTER_REJECT;
          if (parent.closest('[data-cozy-agent]')) return NodeFilter.FILTER_REJECT;
          if (parent.closest('.cozy-bionic')) return NodeFilter.FILTER_REJECT;
          if (parent.hasAttribute('data-cozy-bionic-parent')) return NodeFilter.FILTER_REJECT;
          if (SKIP_TAGS.has(parent.tagName)) return NodeFilter.FILTER_REJECT;
          if (parent.isContentEditable) return NodeFilter.FILTER_REJECT;
          if (node.textContent.trim().length < 2) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    const textNodes = [];
    let node;
    while ((node = walker.nextNode())) {
      textNodes.push(node);
    }

    for (let i = textNodes.length - 1; i >= 0; i--) {
      this._processTextNode(textNodes[i]);
    }
  }

  _processTextNode(textNode) {
    const text = textNode.textContent;
    if (!text || text.trim().length < 2) return;

    const frag = document.createDocumentFragment();
    const parts = text.split(/(\b\w+\b)/);

    let hasBionic = false;

    for (const part of parts) {
      if (/^\w+$/.test(part) && part.length >= 2) {
        const boldLen = this._getBoldLength(part.length);
        if (boldLen > 0 && boldLen < part.length) {
          const b = document.createElement('b');
          b.className = 'cozy-bionic';
          b.textContent = part.slice(0, boldLen);
          frag.appendChild(b);
          frag.appendChild(document.createTextNode(part.slice(boldLen)));
          hasBionic = true;
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      } else {
        frag.appendChild(document.createTextNode(part));
      }
    }

    if (hasBionic && textNode.parentNode) {
      textNode.parentNode.setAttribute('data-cozy-bionic-parent', '');
      textNode.parentNode.replaceChild(frag, textNode);
    }
  }

  _getBoldLength(wordLen) {
    if (wordLen < 2) return 0;

    switch (this._intensity) {
      case 1:
        if (wordLen <= 4) return 1;
        if (wordLen <= 8) return 2;
        return 3;
      case 2:
        return Math.max(1, Math.min(Math.ceil(wordLen * 0.4), wordLen - 1));
      case 3:
        return Math.max(2, Math.min(Math.ceil(wordLen * 0.6), wordLen - 1));
      default:
        return Math.max(1, Math.min(Math.ceil(wordLen * 0.4), wordLen - 1));
    }
  }

  _revert() {
    const bolds = document.querySelectorAll('b.cozy-bionic');
    const parents = new Set();

    for (const b of bolds) {
      const parent = b.parentNode;
      if (!parent) continue;
      parents.add(parent);
      const text = document.createTextNode(b.textContent);
      parent.replaceChild(text, b);
    }

    for (const parent of parents) {
      if (parent.isConnected) {
        parent.normalize();
        parent.removeAttribute('data-cozy-bionic-parent');
      }
    }
  }

  _startObserver() {
    if (this._observer || !document.body) return;

    this._observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        for (const node of m.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.closest('[data-cozy-agent]')) continue;
          if (node.classList?.contains('cozy-bionic')) continue;
          if (node.hasAttribute?.('data-cozy-bionic-parent')) continue;
          requestAnimationFrame(() => {
            if (this._enabled) this._processSubtree(node);
          });
        }
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
  }
}
