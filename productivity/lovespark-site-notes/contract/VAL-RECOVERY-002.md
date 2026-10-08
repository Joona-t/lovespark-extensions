# VAL-RECOVERY-002: Restore validates fully before atomic replacement

Surface: browser and data.
Needs: valid, corrupt, unsupported-version, over-limit, conflict, cancel, and storage-rejection fixtures.
Behavior: restore checks the <=5,000,000-byte limit before parsing, validates every schema field and note, shows the replacement count and explicit confirmation, then changes only `siteNotes` in one successful write. Cancel, validation failure, paused state, or write rejection preserves every storage key; a later valid restore succeeds.
Evidence: popup cancellation/confirmation observations; one-write trace; full before/after snapshots for every fixture; imported-count status and post-restore reads.
Fail: parse-before-size-check, partial/extra-key writes, unconfirmed overwrite, accepted unknown version/invalid entry, false success, or poisoned recovery after failure.
