#!/usr/bin/env python3
"""Render cursor packs to a PNG contact sheet for visual self-review.

    python3 render_pack.py <pack-id>... [--out sheet.png]

Renders with headless Chrome (real SVG + first SMIL frame, like the live cursor).
Each cursor is shown at 4x and at NATIVE 32px on white, pastel-pink and dark
backgrounds — the native rows are what users actually see; judge those first.
Falls back to macOS Quick Look (white background only) if Chrome is missing.
"""
import os, sys, glob, base64, subprocess, tempfile, shutil

HERE = os.path.dirname(os.path.abspath(__file__))
KINDS = ["default", "pointer", "text", "wait"]
BGS = [("#ffffff", "#222"), ("#ffe4ec", "#222"), ("#1c1c20", "#ddd")]
CHROME = "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"

def data_uri(path):
    return "data:image/svg+xml;base64," + base64.b64encode(open(path, "rb").read()).decode()

def main():
    argv = sys.argv[1:]
    out = "sheet.png"
    if "--out" in argv:
        i = argv.index("--out"); out = argv[i + 1]; argv = argv[:i] + argv[i + 2:]
    args = [a for a in argv if not a.startswith("--")]
    packs = args or sorted(os.path.basename(p) for p in glob.glob(os.path.join(HERE, "cursors", "*"))
                           if os.path.exists(os.path.join(p, "default.svg")))
    rows = []
    for p in packs:
        cells = []
        for k in KINDS:
            svg = os.path.join(HERE, "cursors", p, k + ".svg")
            if not os.path.exists(svg):
                cells.append("<td></td>"); continue
            u = data_uri(svg)
            nat = "".join(f'<div class="nat" style="background:{bg}"><img src="{u}" width="32" height="32"></div>' for bg, _ in BGS)
            cells.append(f'<td><div class="big"><img src="{u}" width="128" height="128"></div><div class="nats">{nat}</div><div class="k">{k}</div></td>')
        rows.append(f'<tr><th>{p}</th>{"".join(cells)}</tr>')
    html = f"""<!doctype html><meta charset=utf-8><style>
    body{{margin:0;background:#eee;font:11px -apple-system,system-ui}} table{{border-collapse:collapse}}
    th{{text-align:left;padding:4px 8px;width:150px;max-width:150px;overflow:hidden;white-space:nowrap;font-size:12px}} td{{padding:4px;vertical-align:top}}
    .big{{background:#fff;border:1px solid #ccc;width:128px;height:128px}} .nats{{display:flex;margin-top:2px}}
    .nat{{width:40px;height:40px;display:flex;align-items:center;justify-content:center}} .k{{color:#666;text-align:center}}
    </style><table>{"".join(rows)}</table>"""
    tmp = tempfile.mkdtemp(); page = os.path.join(tmp, "sheet.html"); open(page, "w").write(html)
    h = 16 + 215 * len(packs); w = 170 + 4 * 150
    if os.path.exists(CHROME):
        subprocess.run([CHROME, "--headless=new", "--disable-gpu", "--hide-scrollbars", f"--window-size={w},{h}",
                        f"--screenshot={os.path.abspath(out)}", "file://" + page], capture_output=True, timeout=60)
    else:
        print("Chrome not found; Quick Look fallback is white-background only", file=sys.stderr)
        subprocess.run(["qlmanage", "-t", "-s", str(h), "-o", tmp, page], capture_output=True)
        shutil.copy(page + ".png", out)
    shutil.rmtree(tmp, ignore_errors=True)
    print(out)

if __name__ == "__main__":
    main()
