# VAL-ERROR-001: Popup failures are truthful, accessible, and retryable

Surface: browser.
Needs: corrupt stored-map fixture; injected runtime/storage get/set rejection; existing stored note and unsaved text.
Behavior: failed note load/save/delete, export, restore, or enable-state persistence produces a durable `aria-live` error and never a success status. Failure preserves user-entered text and all stored data, leaves controls in a safe state, reverts a toggle that was not persisted, and permits a later successful retry without reopening the extension.
Evidence: popup integration rejection matrix with all-storage before/after snapshots, visible status/control assertions, a fresh browser corrupt-storage observation, and successful retry evidence.
Fail: silent rejection, optimistic success, cleared unsaved text, stale enabled state, unsafe controls, mutated data, transient error disappearing before user action, or reload required to recover.
