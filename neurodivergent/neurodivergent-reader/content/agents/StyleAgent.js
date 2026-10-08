'use strict';

/**
 * StyleAgent — Generates/applies CSS variables, toggles root data attributes,
 * inserts @font-face blocks for multiple font families (all bundled locally).
 *
 * Supported fonts:
 *   - OpenDyslexic     (bundled .woff, heavy-bottomed letters)
 *   - Lexend           (bundled .woff2, research-backed reading improvement)
 *   - Atkinson Hyperlegible (bundled .woff2, max letter distinction by Braille Institute)
 *   - system           (browser/OS default)
 *
 * DOM owned:
 *   <style id="nr-font-faces">     — @font-face for OpenDyslexic
 *   <style id="nr-web-fonts">      — @font-face for Lexend / Atkinson Hyperlegible
 *   <style id="nr-font-rules">     — font override rules
 *   <style id="nr-css-vars">       — CSS custom properties
 *
 * Attributes set on documentElement:
 *   data-nr-active        — master switch
 *   data-nr-font          — font override active (value = font family name)
 *   data-nr-distractions  — distraction hiding active
 *   data-nr-focus         — paragraph focus active
 */

// Font family CSS values keyed by settings name
const FONT_FAMILIES = {
  'OpenDyslexic':          "'OpenDyslexic', sans-serif",
  'Lexend':                "'Lexend', sans-serif",
  'Atkinson Hyperlegible': "'Atkinson Hyperlegible', sans-serif",
  'system':                'system-ui, -apple-system, sans-serif',
};

