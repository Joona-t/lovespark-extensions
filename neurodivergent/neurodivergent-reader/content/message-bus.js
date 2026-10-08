'use strict';

/**
 * MessageBus — lightweight typed event system for inter-agent communication.
 * Uses EventTarget internally. All agents subscribe here; no direct agent-to-agent calls.
 *
 * Handler map is keyed by type → (original → wrapped), so off() works correctly
 * even when the same callback is registered for multiple message types.
 */

const MSG = Object.freeze({
  SETTINGS_UPDATED:    'SETTINGS_UPDATED',
  FEATURE_TOGGLED:     'FEATURE_TOGGLED',
  DESTROY_ALL:         'DESTROY_ALL',
});

class MessageBus {
  constructor() {
    this._target = new EventTarget();
    // Map<string, Map<Function, Function>> — type → (original → wrapped)
    this._handlers = new Map();
  }

  emit(type, data) {
    this._target.dispatchEvent(new CustomEvent(type, { detail: data }));
  }

  on(type, callback) {
    const wrapped = (e) => callback(e.detail);

    if (!this._handlers.has(type)) {
      this._handlers.set(type, new Map());
    }
    this._handlers.get(type).set(callback, wrapped);

    this._target.addEventListener(type, wrapped);
  }

  off(type, callback) {
    const typeMap = this._handlers.get(type);
    if (!typeMap) return;

    const wrapped = typeMap.get(callback);
    if (wrapped) {
      this._target.removeEventListener(type, wrapped);
      typeMap.delete(callback);
    }
  }
}
