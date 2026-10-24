'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { classify, parseRgb } = require('../src/content/detect.js');
const rgb = (s) => parseRgb(s);

test('white page is light', () => assert.equal(classify(rgb('rgb(255, 255, 255)'), rgb('rgb(0, 0, 0)'), null).nativeDark, false));
test('GitHub dark (#0d1117, light text) is dark', () => assert.equal(classify(rgb('rgb(13, 17, 23)'), rgb('rgb(230, 237, 243)'), null).nativeDark, true));
test('YouTube dark (#0f0f0f, body text black) is dark', () => assert.equal(classify(rgb('rgb(15, 15, 15)'), rgb('rgb(0, 0, 0)'), null).nativeDark, true));
test('mid-grey page with dark text is light', () => assert.equal(classify(rgb('rgb(110, 110, 110)'), rgb('rgb(0, 0, 0)'), null).nativeDark, false));
test('mid-dark page with light text is dark', () => assert.equal(classify(rgb('rgb(90, 90, 100)'), rgb('rgb(240, 240, 240)'), null).nativeDark, true));
test('transparent page follows meta color-scheme', () => {
  assert.equal(classify(null, null, 'dark').nativeDark, true);
  assert.equal(classify(null, null, null).nativeDark, false);
});
test('parseRgb reads alpha', () => assert.equal(parseRgb('rgba(0, 0, 0, 0)').a, 0));
