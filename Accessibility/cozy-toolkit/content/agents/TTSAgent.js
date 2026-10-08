'use strict';

class TTSAgent {
  constructor(bus) {
    this._bus = bus;
    this._enabled = false;
    this._settings = { speed: 1.0, voice: '', highlightMode: 'sentence' };
    this._host = null;
    this._shadow = null;
    this._fabEl = null;
    this._toolbarEl = null;
    this._pauseBtn = null;
    this._speedLabel = null;
    this._utterance = null;
    this._isPlaying = false;
    this._selectedText = '';
    this._onSelectionChange = this._handleSelectionChange.bind(this);
    this._onFabClick = this._handleFabClick.bind(this);
  }

  init() {
    this._bus.on(MSG.DESTROY_ALL, () => this.destroy());
  }

  apply(settings) {
    if (!settings || !settings.enabled || !settings.tts || !settings.tts.enabled) {
      this.disable();
      return;
    }

    this._enabled = true;
    this._settings = settings.tts;

    if (!this._host) {
      this._createDOM();
    }

    if (this._speedLabel) {
      this._speedLabel.textContent = `${this._settings.speed}x`;
    }

    document.addEventListener('selectionchange', this._onSelectionChange);
  }

  disable() {
    if (!this._enabled) return;
    this._enabled = false;
    this._stop();
    this._removeDOM();
    document.removeEventListener('selectionchange', this._onSelectionChange);
  }

  destroy() { this.disable(); }

  _createDOM() {
    this._host = document.createElement('div');
    this._host.setAttribute('data-cozy-agent', 'TTSAgent');
    this._shadow = this._host.attachShadow({ mode: 'closed' });

    const style = document.createElement('style');
    style.textContent = `
      :host { all: initial !important; }

      .cozy-tts-fab {
        position: fixed;
        display: none;
        z-index: 2147483646;
        background: #E8457C;
        color: white;
        border: none;
        border-radius: 20px;
        padding: 6px 14px;
        font-family: -apple-system, sans-serif;
        font-size: 13px;
        cursor: pointer;
        box-shadow: 0 2px 12px rgba(232, 69, 124, 0.4);
        transition: opacity 0.2s;
        pointer-events: auto;
      }
      .cozy-tts-fab:hover { background: #D63466; }

      .cozy-tts-toolbar {
        position: fixed;
        bottom: 20px;
        left: 50%;
        transform: translateX(-50%);
        display: none;
        z-index: 2147483646;
        background: rgba(30, 30, 30, 0.95);
        color: white;
        border-radius: 12px;
        padding: 8px 16px;
        font-family: -apple-system, sans-serif;
        font-size: 13px;
        gap: 12px;
        align-items: center;
        box-shadow: 0 4px 20px rgba(0,0,0,0.3);
        pointer-events: auto;
      }

      .cozy-tts-toolbar button {
        background: none;
        border: none;
        color: white;
        font-size: 18px;
        cursor: pointer;
        padding: 4px 8px;
        border-radius: 6px;
      }
      .cozy-tts-toolbar button:hover { background: rgba(255,255,255,0.15); }

      .cozy-tts-speed { font-size: 11px; color: rgba(255,255,255,0.7); }

      @media (prefers-reduced-motion: reduce) {
        .cozy-tts-fab, .cozy-tts-toolbar { transition: none; }
      }
    `;

    // FAB
    this._fabEl = document.createElement('button');
    this._fabEl.className = 'cozy-tts-fab';
    this._fabEl.textContent = '\u{1F50A} Read aloud';
    this._fabEl.setAttribute('aria-label', 'Read aloud');
    this._fabEl.addEventListener('click', this._onFabClick);

    // Toolbar
    this._toolbarEl = document.createElement('div');
    this._toolbarEl.className = 'cozy-tts-toolbar';

    this._pauseBtn = document.createElement('button');
    this._pauseBtn.textContent = '\u23F8';
    this._pauseBtn.title = 'Pause/Resume';
    this._pauseBtn.addEventListener('click', () => this._togglePause());

    const stopBtn = document.createElement('button');
    stopBtn.textContent = '\u23F9';
    stopBtn.title = 'Stop';
    stopBtn.addEventListener('click', () => this._stop());

    this._speedLabel = document.createElement('span');
    this._speedLabel.className = 'cozy-tts-speed';
    this._speedLabel.textContent = `${this._settings.speed}x`;

    this._toolbarEl.appendChild(this._pauseBtn);
    this._toolbarEl.appendChild(stopBtn);
    this._toolbarEl.appendChild(this._speedLabel);

    this._shadow.appendChild(style);
    this._shadow.appendChild(this._fabEl);
    this._shadow.appendChild(this._toolbarEl);

    document.documentElement.appendChild(this._host);
  }

  _removeDOM() {
    if (this._host) {
      this._host.remove();
      this._host = null;
      this._shadow = null;
      this._fabEl = null;
      this._toolbarEl = null;
      this._pauseBtn = null;
      this._speedLabel = null;
    }
  }

  _handleSelectionChange() {
    const sel = window.getSelection();
    const text = sel?.toString().trim();

    if (!text || text.length < 2) {
      if (this._fabEl) this._fabEl.style.display = 'none';
      return;
    }

    this._selectedText = text;

    try {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();

      if (this._fabEl) {
        this._fabEl.style.display = 'block';
        this._fabEl.style.top = `${rect.bottom + 8}px`;
        this._fabEl.style.left = `${rect.left}px`;
      }
    } catch (err) { console.warn('[agents] unknown:', err); }
  }

  _handleFabClick() {
    if (!this._selectedText) return;
    this._fabEl.style.display = 'none';
    this._speak(this._selectedText);
  }

  _speak(text) {
    this._stop();

    this._utterance = new SpeechSynthesisUtterance(text);
    this._utterance.rate = this._settings.speed || 1.0;

    if (this._settings.voice) {
      const voices = speechSynthesis.getVoices();
      const match = voices.find(v => v.name === this._settings.voice);
      if (match) this._utterance.voice = match;
    }

    this._utterance.onend = () => {
      this._isPlaying = false;
      if (this._toolbarEl) this._toolbarEl.style.display = 'none';
      if (this._pauseBtn) this._pauseBtn.textContent = '\u23F8';
    };

    this._isPlaying = true;
    if (this._toolbarEl) this._toolbarEl.style.display = 'flex';
    if (this._pauseBtn) this._pauseBtn.textContent = '\u23F8';

    speechSynthesis.speak(this._utterance);
  }

  _togglePause() {
    if (speechSynthesis.paused) {
      speechSynthesis.resume();
      if (this._pauseBtn) this._pauseBtn.textContent = '\u23F8';
    } else {
      speechSynthesis.pause();
      if (this._pauseBtn) this._pauseBtn.textContent = '\u25B6';
    }
  }

  _stop() {
    speechSynthesis.cancel();
    this._isPlaying = false;
    if (this._toolbarEl) this._toolbarEl.style.display = 'none';
    if (this._pauseBtn) this._pauseBtn.textContent = '\u23F8';
  }
}
