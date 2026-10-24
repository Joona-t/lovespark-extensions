import sys, time; sys.path.insert(0, 'bench')
from run import launch, EXT
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    ctx = launch(p, EXT)
    page = ctx.new_page()
    page.goto("chrome://extensions"); time.sleep(0.5)
    eid = page.evaluate("""() => { const mgr=document.querySelector('extensions-manager'); const list=mgr.shadowRoot.querySelector('extensions-item-list'); return [...list.shadowRoot.querySelectorAll('extensions-item')][0].id; }""")
    errs = []
    for name, w in (("popup.html", 320), ("settings.html", 900)):
        pg = ctx.new_page(); pg.set_viewport_size({"width": w, "height": 700})
        pg.on("console", lambda m: errs.append(m.text) if m.type == "error" else None)
        pg.on("pageerror", lambda e: errs.append(str(e)))
        pg.goto(f"chrome-extension://{eid}/{name}"); time.sleep(1.2)
        pg.screenshot(path=f"bench/shot-{name.split('.')[0]}.png", full_page=True)
        print(name, "status:", pg.evaluate("document.getElementById('status-text')?.textContent || document.querySelector('.stat-big')?.textContent"))
        print(name, "scrollWidth/clientWidth:", pg.evaluate("[document.documentElement.scrollWidth, document.documentElement.clientWidth]"))
    print("errors:", errs)
    ctx.close()
