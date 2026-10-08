# Site Notes hardening plan

## Current architecture

`popup.html` and `popup.js` form the only user surface. The popup queries the active tab, then sends typed-by-convention messages to the MV3 background runtime in `background.js`. The worker derives a hostname and stores a legacy-compatible `siteNotes` object in `chrome.storage.local`; shared libraries manage install defaults, counters, badge state, and themes. There are no content scripts, host permissions, remote calls, build system, or automated tests.

## Evidence-backed problems

- Capture is not reliably reachable: the popup reads the sensitive `tabs.Tab.url` field, but the manifest declares neither `activeTab` nor a host permission. The least-privilege fix is `activeTab`, granted only when the user invokes the extension.
- Firefox cannot run the declared background today: Firefox uses `background.scripts` for Manifest V3 while the manifest declares only `service_worker`; a fallback that loads `background.js` alone would still crash because `importScripts()` is worker-only.
- Pausing is cosmetic: `isEnabled` changes the toggle and badge, while read, save, and delete messages remain accepted.
- Recovery is absent: all notes live in one local object and cannot be exported or restored.
- Storage accepts unbounded and malformed values, silently ignores failures in the popup, and is exposed to future content scripts by Chrome's default access level.
- Firefox metadata incorrectly claims the extension does not store user data; notes and hostnames are stored locally, although inspected code sends neither over the network.

## Upgrade architecture

Add a small, dependency-free `lib/site-notes-store.js` domain module shared by the background runtime and Node tests. It owns URL/hostname validation, legacy-data sanitization, note length/count limits, and a versioned backup format. Keep the existing `siteNotes` key and string values for compatibility.

The background runtime remains the only note-data writer. Chromium loads `background.js` as a service worker, which conditionally imports its dependencies; Firefox loads an ordered `background.scripts` list and skips worker-only imports. Both paths use the packaged WebExtension Promise polyfill. The runtime restricts `storage.local` to trusted extension contexts where the browser supports that API, enforces paused state and validation, serializes note mutations to avoid same-runtime lost updates, and exposes export/import messages. Import validates the complete backup before one atomic replacement write.

The popup will request `activeTab`, expose clear loading/paused/error states, enforce the same visible note limit, and add local-only Download backup and Restore backup controls. Restore requires explicit confirmation and never mutates storage when parsing or validation fails.

## Capability inventory and decisions

| Area | Accepted behavior | Evidence floor |
| --- | --- | --- |
| Active site | Chromium and Firefox use `activeTab`; ordinary HTTP(S) tabs expose a canonical hostname, while restricted/unsupported pages show a truthful unavailable state. | Manifest assertion and unpacked/temporary-addon popup smoke tests in each available browser. |
| Host-scoped CRUD | Create/read/edit/delete persists across popup reopen. HTTP and HTTPS share a hostname note; different hostnames remain isolated. | Worker integration matrix plus fresh popup steps. |
| Pause | Reading and backup export remain available. Save, delete, and restore are blocked in both popup and worker. Re-enable restores mutations. | UI state plus message-level before/after storage evidence. |
| Limits | Note length <= 10,000 UTF-16 code units, note count <= 1,000, aggregate note text <= 1,000,000 code units, and the complete version-1 UTF-8 backup serialization of every accepted store <= 5,000,000 bytes. Note admission enforces all four invariants so every valid store is exportable. | Equal-boundary and over-boundary tests, including escaped and four-byte Unicode. |
| Corrupt legacy storage | Any non-plain map, invalid hostname, non-string value, or exceeded limit makes note CRUD/export fail without mutation. A fully valid backup may still replace corrupt `siteNotes` after confirmation. | Corrupt fixtures with byte-equivalent before/after proof, followed by successful restore. |
| Backup | Format ID `lovespark-site-notes-backup`, schema version 1, ISO export time, and a canonical hostname-to-string map. Files are plaintext and the popup warns users to keep them private. | Generated artifact inspection, Unicode/multiline round trip, browser download. |
| Privacy | Notes, hostnames, and backup contents stay in local storage or a user-requested local download. Only the popup extension page may call note/backup messages. `storage.local` is set to trusted contexts when supported. Firefox metadata declares `required: ["none"]` (no collection/transmission outside the add-on or local browser), while the UI truthfully warns that notes and backups are stored locally. | Sender authorization tests, manifest/source assertions, browser request inspection. |
| Failure recovery | Storage get/set rejection is surfaced, preserves prior data, and does not poison the serialized mutation queue. | Injected rejection followed by a successful operation. |
| Counters | Each transition from no note to a non-empty note increments today and total exactly once. Edit and delete do not increment; recreate after delete is a new transition and increments once. Counter redesign is outside this mission. | Create/edit/delete/recreate integration checks. |

Implementation ownership is intentionally singular: one Site Notes implementation task owns completion of all nine `VAL-*` assertions across the tightly coupled store, worker, and popup. The independent final validation task owns no implementation assertion.

## Scope and non-goals

In scope: ordinary HTTP(S) pages, one note per hostname, existing stored-note compatibility, capture/read/edit/delete, pause enforcement, local backup/restore, quota/corruption errors, minimal permissions, and reproducible automated verification.

Out of scope: URL-path-specific notes, sync/cloud storage, encryption-at-rest beyond browser-profile protections, publication, store submission, remote services, and unrelated shared-library changes.

## Measurable success criteria

- On an invoked popup for an ordinary HTTP(S) page, its hostname is available under the least-privilege `activeTab` grant and a note can be read, saved, edited, and deleted.
- When paused, note editing controls are disabled and worker mutations fail closed without changing stored notes; re-enabling restores access.
- Exact boundary limits in the inventory are enforced. Malformed stored data, unsupported URLs, and invalid/oversized backups are rejected with user-visible errors rather than silent loss or partial writes.
- A version-1 JSON backup round-trips Unicode/multiline notes; a confirmed restore replaces notes atomically, while a corrupt backup leaves existing data byte-equivalent.
- Note, hostname, and backup data remains local and is never transmitted; explicit footer navigation is not treated as note-data transmission. `storage.local` is restricted to trusted contexts where supported.
- Static checks, domain-module tests, background integration tests, manifest assertions, and a real-browser popup smoke test pass in Chromium. Firefox's ordered background fallback is temporarily loaded and exercised when the installed Firefox harness permits automation; any unavailable interaction or network evidence is reported explicitly rather than inferred.
