/* offscreen.js — Image loading + Canvas re-encode in offscreen document */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type !== 'scrub' || msg.target !== 'offscreen') return;

  scrubImage(msg.imageUrl)
    .then(result => sendResponse(result))
    .catch(err => sendResponse({ error: err.message }));

  return true; // async response
});

async function scrubImage(imageUrl) {
  const settings = (await chrome.storage.local.get('settings')).settings || {};

  // Try fetch first (handles CORS CDNs and data URIs)
  try {
    const response = await fetch(imageUrl, { mode: 'cors' });
    if (response.ok) {
      const blob = await response.blob();
      const bitmap = await createImageBitmap(blob);
      return await reencodeFromBitmap(bitmap, blob.type || guessType(imageUrl), settings);
    }
  } catch { /* CORS blocked — fall through to Image element */ }

  // Fallback: Image element (works for same-origin and some cross-origin)
  return scrubViaImageElement(imageUrl, settings);
}

function scrubViaImageElement(imageUrl, settings) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = async () => {
      try {
        const result = await reencodeFromDrawable(
          img, img.naturalWidth, img.naturalHeight,
          guessType(imageUrl), settings,
        );
        resolve(result);
      } catch (e) {
        reject(e);
      }
    };

    img.onerror = () => reject(new Error(
      "Can't load this image due to CORS restrictions. Use the popup to upload it instead.",
    ));

    img.src = imageUrl;
  });
}
