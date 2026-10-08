# LoveSpark Chess Coach

LoveSpark Chess Coach is a privacy-first browser extension for training your next move ideas locally.

## What it does

- Accepts pasted `FEN` or `PGN`
- Normalizes the current position locally
- Runs a bundled local chess engine inside the popup
- Shows:
  - best move in SAN
  - best move in UCI
  - evaluation
  - short principal variation

## Privacy

- No account
- No telemetry
- No remote engine calls
- No site scraping in v1
- No host permissions
- Pasted notation is kept in memory only by default

## Storage

The extension only persists:

- `theme`
- `analysesToday`
- `analysesTotal`
- `lastResetDate`
- `lastInputMode`

## Third-Party Code

- `chess.js` is vendored locally under `vendor/` with its BSD-2-Clause license in `vendor/licenses/chessjs-LICENSE.txt`
- `Betafish` is vendored locally under `vendor/` with its MIT license in `vendor/licenses/betafish-LICENSE.txt`

## Packaging

Use the repo scripts after changes:

- `scripts/audit-permissions.sh Extensions/Games/lovespark-chess-coach`
- `scripts/build-zips.sh Extensions/Games/lovespark-chess-coach`
