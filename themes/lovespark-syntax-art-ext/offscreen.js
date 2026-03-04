/**
 * Offscreen document — image decode + pipeline orchestration.
 *
 * Receives image URL from background, loads it via <img> + <canvas>,
 * converts sRGB pixels to LAB, runs the full pipeline, and sends
 * the resulting HTML string back.
 */

const CHAR_ASPECT = 0.5; // monospace chars are ~2x taller than wide

/**
 * Convert RGBA pixel data to flat LAB Float64Array.
 * Hot path — inlined sRGB→LAB math to avoid function call overhead.
 */
function rgbaToLabArray(rgba, width, height) {
  const n = width * height;
  const lab = new Float64Array(n * 3);

  for (let i = 0; i < n; i++) {
    const ro = i * 4;
    const lo = i * 3;

    // sRGB [0,255] → linear [0,1]
    let r = rgba[ro] / 255.0;
    let g = rgba[ro + 1] / 255.0;
    let b = rgba[ro + 2] / 255.0;

    r = r <= 0.04045 ? r / 12.92 : Math.pow((r + 0.055) / 1.055, 2.4);
    g = g <= 0.04045 ? g / 12.92 : Math.pow((g + 0.055) / 1.055, 2.4);
    b = b <= 0.04045 ? b / 12.92 : Math.pow((b + 0.055) / 1.055, 2.4);

    // Linear RGB → XYZ (D65)
    const x = 0.4124564 * r + 0.3575761 * g + 0.1804375 * b;
    const y = 0.2126729 * r + 0.7151522 * g + 0.0721750 * b;
    const z = 0.0193339 * r + 0.1191920 * g + 0.9503041 * b;

    // XYZ → CIE L*a*b*
    const delta = 6.0 / 29.0;
    const d3 = delta * delta * delta;
    const d2x3 = 3.0 * delta * delta;

    let fx = x / 0.95047;
    let fy = y / 1.00000;
    let fz = z / 1.08883;

    fx = fx > d3 ? Math.pow(fx, 1.0 / 3.0) : fx / d2x3 + 4.0 / 29.0;
    fy = fy > d3 ? Math.pow(fy, 1.0 / 3.0) : fy / d2x3 + 4.0 / 29.0;
    fz = fz > d3 ? Math.pow(fz, 1.0 / 3.0) : fz / d2x3 + 4.0 / 29.0;

    const Lstar = 116.0 * fy - 16.0;
    const astar = 500.0 * (fx - fy);
    const bstar = 200.0 * (fy - fz);

    // CIE L*a*b* → Pillow LAB encoding (0-255)
    lab[lo]     = Math.max(0, Math.min(255, Math.round(Lstar * 255.0 / 100.0)));
    lab[lo + 1] = Math.max(0, Math.min(255, Math.round(astar + 128.0)));
    lab[lo + 2] = Math.max(0, Math.min(255, Math.round(bstar + 128.0)));
  }

  return lab;
}

/**
 * Load image from URL into an <img> element.
 * Tries crossOrigin first for CORS, falls back to opaque load.
 */
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => {
      // Retry without crossOrigin (some servers reject CORS preflight)
      const img2 = new Image();
      img2.onload = () => resolve(img2);
      img2.onerror = () => reject(new Error('Failed to load image. It may be blocked by CORS.'));
      img2.src = url;
    };

    img.src = url;
  });
}

/**
 * Run the full conversion pipeline.
 */
async function convertImage(imageUrl, themeName, artWidth, fontSize) {
  const theme = THEMES[themeName];
  if (!theme) throw new Error(`Unknown theme: ${themeName}`);

  // Load + decode
  const img = await loadImage(imageUrl);
  const scaledHeight = Math.max(1, Math.round(img.naturalHeight / img.naturalWidth * artWidth * CHAR_ASPECT));

  // Draw to canvas at target size
  const canvas = document.createElement('canvas');
  canvas.width = artWidth;
  canvas.height = scaledHeight;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, artWidth, scaledHeight);

  // Get sRGB pixel data
  const imageData = ctx.getImageData(0, 0, artWidth, scaledHeight);
  const rgba = imageData.data;

  // sRGB → LAB
  const labData = rgbaToLabArray(rgba, artWidth, scaledHeight);

  // Build palette + dither
  const palette = buildPalette(theme);
  const { originalLab, indices } = ditherImage(labData, artWidth, scaledHeight, palette);

  // Char selection
  const grid = selectChars(indices, originalLab, artWidth, scaledHeight, palette);

  // Render HTML
  const html = renderHtml(grid, theme, fontSize);

  return html;
}


// ── Message Handler ─────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.target !== 'offscreen') return;

  if (msg.action === 'convert') {
    convertImage(msg.imageUrl, msg.theme, msg.width, msg.fontSize)
      .then(html => {
        chrome.runtime.sendMessage({
          target: 'background',
          action: 'result',
          html,
        });
      })
      .catch(err => {
        chrome.runtime.sendMessage({
          target: 'background',
          action: 'error',
          error: err.message,
        });
      });

    // Keep message channel open (async response handled via separate message)
    return false;
  }
});
