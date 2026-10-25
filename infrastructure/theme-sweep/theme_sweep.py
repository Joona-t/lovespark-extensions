#!/usr/bin/env python3
"""Theme sweep: load every extension popup in headless Chrome, apply each theme
with transitions off, and measure the contrast of every visible text node.

    python3 infrastructure/theme-sweep/theme_sweep.py            # all popups
    python3 infrastructure/theme-sweep/theme_sweep.py themes/x   # one extension
    python3 infrastructure/theme-sweep/theme_sweep.py --shots out/ --theme gingham

Gate: exits 1 if any text in a GATED theme is below WCAG AA (4.5:1, or 3:1 for
large text). The original four themes are reported but not gated (they carry
known older failures). Popups render with a stub chrome.* API, so screens that
need real extension data show their empty state: that part is not measured.

Written 2026-10-25 for the kawaii theme rollout (ITER notes in
infrastructure/lovespark-shared-lib/BUGS_AND_ITERATIONS.md).
"""
from __future__ import annotations

import argparse
import functools
import html
import http.server
import json
import re
import subprocess
import sys
import threading
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
HERE = Path(__file__).resolve().parent
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
GATED = ["seoul", "gingham", "holo", "neon", "bubblegum"]
TEMP_NAME = "__theme_sweep__.html"


def popups(targets: list[str]) -> list[Path]:
    roots = [ROOT / t for t in targets] if targets else [ROOT]
    found = []
    for r in roots:
        for m in sorted(r.rglob("manifest.json")):
            if any(p in m.parts for p in ("_archive", "node_modules", "lib")):
                continue
            try:
                man = json.loads(m.read_text())
            except (json.JSONDecodeError, UnicodeDecodeError):
                continue
            pop = (man.get("action") or man.get("browser_action") or {}).get("default_popup")
            if pop and (m.parent / pop).exists():
                found.append(m.parent / pop)
    return found


def serve() -> tuple[http.server.ThreadingHTTPServer, int]:
    class Quiet(http.server.SimpleHTTPRequestHandler):
        def log_message(self, *args: object) -> None:
            pass

    handler = functools.partial(Quiet, directory=str(ROOT))
    srv = http.server.ThreadingHTTPServer(("127.0.0.1", 0), handler)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    return srv, srv.server_address[1]


def temp_page(popup: Path, mode: str, theme: str | None) -> Path:
    src = popup.read_text(encoding="utf-8")
    stub = (HERE / "stub.js").read_text()
    head = ("<script>window.__sweepErrors=[];addEventListener('error',e=>"
            "window.__sweepErrors.push(String(e.message)));</script>"
            f"<script>{stub}</script>")
    if mode == "measure":
        tail = ("<script>addEventListener('load',()=>setTimeout(()=>{"
                + (HERE / "measure.js").read_text() + "},700));</script>")
    else:
        t = html.escape(theme or "seoul")
        tail = ("<script>addEventListener('load',()=>setTimeout(()=>{"
                "const L=['seoul','gingham','holo','neon','bubblegum','retro','dark','beige','slate'];"
                f"L.forEach(x=>document.body.classList.remove('theme-'+x));document.body.classList.add('theme-{t}');"
                + ("document.body.classList.add('theme-dark');" if t == "neon" else "") +
                "},700));</script>")
    src = re.sub(r"<head[^>]*>", lambda m: m.group(0) + head, src, count=1, flags=re.I)
    src = re.sub(r"</body>", lambda m: tail + m.group(0), src, count=1, flags=re.I) if re.search(r"</body>", src, re.I) else src + tail
    out = popup.parent / TEMP_NAME
    out.write_text(src, encoding="utf-8")
    return out


def chrome(args: list[str]) -> str:
    base = [CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", "--no-first-run",
            "--window-size=360,600", "--virtual-time-budget=6000"]
    try:
        r = subprocess.run(base + args, capture_output=True, text=True, timeout=90)
    except subprocess.TimeoutExpired:
        return ""  # reported as "no result" for this popup; the sweep continues
    return r.stdout


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("targets", nargs="*", help="extension folders relative to the repo root")
    ap.add_argument("--json", type=Path, help="write the full report here")
    ap.add_argument("--shots", type=Path, help="write a screenshot per popup into this folder")
    ap.add_argument("--theme", default="seoul", help="theme for --shots")
    a = ap.parse_args()

    pages = popups(a.targets)
    srv, port = serve()
    report: dict[str, dict] = {}
    gated_fail = 0
    try:
        for p in pages:
            rel = p.relative_to(ROOT).as_posix()
            if a.shots:
                tmp = temp_page(p, "shot", a.theme)
                try:
                    a.shots.mkdir(parents=True, exist_ok=True)
                    name = rel.replace("/", "__").replace(".html", f"__{a.theme}.png")
                    chrome([f"--screenshot={a.shots / name}", f"http://127.0.0.1:{port}/{tmp.relative_to(ROOT).as_posix()}"])
                finally:
                    tmp.unlink(missing_ok=True)
                continue
            tmp = temp_page(p, "measure", None)
            try:
                dom = chrome(["--dump-dom", f"http://127.0.0.1:{port}/{tmp.relative_to(ROOT).as_posix()}"])
            finally:
                tmp.unlink(missing_ok=True)
            m = re.search(r'<pre id="__sweep">(\{.*?)</pre>', dom, re.S)
            if not m:
                report[rel] = {"error": "no result (page did not finish)"}
                print(f"  ??  {rel}: no result")
                continue
            res = json.loads(html.unescape(m.group(1)))
            report[rel] = res
            bad = {t: len(res[t]["fails"]) for t in GATED if res[t]["fails"]}
            gated_fail += sum(bad.values())
            worst = min(res[t]["worst"] for t in GATED)
            flag = "FAIL" if bad else " ok "
            print(f"  {flag} {rel}  worst(new)={worst}  " + (" ".join(f"{t}:{n}" for t, n in bad.items()) if bad else ""))
    finally:
        srv.shutdown()

    if a.json:
        a.json.write_text(json.dumps(report, indent=1))
    if not a.shots:
        print(f"\n{len(pages)} popups, {gated_fail} text nodes below AA in gated themes ({', '.join(GATED)})")
    return 1 if gated_fail else 0


if __name__ == "__main__":
    sys.exit(main())
