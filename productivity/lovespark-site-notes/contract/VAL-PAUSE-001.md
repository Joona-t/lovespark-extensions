# VAL-PAUSE-001: Pause is enforced and reversible

Surface: browser and data.
Needs: an existing note and enabled extension.
Behavior: pausing leaves note read and backup export available, disables popup edit/save/delete/restore controls, and makes worker save/delete/restore reject without changing storage. Re-enabling restores those controls and successful mutation.
Evidence: UI disabled-state observations; per-message allow/deny tests with all-storage before/after snapshots; re-enable mutation proof.
Fail: cosmetic-only pause, changed note data while paused, blocked read/export, or inability to resume.

