'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const ok = require('../src/content/recolor/oklch.js');
const { PALETTES } = require('../src/shared/palettes.js');

test('sRGB -> OKLCH -> sRGB round-trips within 1/255', () => {
  const samples = [[0,0,0],[255,255,255],[255,0,0],[0,255,0],[0,0,255],[18,18,22],[233,30,140],[128,128,128],[13,138,124]];
  for (const [r,g,b] of samples) {
    const { L, C, h } = ok.rgbToOklch(r,g,b);
    const back = ok.oklchToRgb(L, C, h);
    assert.ok(Math.abs(back.r-r)<=1 && Math.abs(back.g-g)<=1 && Math.abs(back.b-b)<=1, `${r},${g},${b} -> ${back.r},${back.g},${back.b}`);
  }
});

test('white is L~1, black is L~0', () => {
  assert.ok(ok.rgbToOklch(255,255,255).L > 0.99);
  assert.ok(ok.rgbToOklch(0,0,0).L < 0.01);
});

test('contrast(white, black) = 21', () => {
  assert.ok(Math.abs(ok.contrast({r:255,g:255,b:255},{r:0,g:0,b:0}) - 21) < 0.01);
});

// The AA guarantee: every text-band colour on every bg-band colour >= 4.5:1,
// for neutral AND accent bands, across hues. This is what lets the listing say
// "WCAG AA by construction".
for (const p of Object.values(PALETTES)) {
  test(`palette ${p.id}: band corners clear AA (4.5:1)`, () => {
    const hues = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
    const chromas = [0, 0.03, p.chromaCap];
    const bgs = [], texts = [];
    for (const h of hues) for (const c of chromas) {
      for (const L of p.bg) bgs.push(ok.oklchToRgb(L, c, h));
      for (const L of p.accentBg) bgs.push(ok.oklchToRgb(L, c, h));
      for (const L of p.text) texts.push(ok.oklchToRgb(L, c, h));
      for (const L of p.accentText) texts.push(ok.oklchToRgb(L, c, h));
    }
    let min = Infinity, worst = null;
    for (const bg of bgs) for (const tx of texts) {
      const cr = ok.contrast(bg, tx);
      if (cr < min) { min = cr; worst = [bg, tx]; }
    }
    assert.ok(min >= 4.5, `${p.id} worst pair ${JSON.stringify(worst)} = ${min.toFixed(2)}:1`);
  });

  test(`palette ${p.id}: 1000 random text/bg pairs map to >= 4.5:1`, () => {
    let seed = 42; const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 2 ** 32;
    let min = Infinity;
    for (let i = 0; i < 1000; i++) {
      const bgIn = { r: rnd()*255|0, g: rnd()*255|0, b: rnd()*255|0 };
      const txIn = { r: rnd()*255|0, g: rnd()*255|0, b: rnd()*255|0 };
      const bg = ok.mapColor(bgIn, 'bg', p);
      const tx = ok.mapColor(txIn, 'text', p);
      min = Math.min(min, ok.contrast(bg, tx));
    }
    assert.ok(min >= 4.5, `${p.id} min random contrast ${min.toFixed(2)}`);
  });

  test(`palette ${p.id}: white bg becomes darkest, white text stays brightest`, () => {
    const white = { r:255,g:255,b:255 }, black = { r:0,g:0,b:0 };
    const bgW = ok.rgbToOklch(...Object.values(ok.mapColor(white,'bg',p)).slice(0,3)).L;
    const bgB = ok.rgbToOklch(...Object.values(ok.mapColor(black,'bg',p)).slice(0,3)).L;
    assert.ok(bgW < bgB, 'white page darker than black panels');
    const txW = ok.rgbToOklch(...Object.values(ok.mapColor(white,'text',p)).slice(0,3)).L;
    const txB = ok.rgbToOklch(...Object.values(ok.mapColor(black,'text',p)).slice(0,3)).L;
    assert.ok(txW > txB, 'white text brighter than ex-black text');
  });
}

test('accent colours keep their hue', () => {
  const blue = { r: 0, g: 102, b: 204 };
  const hIn = ok.rgbToOklch(blue.r, blue.g, blue.b).h;
  const out = ok.mapColor(blue, 'text', PALETTES.noir);
  const hOut = ok.rgbToOklch(out.r, out.g, out.b).h;
  assert.ok(Math.abs(hIn - hOut) < 6, `hue drift ${hIn} -> ${hOut}`);
});
