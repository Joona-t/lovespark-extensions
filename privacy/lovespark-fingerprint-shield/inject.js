// LoveSpark Fingerprint Shield — inject.js
// MAIN world, document_start
// Adds imperceptible noise to fingerprinting APIs.
// Nothing is blocked — every API works normally, but output
// hashes change per session, defeating cross-session tracking.

(function() {
  'use strict';

  // ── Guard: prevent double-injection ─────────────────────────────────
  if (window.__loveSparkFPShield) return;
  window.__loveSparkFPShield = true;

  // ── Enabled state ───────────────────────────────────────────────────
  // Controlled by bridge.js via dataset attribute on <html>.
  // Default: enabled (attribute absent).
  function isEnabled() {
    return document.documentElement.dataset.loveSparkFpDisabled !== 'true';
  }

  // ── Seeded PRNG (mulberry32) ────────────────────────────────────────
  // One seed per page load from crypto.getRandomValues().
  // Deterministic within session — same call sequence = same output.
  // Random across sessions — new seed each time.
  // Seed is never stored; it dies with the page.

  const _seedArray = new Uint32Array(1);
  crypto.getRandomValues(_seedArray);
  let _seed = _seedArray[0];

  function mulberry32() {
    _seed |= 0;
    _seed = (_seed + 0x6D2B79F5) | 0;
    let t = Math.imul(_seed ^ (_seed >>> 15), 1 | _seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  // Noise helpers
  function noise(magnitude) {
    return (mulberry32() - 0.5) * 2 * magnitude;
  }

  function intNoise() {
    const r = mulberry32();
    if (r < 0.33) return -1;
    if (r < 0.66) return 0;
    return 1;
  }

  // ── Spoof counter ──────────────────────────────────────────────────
  let _spoofCount = 0;
  function recordSpoof() { _spoofCount++; }


  // ===================================================================
  // CATEGORY 1: Canvas 2D Fingerprinting
  // ===================================================================
  // Sites draw text/shapes to a hidden canvas, then read back pixels
  // via toDataURL() or getImageData(). The exact pixel values differ
  // per GPU/driver/font-renderer combo, producing a unique hash.
  // We add +-1 to ~2% of color channels on readback — imperceptible
  // visually but enough to change the hash every session.

  const _origToDataURL = HTMLCanvasElement.prototype.toDataURL;
  const _origToBlob = HTMLCanvasElement.prototype.toBlob;
  const _origGetImageData = CanvasRenderingContext2D.prototype.getImageData;

  function _noiseImageData(imageData) {
    const data = imageData.data;
    const len = data.length;
    for (let i = 0; i < len; i += 4) {
      if (mulberry32() < 0.02) {
        const channel = (mulberry32() * 3) | 0;
        const val = data[i + channel];
        data[i + channel] = Math.max(0, Math.min(255, val + intNoise()));
      }
    }
    return imageData;
  }

  CanvasRenderingContext2D.prototype.getImageData = function() {
    const result = _origGetImageData.apply(this, arguments);
    if (!isEnabled()) return result;
    recordSpoof();
    return _noiseImageData(result);
  };

  HTMLCanvasElement.prototype.toDataURL = function() {
    if (!isEnabled()) return _origToDataURL.apply(this, arguments);
    const ctx = this.getContext('2d');
    if (ctx) {
      try {
        const imageData = _origGetImageData.call(ctx, 0, 0, this.width, this.height);
        _noiseImageData(imageData);
        ctx.putImageData(imageData, 0, 0);
      } catch (e) {
        // SecurityError on cross-origin tainted canvas — pass through
        return _origToDataURL.apply(this, arguments);
      }
    }
    recordSpoof();
    return _origToDataURL.apply(this, arguments);
  };

  HTMLCanvasElement.prototype.toBlob = function(callback, type, quality) {
    if (!isEnabled()) return _origToBlob.apply(this, arguments);
    const ctx = this.getContext('2d');
    if (ctx) {
      try {
        const imageData = _origGetImageData.call(ctx, 0, 0, this.width, this.height);
        _noiseImageData(imageData);
        ctx.putImageData(imageData, 0, 0);
      } catch (e) {
        // Cross-origin tainted — pass through
      }
    }
    recordSpoof();
    return _origToBlob.apply(this, arguments);
  };


  // ===================================================================
  // CATEGORY 2: WebGL Fingerprinting
  // ===================================================================
  // Two vectors: (a) GPU vendor/renderer strings from debug extension,
  // (b) rendered scene pixel readback via readPixels().
  // We spoof (a) with generic strings and noise (b) the pixel data.

  const SPOOFED_VENDOR = 'Google Inc. (Intel)';
  const SPOOFED_RENDERER = 'ANGLE (Intel, Mesa Intel(R) UHD Graphics 630, OpenGL 4.6)';

  // Common desktop parameter values — reduces GPU-specific uniqueness
  const WEBGL_PARAM_OVERRIDES = {
    3379: 16384,               // MAX_TEXTURE_SIZE
    3386: [32767, 32767],      // MAX_VIEWPORT_DIMS
    34076: 16384,              // MAX_RENDERBUFFER_SIZE
    34921: 16,                 // MAX_TEXTURE_IMAGE_UNITS
    34930: 16,                 // MAX_COMBINED_TEXTURE_IMAGE_UNITS
    36347: 1024,               // MAX_FRAGMENT_UNIFORM_VECTORS
    36348: 4096                // MAX_VERTEX_UNIFORM_VECTORS
  };

  function _patchWebGL(proto) {
    const _origGetParameter = proto.getParameter;
    const _origGetExtension = proto.getExtension;
    const _origReadPixels = proto.readPixels;

    proto.getParameter = function(param) {
      if (!isEnabled()) return _origGetParameter.call(this, param);

      // Spoof GPU vendor/renderer from WEBGL_debug_renderer_info
      const ext = _origGetExtension.call(this, 'WEBGL_debug_renderer_info');
      if (ext) {
        if (param === ext.UNMASKED_VENDOR_WEBGL) {
          recordSpoof();
          return SPOOFED_VENDOR;
        }
        if (param === ext.UNMASKED_RENDERER_WEBGL) {
          recordSpoof();
          return SPOOFED_RENDERER;
        }
      }

      // Normalize GPU-specific parameter values
      if (WEBGL_PARAM_OVERRIDES[param] !== undefined) {
        recordSpoof();
        const override = WEBGL_PARAM_OVERRIDES[param];
        if (Array.isArray(override)) return new Int32Array(override);
        return override;
      }

      return _origGetParameter.call(this, param);
    };

    proto.readPixels = function() {
      _origReadPixels.apply(this, arguments);
      if (!isEnabled()) return;

      // Pixel data is the last argument (ArrayBufferView)
      const pixels = arguments[arguments.length - 1];
      if (pixels && pixels.length) {
        for (let i = 0; i < pixels.length; i += 4) {
          if (mulberry32() < 0.02) {
            const channel = (mulberry32() * 3) | 0;
            pixels[i + channel] = Math.max(0, Math.min(255,
              pixels[i + channel] + intNoise()));
          }
        }
        recordSpoof();
      }
    };
  }

  if (typeof WebGLRenderingContext !== 'undefined') {
    _patchWebGL(WebGLRenderingContext.prototype);
  }
  if (typeof WebGL2RenderingContext !== 'undefined') {
    _patchWebGL(WebGL2RenderingContext.prototype);
  }


  // ===================================================================
  // CATEGORY 3: AudioContext Fingerprinting
  // ===================================================================
  // Scripts create an OfflineAudioContext, pipe an oscillator through
  // a compressor, render, then read the output buffer. The exact
  // float sample values differ per audio stack/hardware.
  // We add noise at ~1e-7 magnitude — completely inaudible but
  // enough to change the hash.

  const _origGetChannelData = AudioBuffer.prototype.getChannelData;

  AudioBuffer.prototype.getChannelData = function(channel) {
    const data = _origGetChannelData.call(this, channel);
    if (!isEnabled()) return data;

    // Only noise small buffers typical of fingerprinting probes.
    // Real audio playback uses much larger buffers.
    if (data.length < 10000) {
      for (let i = 0; i < data.length; i++) {
        data[i] += noise(0.0000001);
      }
      recordSpoof();
    }
    return data;
  };


  // ===================================================================
  // CATEGORY 4: Font Enumeration via measureText
  // ===================================================================
  // Sites render text in a target font + fallback, then compare the
  // measured width to fallback-only rendering. If dimensions differ,
  // the font is installed. We add sub-pixel noise to measureText
  // results, making these comparisons unreliable.

  const _origMeasureText = CanvasRenderingContext2D.prototype.measureText;

  CanvasRenderingContext2D.prototype.measureText = function(text) {
    const metrics = _origMeasureText.call(this, text);
    if (!isEnabled()) return metrics;

    const noiseAmount = 0.3;
    recordSpoof();

    // Proxy the TextMetrics object to add noise to numeric properties
    return new Proxy(metrics, {
      get(target, prop) {
        const val = target[prop];
        if (typeof val === 'number') {
          return val + noise(noiseAmount);
        }
        if (typeof val === 'function') {
          return val.bind(target);
        }
        return val;
      }
    });
  };


  // ===================================================================
  // CATEGORY 5: Client Rects (DOM element dimension fingerprinting)
  // ===================================================================
  // Exact sub-pixel element dimensions vary by font rendering, OS,
  // browser version, and zoom level. Sites measure invisible probe
  // elements to build a fingerprint.

  const _origGetClientRects = Element.prototype.getClientRects;
  const _origGetBoundingClientRect = Element.prototype.getBoundingClientRect;

  function _noiseDOMRect(rect) {
    if (!isEnabled()) return rect;
    const n = 0.25;
    recordSpoof();
    return new DOMRect(
      rect.x + noise(n),
      rect.y + noise(n),
      rect.width + noise(n),
      rect.height + noise(n)
    );
  }

  Element.prototype.getBoundingClientRect = function() {
    const rect = _origGetBoundingClientRect.call(this);
    return _noiseDOMRect(rect);
  };

  Element.prototype.getClientRects = function() {
    const rects = _origGetClientRects.call(this);
    if (!isEnabled()) return rects;

    const noised = [];
    for (let i = 0; i < rects.length; i++) {
      noised.push(_noiseDOMRect(rects[i]));
    }

    // Mimic DOMRectList interface
    noised.item = function(index) { return noised[index] || null; };
    Object.defineProperty(noised, 'length', { value: noised.length });
    recordSpoof();
    return noised;
  };


  // ===================================================================
  // CATEGORY 6: Screen Properties
  // ===================================================================
  // screen.width, screen.height, screen.colorDepth, screen.pixelDepth
  // are common fingerprint signals. We snap to the nearest common
  // resolution to reduce uniqueness.

  const COMMON_WIDTHS = [1366, 1440, 1536, 1920, 2560];
  const COMMON_HEIGHTS = [768, 900, 864, 1080, 1440];

  function nearestCommon(val, common) {
    let closest = common[0];
    let minDist = Math.abs(val - closest);
    for (let i = 1; i < common.length; i++) {
      const dist = Math.abs(val - common[i]);
      if (dist < minDist) { closest = common[i]; minDist = dist; }
    }
    return closest;
  }

  const _realWidth = screen.width;
  const _realHeight = screen.height;
  const _spoofedWidth = nearestCommon(_realWidth, COMMON_WIDTHS);
  const _spoofedHeight = nearestCommon(_realHeight, COMMON_HEIGHTS);

  try {
    Object.defineProperty(Screen.prototype, 'width', {
      get() { return isEnabled() ? _spoofedWidth : _realWidth; },
      configurable: true
    });
    Object.defineProperty(Screen.prototype, 'height', {
      get() { return isEnabled() ? _spoofedHeight : _realHeight; },
      configurable: true
    });
    Object.defineProperty(Screen.prototype, 'availWidth', {
      get() { return isEnabled() ? _spoofedWidth : _realWidth; },
      configurable: true
    });
    Object.defineProperty(Screen.prototype, 'availHeight', {
      get() { return isEnabled() ? _spoofedHeight - 40 : _realHeight; },
      configurable: true
    });
    Object.defineProperty(Screen.prototype, 'colorDepth', {
      get() { return 24; },
      configurable: true
    });
    Object.defineProperty(Screen.prototype, 'pixelDepth', {
      get() { return 24; },
      configurable: true
    });
  } catch (e) {
    // Some environments may not allow redefining screen properties
  }


  // ===================================================================
  // CATEGORY 7: Hardware & Navigator Properties
  // ===================================================================

  // navigator.hardwareConcurrency — CPU core count
  const _realHC = navigator.hardwareConcurrency;
  try {
    Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', {
      get() { return isEnabled() ? 8 : _realHC; },
      configurable: true
    });
  } catch (e) {}

  // navigator.deviceMemory — RAM in GB (Chrome-only)
  const _realDM = navigator.deviceMemory;
  try {
    Object.defineProperty(Navigator.prototype, 'deviceMemory', {
      get() { return isEnabled() ? 8 : (_realDM || 8); },
      configurable: true
    });
  } catch (e) {}

  // Battery API — level + charging state = fingerprint signal
  // Return a fixed "fully charged desktop" battery.
  if (navigator.getBattery) {
    const _origGetBattery = navigator.getBattery.bind(navigator);
    navigator.getBattery = function() {
      if (!isEnabled()) return _origGetBattery();
      recordSpoof();
      return Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1.0,
        addEventListener: function() {},
        removeEventListener: function() {},
        dispatchEvent: function() { return true; }
      });
    };
  }


  // ===================================================================
  // CATEGORY 8: Media Devices
  // ===================================================================
  // enumerateDevices() reveals connected cameras, mics, speakers.
  // The count and device IDs are unique per setup.
  // Return a generic set — one device per type.

  if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
    const _origEnumerate = navigator.mediaDevices.enumerateDevices.bind(
      navigator.mediaDevices
    );

    navigator.mediaDevices.enumerateDevices = function() {
      if (!isEnabled()) return _origEnumerate();
      recordSpoof();
      return Promise.resolve([
        { deviceId: '', groupId: '', kind: 'audioinput', label: '' },
        { deviceId: '', groupId: '', kind: 'videoinput', label: '' },
        { deviceId: '', groupId: '', kind: 'audiooutput', label: '' }
      ]);
    };
  }


  // ===================================================================
  // CATEGORY 9: Date/Timezone Precision
  // ===================================================================
  // Timezone offset combined with locale can narrow down location.
  // We don't change the timezone (that would break UX), but we
  // normalize getTimezoneOffset precision and spoof
  // Intl.DateTimeFormat().resolvedOptions().timeZone is left alone
  // (changing it breaks date displays). Instead we noise the
  // performance.now() timing to defeat timing-based fingerprints.

  const _origPerformanceNow = Performance.prototype.now;

  Performance.prototype.now = function() {
    const real = _origPerformanceNow.call(this);
    if (!isEnabled()) return real;
    // Reduce precision to 100us and add small noise
    // This defeats high-resolution timer fingerprinting
    return Math.round(real * 10) / 10 + noise(0.05);
  };


  // ===================================================================
  // REPORTING: Send spoof count to isolated world
  // ===================================================================
  // Batched via requestIdleCallback to avoid performance impact.

  let _lastReportedCount = 0;

  function reportToIsolated() {
    if (_spoofCount > _lastReportedCount) {
      const delta = _spoofCount - _lastReportedCount;
      _lastReportedCount = _spoofCount;
      window.postMessage({
        __ls: 'fpSpoofed',
        count: delta
      }, '*');
    }

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(reportToIsolated, { timeout: 5000 });
    } else {
      setTimeout(reportToIsolated, 5000);
    }
  }

  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(reportToIsolated, { timeout: 2000 });
  } else {
    setTimeout(reportToIsolated, 2000);
  }

})();
