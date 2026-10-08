# Research: Universal Chess Coach Extension v1

## Product Intent

- Build a Chrome-first LoveSpark extension that can be opened from the toolbar on any page.
- V1 is a manual training tool, not a site-integrated live assistant.
- User pastes either FEN or PGN into the popup, gets a locally computed best move, evaluation, and short line.

## Repo Constraints

- New extension location is confirmed: `Extensions/Games/lovespark-chess-coach/`.
- This is a non-trivial feature, so `research.md` and `plan.md` must exist before any code.
- LoveSpark UI rules apply:
  - Sparky must be visible in the popup.
  - Use `--ls-bg-gradient` as the background.
  - Popup must keep the theme dropdown in the top-right.
  - Interactive controls need 32px minimum touch targets.
  - Popup layout must stay stable at 320px and 360px widths.
- MIT licensing is a repo-level requirement.
- Manifest patch version must be bumped whenever the extension changes after implementation starts.

## Extension Architecture Findings

- Existing LoveSpark game/productivity extensions use a simple MV3 shape:
  - `manifest.json`
  - `background.js`
  - `popup.html`, `popup.css`, `popup.js`
  - `mascot.png`
  - `icons/`
  - `lib/` shared LoveSpark assets
- The shared LoveSpark library already provides:
  - theme dropdown styles and behavior
  - popup animation helpers
  - stats helpers
  - shared base CSS and fonts
- `scripts/build-zips.sh` creates both Chrome and Firefox zips from an extension folder.
- `scripts/audit-permissions.sh` verifies declared permissions against actual API usage.

## Permission / Policy Shape

- V1 does not need site access.
- V1 does not need content scripts.
- V1 does not need background auto-analysis.
- V1 does not need remote fetches or remote code.
- Minimal manifest permission set is `storage`.
- No `host_permissions` should be declared.

## Engine / Parser Research

### Parser

- `chess.js` is the correct fit for local FEN validation and PGN parsing.
- It can:
  - validate/load FEN
  - load PGN and derive the final board state
  - convert UCI-like coordinate moves into SAN by applying them on the normalized position
- It stays entirely local and fits the popup-only design.

### Engine

- Stockfish is not a fit for this repo’s default license posture.
- Primary-source licensing finding:
  - Stockfish is GPLv3, which conflicts with the repo’s MIT default unless this extension is carved out as an exception.
- The selected engine path is an MIT-compatible local JavaScript engine.
- `Betafish` is the chosen v1 engine:
  - MIT licensed
  - browser-compatible JavaScript
  - local analysis only
  - weaker than Stockfish, but aligned with repo rules and good enough for a training-first v1

## Runtime Design Findings

- Analysis should not run on the main popup thread.
- A dedicated worker is the simplest v1 design:
  - popup sends `AnalysisRequest`
  - worker validates / normalizes the position
  - worker runs the engine and returns a structured `AnalysisResult`
- An always-on MV3 background analysis path is unnecessary for v1 and would complicate permissions and lifecycle handling.

## Input / Output Contract

### Input

- `FEN` mode:
  - validate exact board state directly
- `PGN` mode:
  - load PGN mainline
  - derive final position from parsed moves

### Output

- Best move in SAN is the primary recommendation.
- UCI move should be shown as a secondary technical detail.
- Evaluation should support:
  - centipawn scores
  - mate scores when the engine reports them
- Principal variation should be shown as a short SAN line, not raw engine text.

## Storage Findings

- Raw pasted FEN / PGN should not be persisted in local storage in v1.
- Persist only:
  - `theme`
  - `analysesToday`
  - `analysesTotal`
  - `lastResetDate`
  - `lastInputMode`
- Daily reset logic should follow the existing LoveSpark stats pattern.

## Accessibility / UI Notes

- Popup container should use `role="dialog"` with `aria-labelledby` and `aria-describedby`, matching current LoveSpark popup patterns.
- Result and validation regions need `aria-live`.
- Theme dropdown must remain keyboard accessible.
- Long principal variations need wrapping instead of horizontal overflow.
- Reduced-motion handling should rely on the shared base CSS plus any popup-specific transitions being guarded.

## Risks

- `Betafish` strength is materially lower than Stockfish, so move quality will be weaker than state-of-the-art browser analysis.
- PGN parsing must tolerate headers and comments but can stay limited to a single mainline in v1.
- Worker/engine integration may require a small adapter layer if the engine API is not already request/response shaped.
- Firefox packaging is expected to work because the extension is popup-only and permission-light, but the worker path still needs to be verified in practice.

## Implementation Guidance

- Keep the extension self-contained and vanilla JS.
- Prefer copying the shared LoveSpark library from canonical sources rather than inventing local variants.
- Use existing game extension structure as the scaffold model.
- Add a root `BUGS_AND_ITERATIONS.md` entry when implementation begins.
