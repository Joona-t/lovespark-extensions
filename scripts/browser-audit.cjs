// Real unpacked-extension smoke tests. No browser API mocks or personal profiles.
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const scenarios = require('./functional-scenarios.cjs');
const contentScenarios = require('./content-scenarios.cjs');
const root = path.resolve(__dirname, '..');
const output = path.join(root, 'work', process.env.AUDIT_RUN || 'browser-audit');
fs.mkdirSync(output, { recursive: true });
const scope = require('./published-scope.cjs');
const selected = process.env.EXTENSIONS?.split(',');
if (selected?.some(name => !scope.some(folder => folder.endsWith('/' + name)))) {
  throw new Error('EXTENSIONS must contain only published screenshot projects from published-scope.cjs');
}
const folders = scope.filter(folder => !selected || selected.some(name => folder.endsWith('/' + name)));
(async () => {
  const context = await chromium.launchPersistentContext('', {
    ignoreDefaultArgs: ['--disable-extensions'],
    channel: 'chromium', headless: true, executablePath: process.env.CHROMIUM_PATH,
    args: ['--enable-unsafe-extension-debugging', '--disable-component-update'],
  });
  context.setDefaultTimeout(5000);
  const cdp = await context.browser().newBrowserCDPSession();
  const results = [];
  try {
    for (const folder of folders) {
      const manifest = JSON.parse(fs.readFileSync(path.join(root, folder, 'manifest.json')));
      const result = { folder, version: manifest.version, errors: [], pages: [] };
      let id;
      try {
        ({ id } = await cdp.send('Extensions.loadUnpacked', { path: path.join(root, folder) }));
        result.loaded = true;
        result.id = id;
        const extraPages = { 'productivity/lovespark-notes': ['app/app.html'], 'privacy/porn-blocker-rewire-brain': ['dashboard.html'] };
        const pages = [...new Set([...(extraPages[folder] || []),manifest.action?.default_popup, manifest.options_page, manifest.options_ui?.page, ...Object.values(manifest.chrome_url_overrides || {})].filter(Boolean))];
        if (manifest.background?.service_worker) {
          const worker = context.serviceWorkers().find(w => w.url().startsWith(`chrome-extension://${id}/`)) || await context.waitForEvent('serviceworker', { predicate: w => w.url().startsWith(`chrome-extension://${id}/`), timeout: 5000 });
          await new Promise(resolve => setTimeout(resolve, 200));
          result.worker = await worker.evaluate(() => ({ id: chrome.runtime.id, version: chrome.runtime.getManifest().version, messageListener: chrome.runtime.onMessage.hasListeners() }));
          const workerSource = fs.readFileSync(path.join(root, folder, manifest.background.service_worker), 'utf8');
          if (workerSource.includes('onMessage.addListener') && !result.worker.messageListener) result.errors.push('Service worker did not register its message listener');
        }
        if (folder === 'privacy/porn-blocker-rewire-brain') {
          const onboarding = await context.newPage();
          await onboarding.goto(`chrome-extension://${id}/onboarding.html`);
          await onboarding.locator('#inputReason').fill('Browser regression test');
          await onboarding.locator('#btnStart').click();
          await onboarding.waitForURL('**/dashboard.html');
          result.onboarding = 'completed through UI';
          await onboarding.close();
        }
        for (const relative of pages) {
          const page = await context.newPage();
          const errors = [];
          page.on('pageerror', e => errors.push(e.message));
          page.on('console', m => { if(m.type() === 'error') errors.push(m.text()); });
          page.on('requestfailed', r => { if(r.url().startsWith(`chrome-extension://${id}/`)) errors.push(`${r.url().replace(id, '<id>')}: ${r.failure()?.errorText}`); });
          await page.goto(`chrome-extension://${id}/${relative}`);
          await page.waitForTimeout(500);
          if (process.env.FUNCTIONAL && relative === manifest.action?.default_popup) await scenarios({page, context, folder, manifest, result});
          const ui = await page.evaluate(() => ({
            controls: Array.from(document.querySelectorAll('button,input,select,textarea')).map(e => ({id:e.id, type:e.type, text:e.innerText?.trim().slice(0,65), checked:e.checked, label:e.getAttribute('aria-label')})),
            title: document.title, textLength: document.body?.innerText.length,
            width: document.documentElement.scrollWidth,
            brokenImages: Array.from(document.images).filter(i => i.getAttribute('src') && (!i.complete || !i.naturalWidth)).map(i => i.getAttribute('src')),
            unnamedControls: Array.from(document.querySelectorAll('button,input,select,textarea')).filter(e => e.getBoundingClientRect().width && !e.getAttribute('aria-label') && !e.getAttribute('aria-labelledby') && !e.labels?.length && !e.innerText?.trim() && !e.title && !e.placeholder && !['hidden','range','checkbox','color'].includes(e.type)).map(e => e.id || e.outerHTML.slice(0,120)),
          }));
          if (await page.locator('#footerMount').count() && !await page.locator('#footerMount .ls-footer').count()) errors.push('Shared footer did not render');
          if (ui.brokenImages.length) errors.push('Broken images: ' + ui.brokenImages.join(', '));
          await page.screenshot({ path: path.join(output, `${folder.replaceAll('/', '--')}--${relative.replaceAll('/', '--')}.png`), fullPage: true });
          result.pages.push({ path: relative, ...ui, errors });
          result.errors.push(...errors);
          await page.close();
        }
        if (process.env.CONTENT) await contentScenarios({context, folder, id, manifest, result});
      } catch (e) { result.errors.push(e.message.replaceAll(root, '<repo>')); }
      finally {
        if (id) await cdp.send('Extensions.uninstall', { id }).catch(e => result.errors.push(e.message));
        for (const page of context.pages()) await page.close();
      }
      results.push(result);
      fs.writeFileSync(path.join(output, 'results.json'), JSON.stringify(results, null, 2));
      console.log(`${result.errors.length ? 'FAIL' : 'PASS'} ${folder}: ${result.errors.join(' | ').slice(0,400)}`);
    }
  } finally { await context.close(); }
  console.log(JSON.stringify({ total: results.length, failed: results.filter(r => r.errors.length).length, output: path.relative(root, output) }));
  if(results.some(r => r.errors.length)) process.exitCode = 1;
})().catch(e => { console.error(e); process.exitCode = 1; });
