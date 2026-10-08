# VAL-PRIVACY-001: Notes remain local behind a truthful access boundary

Surface: browser and other.
Needs: popup-style and content-script-style message senders; Chromium trusted-context API and Firefox-compatible fallback.
Behavior: notes, hostnames, and backup contents are processed transiently only inside authorized popup/worker contexts, persisted only in `storage.local` or a user-requested plaintext local download, never logged, collected, or transmitted remotely. Note/backup messages accept only the exact popup extension page, content-script-style callers are rejected, trusted-context storage restriction is applied where supported, and manifest disclosure states local storage with no collection or transmission.
Evidence: sender authorization tests, access-level call assertion, manifest/source scan for persistence/logging/network boundaries, and browser network-request observation during note and backup actions.
Fail: content-script proxy access, sync/remote/logged note data, missing plaintext warning, false no-storage disclosure, or unsupported-browser crash.
