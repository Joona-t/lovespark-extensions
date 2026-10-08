/**
 * Token density mapping from pixel luminance.
 *
 * For each pixel, selects a token from the matched token type's pool.
 * Multi-char tokens consume multiple grid columns — the column pointer
 * advances by token width, skipping consumed pixels. Output reads like
 * real syntax-highlighted code.
 */

// CSS class names for each token type — maps palette index to class
const CSS_CLASSES = ['kw', 'st', 'nm', 'op', 'fn', 'cm', 'vr', 'tp'];

/**
 * Map pixels to { token, cssClass }, advancing past multi-char tokens.
 *
 * @param {Int32Array} indices - Palette indices (W*H flat)
 * @param {Float64Array} labData - Original LAB data (W*H*3 flat)
 * @param {number} width
 * @param {number} height
 * @param {Array} palette - Output of buildPalette()
 * @returns {Array<Array<{token: string, cssClass: string}>>}
 */
function selectChars(indices, labData, width, height, palette) {
  const grid = [];

  for (let y = 0; y < height; y++) {
    const row = [];
    let x = 0;

    while (x < width) {
      const flatIdx = y * width + x;
      const paletteIdx = indices[flatIdx];
      const tokenType = palette[paletteIdx].type;
      const cssClass = CSS_CLASSES[paletteIdx];

      const pool = POOLS[tokenType];
      const poolLen = pool.length;

      // L channel from original image (Pillow LAB: 0-255)
      // High L = bright → light token (low index, narrow)
      // Low L  = dark   → heavy token (high index, wider)
      const luminance = labData[flatIdx * 3];
      let tokenIdx = Math.floor((255.0 - luminance) / 256.0 * poolLen);
      if (tokenIdx >= poolLen) tokenIdx = poolLen - 1;

      let token = pool[tokenIdx];
      let tokenWidth = token.length;

      // Clamp token width to remaining columns
      const remaining = width - x;
      if (tokenWidth > remaining) {
        token = token.substring(0, remaining);
        tokenWidth = remaining;
      }

      row.push({ token, cssClass });
      x += tokenWidth;
    }

    grid.push(row);
  }

  return grid;
}
