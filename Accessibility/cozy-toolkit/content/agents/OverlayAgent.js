'use strict';

class OverlayAgent {
  constructor(bus) {
    this._bus = bus;
    this._tintEl = null;
    this._filterStyleEl = null;
    this._svgFilterEl = null;
    this._enabled = false;
  }

  init() {
    this._bus.on(MSG.DESTROY_ALL, () => this.destroy());
  }

  apply(settings) {
    if (!settings || !settings.enabled || !settings.overlay || !settings.overlay.enabled) {
      this.disable();
      return;
    }

    this._enabled = true;
    const o = settings.overlay;

    // Tint overlay
    if (o.tintColor && o.tintOpacity > 0) {
      this._ensureTint(o.tintColor, o.tintOpacity);
    } else {
      this._removeTint();
    }

    // Color blindness simulation (must be set before _applyFilters)
    if (o.colorFilter && o.colorFilter !== 'none') {
      this._applyCVDFilter(o.colorFilter);
    } else {
      this._removeCVDFilter();
    }

    // CSS filters (brightness, contrast, temperature, CVD)
    this._applyFilters(o);
  }

  disable() {
    if (!this._enabled) return;
    this._enabled = false;
    this._removeTint();
    this._removeFilters();
    this._removeCVDFilter();
  }

  destroy() { this.disable(); }

  _ensureTint(color, opacity) {
    if (!this._tintEl) {
      this._tintEl = document.createElement('div');
      this._tintEl.setAttribute('data-cozy-agent', 'OverlayAgent');
      this._tintEl.setAttribute('data-cozy', 'tint-overlay');
      this._tintEl.style.cssText =
        'position:fixed;inset:0;pointer-events:none;z-index:2147483640;transition:opacity 0.3s ease;';
      document.documentElement.appendChild(this._tintEl);
    }
    this._tintEl.style.background = color;
    this._tintEl.style.opacity = Math.min(opacity, 0.5);
  }

  _removeTint() {
    if (this._tintEl) {
      this._tintEl.remove();
      this._tintEl = null;
    }
  }

  _applyFilters(o) {
    const parts = [];

    if (o.brightness !== undefined && o.brightness !== 1.0) {
      parts.push(`brightness(${o.brightness})`);
    }
    if (o.contrast !== undefined && o.contrast !== 1.0) {
      parts.push(`contrast(${o.contrast})`);
    }
    if (o.temperature !== undefined && o.temperature !== 0) {
      if (o.temperature > 0) {
        parts.push(`sepia(${(o.temperature * 0.3).toFixed(2)})`);
      } else {
        parts.push(`hue-rotate(${Math.round(o.temperature * 30)}deg)`);
      }
    }

    if (this._svgFilterEl) {
      parts.push('url(#cozy-cvd-filter)');
    }

    if (parts.length === 0) {
      this._removeFilters();
      return;
    }

    if (!this._filterStyleEl) {
      this._filterStyleEl = document.createElement('style');
      this._filterStyleEl.id = 'cozy-filter-style';
      this._filterStyleEl.setAttribute('data-cozy-agent', 'OverlayAgent');
      (document.head || document.documentElement).appendChild(this._filterStyleEl);
    }

    this._filterStyleEl.textContent = `html { filter: ${parts.join(' ')} !important; }`;
  }

  _removeFilters() {
    if (this._filterStyleEl) {
      this._filterStyleEl.remove();
      this._filterStyleEl = null;
    }
  }

  _applyCVDFilter(type) {
    const matrices = {
      protanopia:   '0.567, 0.433, 0, 0, 0,  0.558, 0.442, 0, 0, 0,  0, 0.242, 0.758, 0, 0,  0, 0, 0, 1, 0',
      deuteranopia: '0.625, 0.375, 0, 0, 0,  0.7, 0.3, 0, 0, 0,  0, 0.3, 0.7, 0, 0,  0, 0, 0, 1, 0',
      tritanopia:   '0.95, 0.05, 0, 0, 0,  0, 0.433, 0.567, 0, 0,  0, 0.475, 0.525, 0, 0,  0, 0, 0, 1, 0',
    };

    const matrix = matrices[type];
    if (!matrix) return;

    const SVG_NS = 'http://www.w3.org/2000/svg';

    if (!this._svgFilterEl) {
      this._svgFilterEl = document.createElementNS(SVG_NS, 'svg');
      this._svgFilterEl.setAttribute('data-cozy-agent', 'OverlayAgent');
      this._svgFilterEl.style.cssText = 'position:absolute;width:0;height:0;overflow:hidden;';

      const defs = document.createElementNS(SVG_NS, 'defs');
      const filter = document.createElementNS(SVG_NS, 'filter');
      filter.setAttribute('id', 'cozy-cvd-filter');

      const feColorMatrix = document.createElementNS(SVG_NS, 'feColorMatrix');
      feColorMatrix.setAttribute('type', 'matrix');
      feColorMatrix.setAttribute('values', matrix);

      filter.appendChild(feColorMatrix);
      defs.appendChild(filter);
      this._svgFilterEl.appendChild(defs);

      document.documentElement.appendChild(this._svgFilterEl);
    } else {
      const fe = this._svgFilterEl.querySelector('feColorMatrix');
      if (fe) fe.setAttribute('values', matrix);
    }
  }

  _removeCVDFilter() {
    if (this._svgFilterEl) {
      this._svgFilterEl.remove();
      this._svgFilterEl = null;
    }
  }
}
