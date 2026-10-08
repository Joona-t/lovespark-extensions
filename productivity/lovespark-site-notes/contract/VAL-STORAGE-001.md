# VAL-STORAGE-001: Legacy storage and exact boundaries fail closed

Surface: data.
Needs: valid legacy map plus invalid type, prototype-key, hostname, value, and boundary fixtures.
Behavior: the legacy hostname-to-string map remains compatible. Notes are accepted at <=10,000 UTF-16 code units, maps at <=1,000 own entries and <=1,000,000 aggregate code units, and only when their complete version-1 UTF-8 backup serialization remains <=5,000,000 bytes; supported keys are canonical HTTP(S) hostnames. Any corrupt or over-limit stored map makes CRUD/export fail without modifying any storage key, while a valid restore may replace it.
Evidence: minus-one/equal/plus-one domain-module and worker tests including escaped/four-byte Unicode, own-property checks, and complete before/after storage snapshots for rejection and recovery.
Fail: implicit coercion, prototype-derived entries, silent deletion/repair, partial mutation, or accepting an exceeded inclusive limit.
