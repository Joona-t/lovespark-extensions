// Regression test for BUG-001: theme dropdown trigger's aria-expanded must track the menu's open state.
// Run: node --test "tests/**/*.test.js"
'use strict';
const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function makeEl(id) {
  const classes = new Set();
  const attrs = {};
  const handlers = {};
  return {
    id, dataset: {}, style: {}, checked: false, value: '', textContent: '',
    classList: {
      add: c => classes.add(c), remove: c => classes.delete(c),
      toggle: c => (classes.has(c) ? (classes.delete(c), false) : (classes.add(c), true)),
      contains: c => classes.has(c),
    },
    setAttribute: (k, v) => { attrs[k] = v; }, getAttribute: k => attrs[k],
    addEventListener: (type, fn) => { (handlers[type] ||= []).push(fn); },
    dispatch: (type, e = {}) => (handlers[type] || []).forEach(fn => fn({ stopPropagation() {}, target: { closest: () => null }, ...e })),
    closest: () => null,
    insertAdjacentHTML() {},
  };
}

function loadPopup() {
  const els = {};
  const byId = id => (els[id] ||= makeEl(id));
  const docHandlers = {};
  const document = {
    body: byId('body'),
    getElementById: byId,
    querySelectorAll: () => [],
    querySelector: () => null,
    addEventListener: (type, fn) => { (docHandlers[type] ||= []).push(fn); },
    dispatch: type => (docHandlers[type] || []).forEach(fn => fn({})),
  };
  const chrome = {
    storage: {
      local: {
        get: (keys, cb) => { if (cb) cb({}); return Promise.resolve({}); },
        set: () => Promise.resolve(),
      },
      onChanged: { addListener() {} },
    },
  };
  const ctx = vm.createContext({ document, chrome, LoveSparkFooter: { render: () => '' }, console, Date, Math,
    // Stub timers: popup.js starts a real setInterval at init, which would keep the test process alive.
    setTimeout: () => 0, setInterval: () => 0, clearInterval() {}, clearTimeout() {} });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'popup.js'), 'utf8'), ctx, { filename: 'popup.js' });
  byId('themeToggle').setAttribute('aria-expanded', 'false'); // as shipped in popup.html
  return { toggle: byId('themeToggle'), menu: byId('themeMenu'), document };
}

test('aria-expanded flips to true when the theme menu opens', () => {
  const { toggle, menu } = loadPopup();
  toggle.dispatch('click');
  assert.strictEqual(menu.classList.contains('open'), true);
  assert.strictEqual(toggle.getAttribute('aria-expanded'), 'true');
});

test('aria-expanded returns to false when the trigger closes the menu', () => {
  const { toggle } = loadPopup();
  toggle.dispatch('click');
  toggle.dispatch('click');
  assert.strictEqual(toggle.getAttribute('aria-expanded'), 'false');
});

test('aria-expanded returns to false on outside click', () => {
  const { toggle, menu, document } = loadPopup();
  toggle.dispatch('click');
  document.dispatch('click');
  assert.strictEqual(menu.classList.contains('open'), false);
  assert.strictEqual(toggle.getAttribute('aria-expanded'), 'false');
});

test('aria-expanded returns to false after picking a theme option', () => {
  const { toggle, menu } = loadPopup();
  toggle.dispatch('click');
  menu.dispatch('click', { target: { closest: () => ({ dataset: { theme: 'dark' } }) } });
  assert.strictEqual(toggle.getAttribute('aria-expanded'), 'false');
});
