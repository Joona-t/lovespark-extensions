'use strict';

/**
 * LoveSpark Read Aloud — Article extractor and sentence splitter.
 * Extracts readable text from the current page without external dependencies.
 */
var LoveSparkReader = (function () {
  const REMOVE_SELECTORS = [
    'nav', 'footer', 'aside', 'header',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '[role="complementary"]', '.sidebar', '.nav', '.footer', '.header',
    '.menu', '.breadcrumb', '.pagination', '.comments', '.comment',
    '.social-share', '.share-buttons', '.ad', '.advertisement',
    '.related-posts', '.recommended', 'script', 'style', 'noscript',
    'iframe', 'svg', 'form', '.cookie-banner', '.popup', '.modal'
  ];

  const CONTENT_SELECTORS = [
    'article', '[role="main"]', 'main',
    '.post-content', '.article-content', '.entry-content',
    '.content', '#content', '.post-body', '.article-body',
    '.story-body', '.prose'
  ];

  /**
   * Extract article text from the current document.
   * Returns { title, byline, sentences[] }.
   */
  function extract() {
    const title = document.title || '';
    const byline = getByline();
    const container = findContentContainer();
    if (!container) {
      return { title, byline, sentences: [], error: 'No readable content found.' };
    }

    const clone = container.cloneNode(true);
    for (const sel of REMOVE_SELECTORS) {
      clone.querySelectorAll(sel).forEach(el => el.remove());
    }

    const paragraphs = [];
    const walker = document.createTreeWalker(clone, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript'].includes(tag)) return NodeFilter.FILTER_REJECT;
        const text = node.textContent.trim();
        if (text.length < 3) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let node;
    let currentParagraph = '';
    let lastParent = null;
    while ((node = walker.nextNode())) {
      const parent = node.parentElement;
      const block = getBlockParent(parent);
      if (block !== lastParent && currentParagraph.trim()) {
        paragraphs.push(currentParagraph.trim());
        currentParagraph = '';
      }
      currentParagraph += ' ' + node.textContent.trim();
      lastParent = block;
    }
    if (currentParagraph.trim()) {
      paragraphs.push(currentParagraph.trim());
    }

    const fullText = paragraphs.join(' ');
    const sentences = splitSentences(fullText);

    return { title, byline, sentences };
  }

  function getByline() {
    const meta = document.querySelector('meta[name="author"]');
    if (meta) return meta.getAttribute('content') || '';
    const bylineEl = document.querySelector('.byline, .author, [rel="author"], .post-author');
    if (bylineEl) return bylineEl.textContent.trim();
    return '';
  }

  function findContentContainer() {
    for (const sel of CONTENT_SELECTORS) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 200) return el;
    }
    return findLargestTextBlock();
  }

  function findLargestTextBlock() {
    let best = null;
    let bestScore = 0;
    const candidates = document.querySelectorAll('div, section');
    for (const el of candidates) {
      const text = el.textContent.trim();
      const textLen = text.length;
      if (textLen < 200) continue;
      const pCount = el.querySelectorAll('p').length;
      const linkDensity = getLinkDensity(el);
      if (linkDensity > 0.5) continue;
      const score = textLen * (1 + pCount * 0.5) * (1 - linkDensity);
      if (score > bestScore) {
        bestScore = score;
        best = el;
      }
    }
    return best || document.body;
  }

  function getLinkDensity(el) {
    const textLen = el.textContent.trim().length || 1;
    let linkLen = 0;
    el.querySelectorAll('a').forEach(a => {
      linkLen += a.textContent.trim().length;
    });
    return linkLen / textLen;
  }

  function getBlockParent(el) {
    const blocks = ['P', 'DIV', 'LI', 'BLOCKQUOTE', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'TD', 'TH', 'SECTION', 'ARTICLE'];
    let node = el;
    while (node && node !== document.body) {
      if (blocks.includes(node.tagName)) return node;
      node = node.parentElement;
    }
    return document.body;
  }

  /**
   * Split text into sentences. Handles abbreviations and decimal numbers.
   */
  function splitSentences(text) {
    const abbrevs = /(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|St|Ave|Blvd|Inc|Corp|Ltd|Co|vs|etc|e\.g|i\.e|U\.S\.A|U\.S|U\.K)\./gi;
    let cleaned = text.replace(/\s+/g, ' ').trim();

    // Protect abbreviations by replacing their dots temporarily
    const protections = [];
    cleaned = cleaned.replace(abbrevs, (match) => {
      const key = `\x00ABBR${protections.length}\x00`;
      protections.push(match);
      return key;
    });

    // Protect decimal numbers (e.g., 3.14)
    cleaned = cleaned.replace(/(\d)\.(\d)/g, '$1\x00DOT\x00$2');

    // Split on sentence-ending punctuation followed by space + capital or end
    const raw = cleaned.split(/(?<=[.!?])\s+(?=[A-Z"\u201C])/);

    // Restore protections
    const sentences = raw.map(s => {
      let restored = s;
      for (let i = 0; i < protections.length; i++) {
        restored = restored.replace(`\x00ABBR${i}\x00`, protections[i]);
      }
      restored = restored.replace(/\x00DOT\x00/g, '.');
      return restored.trim();
    }).filter(s => s.length > 0);

    return sentences;
  }

  return { extract, splitSentences };
})();
