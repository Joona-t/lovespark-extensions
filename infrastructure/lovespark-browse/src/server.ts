/**
 * server.ts — lovespark-browse HTTP daemon.
 *
 * Localhost-only, bearer-UUID-authed, Chromium via Playwright, 30min idle shutdown,
 * ring-buffer logs, version auto-restart, LoveSpark-native endpoints (contrast-sample,
 * theme-cycle, mascot-check). Boot: `bun src/server.ts`.
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync, appendFileSync } from "fs";
import { homedir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";
import { createServer } from "net";
import { RefRegistry } from "./refs";
import { contrastSample, themeCycle, mascotCheck } from "./lovespark";
import type { DaemonState, GuardLock, ConsoleEntry, NetworkEntry } from "./types";

// ── Paths ─────────────────────────────────────────────────────────────

const LS_DIR = join(homedir(), ".lovespark");
const STATE_FILE = join(LS_DIR, "browse.json");
const GUARD_FILE = join(LS_DIR, "guard.lock");
const LOG_DIR = join(LS_DIR, "browse-logs");
const CONSOLE_LOG = join(LOG_DIR, "console.log");
const NETWORK_LOG = join(LOG_DIR, "network.log");
const DIALOG_LOG = join(LOG_DIR, "dialog.log");
const SERVER_LOG = join(LOG_DIR, "server.log");

// ── Ring buffers (bounded in-memory, append-only disk flush) ────────

class RingBuffer<T> {
  private buf: T[] = [];
  constructor(private max: number, private flushPath: string) {}
  push(item: T): void {
    this.buf.push(item);
    if (this.buf.length > this.max) this.buf.shift();
    try {
      appendFileSync(this.flushPath, JSON.stringify(item) + "\n");
    } catch {
      // log dir may not exist yet — ignore
    }
  }
  last(n: number): T[] {
    return this.buf.slice(-n);
  }
}

// ── Port selection ────────────────────────────────────────────────────

async function pickPort(): Promise<number> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const port = 10000 + Math.floor(Math.random() * 50000);
    if (await isPortFree(port)) return port;
  }
  throw new Error(
    "pickPort: 5 random ports in [10000, 60000] all in use. Remedy: retry shortly, or free some ports.",
  );
}

function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const s = createServer();
    s.unref();
    s.once("error", () => resolve(false));
    s.listen(port, "127.0.0.1", () => {
      s.close(() => resolve(true));
    });
  });
}

// ── State file ────────────────────────────────────────────────────────

function writeState(s: DaemonState): void {
  mkdirSync(LS_DIR, { recursive: true });
  writeFileSync(STATE_FILE, JSON.stringify(s, null, 2), { encoding: "utf-8" });
  chmodSync(STATE_FILE, 0o600);
}

function readGuardLock(): GuardLock | null {
  if (!existsSync(GUARD_FILE)) return null;
  try {
    return JSON.parse(readFileSync(GUARD_FILE, "utf-8"));
  } catch {
    return null;
  }
}

// ── Responses ─────────────────────────────────────────────────────────

function json(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", ...headers },
  });
}

function errorResp(msg: string, remedy: string, status = 400): Response {
  return json({ error: msg, remedy }, status);
}

function serverLog(msg: string): void {
  try {
    appendFileSync(SERVER_LOG, `[${new Date().toISOString()}] ${msg}\n`);
  } catch {
    /* ignore */
  }
}

// ── Main ──────────────────────────────────────────────────────────────

