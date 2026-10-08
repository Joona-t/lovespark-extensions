'use strict';

/**
 * RulerAgent — Two-overlay reading ruler in closed Shadow DOM.
 *
 * Architecture:
 *   Two full-viewport overlays (top shade + bottom shade) with a clear gap between
 *   them that follows the cursor. Positions via transform:translateY (GPU-composited).
 *
 * Top overlay:    position:fixed; top:0; height:100vh  → translateY shifts it so
 *                 its bottom edge = gapTop (cursor - halfGap)
 *
 * Bottom overlay: position:fixed; top:0; height:100vh  → translateY shifts it so
 *                 its top edge = gapBottom (cursor + halfGap)
 *
 * Performance:
 *   - rAF loop only runs while animating (stopped at epsilon convergence)
 *   - will-change:transform on overlays (pre-promoted GPU layers)
 *   - Lerp smoothing factor: 0.15 default, 0.35 for keyboard, 1.0 for reduced-motion
 *
 * Input:
 *   - Mouse (mousemove) + Touch (touchmove) set target Y
 *   - Shift+ArrowUp / Shift+ArrowDown: move ruler 20px (Shift avoids stealing scroll)
 *   - Escape: disable ruler
 *
 * DOM owned: Single Shadow DOM host element with closed root
 */

class RulerAgent {
  constructor(bus) {
    this._bus = bus;
    this._host = null;
    this._shadow = null;
    this._topOverlay = null;
    this._bottomOverlay = null;
    this._enabled = false;
    this._settings = { height: 80, opacity: 0.5, color: '#000000', smoothing: 0.15 };

    // Animation state
    this._targetY = 0;
    this._currentY = 0;
    this._animFrameId = null;
    this._isKeyboard = false;
    this._reducedMotion = false;

    // Bound handlers
    this._onMouseMove = this._handleMouseMove.bind(this);
    this._onTouchMove = this._handleTouchMove.bind(this);
    this._onKeyDown = this._handleKeyDown.bind(this);
    this._onVisibilityChange = this._handleVisibility.bind(this);
  }

  init() {
    this._bus.on(MSG.SETTINGS_UPDATED, (s) => this._onSettings(s));
    this._bus.on(MSG.DESTROY_ALL, () => this.destroy());

    // Check reduced motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    this._reducedMotion = mq.matches;
    mq.addEventListener('change', (e) => { this._reducedMotion = e.matches; });
  }

  _onSettings(settings) {
    if (!settings || !settings.enabled || !settings.ruler || !settings.ruler.enabled) {
      this.disable();
      return;
    }

    const ruler = settings.ruler;
    this._settings = {
      height:    typeof ruler.height === 'number' ? ruler.height : 80,
      opacity:   typeof ruler.opacity === 'number' ? ruler.opacity : 0.5,
      color:     typeof ruler.color === 'string' ? ruler.color : '#000000',
      smoothing: typeof ruler.smoothing === 'number' ? ruler.smoothing : 0.15,
    };

    if (!this._enabled) {
      this.enable();
    } else {
      this._updateShadeColor();
    }
  }

  enable() {
    if (this._enabled) return;
    this._enabled = true;

    this._createDOM();
    this._currentY = window.innerHeight / 2;
    this._targetY = this._currentY;
    this._updateOverlayPositions(this._currentY);

    document.addEventListener('mousemove', this._onMouseMove, { passive: true });
    document.addEventListener('touchmove', this._onTouchMove, { passive: true });
    document.addEventListener('keydown', this._onKeyDown);
    document.addEventListener('visibilitychange', this._onVisibilityChange);
  }

  disable() {
    if (!this._enabled) return;
    this._enabled = false;

    document.removeEventListener('mousemove', this._onMouseMove);
    document.removeEventListener('touchmove', this._onTouchMove);
    document.removeEventListener('keydown', this._onKeyDown);
    document.removeEventListener('visibilitychange', this._onVisibilityChange);

    this._stopAnimation();
    this._removeDOM();
  }

  destroy() {
    this.disable();
  }

  // ── DOM ──────────────────────────────────────────────────────────────────────

