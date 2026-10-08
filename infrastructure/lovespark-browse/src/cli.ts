/**
 * cli.ts — lovespark-browse CLI entry point.
 *
 * Single compiled binary (via `bun build --compile`). When invoked with the
 * hidden subcommand "server-internal", it behaves as the daemon. Otherwise
 * it's a client that auto-spawns the daemon on first use.
 */

import { existsSync, readFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { runServer } from "./server";
import type { DaemonState } from "./types";

const VERSION = "0.1.0";
const STATE_FILE = join(homedir(), ".lovespark", "browse.json");

// ── Daemon discovery + auto-start ─────────────────────────────────────

function loadState(): DaemonState | null {
  if (!existsSync(STATE_FILE)) return null;
  try {
    const text = readFileSync(STATE_FILE, "utf-8");
    if (!text.trim()) return null;
    return JSON.parse(text);
  } catch {
    return null;
  }
}

async function isHealthy(s: DaemonState): Promise<boolean> {
  try {
    const r = await fetch(`http://127.0.0.1:${s.port}/health`, {
      signal: AbortSignal.timeout(800),
    });
    if (!r.ok) return false;
    const body = (await r.json()) as { pid?: number };
    return body.pid === s.pid;
  } catch {
    return false;
  }
}

async function ensureDaemon(): Promise<DaemonState> {
  let state = loadState();
  if (state && (await isHealthy(state))) return state;

  // Spawn ourselves with server-internal flag, detached
  const binary = process.execPath;
  const args = binary.endsWith("ls-browse") || binary.endsWith("lovespark-browse")
    ? ["server-internal"]
    : [process.argv[1]!, "server-internal"];
  const proc = Bun.spawn([binary, ...args], {
    stdout: "ignore",
    stderr: "ignore",
    stdin: "ignore",
    env: { ...process.env, LS_BROWSE_VERSION: VERSION },
  });
  proc.unref();

  // Wait up to 8s for state file + health
  for (let i = 0; i < 40; i++) {
    await new Promise((r) => setTimeout(r, 200));
    state = loadState();
    if (state && (await isHealthy(state))) return state;
  }
  throw new Error(
    "daemon failed to start within 8s.\n" +
      "  Remedy: inspect ~/.lovespark/browse-logs/server.log for errors. " +
      "Common fixes: `bunx playwright install chromium`, ensure ~/.lovespark is writable, " +
      "and try `ls-browse stop` to clear any stale state.",
  );
}

async function call(
  method: string,
  path: string,
  body?: unknown,
  acceptBinary = false,
): Promise<Response> {
  const s = await ensureDaemon();
  return fetch(`http://127.0.0.1:${s.port}${path}`, {
    method,
    headers: {
      authorization: `Bearer ${s.token}`,
      ...(body ? { "content-type": "application/json" } : {}),
      ...(acceptBinary ? {} : { accept: "application/json, text/plain, text/html" }),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
}

// ── Helpers ────────────────────────────────────────────────────────────

async function printResponse(res: Response): Promise<number> {
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = await res.json();
    process.stdout.write(JSON.stringify(body, null, 2) + "\n");
    return res.ok ? 0 : 1;
  }
  if (ct.startsWith("image/")) {
    const buf = new Uint8Array(await res.arrayBuffer());
    process.stdout.write(buf);
    return res.ok ? 0 : 1;
  }
  const text = await res.text();
  process.stdout.write(text + "\n");
  return res.ok ? 0 : 1;
}

function err(msg: string, remedy: string): never {
  console.error(`ls-browse: ${msg}\n  Remedy: ${remedy}`);
  process.exit(1);
}

function parseRef(arg: string | undefined): string {
  if (!arg || !arg.startsWith("@")) {
    err(
      `missing or invalid ref (got ${JSON.stringify(arg)})`,
      "Refs start with @ (e.g. @e3). Run `ls-browse snapshot -i` first to discover refs.",
    );
  }
  return arg!;
}

// ── Commands ───────────────────────────────────────────────────────────

async function cmdStatus(): Promise<number> {
  const s = loadState();
  if (!s) {
    console.log("ls-browse: not running (no state file).");
    console.log("  Remedy: run any command (e.g. `ls-browse goto https://example.com`) to auto-start.");
    return 0;
  }
  const ok = await isHealthy(s);
  if (ok) {
    console.log(`ls-browse: healthy (pid ${s.pid}, port ${s.port}, version ${s.version})`);
    return 0;
  }
  console.log(`ls-browse: stale state file (pid ${s.pid} not responding on port ${s.port}).`);
  console.log("  Remedy: run `ls-browse stop` to clear, then retry your command.");
  return 1;
}

async function cmdStop(): Promise<number> {
  const s = loadState();
  if (!s) {
    console.log("ls-browse: not running.");
    return 0;
  }
  try {
    const r = await call("POST", "/shutdown");
    if (r.ok) {
      console.log(`ls-browse: shutdown signalled to pid ${s.pid}.`);
      return 0;
    }
  } catch {
    /* fall through to SIGTERM */
  }
  try {
    process.kill(s.pid, "SIGTERM");
    console.log(`ls-browse: SIGTERM sent to pid ${s.pid}.`);
    return 0;
  } catch (e: any) {
    err(
      `could not stop pid ${s.pid}: ${e?.message ?? e}`,
      `Check if already dead ('ps -p ${s.pid}') or remove ~/.lovespark/browse.json manually.`,
    );
  }
}

async function cmdGoto(args: string[]): Promise<number> {
  const url = args[0];
  if (!url) err("missing URL", "Usage: ls-browse goto <url>");
  return printResponse(await call("POST", "/goto", { url }));
}

async function cmdSnapshot(args: string[]): Promise<number> {
  const indexed = !args.includes("--no-refs");
  const q = indexed ? "?indexed=true" : "?indexed=false";
  const res = await call("GET", `/snapshot${q}`);
  if (!res.ok) return printResponse(res);
  const { text, refs } = (await res.json()) as { text: string; refs: Array<unknown> };
  process.stdout.write(text + "\n");
  if (indexed) process.stdout.write(`\n# ${refs.length} refs indexed\n`);
  return 0;
}

async function cmdText(args: string[]): Promise<number> {
  const ref = args[0];
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  return printResponse(await call("GET", `/text${q}`));
}

async function cmdHtml(args: string[]): Promise<number> {
  const ref = args[0];
  const q = ref ? `?ref=${encodeURIComponent(ref)}` : "";
  return printResponse(await call("GET", `/html${q}`));
}

async function cmdScreenshot(args: string[]): Promise<number> {
  const full = args.includes("--full");
  const outIdx = args.indexOf("--out");
  const out = outIdx >= 0 ? args[outIdx + 1] : null;
  const res = await call("GET", `/screenshot${full ? "?full=true" : ""}`, undefined, true);
  if (!res.ok) return printResponse(res);
  const buf = new Uint8Array(await res.arrayBuffer());
  if (out) {
    await Bun.write(out, buf);
    console.log(`screenshot: ${out} (${buf.length} bytes)`);
  } else {
    process.stdout.write(buf);
  }
  return 0;
}

async function cmdConsole(args: string[]): Promise<number> {
  const nIdx = args.indexOf("-n");
  const n = nIdx >= 0 ? args[nIdx + 1] ?? "50" : "50";
  return printResponse(await call("GET", `/console?n=${encodeURIComponent(n)}`));
}

async function cmdNetwork(args: string[]): Promise<number> {
  const nIdx = args.indexOf("-n");
  const n = nIdx >= 0 ? args[nIdx + 1] ?? "50" : "50";
  return printResponse(await call("GET", `/network?n=${encodeURIComponent(n)}`));
}

async function cmdClick(args: string[]): Promise<number> {
  const ref = parseRef(args[0]);
  return printResponse(await call("POST", "/click", { ref }));
}

async function cmdFill(args: string[]): Promise<number> {
  const ref = parseRef(args[0]);
  const text = args.slice(1).join(" ");
  return printResponse(await call("POST", "/fill", { ref, text }));
}

async function cmdPress(args: string[]): Promise<number> {
  const key = args[0];
  if (!key) err("missing key", "Usage: ls-browse press <key> [ref]. Example: ls-browse press Enter");
  const ref = args[1];
  return printResponse(await call("POST", "/press", ref ? { key, ref } : { key }));
}

async function cmdContrastSample(args: string[]): Promise<number> {
  const fg = parseRef(args[0]);
  const bg = args[1] && args[1].startsWith("@") ? args[1] : null;
  const q = `?fg=${encodeURIComponent(fg)}${bg ? `&bg=${encodeURIComponent(bg)}` : ""}`;
  return printResponse(await call("GET", `/contrast-sample${q}`));
}

async function cmdThemeCycle(): Promise<number> {
  return printResponse(await call("POST", "/theme-cycle", {}));
}

async function cmdMascotCheck(): Promise<number> {
  return printResponse(await call("GET", "/mascot-check"));
}

async function cmdUrl(): Promise<number> {
  return printResponse(await call("GET", "/url"));
}

async function cmdHelp(): Promise<number> {
  console.log(
    `ls-browse v${VERSION} — LoveSpark persistent Chromium daemon\n\n` +
      `META:\n` +
      `  status                            Is the daemon running?\n` +
      `  stop                              Shut down the daemon\n` +
      `  url                               Current page URL\n\n` +
      `READ:\n` +
      `  snapshot [--no-refs]              ARIA tree with @eN refs\n` +
      `  text [@ref]                       innerText of page or element\n` +
      `  html [@ref]                       innerHTML of page or element\n` +
      `  screenshot [--full] [--out PATH]  PNG to stdout or file\n` +
      `  console [-n N]                    Recent console messages\n` +
      `  network [-n N]                    Recent HTTP events\n\n` +
      `WRITE:\n` +
      `  goto <url>                        Navigate\n` +
      `  click @ref                        Click element\n` +
      `  fill @ref <text...>               Fill input with text\n` +
      `  press <key> [@ref]                Press key (optionally targeted)\n\n` +
      `LoveSpark:\n` +
      `  contrast-sample @fg [@bg]         Real-DOM WCAG 2.1 ratio\n` +
      `  theme-cycle                       Snapshot retro/dark/beige/slate\n` +
      `  mascot-check                      Verify Sparky presence + alt text\n\n` +
      `State file: ~/.lovespark/browse.json (mode 0600, bearer token inside).\n` +
      `Logs:       ~/.lovespark/browse-logs/\n` +
      `Idle shutdown after 30 minutes. Auto-start on first use.\n`,
  );
  return 0;
}

// ── Dispatch ───────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const [cmd, ...args] = process.argv.slice(2);

  // Hidden subcommand — runs the server mode in-process.
  if (cmd === "server-internal") {
    await runServer(VERSION);
    return;
  }

  const exit = await (async () => {
    switch (cmd) {
      case undefined:
      case "help":
      case "--help":
      case "-h":
        return cmdHelp();
      case "--version":
      case "-v":
      case "version":
        console.log(VERSION);
        return 0;
      case "status":
        return cmdStatus();
      case "stop":
        return cmdStop();
      case "url":
        return cmdUrl();
      case "goto":
        return cmdGoto(args);
      case "snapshot":
        return cmdSnapshot(args);
      case "text":
        return cmdText(args);
      case "html":
        return cmdHtml(args);
      case "screenshot":
        return cmdScreenshot(args);
      case "console":
        return cmdConsole(args);
      case "network":
        return cmdNetwork(args);
      case "click":
        return cmdClick(args);
      case "fill":
        return cmdFill(args);
      case "press":
        return cmdPress(args);
      case "contrast-sample":
        return cmdContrastSample(args);
      case "theme-cycle":
        return cmdThemeCycle();
      case "mascot-check":
        return cmdMascotCheck();
      default:
        err(
          `unknown command '${cmd}'`,
          "Run `ls-browse --help` to see all commands.",
        );
    }
  })();
  process.exit(exit);
}

main().catch((e: any) => {
  console.error(`ls-browse: ${e?.message ?? e}`);
  process.exit(1);
});
