/**
 * Palette construction + Floyd-Steinberg dithering in LAB space.
 *
 * Quantizes each pixel to the nearest of 8 palette colors and diffuses
 * the error to neighboring pixels. Flat typed arrays throughout —
 * no per-pixel objects, cache-friendly linear memory access.
 */

/**
 * Build palette array from a theme.
 * Returns: [{ type, lab: [L, a, b], hex }, ...] (8 entries)
 */
function buildPalette(theme) {
  const types = Object.keys(theme.tokenColors);
  return types.map(type => ({
    type,
    lab: hexToLab(theme.tokenColors[type]),
    hex: theme.tokenColors[type],
  }));
}

/**
 * Floyd-Steinberg dithering on flat LAB arrays.
 *
 * @param {Float64Array} labData - Flat (W*H*3) LAB pixel data
 * @param {number} width
 * @param {number} height
 * @param {Array} palette - Output of buildPalette()
 * @returns {{ originalLab: Float64Array, indices: Int32Array }}
 */
function ditherImage(labData, width, height, palette) {
  const n = width * height;

  // Copy input — dithering mutates the work array, original preserved for char density
  const originalLab = new Float64Array(labData);
  const work = new Float64Array(labData);
  const indices = new Int32Array(n);

  // Pre-extract palette LAB into flat array for fast inner loop
  const nColors = palette.length;
  const palL = new Float64Array(nColors);
  const palA = new Float64Array(nColors);
  const palB = new Float64Array(nColors);
  for (let i = 0; i < nColors; i++) {
    palL[i] = palette[i].lab[0];
    palA[i] = palette[i].lab[1];
    palB[i] = palette[i].lab[2];
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const off = (y * width + x) * 3;
      const oL = work[off];
      const oA = work[off + 1];
      const oB = work[off + 2];

      // Nearest palette color (Euclidean LAB distance, no sqrt)
      let bestIdx = 0;
      let bestDist = Infinity;
      for (let i = 0; i < nColors; i++) {
        const dL = oL - palL[i];
        const dA = oA - palA[i];
        const dB = oB - palB[i];
        const dist = dL * dL + dA * dA + dB * dB;
        if (dist < bestDist) {
          bestDist = dist;
          bestIdx = i;
        }
      }
      indices[y * width + x] = bestIdx;

      // Quantization error
      const eL = oL - palL[bestIdx];
      const eA = oA - palA[bestIdx];
      const eB = oB - palB[bestIdx];

      // Distribute error to neighbors (Floyd-Steinberg weights)
      if (x + 1 < width) {
        const r = off + 3;
        work[r]     += eL * (7.0 / 16.0);
        work[r + 1] += eA * (7.0 / 16.0);
        work[r + 2] += eB * (7.0 / 16.0);
      }
      if (y + 1 < height) {
        if (x - 1 >= 0) {
          const bl = off + (width - 1) * 3;
          work[bl]     += eL * (3.0 / 16.0);
          work[bl + 1] += eA * (3.0 / 16.0);
          work[bl + 2] += eB * (3.0 / 16.0);
        }
        const bc = off + width * 3;
        work[bc]     += eL * (5.0 / 16.0);
        work[bc + 1] += eA * (5.0 / 16.0);
        work[bc + 2] += eB * (5.0 / 16.0);
        if (x + 1 < width) {
          const br = off + (width + 1) * 3;
          work[br]     += eL * (1.0 / 16.0);
          work[br + 1] += eA * (1.0 / 16.0);
          work[br + 2] += eB * (1.0 / 16.0);
        }
      }
    }
  }

  return { originalLab, indices };
}
