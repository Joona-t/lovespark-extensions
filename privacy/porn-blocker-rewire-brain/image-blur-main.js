// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Image Blur Classifier (MAIN world)
// Loads NSFWJS, classifies <img> elements on-device, applies blur
// Communicates with isolated bridge via data attributes + custom events
// ═══════════════════════════════════════════════════════════════════

(async () => {
  'use strict';

  // Wait for the bridge script to set data attributes (async chrome.storage read)
  const html = document.documentElement;
  let waited = 0;
  while (!html.dataset.rbBlur && waited < 5000) {
    await new Promise(r => setTimeout(r, 50));
    waited += 50;
  }

  if (html.dataset.rbBlur !== 'enabled') return;

  const sensitivity = html.dataset.rbBlurSensitivity || 'strict';
  const threshold = parseFloat(html.dataset.rbBlurThreshold) || 0.6;
  const nsfwjsUrl = html.dataset.rbBlurNsfwjsUrl;
  const modelUrl = html.dataset.rbBlurModelUrl;

  if (!nsfwjsUrl || !modelUrl) return;

  const triggerClasses = sensitivity === 'strict'
    ? ['Porn', 'Hentai', 'Sexy']
    : sensitivity === 'standard'
    ? ['Porn', 'Hentai']
    : ['Porn'];

  // ── Lazy model loader (singleton) ────────────────────────────────
  let modelPromise = null;

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error('Failed to load: ' + url));
      (document.head || document.documentElement).appendChild(s);
    });
  }

  async function getModel() {
    if (!modelPromise) {
      modelPromise = (async () => {
        await loadScript(nsfwjsUrl);
        // Wait for window.nsfwjs to be defined (UMD bundle)
        let tries = 0;
        while (typeof window.nsfwjs === 'undefined' && tries < 100) {
          await new Promise(r => setTimeout(r, 50));
          tries++;
        }
        if (typeof window.nsfwjs === 'undefined') {
          throw new Error('NSFWJS bundle did not register');
        }
        return window.nsfwjs.load(modelUrl);
      })();
    }
    return modelPromise;
  }

  // ── Classification queue (max 2 concurrent) ──────────────────────
  let active = 0;
  const queue = [];
  const cache = new Map();

  async function withSlot(fn) {
    if (active >= 2) {
      await new Promise(r => queue.push(r));
    }
    active++;
    try {
      return await fn();
    } finally {
      active--;
      const next = queue.shift();
      if (next) next();
    }
  }

  function decideBlur(predictions) {
    return predictions.some(p =>
      triggerClasses.includes(p.className) && p.probability >= threshold
    );
  }

  async function classify(img) {
    if (cache.has(img.src)) return cache.get(img.src);
    const result = await withSlot(async () => {
      const model = await getModel();
      const predictions = await model.classify(img);
      return decideBlur(predictions);
    });
    cache.set(img.src, result);
    return result;
  }

  // ── Wrap blurred image so we can show a "Rewire Brain" badge ────
  function wrapImage(img) {
    if (img.parentElement && img.parentElement.classList.contains('rb-blur-wrap')) return;
    const wrap = document.createElement('span');
    wrap.className = 'rb-blur-wrap';
    if (img.parentNode) {
      img.parentNode.insertBefore(wrap, img);
      wrap.appendChild(img);
    }
  }

  // ── Per-image processing ─────────────────────────────────────────
  async function processImage(img) {
    if (img.dataset.rbProcessed) return;
    img.dataset.rbProcessed = '1';

    // Wait for image to load if not yet ready
    if (!img.complete || img.naturalWidth === 0) {
      await new Promise(res => {
        const cleanup = () => {
          img.removeEventListener('load', onLoad);
          img.removeEventListener('error', onError);
        };
        const onLoad = () => { cleanup(); res(); };
        const onError = () => { cleanup(); res(); };
        img.addEventListener('load', onLoad, { once: true });
        img.addEventListener('error', onError, { once: true });
        setTimeout(() => { cleanup(); res(); }, 5000);
      });
    }

    // Skip small images (icons, avatars, sprites)
    if (img.naturalWidth < 100 || img.naturalHeight < 100) return;
    if (!img.src || img.src.startsWith('data:image/svg')) return;

    // Pre-blur immediately (no flash of NSFW content)
    img.classList.add('rb-blur-pending');

    try {
      const shouldBlur = await classify(img);
      img.classList.remove('rb-blur-pending');
      if (shouldBlur) {
        img.classList.add('rb-blur');
        wrapImage(img);
        // Notify isolated bridge to increment stats
        document.dispatchEvent(new CustomEvent('rb-image-blurred'));
      }
    } catch (err) {
      // FAIL-CLOSED: classification failed (tainted canvas / CSP / network).
      // Keep the blur on. Never lift pre-blur on error — the alternative is
      // letting NSFW through silently (the v2.4.0 Twitter/DDG bug).
      console.warn('[Rewire Brain] classify failed for', img.src, '— keeping safety blur:', err);
      img.classList.remove('rb-blur-pending');
      img.classList.add('rb-blur');
      wrapImage(img);
      document.dispatchEvent(new CustomEvent('rb-image-blurred'));
    }
  }

  // ── Visibility-based queue (don't classify off-screen) ──────────
  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        io.unobserve(entry.target);
        processImage(entry.target);
      }
    }
  }, { rootMargin: '200px' });

  function observeIfNew(img) {
    if (img.dataset.rbObserved) return;
    img.dataset.rbObserved = '1';
    io.observe(img);
  }

  function scanAll() {
    document.querySelectorAll('img').forEach(observeIfNew);
  }

  // ── Watch dynamically-added images (infinite scroll, SPAs) ──────
  const mo = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.tagName === 'IMG') {
          observeIfNew(node);
        } else if (node.querySelectorAll) {
          node.querySelectorAll('img').forEach(observeIfNew);
        }
      }
    }
  });

  mo.observe(document.documentElement, { childList: true, subtree: true });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', scanAll, { once: true });
  } else {
    scanAll();
  }
})();