  _createDOM() {
    if (this._host) return;

    this._host = document.createElement('div');
    this._host.setAttribute('data-lovespark-agent', 'RulerAgent');
    this._shadow = this._host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      :host {
        all: initial !important;
        position: fixed !important;
        inset: 0 !important;
        z-index: 2147483647 !important;
        pointer-events: none !important;
      }
      .shade {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100vh;
        pointer-events: none;
        will-change: transform;
        contain: layout style;
      }
    `;

    this._topOverlay = document.createElement('div');
    this._topOverlay.className = 'shade';

    this._bottomOverlay = document.createElement('div');
    this._bottomOverlay.className = 'shade';

    this._shadow.appendChild(style);
    this._shadow.appendChild(this._topOverlay);
    this._shadow.appendChild(this._bottomOverlay);

    this._updateShadeColor();
    document.documentElement.appendChild(this._host);
  }

  _removeDOM() {
    if (this._host) {
      this._host.remove();
      this._host = null;
      this._shadow = null;
      this._topOverlay = null;
      this._bottomOverlay = null;
    }
  }

  _updateShadeColor() {
    if (!this._topOverlay) return;
    const bg = this._hexToRgba(this._settings.color, this._settings.opacity);
    this._topOverlay.style.background = bg;
    this._bottomOverlay.style.background = bg;
  }

  _hexToRgba(hex, alpha) {
    if (!hex || typeof hex !== 'string' || hex.length < 7 || hex[0] !== '#') {
      return `rgba(0, 0, 0, ${alpha || 0.5})`;
    }
    const r = parseInt(hex.slice(1, 3), 16) || 0;
    const g = parseInt(hex.slice(3, 5), 16) || 0;
    const b = parseInt(hex.slice(5, 7), 16) || 0;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  // ── Input handlers ───────────────────────────────────────────────────────────

  _handleMouseMove(e) {
    this._targetY = e.clientY;
    this._isKeyboard = false;
    this._startAnimation();
  }

  _handleTouchMove(e) {
    if (e.touches.length > 0) {
      this._targetY = e.touches[0].clientY;
      this._isKeyboard = false;
      this._startAnimation();
    }
  }

  _handleKeyDown(e) {
    if (!this._enabled) return;

    if (e.key === 'Escape') {
      this._bus.emit(MSG.FEATURE_TOGGLED, { feature: 'ruler', enabled: false });
      return;
    }

    // Shift+Arrow to avoid stealing normal scroll
    if (!e.shiftKey) return;

    const step = 20;
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      this._targetY = Math.max(0, this._targetY - step);
      this._isKeyboard = true;
      this._startAnimation();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      this._targetY = Math.min(window.innerHeight, this._targetY + step);
      this._isKeyboard = true;
      this._startAnimation();
    }
  }

  _handleVisibility() {
    if (document.hidden) {
      this._stopAnimation();
    } else {
      // Snap to target on return (no jarring lerp catch-up)
      this._currentY = this._targetY;
      this._updateOverlayPositions(this._currentY);
    }
  }

  // ── Animation ────────────────────────────────────────────────────────────────

  _startAnimation() {
    if (this._animFrameId !== null) return;

    const animate = () => {
      if (!this._enabled) {
        this._animFrameId = null;
        return;
      }

      const diff = this._targetY - this._currentY;

      // Epsilon check — stop loop when converged
      if (Math.abs(diff) < 0.5) {
        this._currentY = this._targetY;
        this._updateOverlayPositions(this._currentY);
        this._animFrameId = null;
        return;
      }

      // Smoothing factor: snap for reduced-motion, faster for keyboard
      let factor;
      if (this._reducedMotion) {
        factor = 1.0;
      } else if (this._isKeyboard) {
        factor = 0.35;
      } else {
        factor = this._settings.smoothing;
      }

      this._currentY += diff * factor;
      this._updateOverlayPositions(this._currentY);

      this._animFrameId = requestAnimationFrame(animate);
    };

    this._animFrameId = requestAnimationFrame(animate);
  }

  _stopAnimation() {
    if (this._animFrameId !== null) {
      cancelAnimationFrame(this._animFrameId);
      this._animFrameId = null;
    }
  }

  /**
   * Position overlays to create a clear gap centered on y.
   *
   * Both overlays: position:fixed; top:0; height:100vh
   *   → natural range: 0 to viewportHeight
   *
   * Top shade: shift UP so bottom edge = gapTop
   *   → translateY(gapTop - vh)
   *
   * Bottom shade: shift DOWN so top edge = gapBottom
   *   → translateY(gapBottom)
   */
  _updateOverlayPositions(y) {
    if (!this._topOverlay || !this._bottomOverlay) return;

    const halfGap = this._settings.height / 2;
    const gapTop = y - halfGap;
    const gapBottom = y + halfGap;
    const vh = window.innerHeight;

    // Top shade: bottom edge at gapTop
    this._topOverlay.style.transform = `translateY(${gapTop - vh}px)`;

    // Bottom shade: top edge at gapBottom
    this._bottomOverlay.style.transform = `translateY(${gapBottom}px)`;
  }
}
