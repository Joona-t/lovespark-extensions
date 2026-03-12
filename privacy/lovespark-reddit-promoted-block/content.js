// LoveSpark Reddit Ad Blocker
// Hides promoted posts on new Reddit, old Reddit, and Reddit's SPA feed.
// No network requests, no data collected. Ever.

// ─── Selectors ───────────────────────────────────────────────────────────────
//
// New Reddit (shreddit, the current React SPA):
//   <shreddit-ad-post>                        — custom element wrapping each promoted post
//   [data-testid="ad-comments-post-unit"]     — promoted post in comment feeds
//   [data-ad-loading]                         — ad skeleton loaders
//
// New Reddit (older redesign, pre-shreddit):
//   [data-promoted="true"]                    — feed post containers
//   [promoted-beacon]                         — beacon element inside promoted posts
//   div[class*="promotedLink"]               — class-based selector
//
// Old Reddit (old.reddit.com):
//   .sponsored-v2                             — top-level post div
//   .promoted-v2                              — alternative class used
//   div.thing.promoted                        — combined selector
//   span.promoted-tag                         — inline "Promoted" badge
//
// Sidebar ads (both versions):
//   .ad-container, .premium-banner, #premium-banner-ad

const NEW_REDDIT_SELECTORS = [
  'shreddit-ad-post',
  '[data-testid="ad-comments-post-unit"]',
  '[data-ad-loading]',
  '[data-promoted="true"]',
  '[promoted-beacon]',
  'div[class*="promotedLink"]',
  'shreddit-post:has([slot="promoted-label"])',
  'article:has([data-testid="post-promoted-label"])',
];

const OLD_REDDIT_SELECTORS = [
  '.sponsored-v2',
  '.promoted-v2',
  'div.thing.promoted',
];

const SIDEBAR_SELECTORS = [
  '.ad-container',
  '#premium-banner-ad',
  '.premium-banner',
  'aside[data-testid="right-sidebar"] shreddit-ad',
];

// ─── Counter ─────────────────────────────────────────────────────────────────

let hiddenCount = 0;
let persistTimer = null;

function persistCount() {
  if (hiddenCount === 0) return; // nothing new to write
  const batch = hiddenCount;
  hiddenCount = 0;

  const today = new Date().toISOString().slice(0, 10);
  browser.storage.local.get(['hiddenToday', 'hiddenTotal', 'lastResetDate']).then((data) => {
    const needsReset = data.lastResetDate !== today;
    browser.storage.local.set({
      hiddenToday: needsReset ? batch : (data.hiddenToday || 0) + batch,
      hiddenTotal: (data.hiddenTotal || 0) + batch,
      lastResetDate: today,
    });
  });
}

// Debounced flush: writes storage only when hiddenCount changes, max once per 3s
function schedulePersist() {
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    persistCount();
  }, 3000);
}

// ─── Core hide function ──────────────────────────────────────────────────────

function hideElement(el) {
  if (el.dataset.lovesparkHidden) return;
  el.dataset.lovesparkHidden = '1';
  el.style.setProperty('display', 'none', 'important');
  hiddenCount++;
  schedulePersist();
}

// ─── Text-based fallback ─────────────────────────────────────────────────────
// Reddit sometimes renders "Promoted" as plain text inside the post card.
// Walk up from the label to the containing post card and hide that.

function hideByPromotedLabel(root) {
  const candidates = root.querySelectorAll(
    'span, a, faceplate-tracker, [data-testid*="promoted"]'
  );

  for (const el of candidates) {
    const text = el.textContent.trim();
    if (text !== 'Promoted' && text !== 'promoted') continue;

    let parent = el.parentElement;
    let depth = 0;
    while (parent && depth < 12) {
      const tag = parent.tagName.toLowerCase();
      if (
        tag === 'article' ||
        tag === 'shreddit-post' ||
        tag === 'shreddit-ad-post' ||
        parent.classList.contains('thing') ||
        parent.classList.contains('Post')
      ) {
        hideElement(parent);
        break;
      }
      parent = parent.parentElement;
      depth++;
    }
  }
}

// ─── Main sweep ──────────────────────────────────────────────────────────────

function sweep(root) {
  const isOldReddit = location.hostname === 'old.reddit.com';

  if (isOldReddit) {
    for (const sel of OLD_REDDIT_SELECTORS) {
      root.querySelectorAll(sel).forEach(hideElement);
    }
  } else {
    for (const sel of NEW_REDDIT_SELECTORS) {
      try {
        root.querySelectorAll(sel).forEach(hideElement);
      } catch (_) {}
    }
    // Only run the text walk on nodes large enough to contain a post
    if (root === document || root.childElementCount > 3) {
      hideByPromotedLabel(root);
    }
  }

  for (const sel of SIDEBAR_SELECTORS) {
    try {
      root.querySelectorAll(sel).forEach(hideElement);
    } catch (_) {}
  }
}

// ─── Init ────────────────────────────────────────────────────────────────────
// Sweep existing DOM first, then start observing for new nodes.

sweep(document);

const observer = new MutationObserver((mutations) => {
  for (const mutation of mutations) {
    if (mutation.addedNodes.length === 0) continue;
    for (const node of mutation.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      sweep(node);
    }
  }
});

observer.observe(document.body, { childList: true, subtree: true });
