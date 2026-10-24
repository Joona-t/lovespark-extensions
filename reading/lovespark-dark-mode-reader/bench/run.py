#!/usr/bin/env python3
"""Dark Mode Reader bench harness.

  python3 bench/run.py smoke            # local fixtures: engine correctness
  python3 bench/run.py sites [--n 20]  # live fixture URLs: flash, CPU, contrast (writes bench/results.json)

Needs: pip install playwright && python -m playwright install chromium.
Run with the extension dir as cwd. No telemetry; nothing leaves this machine.
"""
import json, sys, time, threading, http.server, socketserver, functools, tempfile, os, argparse
from pathlib import Path
from playwright.sync_api import sync_playwright

EXT = Path(__file__).resolve().parents[1]
FIX = EXT / "bench" / "fixtures"

MEASURE_JS = """
() => {
  const lum = (c) => { const m = /rgba?\\((\\d+)[,\\s]+(\\d+)[,\\s]+(\\d+)/.exec(c); if (!m) return null;
    const f = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    return 0.2126 * f(+m[1]) + 0.7152 * f(+m[2]) + 0.0722 * f(+m[3]); };
  const alpha = (c) => { const m = /rgba\\([^)]*,\\s*([\\d.]+)\\)/.exec(c); return m ? +m[1] : (c === 'rgba(0, 0, 0, 0)' || c === 'transparent' ? 0 : 1); };
  const bgOf = (el) => { let e = el; while (e) { const bg = getComputedStyle(e).backgroundColor; if (alpha(bg) > 0.5) return bg; e = e.parentElement; } return getComputedStyle(document.documentElement).backgroundColor; };
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  let total = 0, pass = 0, fail = [], n;
  while ((n = walker.nextNode()) && total < 400) {
    if (!n.textContent.trim() || n.textContent.trim().length < 3) continue;
    const el = n.parentElement; if (!el) continue;
    const cs = getComputedStyle(el); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) continue;
    const r = el.getBoundingClientRect(); if (!r.width || !r.height) continue;
    const fg = lum(cs.color), bg = lum(bgOf(el)); if (fg === null || bg === null) continue;
    total++; const cr = (Math.max(fg, bg) + 0.05) / (Math.min(fg, bg) + 0.05);
    if (cr >= 4.5) pass++; else if (fail.length < 8) fail.push({ text: n.textContent.trim().slice(0, 40), cr: +cr.toFixed(2), color: cs.color, bg: bgOf(el) });
  }
  const html = document.documentElement;
  const bodyBg = bgOf(document.body);
  const inverted = [...document.images].filter(i => /invert/.test(getComputedStyle(i).filter)).length;
  return { textNodes: total, aaPass: pass, aaFail: fail, bodyBg, bodyLum: lum(bodyBg), classes: html.className, inverted, imgs: document.images.length,
           themeBytes: (document.getElementById('dmr-theme') || {}).textContent?.length || 0 };
}
"""

def serve(directory, port):
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *a, **k): super().__init__(*a, directory=str(directory), **k)
        def log_message(self, *a): pass
    socketserver.TCPServer.allow_reuse_address = True
    srv = socketserver.TCPServer(("127.0.0.1", port), Quiet)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv

def launch(p, ext_dir, headless=False):
    user = tempfile.mkdtemp(prefix="dmr-")
    args = [f"--disable-extensions-except={ext_dir}", f"--load-extension={ext_dir}", "--no-first-run", "--no-default-browser-check",
            "--window-size=1280,900", "--window-position=-2400,-2400"]
    if headless: args.append("--headless=new")
    ctx = p.chromium.launch_persistent_context(user, headless=False, args=args, viewport={"width": 1280, "height": 900})
    # wait for the service worker so dynamic CSS registration is in place
    for _ in range(200):
        if ctx.service_workers: break
        time.sleep(0.1)
    if not ctx.service_workers: print("WARN: service worker not seen after 20 s")
    time.sleep(0.8)
    return ctx

def smoke():
    srv = serve(FIX, 8765)
    report = {}
    with sync_playwright() as p:
        ctx = launch(p, EXT)
        page = ctx.new_page()
        for name in ("light-article.html", "native-dark.html"):
            page.goto(f"http://127.0.0.1:8765/{name}")
            page.wait_for_load_state("load"); time.sleep(1.2)
            m = page.evaluate(MEASURE_JS)
            # shadow DOM check
            m["shadowBg"] = page.evaluate("() => { const h = document.getElementById('shadow-host'); if (!h) return null; const i = h.shadowRoot.getElementById('shadow-inner'); return getComputedStyle(i).backgroundColor; }")
            m["inlineBg"] = page.evaluate("() => { const e = document.getElementById('inline'); return e ? getComputedStyle(e).backgroundColor : null; }")
            m["tdBg"] = page.evaluate("() => { const e = document.getElementById('td'); return e ? getComputedStyle(e).backgroundColor : null; }")
            page.screenshot(path=str(EXT / "bench" / f"shot-{name.replace('.html','')}.png"))
            report[name] = m
        # palette switch at runtime via the worker message path
        ctx.close()
    srv.shutdown()
    print(json.dumps(report, indent=2))
    ok = True
    la, nd = report["light-article.html"], report["native-dark.html"]
    checks = [
        ("light page themed (dmr-on)", "dmr-on" in la["classes"]),
        ("light page body is dark", la["bodyLum"] is not None and la["bodyLum"] < 0.05),
        ("light page: 100% text nodes >= 4.5:1", la["textNodes"] > 0 and la["aaPass"] == la["textNodes"]),
        ("no inverted images", la["inverted"] == 0),
        ("inline style recoloured", la["inlineBg"] not in (None, "rgb(250, 250, 250)")),
        ("bgcolor attr recoloured", la["tdBg"] not in (None, "rgb(255, 255, 255)")),
        ("shadow DOM recoloured", la["shadowBg"] not in (None, "rgb(255, 255, 255)")),
        ("native-dark page left alone (dmr-off)", "dmr-off" in nd["classes"] and "dmr-on" not in nd["classes"]),
        ("native-dark body colour untouched", nd["bodyBg"] == "rgb(13, 17, 23)"),
    ]
    for label, passed in checks:
        print(("PASS " if passed else "FAIL ") + label); ok &= passed
    sys.exit(0 if ok else 1)

if __name__ == "__main__":
    ap = argparse.ArgumentParser(); ap.add_argument("mode", choices=["smoke", "sites"]); ap.add_argument("--n", type=int, default=20)
    a = ap.parse_args()
    if a.mode == "smoke": smoke()
    else:
        from sites import run_sites  # noqa
        run_sites(a.n)
