'use strict';

/**
 * TelemetryAgent — Local-only performance counters.
 * Never sends data anywhere. Console output only.
 *
 * Tracks:
 *   - Observer callback count (DistractionAgent)
 *   - rAF frame times (RulerAgent)
 *   - Settings update count
 *   - Feature toggle count
 */

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

    console.log('[NR TelemetryAgent] Initialized in', this._counters.initTime + 'ms');
  }

  report() {
    console.table({
      'Init time (ms)': this._counters.initTime,
      'Settings updates': this._counters.settingsUpdates,
      'Feature toggles': this._counters.featureToggles,
    });
  }

  destroy() {
    this.report();
  }
}
