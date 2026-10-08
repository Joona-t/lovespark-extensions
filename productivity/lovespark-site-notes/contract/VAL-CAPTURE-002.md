# VAL-CAPTURE-002: Hostname-scoped CRUD persists and stays isolated

Surface: browser and data.
Needs: two controllable HTTP(S) hostnames and an initially empty store.
Behavior: host A supports create, popup reopen/read, edit, popup reopen/read, and persistent delete; host B remains unchanged; HTTP and HTTPS URLs with the same canonical hostname resolve to the same note. Each absent-to-non-empty transition increments today and total exactly once; edit and delete do not increment, while recreate after delete increments once.
Evidence: worker integration transition and counter matrix plus fresh browser steps with storage snapshots and popup status/screenshots.
Fail: a success status before storage completion, lost state after reopen, cross-host leakage, wrong create/edit/delete/recreate counter delta, or deletion that reappears.
