'use strict';
// Regression test for BUG-006: inject.js is registered with run_at: document_start
// (world: MAIN), where document.body is still null. Evaluating the script in that
// state must not throw — a throw at load would surface as an uncaught TypeError
// on every YouTube page. Run: node tests/inject-document-start.test.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const src = fs.readFileSync(path.join(__dirname, '..', 'inject.js'), 'utf8');

function makeDocumentStartSandbox() {
  const observed = [];
  class MutationObserver {
    constructor(cb) { this.cb = cb; }
    observe(target, opts) { observed.push({ target, opts }); }
    disconnect() {}
  }
  class XMLHttpRequest {
    open() {}
    send() {}
    addEventListener() {}
  }
  const documentElement = { style: {} };
  const document = {
    documentElement,
    body: null,                 // the document_start reality
    querySelector: () => null,
    querySelectorAll: () => [],
  };
  const sandbox = {
    console,
    document,
    MutationObserver,
    XMLHttpRequest,
    fetch: async () => ({ clone() { return this; }, text: async () => '{}' }),
    Response: class { constructor(b, i) { this.b = b; this.i = i; } },
    JSON, Object, Promise, Array, String, Error, TypeError, Symbol, Reflect, Proxy,
  };
  sandbox.window = sandbox;
  sandbox.self = sandbox;
  sandbox.globalThis = sandbox;
  return { sandbox, observed };
}

let failures = 0;
function check(name, fn) {
  try { fn(); console.log('ok   - ' + name); }
  catch (e) { failures++; console.log('FAIL - ' + name + '\n       ' + (e && e.stack || e)); }
}

check('inject.js evaluates at document_start (document.body === null) without throwing', () => {
  const { sandbox, observed } = makeDocumentStartSandbox();
  vm.runInNewContext(src, sandbox, { filename: 'inject.js' });
  if (observed.length !== 1) throw new Error('expected exactly 1 MutationObserver.observe call, got ' + observed.length);
  if (observed[0].target !== sandbox.document.documentElement) throw new Error('observer must watch documentElement');
});

check('observer callback tolerates a mutation that fires before <body> exists', () => {
  const { sandbox } = makeDocumentStartSandbox();
  let cb = null;
  sandbox.MutationObserver = class { constructor(c) { cb = c; } observe() {} disconnect() {} };
  vm.runInNewContext(src, sandbox, { filename: 'inject.js' });
  if (typeof cb !== 'function') throw new Error('no observer callback captured');
  cb([]); // body still null here
});

check('inject.js must not use setInterval for DOM watching', () => {
  const code = src.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');
  if (/\bsetInterval\s*\(/.test(code)) throw new Error('setInterval( call found in inject.js');
});

if (failures) { console.log(`\n${failures} failing`); process.exit(1); }
console.log('\nall checks passed');
