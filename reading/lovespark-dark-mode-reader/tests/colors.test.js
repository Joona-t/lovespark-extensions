'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const ok = require('../src/content/recolor/oklch.js');
const colors = require('../src/content/recolor/colors.js');
const { PALETTES } = require('../src/shared/palettes.js');
const P = PALETTES.noir;

test('parseColor handles hex/rgb/hsl/named/alpha', () => {
  assert.deepEqual(colors.parseColor('#fff'), { r:255,g:255,b:255,a:1 });
  assert.deepEqual(colors.parseColor('#80808080').a.toFixed(2), '0.50');
  assert.deepEqual(colors.parseColor('rgb(10, 20, 30)'), { r:10,g:20,b:30,a:1 });
  assert.deepEqual(colors.parseColor('rgba(10 20 30 / 50%)').a, 0.5);
  assert.deepEqual(colors.parseColor('hsl(0, 100%, 50%)'), { r:255,g:0,b:0,a:1 });
  assert.deepEqual(colors.parseColor('RebeccaPurple'), { r:102,g:51,b:153,a:1 });
  assert.equal(colors.parseColor('transparent'), null);
  assert.equal(colors.parseColor('currentColor'), null);
  assert.equal(colors.parseColor('var(--x)'), null);
  assert.equal(colors.parseColor('rgb(var(--r), 0, 0)'), null);
});

test('white background becomes dark, black text becomes light', () => {
  const bg = colors.parseColor(colors.rewriteDeclaration('background-color', '#ffffff', P));
  assert.ok(ok.rgbToOklch(bg.r,bg.g,bg.b).L < 0.2);
  const tx = colors.parseColor(colors.rewriteDeclaration('color', '#000', P));
  assert.ok(ok.rgbToOklch(tx.r,tx.g,tx.b).L > 0.8);
});

test('url() inside background is left alone, gradient stops are recoloured', () => {
  assert.equal(colors.rewriteDeclaration('background', 'url(white.png) no-repeat', P), null);
  const out = colors.rewriteDeclaration('background', 'url(red.png), linear-gradient(white, #eee)', P);
  assert.ok(out.includes('url(red.png)'));
  assert.ok(!out.includes('white'));
});

test('keywords that are not colours are not touched', () => {
  assert.equal(colors.rewriteDeclaration('border', '1px solid', P), null);
  assert.equal(colors.rewriteDeclaration('color', 'inherit', P), null);
  assert.equal(colors.rewriteDeclaration('font-size', '12px', P), null);
});

test('alpha is preserved', () => {
  const out = colors.rewriteDeclaration('background-color', 'rgba(255,255,255,0.5)', P);
  assert.ok(/rgba\(\d+, \d+, \d+, 0\.5\)/.test(out), out);
});

test('custom property definitions expand to per-role derived vars', () => {
  const out = colors.expandCustomProp('--accent', '#0b5fff', P);
  assert.deepEqual(out.map(x => x[0]), ['--dmr-bg-accent', '--dmr-text-accent', '--dmr-border-accent']);
  const text = colors.parseColor(out[1][1]), bg = colors.parseColor(out[0][1]);
  assert.ok(ok.rgbToOklch(text.r, text.g, text.b).L > 0.75, 'text copy is light');
  assert.ok(ok.rgbToOklch(bg.r, bg.g, bg.b).L < 0.4, 'bg copy is dark');
  assert.deepEqual(colors.expandCustomProp('--gap', '8px', P), []);
  assert.equal(colors.expandCustomProp('--g', 'linear-gradient(#fff, #000)', P).length, 1);
});

test('var() usages point at the derived var with the original as fallback', () => {
  assert.equal(colors.rewriteDeclaration('color', 'var(--accent)', P), 'var(--dmr-text-accent, var(--accent))');
  assert.equal(colors.rewriteDeclaration('background-color', 'var(--bg, white)', P).startsWith('var(--dmr-bg-bg, var(--bg,'), true);
  assert.ok(!colors.rewriteDeclaration('background-color', 'var(--bg, white)', P).includes('white'), 'fallback colour recoloured');
  const nested = colors.rewriteDeclaration('border-color', 'var(--a, var(--b))', P);
  assert.equal(nested, 'var(--dmr-border-a, var(--a, var(--dmr-border-b, var(--b))))');
  assert.equal(colors.rewriteDeclaration('border', '1px solid var(--line)', P), '1px solid var(--dmr-border-line, var(--line))');
});

test('box-shadow keeps structure', () => {
  const out = colors.rewriteDeclaration('box-shadow', '0 1px 2px rgba(0,0,0,.2), inset 0 0 0 1px #ddd', P);
  assert.ok(out.startsWith('0 1px 2px rgba('));
  assert.ok(out.includes('inset 0 0 0 1px rgb('));
});
