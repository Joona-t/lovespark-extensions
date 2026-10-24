const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
for (const category of fs.readdirSync(root, { withFileTypes: true })) {
  if (!category.isDirectory() || category.name.startsWith('.') || ['node_modules', 'work'].includes(category.name)) continue;
  for (const extension of fs.readdirSync(path.join(root, category.name), { withFileTypes: true })) {
    const dir = path.join(root, category.name, extension.name);
    if (!extension.isDirectory() || !fs.existsSync(path.join(dir, 'manifest.json'))) continue;
    test(`${category.name}/${extension.name}: manifest resources and locale JSON`, () => {
      const m = JSON.parse(fs.readFileSync(path.join(dir, 'manifest.json'), 'utf8'));
      assert.equal(m.manifest_version, 3);
      const icons = value => typeof value === 'string' ? [value] : Object.values(value || {});
      const webResources = (m.web_accessible_resources || []).flatMap(r => typeof r === 'string' ? [r] : r.resources || []).filter(r => !r.includes('*'));
      const refs = [...webResources, ...icons(m.icons), ...icons(m.action?.default_icon), m.action?.default_popup, m.options_page, m.options_ui?.page, m.background?.service_worker, ...(m.background?.scripts || []), ...Object.values(m.chrome_url_overrides || {}), ...(m.content_scripts || []).flatMap(s => [...s.js || [], ...s.css || []]), ...(m.declarative_net_request?.rule_resources || []).map(r => r.path)].filter(Boolean);
      for (const ref of refs) assert.ok(fs.existsSync(path.join(dir, ref)), `missing manifest resource ${ref}`);
      if (m.default_locale) {
        const locales = path.join(dir, '_locales');
        assert.ok(fs.existsSync(path.join(locales, m.default_locale, 'messages.json')), 'missing default locale');
        for (const locale of fs.readdirSync(locales)) {
          const file = path.join(locales, locale, 'messages.json');
          if (fs.existsSync(file)) JSON.parse(fs.readFileSync(file, 'utf8'));
        }
      }
    });
  }
}
