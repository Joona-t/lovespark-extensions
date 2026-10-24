"""Live-site bench: first-paint darkness (flash), main-thread CPU during a 20 s scroll,
JS heap delta, AA contrast coverage, inverted images. Writes bench/results.json.
Columns: baseline (no extension) and dmr. Pass --darkreader <unpacked dir> to add a Dark Reader column."""
import json, time, sys, statistics
from pathlib import Path
from playwright.sync_api import sync_playwright
from run import launch, MEASURE_JS, EXT

LIGHT = ["https://en.wikipedia.org/wiki/Dark_mode", "https://news.ycombinator.com/", "https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme",
         "https://stackoverflow.com/questions/tagged/css", "https://www.gutenberg.org/", "https://docs.python.org/3/tutorial/",
         "https://www.bbc.com/news", "https://github.com/darkreader/darkreader", "https://www.w3.org/WAI/WCAG21/quickref/", "https://html.spec.whatwg.org/multipage/"]
DARK = ["https://github.com/darkreader/darkreader", "https://developer.mozilla.org/en-US/docs/Web/CSS/color-scheme", "https://www.youtube.com/",
        "https://html.spec.whatwg.org/multipage/", "https://docs.python.org/3/tutorial/", "https://stackoverflow.com/questions/tagged/css",
        "https://en.wikipedia.org/wiki/Dark_mode", "https://news.ycombinator.com/", "https://www.gutenberg.org/", "https://www.w3.org/WAI/WCAG21/quickref/"]
# DARK list = same sites loaded with the OS in dark mode (prefers-color-scheme: dark): the ones that honour it must be left alone.

FIRST_PAINT_JS = """() => new Promise(r => { const t0 = performance.now(); requestAnimationFrame(() => requestAnimationFrame(() => {
  const c = document.createElement('canvas'); r({ t: performance.now() - t0 }); })); })"""

def run_one(ctx, url, dark_scheme):
    page = ctx.new_page()
    page.emulate_media(color_scheme="dark" if dark_scheme else "light")
    cdp = ctx.new_cdp_session(page)
    cdp.send("Performance.enable")
    t0 = time.time()
    try:
        page.goto(url, wait_until="domcontentloaded", timeout=45000)
    except Exception as e:
        page.close(); return {"url": url, "error": str(e)[:120]}
    # screenshot as early as we can after DCL: mean luminance tells us if the first visible frame was dark
    shot = page.screenshot(type="jpeg", quality=30)
    early_lum = mean_lum(shot)
    try: page.wait_for_load_state("load", timeout=30000)
    except Exception: pass
    time.sleep(1.0)
    m0 = cdp.send("Performance.getMetrics")["metrics"]
    task0 = next(x["value"] for x in m0 if x["name"] == "TaskDuration")
    heap0 = next(x["value"] for x in m0 if x["name"] == "JSHeapUsedSize")
    for _ in range(20):  # 10 s of scrolling, 500 ms apart
        page.mouse.wheel(0, 600); time.sleep(0.5)
    m1 = cdp.send("Performance.getMetrics")["metrics"]
    task1 = next(x["value"] for x in m1 if x["name"] == "TaskDuration")
    heap1 = next(x["value"] for x in m1 if x["name"] == "JSHeapUsedSize")
    page.evaluate("window.scrollTo(0,0)"); time.sleep(0.4)
    meas = page.evaluate(MEASURE_JS)
    page.close()
    return {"url": url, "earlyLum": round(early_lum, 3), "cpuMs": round((task1 - task0) * 1000), "heapMB": round((heap1 - heap0) / 1e6, 1),
            "textNodes": meas["textNodes"], "aaPct": round(100 * meas["aaPass"] / max(1, meas["textNodes"]), 1), "inverted": meas["inverted"],
            "bodyLum": round(meas["bodyLum"] or 0, 3), "classes": meas["classes"], "themeBytes": meas["themeBytes"], "loadS": round(time.time() - t0, 1)}

def mean_lum(jpeg_bytes):
    from PIL import Image; import io
    im = Image.open(io.BytesIO(jpeg_bytes)).convert("L").resize((64, 40))
    return sum(im.get_flattened_data() if hasattr(im, "get_flattened_data") else im.getdata()) / (64 * 40 * 255)

def run_sites(n, darkreader=None):
    results = {"baseline": [], "dmr": [], "darkreader": []}
    configs = [("baseline", None), ("dmr", str(EXT))] + ([("darkreader", darkreader)] if darkreader else [])
    with sync_playwright() as p:
        for name, ext in configs:
            if ext: ctx = launch(p, ext)
            else: ctx = p.chromium.launch_persistent_context(str(Path("/tmp") / f"dmr-base-{int(time.time())}"), headless=False, args=["--window-position=-2400,-2400", "--no-first-run"])
            for url in LIGHT[:n]:
                r = run_one(ctx, url, False); r["scheme"] = "light"; results[name].append(r); print(name, "light", r)
            for url in DARK[:n]:
                r = run_one(ctx, url, True); r["scheme"] = "dark"; results[name].append(r); print(name, "dark", r)
            ctx.close()
    out = EXT / "bench" / "results.json"
    out.write_text(json.dumps({"date": time.strftime("%Y-%m-%d"), "results": results}, indent=1))
    summarize(results)

def summarize(results):
    def col(rows, key, scheme=None):
        v = [r[key] for r in rows if "error" not in r and (scheme is None or r["scheme"] == scheme) and r.get(key) is not None]
        return statistics.median(v) if v else None
    for name, rows in results.items():
        if not rows: continue
        print(f"\n== {name} ==  sites ok: {sum('error' not in r for r in rows)}/{len(rows)}")
        print(" light pages: early-frame luminance median", col(rows, "earlyLum", "light"), "| body lum", col(rows, "bodyLum", "light"),
              "| AA% median", col(rows, "aaPct", "light"), "| cpu ms median", col(rows, "cpuMs", "light"), "| heap MB", col(rows, "heapMB", "light"), "| inverted", sum(r.get("inverted", 0) for r in rows))
        print(" dark-scheme pages: body lum median", col(rows, "bodyLum", "dark"), "| themed", sum("dmr-on" in r.get("classes", "") for r in rows if r.get("scheme") == "dark"), "| stood down", sum("dmr-off" in r.get("classes", "") for r in rows if r.get("scheme") == "dark"))

if __name__ == "__main__":
    import argparse; ap = argparse.ArgumentParser(); ap.add_argument("--n", type=int, default=10); ap.add_argument("--darkreader")
    a = ap.parse_args(); run_sites(a.n, a.darkreader)
