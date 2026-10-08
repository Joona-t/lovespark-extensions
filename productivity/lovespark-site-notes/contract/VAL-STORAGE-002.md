# VAL-STORAGE-002: Serialized writes recover from storage failures

Surface: data.
Needs: controllable asynchronous storage mock with get/set rejection and interleaving.
Behavior: concurrent saves/deletes are serialized without lost unrelated-host updates. A rejected get or set is returned as failure, leaves prior storage intact, and does not poison the queue; a later valid mutation succeeds.
Evidence: deterministic interleaving traces, rejected Promise results, complete pre/post snapshots, and subsequent-operation success.
Fail: lost update, claimed success after rejection, partial write, unhandled rejection, or permanently rejected queue.

