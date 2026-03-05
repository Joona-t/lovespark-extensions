'use strict';

class WritingAgent {
  constructor(bus) {
    this._bus = bus;
    this._enabled = false;
    this._styleEl = null;
  }

  init() {
    this._bus.on(MSG.DESTROY_ALL, () => this.destroy());
  }

  apply(settings) {
    if (!settings || !settings.enabled || !settings.writing || !settings.writing.enabled) {
      this.disable();
      return;
    }

    this._enabled = true;
    const w = settings.writing;

    if (!this._styleEl) {
      this._styleEl = document.createElement('style');
      this._styleEl.id = 'cozy-writing-comfort';
      this._styleEl.setAttribute('data-cozy-agent', 'WritingAgent');
      (document.head || document.documentElement).appendChild(this._styleEl);
    }

    const rules = [];
    const formSelector = `
      input[type="text"], input[type="search"], input[type="email"],
      input[type="url"], input[type="password"], input:not([type]),
      textarea, [contenteditable="true"]`.trim();

    if (w.fontInForms) {
      const fontFamily = settings.typography?.enabled
        ? this._getFontFamily(settings.typography.family)
        : "'OpenDyslexic', sans-serif";

      rules.push(`${formSelector} {
        font-family: ${fontFamily} !important;
        font-size: 16px !important;
        line-height: 1.6 !important;
      }`);
    }

    if (w.spacingInForms) {
      rules.push(`${formSelector} {
        letter-spacing: 0.05em !important;
        word-spacing: 0.15em !important;
      }`);
    }

    this._styleEl.textContent = rules.join('\n');
  }

  _getFontFamily(name) {
    const map = {
      'OpenDyslexic': "'OpenDyslexic', sans-serif",
      'Lexend': "'Lexend', sans-serif",
      'Atkinson Hyperlegible': "'Atkinson Hyperlegible', sans-serif",
      'system': 'system-ui, sans-serif',
    };
    return map[name] || map['OpenDyslexic'];
  }

  disable() {
    if (!this._enabled) return;
    this._enabled = false;
    if (this._styleEl) {
      this._styleEl.remove();
      this._styleEl = null;
    }
  }

  destroy() { this.disable(); }
}
