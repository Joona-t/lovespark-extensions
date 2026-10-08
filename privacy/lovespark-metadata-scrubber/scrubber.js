/* scrubber.js — Shared Canvas re-encode logic
 * Used by both offscreen.js (context menu flow) and popup.js (drag-and-drop flow).
 * Canvas re-encoding produces a pixel-identical image with zero metadata.
 */

function reencodeFromBitmap(bitmap, originalMimeType, settings) {
  const canvas = document.getElementById('canvas') || document.createElement('canvas');
  canvas.width = bitmap.width;
  canvas.height = bitmap.height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bitmap, 0, 0);

  return exportCanvas(canvas, originalMimeType, settings);
}

function reencodeFromDrawable(drawable, width, height, originalMimeType, settings) {
  const canvas = document.getElementById('canvas') || document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(drawable, 0, 0);

  return exportCanvas(canvas, originalMimeType, settings);
}

function exportCanvas(canvas, originalMimeType, settings) {
  const format = settings.outputFormat || 'original';
  const quality = settings.jpegQuality || 0.95;

  let outputMime;
  if (format === 'png') {
    outputMime = 'image/png';
  } else if (format === 'jpeg') {
    outputMime = 'image/jpeg';
  } else {
    // "original" — match input, but Canvas only reliably exports png and jpeg
    outputMime = (originalMimeType === 'image/jpeg') ? 'image/jpeg' : 'image/png';
  }

  // Large images (>4096px): use toBlob to avoid data URL string size limits
  const isLarge = canvas.width > 4096 || canvas.height > 4096;

  if (isLarge) {
    return new Promise(resolve => {
      canvas.toBlob(blob => {
        resolve({
          cleanDataUrl: URL.createObjectURL(blob),
          cleanBlob: blob,
          width: canvas.width,
          height: canvas.height,
          outputMime,
          originalMime: originalMimeType,
          isObjectUrl: true,
        });
      }, outputMime, outputMime === 'image/jpeg' ? quality : undefined);
    });
  }

  const dataUrl = (outputMime === 'image/jpeg')
    ? canvas.toDataURL('image/jpeg', quality)
    : canvas.toDataURL('image/png');

  return {
    cleanDataUrl: dataUrl,
    width: canvas.width,
    height: canvas.height,
    outputMime,
    originalMime: originalMimeType,
    isObjectUrl: false,
  };
}

function guessType(url) {
  if (url.match(/\.jpe?g/i)) return 'image/jpeg';
  if (url.match(/\.png/i)) return 'image/png';
  if (url.match(/\.webp/i)) return 'image/webp';
  if (url.match(/\.gif/i)) return 'image/gif';
  if (url.match(/\.svg/i)) return 'image/svg+xml';
  if (url.match(/^data:image\/jpeg/)) return 'image/jpeg';
  if (url.match(/^data:image\/png/)) return 'image/png';
  return 'image/png';
}
