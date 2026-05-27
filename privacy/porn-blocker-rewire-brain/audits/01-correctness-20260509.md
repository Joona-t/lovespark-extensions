# Rewire Brain — Correctness Audit

**Date:** 2026-05-09
**Lens:** General correctness — logic errors, edge cases, race conditions, error handling
**Verdict:** **WARNINGS** (no P0s; 3 P1s, 5 P2s)

---

## P1 — Important Bugs (will be hit in normal use)

### P1-1: Journal entries accumulate duplicates per day
**File:** `background.js:313` / `dashboard.js:98`

`SAVE_JOURNAL_ENTRY` unconditionally pushes a new object on every save without deduplicating by date. `dashboard.js:98` uses `entries.find(e => e.date === today)` which returns the FIRST match (oldest). User saves N times → array has N entries for the date → re-opening dashboard pre-fills with the oldest, not latest.

**Fix:**
```js
const idx = entries.findIndex(e => e.date === date);
if (idx !== -1) entries[idx] = newEntry;
else entries.push(newEntry);
```

### P1-2: `updateStreak()` runs after SITE_BLOCKED storage write — XP response is stale
**File:** `background.js:175-177`

`SITE_BLOCKED`:
1. `await chrome.storage.local.set(updates)` (block XP)
2. `await updateStreak()` (may add +10 streak XP, or +110 milestone)
3. `return { ..., xp: updates.xp || data.xp || 0 }` ← stale by 10-110

XP toast on blocked.js shows wrong value immediately after a block.

**Fix:** Re-read xp after `updateStreak()`, or have updateStreak return the new xp.

### P1-3: UTC date mismatch for non-UTC users
**File:** `background.js:574-576`

`toDateStr(iso)` returns UTC date (`new Date(iso).toISOString().split('T')[0]`). `scheduleJournalReminder` uses local clock. Result: users outside UTC who journal late at night may store entries under the previous UTC date string, breaking dashboard "today's entry" lookup and streak counting.

**Fix:** Make `toDateStr` produce local-date strings:
```js
function toDateStr(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
```

---

## P2 — Edge Cases

### P2-1: image-blur-main.js busy-poll loop (up to 5s)
**File:** `image-blur-main.js:13-16`
On Twitter/DDG (CSP rejects link element), polling never resolves and runs full 5s timeout each navigation. Adds jank.
**Fix:** Use CustomEvent signaling instead of polling.

### P2-2: content.js 500ms timeout removes hide-style EVEN when block IS detected
**File:** `content.js:49-51`
If response arrives at 400ms with `blocked: true`, the timeout still fires at 500ms and removes the style → flash of blocked content.
**Fix:**
```js
let responded = false;
// In sendMessage callback: responded = true
setTimeout(() => { if (!responded && style.parentNode) style.remove(); }, 1500);
```

### P2-3: SITE_BLOCKED streak reset doesn't reset `streakDays: 0`
**File:** `background.js:161-163`
Gap detection sets `streakStartDate: today` but not `streakDays: 0`. `updateStreak()` corrects it on the next line, but a brief inconsistent state exists between the two writes.
**Fix:** Add `updates.streakDays = 0` on line 162.

### P2-4: countdownInterval not cleared on bypass-confirm
**File:** `blocked.js:231-245`
Defensive hygiene; not a real bug but leak risk if event timing races.
**Fix:** Add `if (countdownInterval) clearInterval(countdownInterval);` at top of `bypassConfirm` click handler.

### P2-5: Empty catch swallowing image-blur errors silently
**File:** `image-blur.js:51-53`
`catch {}` hides extension-context-invalidated errors. Lifetime blur count underreports if extension reloads mid-session.
**Fix:** At minimum add a comment; better — check `chrome.runtime.lastError` in callback.

---

## Verified Non-Issues

- Alarm replacement behavior — same-name alarms replace cleanly (no stacking)
- `normalizeDomain` regex — `\-` in char class is literal hyphen, valid
- XSS in blocked.js — all DOM writes use `.textContent`, `rel="noopener noreferrer"` set
- `isValidUrl` — correctly gates http/https only
- MV3 SW lifecycle — no setInterval, alarms idempotent, no in-memory state assumptions

---

## Action items for Phase 4

| # | ID | Severity | Item |
|---|------|----------|------|
| C-1 | P1-1 | HIGH | Journal upsert by date instead of push |
| C-2 | P1-2 | HIGH | Re-read XP after updateStreak in SITE_BLOCKED |
| C-3 | P1-3 | HIGH | Local-date `toDateStr` |
| C-4 | P2-1 | MED | CustomEvent signal in image-blur (replace busy poll) |
| C-5 | P2-2 | MED | content.js: responded flag + 1500ms timeout |
| C-6 | P2-3 | LOW | Add `streakDays: 0` to gap branch in SITE_BLOCKED |
| C-7 | P2-4 | LOW | clearInterval in bypassConfirm |
| C-8 | P2-5 | LOW | Comment / lastError check in image-blur catch |
