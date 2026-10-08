# lovespark-browse

Persistent Bun-compiled Chromium daemon giving Claude Code sub-second browser control with cookies + DOM state across tool calls. Gstack-pattern #1 absorbed into the LoveSpark empire with LoveSpark-native extensions (contrast sampler, theme cycler, mascot-presence checker).

**Status: working.** Phases 1–5 complete: Bun + Playwright installed, daemon lifecycle live, READ/WRITE routes implemented, LoveSpark extensions (contrast-sample / theme-cycle / mascot-check) validated against example.com / iana.org. Shell-wrapper `dist/ls-browse` symlinked to `~/.local/bin/ls-browse` (Bun-backed; standard `bun build --compile` output can't be macOS-codesigned, so the wrapper approach is the clean path). Phase 6 integration (wiring into `/audit-a11y` + `/brand-sweep`) is partial — `/browse.md` updated with integration call-outs. See [IMPLEMENTATION.md](IMPLEMENTATION.md) for remaining follow-ons.

## Why this exists

Claude Preview MCP cold-starts a browser per session; cookies evaporate; you cannot QA a logged-in CWS listing, a Gmail integration, or a multi-step extension popup flow. `ls-browse` holds Chromium open, sub-200ms latency after ~3s first boot, bearer-UUID-token auth on localhost-only HTTP. Matches gstack's daemon shape plus three LoveSpark-specific endpoints:

- `GET /contrast-sample?fg=...&bg=...` — real-DOM contrast ratio at actual render
- `GET /theme-cycle` — iterate retro/dark/beige/slate and snapshot each
- `GET /mascot-check` — verify Sparky is present and has alt text

## Architecture

```
Claude Code ──► ls-browse CLI (Bun binary)
                       │
                       ▼
              localhost HTTP :10000-60000   ◄── bearer UUID from ~/.lovespark/browse.json (mode 0600)
                       │
                       ▼
              Chromium (Playwright, headless or headed)
                       │
                       ▼
              ARIA-tree refs @e1, @e2, @c1...
```

### Key design points (absorbed from gstack ARCHITECTURE.md)

1. **Daemon model.** First invocation boots Chromium (~3s). Subsequent calls: 100–200ms via localhost HTTP. Auto-shutdown after 30min idle.
2. **Bearer UUID auth.** State file at `~/.lovespark/browse.json`, mode 0600. Every HTTP request carries `Authorization: Bearer <uuid>`. Localhost-bind enforced separately.
3. **Locator-based refs.** `snapshot -i` walks Playwright's `page.accessibility.snapshot()`, assigns `@e1` `@e2` sequentially, binds each to a Locator via `getByRole(role, { name }).nth(index)`. No DOM mutation — survives CSP + React hydration.
4. **READ / WRITE / META command categorization.** Matches the same taxonomy we added to `~/.claude/commands/*.md` frontmatter.
5. **Actionable errors.** Every error ends with a remediation hint. No bare stack traces.
6. **Append-only ring-buffer logs.** `~/.lovespark/browse-logs/console.log`, `network.log`, `dialog.log`, 50K entries each, flushed every 1s.
7. **Version auto-restart.** Build writes git commit hash to `dist/.version`. CLI re-spawns daemon when version differs.

## Commands (planned)

### READ (idempotent, parallelizable)
- `ls-browse text [@ref?]` — innerText of page or element
- `ls-browse html [@ref?]` — innerHTML
- `ls-browse snapshot [-i]` — ARIA snapshot, `-i` assigns refs
- `ls-browse screenshot [--full]` — PNG to stdout (base64) or file
- `ls-browse console` — last 200 console messages
- `ls-browse network` — last 200 HTTP events
- `ls-browse cookies [--domain ...]` — read cookies (never writes)
- `ls-browse contrast-sample @fg @bg` — **LoveSpark** ratio at actual render

### WRITE (mutates page state)
- `ls-browse goto <url>` — navigate
- `ls-browse click @ref` — click element
- `ls-browse fill @ref <text>` — fill input
- `ls-browse press <key>` — keyboard
- `ls-browse theme-cycle` — **LoveSpark** cycle through 4 themes, snapshot each

### META (server-level)
- `ls-browse start` — boot daemon
- `ls-browse stop` — shutdown
- `ls-browse status` — is it running?
- `ls-browse tabs` — list open tabs
- `ls-browse mascot-check` — **LoveSpark** verify Sparky presence + alt text

## LoveSpark-native extensions over gstack

Beyond the daemon shape, we add three things gstack doesn't have:

1. **Contrast sampler** — pull FG/BG swatch from a live element, run through `audit-contrast.py`'s relative-luminance code, return the ratio. Catches theme-specific contrast failures that only show up at actual render (e.g., semi-transparent overlays, gradient backgrounds).
2. **Theme cycler** — snapshot all 4 LoveSpark themes (retro/dark/beige/slate) in a single command, write to `~/.lovespark/browse-logs/theme-snapshots/{runId}/{theme}.png`. Feeds `/audit-a11y`.
3. **Mascot presence checker** — CLAUDE.md rule #3 says every UI must include Sparky. This asserts at runtime: finds `<img>` with `alt*="Sparky"` or known src; checks it's visible (not display:none or zero-size).

## Setup & build (pending)

See [IMPLEMENTATION.md](IMPLEMENTATION.md) for the ordered checklist. TL;DR:

```bash
cd "Extensions/infrastructure/lovespark-browse"
bash setup.sh   # installs Bun if missing, installs Playwright Chromium, builds binary
```

After setup, `ls-browse` is a 58MB compiled binary at `dist/ls-browse`.

## Security model

- Localhost-only HTTP (binds to 127.0.0.1 explicitly)
- Bearer UUID token in state file, mode 0600, re-issued on every boot
- Cookies read-only: never persisted to plaintext disk
- No writes outside `~/.lovespark/`
- `ls-guard` (our sibling safety layer) can block `ls-browse WRITE *` commands when freeze mode is on

## Integration with the rest of the empire

- **`/audit-a11y`** — calls `ls-browse theme-cycle` + `ls-browse contrast-sample` for real-DOM verification layered over the static CSS audit in `audit-contrast.py`
- **`/check` (ls-check.py)** — can optionally spawn an `ls-browse` session to assert popup loads without errors (adds ~5s; gated behind `--deep`)
- **`/ship-day`** swarm — QA agent invokes `ls-browse` on the built extension loaded into Chromium; screenshots saved to the CWS listing assets
- **`/test-skills` tier 2** — uses `ls-browse` for any skill that needs browser verification; Sparky-mascot skills especially

## Status checklist

- [x] Architecture doc
- [x] Implementation plan
- [x] src/types.ts, server.ts, cli.ts, refs.ts, lovespark.ts — full implementations
- [x] package.json, tsconfig.json, setup.sh
- [x] server.ts: HTTP routes + daemon lifecycle + ring-buffer logs + idle watchdog + bearer auth
- [x] cli.ts: command dispatch (META/READ/WRITE/LoveSpark), auto-spawn, self-fork via `server-internal`
- [x] refs.ts: ARIA snapshot walk via Playwright 1.59's `ariaSnapshot()`, locator binding, staleness check
- [x] contrast-sample: real-DOM WCAG 2.1 ratio (ported math from `audit-contrast.py`)
- [x] theme-cycle: retro / dark / beige / slate snapshots
- [x] mascot-check: Sparky presence + alt-text enforcement (CLAUDE.md rule #3)
- [x] Built: shell wrapper around `bun src/cli.ts` at `dist/ls-browse` (62MB of deps, not a static binary)
- [x] Installed: `~/.local/bin/ls-browse` symlink
- [x] Tier-1 test-skills: 32/32 pass
- [x] Manual E2E: example.com goto + snapshot + text + contrast-sample + click → iana.org + mascot-check + screenshot
- [ ] `ls-check --deep` flag (optional; spawns ls-browse on extension popup to assert zero console errors)
- [ ] `/audit-a11y` wiring (replace static-only contrast with static+live stack)
- [ ] `/brand-sweep` invoking `mascot-check` per extension popup
- [ ] Tier-2 `claude -p /browse` test under `EVALS=1`

## Known limitations

- **No `bun build --compile` binary.** Bun's compile format can't be macOS-codesigned (ad-hoc signing rejects the format), so the unsigned 62MB binary was SIGKILL'd on first exec. Shell wrapper → `bun src/cli.ts` is the working path. Revisit when Bun ships signable binaries.
- **ariaSnapshot() instead of `page.accessibility.snapshot()`.** Playwright 1.59 removed the old API; the new one is YAML-based and we parse it with a small regex walker (`parseAriaYaml` in refs.ts). Works for standard pages; exotic shadow-DOM/iframe trees may need extra work.
- **macOS-only Chromium cookie decryption.** We haven't implemented cookie import from live Chrome — only in-daemon cookies. Live-session import is a Phase 8.
- **Theme-cycle assumes LoveSpark popup convention.** Body gets `class="theme-<name>"` + `data-theme=<name>`. Extensions using different theme mechanisms won't cycle correctly without a small adapter.
