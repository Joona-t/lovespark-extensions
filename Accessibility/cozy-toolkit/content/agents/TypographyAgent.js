'use strict';

const FONT_FAMILIES = {
  'OpenDyslexic':          "'OpenDyslexic', sans-serif",
  'Lexend':                "'Lexend', sans-serif",
  'Atkinson Hyperlegible': "'Atkinson Hyperlegible', sans-serif",
  'system':                'system-ui, -apple-system, sans-serif',
};

class TypographyAgent {
  constructor(bus) {
    this._bus = bus;
    this._fontFacesEl = null;
    this._fontRulesEl = null;
    this._cssVarsEl = null;
    this._active = false;
    this._currentFamily = null;
  }

  init() {
    this._bus.on(MSG.DESTROY_ALL, () => this.destroy());
  }

  apply(settings) {
    if (!settings || !settings.enabled) {
      this.disable();
      return;
    }

    this._setActive(true);

    const typo = settings.typography || {};

    if (typo.enabled) {
      this._enableFont(typo);
    } else {
      this._disableFont();
    }

    this._applyCSSVars(typo);

    // Focus data attribute for focus-mode.css
    const html = document.documentElement;
    if (settings.focus && settings.focus.enabled) {
      html.setAttribute('data-cozy-focus', '');
    } else {
      html.removeAttribute('data-cozy-focus');
    }
  }

  _setActive(active) {
    this._active = active;
    if (active) {
      document.documentElement.setAttribute('data-cozy-active', '');
    } else {
      document.documentElement.removeAttribute('data-cozy-active');
    }
  }

  _enableFont(fontSettings) {
    const family = fontSettings.family || 'OpenDyslexic';

    this._ensureFontFaces();
    this._ensureFontRules(fontSettings);
    this._currentFamily = family;
    document.documentElement.setAttribute('data-cozy-font', family);
  }

  _disableFont() {
    this._removeFontRules();
    this._currentFamily = null;
    document.documentElement.removeAttribute('data-cozy-font');
  }

  _ensureFontFaces() {
    if (this._fontFacesEl) return;

    const style = document.createElement('style');
    style.id = 'cozy-font-faces';
    style.setAttribute('data-cozy-agent', 'TypographyAgent');

    const base = chrome.runtime.getURL('fonts/');

    style.textContent = `
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('${base}OpenDyslexic-Regular.woff') format('woff');
        font-weight: 400; font-style: normal; font-display: swap;
      }
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('${base}OpenDyslexic-Bold.woff') format('woff');
        font-weight: 700; font-style: normal; font-display: swap;
      }
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('${base}OpenDyslexic-Italic.woff') format('woff');
        font-weight: 400; font-style: italic; font-display: swap;
      }
      @font-face {
        font-family: 'OpenDyslexic';
        src: url('${base}OpenDyslexic-BoldItalic.woff') format('woff');
        font-weight: 700; font-style: italic; font-display: swap;
      }
      @font-face {
        font-family: 'Lexend';
        src: url('${base}Lexend-Regular.woff2') format('woff2');
        font-weight: 400; font-style: normal; font-display: swap;
      }
      @font-face {
        font-family: 'Lexend';
        src: url('${base}Lexend-Bold.woff2') format('woff2');
        font-weight: 700; font-style: normal; font-display: swap;
      }
      @font-face {
        font-family: 'Atkinson Hyperlegible';
        src: url('${base}AtkinsonHyperlegible-Regular.woff2') format('woff2');
        font-weight: 400; font-style: normal; font-display: swap;
      }
      @font-face {
        font-family: 'Atkinson Hyperlegible';
        src: url('${base}AtkinsonHyperlegible-Bold.woff2') format('woff2');
        font-weight: 700; font-style: normal; font-display: swap;
      }
    `;

    (document.head || document.documentElement).appendChild(style);
    this._fontFacesEl = style;
  }

  _ensureFontRules(fontSettings) {
    if (this._fontRulesEl) {
      this._fontRulesEl.remove();
    }

    const style = document.createElement('style');
    style.id = 'cozy-font-rules';
    style.setAttribute('data-cozy-agent', 'TypographyAgent');

    const family = FONT_FAMILIES[fontSettings.family] || FONT_FAMILIES['system'];

    const exclude = [
      ':not([class*="fa"])',
      ':not([class*="icon"])',
      ':not([class*="material"])',
      ':not([class*="glyphicon"])',
      ':not([class*="emoji"])',
      ':not([class*="math"])',
      ':not([class*="katex"])',
      ':not([class*="MathJax"])',
      ':not([data-cozy-agent])',
      ':not(code)',
      ':not(pre)',
      ':not(kbd)',
      ':not(samp)',
      ':not(svg)',
    ].join('');

    style.textContent = `
      html[data-cozy-font] *${exclude} {
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
      style.id = 'cozy-css-vars';
      style.setAttribute('data-cozy-agent', 'TypographyAgent');
      (document.head || document.documentElement).appendChild(style);
      this._cssVarsEl = style;
    }

    const size = typeof fontSettings.size === 'number' ? fontSettings.size : 18;
    const lh = typeof fontSettings.lineHeight === 'number' ? fontSettings.lineHeight : 1.8;
    const ls = typeof fontSettings.letterSpacing === 'number' ? fontSettings.letterSpacing : 0.05;
    const ws = typeof fontSettings.wordSpacing === 'number' ? fontSettings.wordSpacing : 0.1;
    const fw = fontSettings.weight === 'bold' ? 700 : 400;

    const exclude = ':not([class*="fa"]):not([class*="icon"]):not([class*="material"]):not([class*="glyphicon"]):not([class*="emoji"]):not([class*="math"]):not([class*="katex"]):not([class*="MathJax"]):not([data-cozy-agent]):not(code):not(pre):not(kbd):not(samp):not(svg)';

    this._cssVarsEl.textContent = `
      html[data-cozy-active] {
        --cozy-font-size: ${size}px;
        --cozy-line-height: ${lh};
        --cozy-letter-spacing: ${ls}em;
        --cozy-word-spacing: ${ws}em;
        --cozy-font-weight: ${fw};
      }

      html[data-cozy-font] *${exclude} {
        font-size: var(--cozy-font-size) !important;
        line-height: var(--cozy-line-height) !important;
        letter-spacing: var(--cozy-letter-spacing) !important;
        word-spacing: var(--cozy-word-spacing) !important;
        font-weight: var(--cozy-font-weight) !important;
      }
    `;
  }

  disable() {
    this._setActive(false);
    this._disableFont();
    document.documentElement.removeAttribute('data-cozy-focus');
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
  }
}
