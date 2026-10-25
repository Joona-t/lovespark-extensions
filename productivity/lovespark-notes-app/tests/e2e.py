"""End-to-end check of LoveSpark Notes (new tab), loaded as a real unpacked extension.

Covers themes (incl. the candy -> bubblegum migration), plain-text bullets, custom
categories, How it works & FAQ, rendered text contrast in all six themes, and
layout at 360/320px.

    uv run --with playwright python3 tests/e2e.py . /tmp/notes-shots
    # optional: CHROMIUM=/path/to/full/chromium (extensions need full Chromium,
    # not the headless shell)
"""
import os, sys, tempfile, json
from pathlib import Path
from playwright.sync_api import sync_playwright

EXT = os.path.abspath(sys.argv[1])
OUT = Path(sys.argv[2]); OUT.mkdir(parents=True, exist_ok=True)
results, errors = [], []

def check(name, ok, detail=''):
    results.append((name, bool(ok), detail))

with sync_playwright() as p:
    ctx = p.chromium.launch_persistent_context(
        tempfile.mkdtemp(), executable_path=os.environ.get('CHROMIUM') or None, headless=True, viewport={'width': 1280, 'height': 860},
        args=[f'--disable-extensions-except={EXT}', f'--load-extension={EXT}'])
    page = ctx.new_page()
    page.on('console', lambda m: m.type == 'error' and errors.append(m.text))
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.goto('chrome://newtab')
    page.wait_for_selector('.note-card')
    url = page.url
    check('new tab is the extension', url.startswith('chrome-extension://') and url.endswith('/newtab.html'), url)

    st = lambda: page.evaluate("chrome.storage.local.get(null)")
    body = lambda: page.evaluate("document.body.className")

    # ── Themes ──
    check('default theme bubblegum', 'theme-bubblegum' in body() and page.inner_text('#themeLabel') == 'Bubblegum', body())
    page.screenshot(path=str(OUT / 'bubblegum.png'))
    page.evaluate("chrome.storage.local.set({theme:'candy'})"); page.reload(); page.wait_for_selector('.note-card')
    check('saved candy migrates', 'theme-bubblegum' in body() and st()['theme'] == 'bubblegum', st().get('theme'))
    page.click('#themeToggle')
    check('menu aria-expanded', page.get_attribute('#themeToggle', 'aria-expanded') == 'true')
    check('six themes listed', page.locator('#themeMenu .theme-option').count() == 6)
    page.click('#themeMenu .theme-option[data-theme="seoul"]')
    check('seoul applied + saved', 'theme-seoul' in body() and st()['theme'] == 'seoul' and page.inner_text('#themeLabel') == 'Seoul Y2K')
    bg = page.evaluate("getComputedStyle(document.body).backgroundImage")
    check('seoul gradient renders', '223, 241, 255' in bg, bg[:60])
    page.screenshot(path=str(OUT / 'seoul.png'))
    for t in ['retro', 'dark', 'beige', 'slate']:
        page.click('#themeToggle'); page.click(f'#themeMenu .theme-option[data-theme="{t}"]')
        check(f'{t} applied', f'theme-{t}' in body())
    page.click('#themeToggle'); page.click('#themeMenu .theme-option[data-theme="seoul"]')

    # ── Bullets ──
    page.click('#fabNew'); page.wait_for_timeout(200)
    ta = page.locator('#editorContent'); ta.click()
    page.keyboard.type('- milk')
    check('dash-space becomes bullet', ta.input_value() == '• milk', repr(ta.input_value()))
    check('button pressed on bullet line', page.get_attribute('#editorBullet', 'aria-pressed') == 'true')
    page.keyboard.press('Enter'); page.keyboard.type('eggs')
    check('enter continues list', ta.input_value() == '• milk\n• eggs', repr(ta.input_value()))
    page.keyboard.press('Tab')
    check('tab indents bullet', ta.input_value().endswith('\n  • eggs'), repr(ta.input_value()))
    page.keyboard.press('Shift+Tab')
    check('shift-tab outdents', ta.input_value().endswith('\n• eggs'), repr(ta.input_value()))
    page.keyboard.press('Enter'); page.keyboard.press('Enter')
    check('enter on empty bullet ends list', ta.input_value() == '• milk\n• eggs\n', repr(ta.input_value()))
    page.keyboard.type('plain line')
    page.keyboard.press('Meta+a') if sys.platform == 'darwin' else page.keyboard.press('Control+a')
    page.click('#editorBullet')
    check('toggle bullets whole selection', ta.input_value() == '• milk\n• eggs\n• plain line', repr(ta.input_value()))
    page.keyboard.press('Meta+a'); page.click('#editorBullet')
    check('toggle removes all bullets', ta.input_value() == 'milk\neggs\nplain line', repr(ta.input_value()))
    page.keyboard.press('Meta+z')
    check('undo restores bullets', ta.input_value() == '• milk\n• eggs\n• plain line', repr(ta.input_value()))
    # keyboard escape hatch: Esc then Tab leaves the editor
    page.keyboard.press('Meta+ArrowDown'); page.keyboard.press('Escape'); page.keyboard.press('Tab')
    check('Esc then Tab leaves editor', page.evaluate("document.activeElement.id") != 'editorContent',
          page.evaluate("document.activeElement.id || document.activeElement.className"))
    check('editor still open after first Esc', page.is_visible('#editorActive'))
    page.wait_for_timeout(600)
    note_id = page.evaluate("state.selectedId")
    saved = st().get('note_' + note_id)
    check('bullets saved to storage', saved == '• milk\n• eggs\n• plain line', repr(saved))
    wc = page.inner_text('#editorWordCount')
    check('word count ignores bullets', wc == '4w', wc)

    # ── Custom categories ──
    page.click('#catAdd')
    check('category dialog open', page.evaluate("document.getElementById('catDialog').open"))
    page.click('#catSave')
    check('empty name rejected', 'name' in page.inner_text('#catError'), page.inner_text('#catError'))
    page.fill('#catName', 'idea'); page.click('#catSave')
    check('duplicate name rejected', 'already' in page.inner_text('#catError'), page.inner_text('#catError'))
    page.fill('#catName', 'Books'); page.fill('#catEmoji', '\U0001F4DA'); page.click('#catSave')
    cats = st()['prefs']['categories']
    books = next((c for c in cats if c['label'] == 'Books'), None)
    check('category saved', books and books['emoji'] == '\U0001F4DA' and not books['builtin'], json.dumps(cats)[:120])
    page.wait_for_timeout(300)
    check('new tab active', page.get_attribute('.cat-tab.active', 'data-cat') == books['id'], page.get_attribute('.cat-tab.active', 'data-cat'))
    page.click('#fabNew'); page.wait_for_timeout(200)
    nid = page.evaluate("state.selectedId")
    check('new note lands in custom category', page.evaluate(f"state.index.find(n=>n.id==='{nid}').category") == books['id'])
    check('editor select shows it', page.input_value('#editorCategory') == books['id'])
    page.reload(); page.wait_for_selector('.cat-tab')
    check('custom category persists after reload', page.locator(f'.cat-tab[data-cat="{books["id"]}"]').count() == 1)
    # editor select "+ New category…" assigns the new category to the open note
    page.click('#categoryTabs .cat-tab[data-cat="all"]')
    page.locator('.note-card').first.click()
    first = page.evaluate("state.selectedId")
    page.select_option('#editorCategory', '__new__')
    page.fill('#catName', 'Recipes'); page.click('#catSave'); page.wait_for_timeout(200)
    rec = next(c for c in st()['prefs']['categories'] if c['label'] == 'Recipes')
    check('select → new category assigns note', page.evaluate(f"state.index.find(n=>n.id==='{first}').category") == rec['id'])
    # rename + delete Books
    page.click(f'.cat-tab[data-cat="{books["id"]}"]')
    check('edit button shows for custom', page.is_visible('#catEdit'))
    page.click('#catEdit'); page.fill('#catName', 'Reading'); page.click('#catSave')
    check('rename works', any(c['label'] == 'Reading' for c in st()['prefs']['categories']))
    page.click('#fabNew'); page.wait_for_timeout(300)   # one more note filed under Books (active tab)
    in_books = page.evaluate(f"state.index.filter(n=>n.category==='{books['id']}').map(n=>n.id)")
    page.click('#catEdit'); page.click('#catDelete')
    page.click('.confirm-overlay .confirm-btn-danger'); page.wait_for_timeout(300)
    cats = st()['prefs']['categories']
    check('category deleted', not any(c['id'] == books['id'] for c in cats))
    stored = {n['id']: n['category'] for n in st()['note_index']}
    check('its notes kept, now uncategorized', in_books and all(stored.get(i) == 'uncategorized' for i in in_books),
          f'{in_books} -> {[stored.get(i) for i in in_books]}')
    check('no note lost', len(stored) == page.evaluate("state.index.length"))
    check('active tab falls back to All', page.get_attribute('.cat-tab.active', 'data-cat') == 'all')
    page.click('.cat-tab[data-cat="idea"]')
    check('edit hidden for built-in', not page.is_visible('#catEdit'))

    # ── Rendered contrast, every theme ──
    page.click('.cat-tab[data-cat="all"]'); page.locator('.note-card').first.click()
    js = """() => {
      const parse = c => { const m = c.match(/[\d.]+/g) || [0,0,0,0]; return [+m[0], +m[1], +m[2], m[3] === undefined ? 1 : +m[3]]; };
      const lum = ([r,g,b]) => { const f = v => { v /= 255; return v <= .03928 ? v/12.92 : ((v+.055)/1.055)**2.4; }; return .2126*f(r)+.7152*f(g)+.0722*f(b); };
      const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x,y)+.05)/(Math.min(x,y)+.05); };
      const hex = getComputedStyle(document.body).getPropertyValue('--ls-bg-pink-light').trim() || '#ffffff';
      const base = [1,3,5].map(i => parseInt(hex.slice(i, i+2), 16));
      const bgOf = el => { const layers = []; for (let n = el; n && n !== document.documentElement; n = n.parentElement) { const c = parse(getComputedStyle(n).backgroundColor); if (c[3] > 0) layers.push(c); }
        let out = base.slice(); for (let i = layers.length - 1; i >= 0; i--) { const [r,g,b,a] = layers[i]; out = [r*a+out[0]*(1-a), g*a+out[1]*(1-a), b*a+out[2]*(1-a)]; } return out; };
      const sels = ['.note-card-title','.note-card-meta span','.note-card-snippet','.cat-tab:not(.active)','.cat-tab.active','.fab','#helpBtn','#catAdd','#themeLabel','#editorTitle','#editorContent','.editor-meta span','.editor-bullet','.note-count','.editor-cat-select'];
      return sels.map(s => { const el = document.querySelector(s); if (!el) return [s, null];
        const c = parse(getComputedStyle(el).color); const bg = bgOf(el);
        const fg = [c[0]*c[3]+bg[0]*(1-c[3]), c[1]*c[3]+bg[1]*(1-c[3]), c[2]*c[3]+bg[2]*(1-c[3])];
        return [s, Math.round(ratio(fg, bg)*100)/100]; });
    }"""
    for t in ['bubblegum', 'retro', 'dark', 'beige', 'slate', 'seoul']:
        page.evaluate(f"chrome.storage.local.set({{theme:'{t}'}})"); page.reload(); page.wait_for_selector('.note-card')
        page.locator('.note-card').first.click(); page.wait_for_timeout(600)   # let colour transitions settle
        res = page.evaluate(js)
        low = [f'{s}={r}' for s, r in res if r is not None and r < 4.5]
        check(f'{t}: all text >= 4.5:1 ({len([r for _, r in res if r])} elements, min {min(r for _, r in res if r)})', not low, low)
    page.click('#themeToggle'); page.click('#themeMenu .theme-option[data-theme="seoul"]')

    # ── How it works & FAQ ──
    box_help = page.locator('#helpBtn').bounding_box(); box_view = page.locator('.view-toggle').bounding_box()
    check('FAQ button left of view toggle', box_help['x'] + box_help['width'] <= box_view['x'])
    page.click('#helpBtn')
    check('help dialog opens', page.evaluate("document.getElementById('helpDialog').open"))
    last = page.locator('.faq details').last
    last.locator('summary').click()
    link = last.locator('a')
    check('last FAQ links lovespark.love tools', link.get_attribute('href') == 'https://lovespark.love/#tools'
          and link.get_attribute('target') == '_blank' and 'noopener' in link.get_attribute('rel'))
    page.screenshot(path=str(OUT / 'faq.png'))
    page.keyboard.press('Escape')
    check('Esc closes help, focus returns', not page.evaluate("document.getElementById('helpDialog').open")
          and page.evaluate("document.activeElement.id") == 'helpBtn')

    # narrow viewports: every visible control inside the viewport, no two overlapping
    page.click('.cat-tab[data-cat="all"]'); page.locator('.note-card').first.click()
    probe = """() => {
      const sel = '.top-bar button, .top-bar input, .category-bar > button, .editor-toolbar select, .editor-toolbar button, .fab';
      const els = [...document.querySelectorAll(sel)].filter(e => e.offsetParent !== null || e.classList.contains('fab'));
      const r = els.map(e => [e.id || e.className, e.getBoundingClientRect()]);
      const out = r.filter(([, b]) => b.right > innerWidth + 0.5 || b.left < -0.5).map(([n]) => n);
      const lap = [];
      for (let i = 0; i < r.length; i++) for (let j = i + 1; j < r.length; j++) {
        const [a, A] = r[i], [b, B] = r[j];
        if (a === 'fab' || b === 'fab') continue;
        if (A.left < B.right - 0.5 && B.left < A.right - 0.5 && A.top < B.bottom - 0.5 && B.top < A.bottom - 0.5) lap.push(a + '/' + b);
      }
      const small = r.filter(([, b]) => b.height < 31.5 && b.width > 0).map(([n, b]) => n + ':' + Math.round(b.height));
      return { out, lap, small };
    }"""
    for w in (360, 320):
        page.set_viewport_size({'width': w, 'height': 800}); page.wait_for_timeout(150)
        res = page.evaluate(probe)
        check(f'{w}px: controls inside viewport', not res['out'], res['out'])
        check(f'{w}px: no overlapping controls', not res['lap'], res['lap'])
        check(f'{w}px: touch targets >= 32px', not res['small'], res['small'])
        page.screenshot(path=str(OUT / f'narrow-{w}.png'))
    ctx.close()

check('no console errors', not errors, '; '.join(errors)[:300])
for name, ok, detail in results:
    print(('PASS ' if ok else 'FAIL ') + name + (('  [' + str(detail) + ']') if detail and not ok else ''))
print(f"{sum(ok for _, ok, _ in results)}/{len(results)} passed")
sys.exit(0 if all(ok for _, ok, _ in results) else 1)
