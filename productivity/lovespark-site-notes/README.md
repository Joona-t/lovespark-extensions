# LoveSpark Site Notes

Attach one private, local note to each website hostname. Site Notes uses the temporary `activeTab` permission only when you open the popup and stores notes in `chrome.storage.local`; it does not transmit note data.

## Recovery and privacy

- **Download backup** creates a versioned plaintext JSON file. Keep it private.
- **Restore backup** validates the complete file and asks before replacing notes.
- Pausing keeps read/export available but blocks save, delete, and restore.
- Notes are limited to 10,000 characters; the store and backup have additional fail-closed size/count limits documented in `ARCHITECTURE-PLAN.md`.

## Verify

```sh
node --test tests/site-notes.test.js
node --check lib/site-notes-store.js
node --check background.js
node --check popup.js
python3 -m json.tool manifest.json >/dev/null
```

No build or dependency install is required. Load this directory unpacked in a Chromium browser for the real-popup smoke test.
