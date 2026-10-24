'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { inWindow, DEFAULTS, KEYS } = require('../src/shared/storage.js');
const fs = require('node:fs');
const path = require('node:path');
test('time window crossing midnight', () => {
  const at = (h, m) => { const d = new Date(2026, 0, 1, h, m); return d; };
  assert.equal(inWindow('20:00', '07:00', at(23, 0)), true);
  assert.equal(inWindow('20:00', '07:00', at(3, 0)), true);
  assert.equal(inWindow('20:00', '07:00', at(12, 0)), false);
  assert.equal(inWindow('09:00', '17:00', at(12, 0)), true);
  assert.equal(inWindow('09:00', '17:00', at(17, 0)), false);
});

test('KEYS and the literal get() list match DEFAULTS exactly', () => {
  assert.deepEqual([...KEYS].sort(), Object.keys(DEFAULTS).sort());
  const src = fs.readFileSync(path.join(__dirname, '../src/shared/storage.js'), 'utf8');
  const m = /storage\.local\.get\(\[([^\]]+)\]\)/.exec(src);
  const literal = m[1].match(/'(\w+)'/g).map(s => s.slice(1, -1));
  assert.deepEqual(literal.sort(), Object.keys(DEFAULTS).sort());
});