// Bundled font file names for Atkinson Hyperlegible and Lexend (privacy-first, no CDN)
const BUNDLED_WEB_FONTS = {
  'Atkinson Hyperlegible': [
    { file: 'atkinson-hyperlegible-400-normal-latin.woff2', weight: 400, style: 'normal', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
    { file: 'atkinson-hyperlegible-400-normal-latin-ext.woff2', weight: 400, style: 'normal', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' },
    { file: 'atkinson-hyperlegible-700-normal-latin.woff2', weight: 700, style: 'normal', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
    { file: 'atkinson-hyperlegible-700-normal-latin-ext.woff2', weight: 700, style: 'normal', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' },
    { file: 'atkinson-hyperlegible-400-italic-latin.woff2', weight: 400, style: 'italic', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
    { file: 'atkinson-hyperlegible-400-italic-latin-ext.woff2', weight: 400, style: 'italic', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' },
    { file: 'atkinson-hyperlegible-700-italic-latin.woff2', weight: 700, style: 'italic', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
    { file: 'atkinson-hyperlegible-700-italic-latin-ext.woff2', weight: 700, style: 'italic', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' },
  ],
  'Lexend': [
    { file: 'lexend-300-latin.woff2', weight: 300, style: 'normal', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
    { file: 'lexend-300-latin-ext.woff2', weight: 300, style: 'normal', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' },
    { file: 'lexend-400-latin.woff2', weight: 400, style: 'normal', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
    { file: 'lexend-400-latin-ext.woff2', weight: 400, style: 'normal', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' },
    { file: 'lexend-500-latin.woff2', weight: 500, style: 'normal', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
    { file: 'lexend-500-latin-ext.woff2', weight: 500, style: 'normal', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' },
    { file: 'lexend-700-latin.woff2', weight: 700, style: 'normal', range: 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+0304, U+0308, U+0329, U+2000-206F, U+20AC, U+2122, U+2191, U+2193, U+2212, U+2215, U+FEFF, U+FFFD' },
    { file: 'lexend-700-latin-ext.woff2', weight: 700, style: 'normal', range: 'U+0100-02BA, U+02BD-02C5, U+02C7-02CC, U+02CE-02D7, U+02DD-02FF, U+0304, U+0308, U+0329, U+1D00-1DBF, U+1E00-1E9F, U+1EF2-1EFF, U+2020, U+20A0-20AB, U+20AD-20C0, U+2113, U+2C60-2C7F, U+A720-A7FF' },
  ],
};

class StyleAgent {
  constructor(bus) {
    this._bus = bus;
    this._fontFacesEl = null;
    this._webFontsEl = null;
    this._fontRulesEl = null;
    this._cssVarsEl = null;
    this._active = false;
    this._currentFamily = null;
  }

  init() {
    this._bus.on(MSG.SETTINGS_UPDATED, (s) => this._onSettings(s));
    this._bus.on(MSG.DESTROY_ALL, () => this.destroy());
  }

  _onSettings(settings) {
    if (!settings || !settings.enabled) {
      this.disable();
      return;
    }

    this._setActive(true);

    const fo = settings.fontOverride || {};

    // Font override
    if (fo.enabled) {
      this._enableFont(fo);
    } else {
      this._disableFont();
    }

    // CSS variables for typography
    this._applyCSSVars(fo);

    // Focus data attribute for focus-mode.css
    const html = document.documentElement;
    if (settings.focus && settings.focus.enabled) {
      html.setAttribute('data-nr-focus', '');
    } else {
      html.removeAttribute('data-nr-focus');
    }
  }

  _setActive(active) {
    this._active = active;
    if (active) {
      document.documentElement.setAttribute('data-nr-active', '');
    } else {
      document.documentElement.removeAttribute('data-nr-active');
    }
  }

  _enableFont(fontSettings) {
    const family = fontSettings.family || 'OpenDyslexic';

    // Load the appropriate font source
    if (family === 'OpenDyslexic') {
      this._ensureOpenDyslexicFaces();
    }
    if (family === 'Lexend' || family === 'Atkinson Hyperlegible') {
      this._ensureWebFonts();
    }

    this._ensureFontRules(fontSettings);
    this._currentFamily = family;
    document.documentElement.setAttribute('data-nr-font', family);
  }

  _disableFont() {
    this._removeFontRules();
    this._currentFamily = null;
    document.documentElement.removeAttribute('data-nr-font');
  }

  _ensureOpenDyslexicFaces() {
    if (this._fontFacesEl) return;

    const style = document.createElement('style');
    style.id = 'nr-font-faces';
    style.setAttribute('data-lovespark-agent', 'StyleAgent');

    const base = (typeof chrome !== 'undefined' && chrome.runtime)
      ? chrome.runtime.getURL('fonts/')
      : '../fonts/';

    style.textContent = `
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('${base}OpenDyslexic-Regular.woff') format('woff');
        font-weight: 400;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('${base}OpenDyslexic-Bold.woff') format('woff');
        font-weight: 700;
        font-style: normal;
        font-display: swap;
      }
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('${base}OpenDyslexic-Italic.woff') format('woff');
        font-weight: 400;
        font-style: italic;
        font-display: swap;
      }
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('${base}OpenDyslexic-BoldItalic.woff') format('woff');
        font-weight: 700;
        font-style: italic;
        font-display: swap;
      }
    `;

    (document.head || document.documentElement).appendChild(style);
    this._fontFacesEl = style;
  }

  _ensureWebFonts() {
    if (this._webFontsEl) return;

    const style = document.createElement('style');
    style.id = 'nr-web-fonts';
    style.setAttribute('data-lovespark-agent', 'StyleAgent');

    const base = (typeof chrome !== 'undefined' && chrome.runtime)
      ? chrome.runtime.getURL('fonts/')
      : '../fonts/';

    let css = '';
    for (const [family, faces] of Object.entries(BUNDLED_WEB_FONTS)) {
      for (const face of faces) {
        css += `
      @font-face {
        font-family: '${family}';
        src: url('${base}${face.file}') format('woff2');
        font-weight: ${face.weight};
        font-style: ${face.style};
        font-display: swap;
        unicode-range: ${face.range};
      }`;
      }
    }

    style.textContent = css;
    (document.head || document.documentElement).appendChild(style);
    this._webFontsEl = style;
  }

  _ensureFontRules(fontSettings) {
    if (this._fontRulesEl) {
      this._fontRulesEl.remove();
    }

    const style = document.createElement('style');
    style.id = 'nr-font-rules';
    style.setAttribute('data-lovespark-agent', 'StyleAgent');

    const family = FONT_FAMILIES[fontSettings.family] || FONT_FAMILIES['system'];

    // Exclude icon fonts, code blocks, emoji, math, and SVG elements
    const exclude = [
      ':not([class*="fa"])',
      ':not([class*="icon"])',
      ':not([class*="material"])',
      ':not([class*="glyphicon"])',
      ':not([class*="emoji"])',
      ':not([class*="math"])',
      ':not([class*="katex"])',
      ':not([class*="MathJax"])',
      ':not([data-lovespark-agent])',
      ':not(code)',
      ':not(pre)',
      ':not(kbd)',
      ':not(samp)',
      ':not(svg)',
    ].join('');

    style.textContent = `
      html[data-nr-font] *${exclude} {
        font-family: ${family} !important;
      }
    `;

    (document.head || document.documentElement).appendChild(style);
    this._fontRulesEl = style;
  }

  _removeFontRules() {
    if (this._fontRulesEl) {
      this._fontRulesEl.remove();
      this._fontRulesEl = null;
    }
  }

  _applyCSSVars(fontSettings) {
    if (!this._cssVarsEl) {
      const style = document.createElement('style');
      style.id = 'nr-css-vars';
      style.setAttribute('data-lovespark-agent', 'StyleAgent');
      (document.head || document.documentElement).appendChild(style);
      this._cssVarsEl = style;
    }

    // Safe defaults for missing fields
    const size = typeof fontSettings.size === 'number' ? fontSettings.size : 18;
    const lh = typeof fontSettings.lineHeight === 'number' ? fontSettings.lineHeight : 1.8;
    const ls = typeof fontSettings.letterSpacing === 'number' ? fontSettings.letterSpacing : 0.05;
    const ws = typeof fontSettings.wordSpacing === 'number' ? fontSettings.wordSpacing : 0.1;

    const exclude = ':not([class*="fa"]):not([class*="icon"]):not([class*="material"]):not([class*="glyphicon"]):not([class*="emoji"]):not([class*="math"]):not([class*="katex"]):not([class*="MathJax"]):not([data-lovespark-agent]):not(code):not(pre):not(kbd):not(samp):not(svg)';

    this._cssVarsEl.textContent = `
      html[data-nr-active] {
        --nr-font-size: ${size}px;
        --nr-line-height: ${lh};
        --nr-letter-spacing: ${ls}em;
        --nr-word-spacing: ${ws}em;
      }

      html[data-nr-font] *${exclude} {
        font-size: var(--nr-font-size) !important;
        line-height: var(--nr-line-height) !important;
        letter-spacing: var(--nr-letter-spacing) !important;
        word-spacing: var(--nr-word-spacing) !important;
      }
    `;
  }

  disable() {
    this._setActive(false);
    this._disableFont();
    document.documentElement.removeAttribute('data-nr-focus');
    if (this._cssVarsEl) {
      this._cssVarsEl.remove();
      this._cssVarsEl = null;
    }
  }

  destroy() {
    this.disable();
    if (this._fontFacesEl) {
      this._fontFacesEl.remove();
      this._fontFacesEl = null;
    }
    if (this._webFontsEl) {
      this._webFontsEl.remove();
      this._webFontsEl = null;
    }
  }
}