export async function runServer(version: string): Promise<void> {
  mkdirSync(LS_DIR, { recursive: true });
  mkdirSync(LOG_DIR, { recursive: true });
  serverLog(`booting pid=${process.pid} version=${version}`);

  const token = randomUUID();
  const port = await pickPort();
  const state: DaemonState = {
    pid: process.pid,
    port,
    token,
    startedAt: new Date().toISOString(),
    version,
  };
  writeState(state);

  // ── Chromium lifecycle ─────────────────────────────────────────
  let browser: Browser | null = null;
  let ctx: BrowserContext | null = null;
  let page: Page | null = null;
  const refs = new RefRegistry();
  const consoleBuf = new RingBuffer<ConsoleEntry>(200, CONSOLE_LOG);
  const networkBuf = new RingBuffer<NetworkEntry>(200, NETWORK_LOG);

  async function ensurePage(): Promise<Page> {
    if (page && !page.isClosed()) return page;
    if (!browser) {
      browser = await chromium.launch({ headless: true });
    }
    if (!ctx) {
      ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
    }
    page = await ctx.newPage();
    page.on("console", (m) =>
      consoleBuf.push({
        ts: new Date().toISOString(),
        type: m.type(),
        text: m.text(),
        url: page?.url(),
      }),
    );
    page.on("framenavigated", (frame) => {
      if (frame === page?.mainFrame()) refs.onNavigate();
    });
    page.on("request", (req) => {
      networkBuf.push({
        ts: new Date().toISOString(),
        method: req.method(),
        url: req.url(),
      });
    });
    page.on("response", async (res) => {
      networkBuf.push({
        ts: new Date().toISOString(),
        method: res.request().method(),
        url: res.url(),
        status: res.status(),
      });
    });
    page.on("dialog", async (d) => {
      try {
        appendFileSync(
          DIALOG_LOG,
          JSON.stringify({ ts: new Date().toISOString(), type: d.type(), message: d.message() }) + "\n",
        );
        await d.dismiss();
      } catch {
        /* ignore */
      }
    });
    browser.on("disconnected", () => {
      serverLog("chromium disconnected — exiting for clean restart");
      process.exit(0);
    });
    return page;
  }

  // ── Idle watchdog ──────────────────────────────────────────────
  const IDLE_MS = 30 * 60 * 1000;
  let idleTimer: Timer | null = null;
  const resetIdle = (): void => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      serverLog("30min idle — shutting down");
      void shutdown(0);
    }, IDLE_MS);
  };
  async function shutdown(code: number): Promise<void> {
    try {
      if (browser) await browser.close();
    } catch {
      /* ignore */
    }
    try {
      if (existsSync(STATE_FILE)) {
        const cur = JSON.parse(readFileSync(STATE_FILE, "utf-8")) as DaemonState;
        if (cur.pid === process.pid) {
          // Remove our state file
          writeFileSync(STATE_FILE, "", { encoding: "utf-8" });
        }
      }
    } catch {
      /* ignore */
    }
    process.exit(code);
  }

  // ── Auth ───────────────────────────────────────────────────────
  function requireAuth(req: Request): Response | null {
    const h = req.headers.get("authorization") ?? "";
    if (h !== `Bearer ${token}`) {
      return errorResp(
        "unauthorized",
        "Include 'Authorization: Bearer <token>' from ~/.lovespark/browse.json. The CLI does this automatically.",
        401,
      );
    }
    return null;
  }

  // ── Guard (freeze-mode) check for WRITE endpoints ──────────────
  function guardBlockReason(url: string): { reason: string; remedy: string } | null {
    const lock = readGuardLock();
    if (!lock || (lock.mode !== "freeze" && lock.mode !== "guard")) return null;
    if (!lock.scope_dir) return null;
    // In freeze/guard mode, block navigation outside file:// scope_dir.
    // http(s) URLs are always allowed in freeze mode — freeze is about filesystem writes,
    // not browser navigation. We keep this opening for live-site QA.
    if (url.startsWith("file://")) {
      const scopePrefix = `file://${lock.scope_dir}`;
      if (!url.startsWith(scopePrefix)) {
        return {
          reason: `ls-guard (${lock.mode}): file:// navigation outside scope ${lock.scope_dir}`,
          remedy: `Either change scope ('ls-guard freeze <dir>'), disable ('ls-guard off'), or use LS_GUARD_OVERRIDE=1 on the caller.`,
        };
      }
    }
    return null;
  }

  // ── HTTP routes ────────────────────────────────────────────────
  Bun.serve({
    port,
    hostname: "127.0.0.1",
    idleTimeout: 60,

    async fetch(req: Request): Promise<Response> {
      const url = new URL(req.url);
      const path = url.pathname;

      // /health bypasses auth
      if (path === "/health") {
        resetIdle();
        return json({ ok: true, pid: state.pid, port: state.port, version: state.version });
      }

      const unauth = requireAuth(req);
      if (unauth) return unauth;
      resetIdle();

      try {
        // META
        if (path === "/shutdown" && req.method === "POST") {
          setTimeout(() => void shutdown(0), 10);
          return json({ ok: true, shutting_down: true });
        }

        // READ
        if (path === "/text" && req.method === "GET") {
          const p = await ensurePage();
          const ref = url.searchParams.get("ref");
          if (ref) {
            const loc = await refs.resolve(ref);
            if (!loc) return errorResp(`ref ${ref} not found or stale`, "Run GET /snapshot?indexed=true again to refresh refs.", 404);
            return new Response(await loc.innerText(), { headers: { "content-type": "text/plain" } });
          }
          return new Response(await p.innerText("body"), { headers: { "content-type": "text/plain" } });
        }

        if (path === "/html" && req.method === "GET") {
          const p = await ensurePage();
          const ref = url.searchParams.get("ref");
          if (ref) {
            const loc = await refs.resolve(ref);
            if (!loc) return errorResp(`ref ${ref} not found or stale`, "Run /snapshot?indexed=true to refresh refs.", 404);
            return new Response(await loc.innerHTML(), { headers: { "content-type": "text/html" } });
          }
          return new Response(await p.content(), { headers: { "content-type": "text/html" } });
        }

        if (path === "/snapshot" && req.method === "GET") {
          const p = await ensurePage();
          const indexed = url.searchParams.get("indexed") !== "false";
          const result = await refs.snapshot(p, indexed);
          return json(result);
        }

        if (path === "/screenshot" && req.method === "GET") {
          const p = await ensurePage();
          const full = url.searchParams.get("full") === "true";
          const buf = await p.screenshot({ fullPage: full, type: "png" });
          return new Response(buf as any, { headers: { "content-type": "image/png" } });
        }

        if (path === "/console" && req.method === "GET") {
          const n = parseInt(url.searchParams.get("n") ?? "50", 10);
          return json({ entries: consoleBuf.last(n) });
        }

        if (path === "/network" && req.method === "GET") {
          const n = parseInt(url.searchParams.get("n") ?? "50", 10);
          return json({ entries: networkBuf.last(n) });
        }

        if (path === "/url" && req.method === "GET") {
          const p = await ensurePage();
          return json({ url: p.url() });
        }

        // WRITE
        if (path === "/goto" && req.method === "POST") {
          const body = (await req.json().catch(() => null)) as { url?: string } | null;
          if (!body?.url) return errorResp("missing 'url' in body", "POST /goto with {\"url\":\"https://...\"}");
          const block = guardBlockReason(body.url);
          if (block) return errorResp(block.reason, block.remedy, 403);
          const p = await ensurePage();
          await p.goto(body.url, { waitUntil: "domcontentloaded" });
          refs.onNavigate();
          return json({ ok: true, url: p.url() });
        }

        if (path === "/click" && req.method === "POST") {
          const body = (await req.json().catch(() => null)) as { ref?: string } | null;
          if (!body?.ref) return errorResp("missing 'ref' in body", "POST /click with {\"ref\":\"@e3\"}");
          const loc = await refs.resolve(body.ref);
          if (!loc) return errorResp(`ref ${body.ref} not found or stale`, "Run /snapshot?indexed=true to refresh refs, then retry.", 404);
          await loc.click();
          return json({ ok: true });
        }

        if (path === "/fill" && req.method === "POST") {
          const body = (await req.json().catch(() => null)) as { ref?: string; text?: string } | null;
          if (!body?.ref || body.text === undefined) return errorResp("missing 'ref' or 'text'", "POST /fill with {\"ref\":\"@e3\",\"text\":\"...\"}");
          const loc = await refs.resolve(body.ref);
          if (!loc) return errorResp(`ref ${body.ref} not found or stale`, "Run /snapshot?indexed=true to refresh refs.", 404);
          await loc.fill(body.text);
          return json({ ok: true });
        }

        if (path === "/press" && req.method === "POST") {
          const body = (await req.json().catch(() => null)) as { key?: string; ref?: string } | null;
          if (!body?.key) return errorResp("missing 'key' in body", "POST /press with {\"key\":\"Enter\"} or include 'ref' to target element.");
          if (body.ref) {
            const loc = await refs.resolve(body.ref);
            if (!loc) return errorResp(`ref ${body.ref} not found or stale`, "Run /snapshot?indexed=true to refresh refs.", 404);
            await loc.press(body.key);
          } else {
            const p = await ensurePage();
            await p.keyboard.press(body.key);
          }
          return json({ ok: true });
        }

        // LoveSpark extensions
        if (path === "/contrast-sample" && req.method === "GET") {
          const fgRef = url.searchParams.get("fg");
          const bgRef = url.searchParams.get("bg");
          if (!fgRef) return errorResp("missing 'fg' query param", "GET /contrast-sample?fg=@e3[&bg=@e4]. bg is optional (walks up to first opaque ancestor).");
          const fgLoc = await refs.resolve(fgRef);
          if (!fgLoc) return errorResp(`fg ref ${fgRef} not found`, "Run /snapshot?indexed=true first.", 404);
          const bgLoc = bgRef ? await refs.resolve(bgRef) : null;
          if (bgRef && !bgLoc) return errorResp(`bg ref ${bgRef} not found`, "Run /snapshot?indexed=true first.", 404);
          const result = await contrastSample(fgLoc, bgLoc);
          return json(result);
        }

        if (path === "/theme-cycle" && req.method === "POST") {
          const body = (await req.json().catch(() => ({}))) as { runId?: string };
          const runId = body.runId ?? new Date().toISOString().replace(/[:.]/g, "-");
          const p = await ensurePage();
          const snapshots = await themeCycle(p, runId);
          return json({ runId, snapshots });
        }

        if (path === "/mascot-check" && req.method === "GET") {
          const p = await ensurePage();
          const result = await mascotCheck(p);
          return json(result);
        }

        return errorResp(
          `unknown route: ${req.method} ${path}`,
          "GET /health for liveness; see README.md for full route list (text, html, snapshot, screenshot, console, network, goto, click, fill, press, contrast-sample, theme-cycle, mascot-check, shutdown).",
          404,
        );
      } catch (err: any) {
        serverLog(`route error ${path}: ${err?.message ?? err}`);
        return errorResp(
          `server error: ${err?.message ?? String(err)}`,
          `Check ~/.lovespark/browse-logs/server.log for details. Common causes: page navigated mid-request (retry), element gone (re-run /snapshot), or Chromium crash (daemon will auto-restart on next call).`,
          500,
        );
      }
    },

    error(err) {
      serverLog(`fatal: ${err.message}`);
      return errorResp(`fatal: ${err.message}`, "Inspect ~/.lovespark/browse-logs/server.log and restart daemon.", 500);
    },
  });

  resetIdle();
  serverLog(`listening on 127.0.0.1:${port}`);
  console.log(`[lovespark-browse] ready on 127.0.0.1:${port} (pid ${process.pid})`);

  process.on("SIGTERM", () => void shutdown(0));
  process.on("SIGINT", () => void shutdown(0));
}

// Allow direct invocation: `bun src/server.ts`
if (import.meta.main) {
  runServer(process.env.LS_BROWSE_VERSION ?? "dev").catch((err) => {
    serverLog(`boot failed: ${err?.message ?? err}`);
    console.error(
      `[lovespark-browse] boot failed: ${err?.message ?? err}\n` +
        `  Remedy: bun --version ≥ 1.0 && bunx playwright install chromium && ensure ~/.lovespark is writable.`,
    );
    process.exit(2);
  });
}
