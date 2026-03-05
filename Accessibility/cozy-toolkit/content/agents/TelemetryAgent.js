'use strict';

class TelemetryAgent {
  constructor(bus) {
    this._bus = bus;
    this._counters = {
      settingsUpdates: 0,
      featureToggles: 0,
      initTime: 0,
    };
    this._initStart = performance.now();
  }

  init() {
    this._counters.initTime = Math.round(performance.now() - this._initStart);

    this._bus.on(MSG.SETTINGS_UPDATED, () => {
      this._counters.settingsUpdates++;
    });

    this._bus.on(MSG.FEATURE_TOGGLED, () => {
      this._counters.featureToggles++;
    });

    this._bus.on(MSG.DESTROY_ALL, () => this.destroy());

    console.log('[Cozy TelemetryAgent] Initialized in', this._counters.initTime + 'ms');
  }

  apply() {}

  report() {
    console.table({
      'Init time (ms)': this._counters.initTime,
      'Settings updates': this._counters.settingsUpdates,
      'Feature toggles': this._counters.featureToggles,
    });
  }

  destroy() { this.report(); }
}
