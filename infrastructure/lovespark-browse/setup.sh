#!/usr/bin/env bash
# setup.sh — install lovespark-browse dependencies and build the binary.
# Idempotent; safe to re-run.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo "=== lovespark-browse setup ==="

# 1. Ensure Bun is installed
if ! command -v bun >/dev/null 2>&1; then
  echo ""
  echo "Bun not found. Install with:"
  echo "  curl -fsSL https://bun.sh/install | bash"
  echo "then re-source your shell and re-run this setup."
  echo ""
  echo "Remedy: after install, verify with 'bun --version' (should be ≥ 1.0)."
  exit 1
fi

BUN_VERSION="$(bun --version 2>/dev/null)"
echo "  Bun: $BUN_VERSION"

# 2. Install node_modules via bun
if [[ ! -d "node_modules" ]]; then
  echo "  Installing dependencies (bun install)..."
  bun install
else
  echo "  node_modules present — skipping bun install"
fi

# 3. Install Playwright Chromium (one-time)
if [[ ! -d "$HOME/.cache/ms-playwright" ]]; then
  echo "  Downloading Playwright Chromium (~300MB, ~2 min)..."
  bunx playwright install chromium
else
  echo "  Playwright cache exists — skipping download"
fi

# 4. Build compiled binary
mkdir -p dist
echo "  Building compiled binary to dist/ls-browse..."
bun build --compile src/cli.ts --outfile dist/ls-browse
chmod +x dist/ls-browse

echo ""
echo "✓ Setup complete."
echo "  Binary: $SCRIPT_DIR/dist/ls-browse"
echo ""
echo "  Optional: symlink to \$PATH for convenience:"
echo "    ln -sf \"$SCRIPT_DIR/dist/ls-browse\" /usr/local/bin/ls-browse"
echo ""
echo "  Test: dist/ls-browse --help"
echo "  Phase 1 complete when: 'dist/ls-browse status' returns healthy after first use."
