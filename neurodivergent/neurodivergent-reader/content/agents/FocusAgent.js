'use strict';

/**
 * FocusAgent — Paragraph focus with box-shadow vmax dimming.
 *
 * Detection: ancestor traversal to find paragraph-like containers
 * Dimming:   box-shadow: 0 0 0 100vmax rgba(0,0,0,dimLevel) on focused element
 * Locking:   click-to-lock pins focus on a paragraph
 * Navigation: j/k moves between paragraphs, Escape unlocks
 *
 * DOM owned: <style id="nr-focus-styles"> for dynamic dim level
 * Classes:   .nr-focused on the currently focused element
 *
 * Edge cases handled:
 *   - Stale DOM refs: checks isConnected before using cached elements
 *   - offsetParent null for fixed/sticky: uses getComputedStyle visibility check
 *   - rAF-based mouseover throttle (true frame-aligned)
 *   - Input fields excluded from j/k capture
 */

class FocusAgent {
  constructor(bus) {
    this._bus = bus;
    this._enabled = false;
    this._settings = { dimLevel: 0.7, lockOnClick: true };
    this._styleEl = null;
    this._focusedEl = null;
    this._locked = false;
    this._paragraphs = [];
    this._paragraphsDirty = true;

    this._onMouseOver = this._handleMouseOver.bind(this);
    this._onClick = this._handleClick.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._pendingHover = null;

    // MutationObserver to invalidate paragraph cache on DOM changes
    this._observer = null;
  }

  init() {
    this._bus.on(MSG.SETTINGS_UPDATED, (s) => this._onSettings(s));
    this._bus.on(MSG.DESTROY_ALL, () => this.destroy());
  }

  _onSettings(settings) {
    if (!settings || !settings.enabled || !settings.focus || !settings.focus.enabled) {
      this.disable();
      return;
    }

    this._settings = settings.focus;
    if (!this._enabled) {
      this.enable();
    } else {
      this._updateFocusStyle();
    }
  }

  enable() {
    if (this._enabled) return;
    this._enabled = true;

    this._injectStyles();
    this._paragraphsDirty = true;

    document.addEventListener('mouseover', this._onMouseOver, { passive: true });
    document.addEventListener('click', this._onClick, true);
    document.addEventListener('keydown', this._onKeyDown);

    this._startObserver();
  }

  disable() {
    if (!this._enabled) return;
    this._enabled = false;

    this._clearFocus();
    this._stopObserver();

    document.removeEventListener('mouseover', this._onMouseOver);
    document.removeEventListener('click', this._onClick, true);
    document.removeEventListener('keydown', this._onKeyDown);

    if (this._styleEl) {
      this._styleEl.remove();
      this._styleEl = null;
    }

    this._paragraphs = [];
    this._pendingHover = null;
  }

  destroy() {
    this.disable();
  }

  // ── DOM Observer (invalidates paragraph cache) ───────────────────────────────

