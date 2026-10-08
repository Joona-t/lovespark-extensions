# Input Guard v1.0.2 — Bug Fix Plan

Extension is fully functional. 5 bugs found in audit. Plan: fix all 5, bump version.

## Changes

### 1. Fix entry key collision (BUG-1) — content.js
- Change key from `hostname + '::' + fieldId(el)` to `hostname + pathname + '::' + fieldId(el)`
- This differentiates same-structured fields on different pages
- Also update the `entry.id` to use the new key format

### 2. Exclude sensitive fields (BUG-2) — content.js
- Add check in `isTracked()` for sensitive `autocomplete` attribute values
- Excluded values: `cc-number`, `cc-csc`, `cc-exp`, `cc-exp-month`, `cc-exp-year`, `cc-name`, `cc-type`, `new-password`, `current-password`, `one-time-code`, `ssn`
- Also exclude any field inside a `<form>` with `autocomplete="off"` only if the field itself has a sensitive autocomplete value

### 3. Fix silent catch (BUG-3) — content.js
- `catch (_err) {}` → `catch (err) { console.warn('[InputGuard]', err); }`

### 4. Fix settings header font-size (BUG-4) — settings.css
- `.header-title` font-size: `18px` → `12px`

### 5. Clean up CSP (BUG-5) — manifest.json
- Remove `font-src 'self'` from CSP (MV3 ignores it)

### 6. Bump version — manifest.json + settings.html footer
- `1.0.1` → `1.0.2`

### 7. Update BUGS_AND_ITERATIONS.md
- Log all 5 fixes

## Files Modified
- `content.js` (BUG-1, BUG-2, BUG-3)
- `settings.css` (BUG-4)
- `manifest.json` (BUG-5, version bump)
- `settings.html` (version in footer)
- `BUGS_AND_ITERATIONS.md`

## Do not implement yet
