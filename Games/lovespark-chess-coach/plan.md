# Plan: Universal Chess Coach Extension v1

## Summary

Create `Extensions/Games/lovespark-chess-coach/` as a popup-only MV3 LoveSpark extension for manual chess analysis. The popup accepts FEN or PGN, validates it locally, runs a local MIT-compatible engine in a worker, and shows the best move, evaluation, and a short principal variation.

## Implementation Plan

### 1. Scaffold the extension shell

- Add LoveSpark extension files:
  - `manifest.json`
  - `background.js`
  - `popup.html`
  - `popup.css`
  - `popup.js`
  - `worker.js`
  - `LICENSE`
  - `README.md`
  - `BUGS_AND_ITERATIONS.md`
- Copy in shared LoveSpark assets:
  - `lib/` shared library files
  - `mascot.png`
  - `icons/`
- Keep permissions to `storage` only.
- Include Firefox `browser_specific_settings` block.

### 2. Vendor local chess dependencies

- Vendor `chess.js` locally for FEN validation and PGN parsing.
- Vendor `Betafish` locally as the analysis engine.
- Add a small adapter layer if needed so the worker can issue one structured request and one structured response.
- Ensure all third-party code is local and MIT-compatible.

### 3. Build the popup UI

- Add LoveSpark popup shell with:
  - Sparky on the left
  - title/subtitle on the left block
  - theme dropdown on the top-right
  - `--ls-bg-gradient` page background
- Add input mode selector for `FEN` / `PGN`.
- Add labeled textarea/input area for pasted notation.
- Add one primary `Analyze` button.
- Add result card for:
  - best move SAN
  - UCI move
  - evaluation
  - principal variation
- Add inline validation/error area.
- Add compact stats row for `today` and `total`.

### 4. Wire popup behavior

- Initialize theme dropdown from shared LoveSpark library.
- Persist `lastInputMode` only.
- On `Analyze`:
  - trim input
  - validate/parse based on mode
  - derive normalized FEN
  - send `AnalysisRequest` to the worker
  - show loading state
  - render `AnalysisResult`
- Never persist pasted FEN/PGN by default.
- Increment stats only after a successful analysis result.

### 5. Implement worker analysis flow

- Accept:
  - `AnalysisRequest { inputType, inputText, movetimeMs }`
- Produce:
  - `AnalysisResult { status, normalizedFen?, bestMoveSan?, bestMoveUci?, evaluationCp?, evaluationMate?, pvSan?, errorMessage? }`
- For FEN:
  - validate and load directly
- For PGN:
  - parse PGN
  - derive final position
- Run engine search with fixed v1 budget:
  - `movetimeMs = 1200`
  - `multipv = 1`
- Convert engine move output into SAN and PV SAN against the normalized position.
- Return structured invalid-input and engine-error cases.

### 6. Add docs and packaging support

- Document usage, privacy posture, and local-only analysis in `README.md`.
- Record implementation issues/fixes in `BUGS_AND_ITERATIONS.md`.
- Set initial extension version in `manifest.json`.
- After implementation:
  - run permission audit
  - run `ls-check .`
  - run contrast audit
  - build Chrome and Firefox zips with `scripts/build-zips.sh`

## TODO Checklist

- [ ] Create extension folder structure and base files.
- [ ] Copy shared LoveSpark `lib/` assets.
- [ ] Copy `mascot.png` and base icons.
- [ ] Add MV3 `manifest.json` with `storage` only.
- [ ] Add lightweight `background.js` startup/init flow.
- [ ] Vendor `chess.js` locally.
- [ ] Vendor `Betafish` locally.
- [ ] Add worker adapter for structured analysis requests.
- [ ] Build popup HTML with LoveSpark layout and accessibility attributes.
- [ ] Build popup CSS within LoveSpark popup size constraints.
- [ ] Implement popup state, validation, worker messaging, and stats.
- [ ] Implement FEN parsing flow.
- [ ] Implement PGN parsing flow.
- [ ] Render SAN, UCI, eval, and PV output cleanly.
- [ ] Add README, LICENSE, and BUGS log.
- [ ] Run permission audit and fix any excess permissions.
- [ ] Run quality checks and contrast audit.
- [ ] Build Chrome and Firefox zip packages.

## Defaults Locked In

- Popup-only UI, no site integration in v1.
- No content scripts and no host permissions.
- Manual analysis only in v1.
- FEN and PGN are both supported.
- Output includes best move SAN, UCI move, eval, and short PV.
- Engine is local `Betafish`, not Stockfish.
- Pasted notation stays in memory only.

## Do not implement yet.