  _startObserver() {
    if (this._observer || !document.body) return;

    this._observer = new MutationObserver(() => {
      this._paragraphsDirty = true;

      // Check if focused element was removed from DOM
      if (this._focusedEl && !this._focusedEl.isConnected) {
        this._clearFocus();
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

  // ── Styles ───────────────────────────────────────────────────────────────────

  _injectStyles() {
    if (this._styleEl) return;

    this._styleEl = document.createElement('style');
    this._styleEl.id = 'nr-focus-styles';
    this._styleEl.setAttribute('data-lovespark-agent', 'FocusAgent');
    this._updateFocusStyle();
    (document.head || document.documentElement).appendChild(this._styleEl);
  }

  _updateFocusStyle() {
    if (!this._styleEl) return;
    const dim = typeof this._settings.dimLevel === 'number' ? this._settings.dimLevel : 0.7;

    this._styleEl.textContent = `
      .nr-focused {
        position: relative !important;
        z-index: 9999 !important;
        box-shadow: 0 0 0 100vmax rgba(0, 0, 0, ${dim}) !important;
        transition: box-shadow 0.3s ease !important;
      }

      @media (prefers-reduced-motion: reduce) {
        .nr-focused {
          transition: none !important;
        }
      }
    `;
  }

  // ── Input Handlers ───────────────────────────────────────────────────────────

  _handleMouseOver(e) {
    if (this._locked) return;

    // rAF-based throttle (true frame-aligned, no setTimeout drift)
    if (this._pendingHover !== null) return;
    this._pendingHover = requestAnimationFrame(() => {
      this._pendingHover = null;
      if (this._locked || !this._enabled) return;

      const target = e.target;
      if (!target || !target.isConnected) return;

      const paragraph = this._findParagraph(target);
      if (paragraph && paragraph.isConnected && paragraph !== this._focusedEl) {
        this._setFocus(paragraph);
      }
    });
  }

  _handleClick(e) {
    if (!this._settings.lockOnClick) return;

    // Ignore clicks on extension UI
    if (e.target.closest && e.target.closest('[data-lovespark-agent]')) return;

    const paragraph = this._findParagraph(e.target);

    // Click outside any paragraph = unlock
    if (!paragraph) {
      if (this._locked) {
        this._locked = false;
      }
      return;
    }

    if (this._locked && paragraph === this._focusedEl) {
      this._locked = false;
    } else {
      this._setFocus(paragraph);
      this._locked = true;
    }
  }

  _handleKeyDown(e) {
    if (!this._enabled) return;

    if (e.key === 'Escape') {
      if (this._locked) {
        this._locked = false;
      } else {
        this._bus.emit(MSG.FEATURE_TOGGLED, { feature: 'focus', enabled: false });
      }
      return;
    }

    // j/k navigation between paragraphs
    if (e.key === 'j' || e.key === 'k') {
      // Don't capture if user is typing
      const tag = e.target.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || e.target.isContentEditable) return;

      e.preventDefault();
      this._ensureParagraphs();
      const idx = this._paragraphs.indexOf(this._focusedEl);
      let next;

      if (e.key === 'j') {
        next = idx < this._paragraphs.length - 1 ? this._paragraphs[idx + 1] : this._paragraphs[0];
      } else {
        next = idx > 0 ? this._paragraphs[idx - 1] : this._paragraphs[this._paragraphs.length - 1];
      }

      if (next) {
        this._setFocus(next);
        this._locked = true;
        next.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }

  // ── Paragraph Detection ──────────────────────────────────────────────────────

  _findParagraph(target) {
    let el = target;
    while (el && el !== document.body) {
      if (el.hasAttribute && el.hasAttribute('data-lovespark-agent')) return null;

      const tag = el.tagName ? el.tagName.toLowerCase() : '';
      if (['p', 'blockquote', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'pre'].includes(tag)) {
        return el;
      }
      // Text-heavy divs count as paragraphs
      if (tag === 'div') {
        const children = el.childNodes;
        for (let i = 0; i < children.length; i++) {
          if (children[i].nodeType === 3 && children[i].textContent.trim().length > 20) {
            return el;
          }
        }
      }
      el = el.parentElement;
    }
    return null;
  }

  _ensureParagraphs() {
    if (!this._paragraphsDirty && this._paragraphs.length > 0) return;

    this._paragraphs = Array.from(
      document.querySelectorAll('p, blockquote, li, h1, h2, h3, h4, h5, h6, pre')
    ).filter((el) => {
      // Visibility check that handles fixed/sticky positioning (offsetParent is null for fixed)
      if (!this._isVisible(el)) return false;
      return el.textContent.trim().length > 10;
    });
    this._paragraphsDirty = false;
  }

  _isVisible(el) {
    // offsetParent is null for: hidden elements, fixed position, and <body>/<html>
    // So we can't rely on it alone for fixed-position elements
    if (el.offsetParent !== null) return true;

    // Check computed style for fixed/sticky (which have null offsetParent but are visible)
    const style = window.getComputedStyle(el);
    if (style.display === 'none' || style.visibility === 'hidden') return false;
    if (style.position === 'fixed' || style.position === 'sticky') return true;

    return false;
  }

  // ── Focus Management ─────────────────────────────────────────────────────────

  _setFocus(el) {
    this._clearFocus();
    this._focusedEl = el;
    el.classList.add('nr-focused');
  }

  _clearFocus() {
    if (this._focusedEl) {
      // Safe: only remove class if element is still in DOM
      if (this._focusedEl.isConnected) {
        this._focusedEl.classList.remove('nr-focused');
      }
      this._focusedEl = null;
    }
    this._locked = false;
  }
}
