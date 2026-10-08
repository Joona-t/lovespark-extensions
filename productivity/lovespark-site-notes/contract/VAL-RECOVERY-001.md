# VAL-RECOVERY-001: Backup export is local, versioned, and round-trippable

Surface: artifact and browser.
Needs: canonical Unicode/multiline notes and Chromium download access.
Behavior: user-requested export downloads plaintext JSON with format `lovespark-site-notes-backup`, version `1`, a valid ISO `exportedAt`, and a canonical notes map; note admission guarantees its UTF-8 size is <=5,000,000 bytes, and parsing it reproduces every note exactly without changing storage or transmitting data.
Evidence: generated-file schema/size inspection, exact round-trip tests including escaped/four-byte Unicode, note-admission overflow rejection, annotated browser download observation, storage snapshot, and request log.
Fail: missing disclosure, lossy text, nondeterministic note ordering, storage mutation, remote request, or schema/size violation.
