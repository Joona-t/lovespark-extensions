'use strict';

(() => {
  if (window.__lsBionicReadingInit) return;
  window.__lsBionicReadingInit = true;

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT',
    'CODE', 'PRE', 'KBD', 'SAMP', 'VAR', 'SVG', 'MATH'
  ]);
  const MARKER_ATTR = 'data-ls-bionic';
  let active = false;
  let boldRatio = 0.5;
  let processedNodes = [];

  function shouldSkip(node) {
    if (!node.parentElement) return true;
    const tag = node.parentElement.tagName;
    if (SKIP_TAGS.has(tag)) return true;
    // Skip if already processed
    if (node.parentElement.hasAttribute(MARKER_ATTR)) return true;
    // Skip editable regions
    if (node.parentElement.isContentEditable) return true;
    return false;
  }

  function bionicWord(word, ratio) {
    if (word.length <= 1) return null; // Leave single chars alone
    const boldLen = Math.max(1, Math.ceil(word.length * ratio));
    const boldPart = word.slice(0, boldLen);
    const restPart = word.slice(boldLen);

    const wrapper = document.createElement('span');
    wrapper.setAttribute(MARKER_ATTR, '');

    const b = document.createElement('b');
    b.style.fontWeight = '700';
    b.textContent = boldPart;
    wrapper.appendChild(b);

    if (restPart) {
      wrapper.appendChild(document.createTextNode(restPart));
    }
    return wrapper;
  }

  function processTextNode(textNode, ratio) {
    const text = textNode.nodeValue;
    if (!text || !text.trim()) return 0;

    // Split by word boundaries, preserving whitespace
    const parts = text.split(/(\s+)/);
    if (parts.length <= 1 && !text.trim()) return 0;

    const frag = document.createDocumentFragment();
    let wordCount = 0;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (/^\s+$/.test(part) || !part) {
        // Whitespace — preserve as-is
        frag.appendChild(document.createTextNode(part));
      } else {
        const bionic = bionicWord(part, ratio);
        if (bionic) {
          frag.appendChild(bionic);
          wordCount++;
        } else {
          frag.appendChild(document.createTextNode(part));
        }
      }
    }

    const parent = textNode.parentNode;
    processedNodes.push({ parent, original: textNode, replacement: frag });
    parent.replaceChild(frag, textNode);
    return wordCount;
  }

  function getTextNodes(root) {
    const walker = document.createTreeWalker(
      root,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: function(node) {
          if (shouldSkip(node)) return NodeFilter.FILTER_REJECT;
          if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );
    const nodes = [];
    let current;
    while ((current = walker.nextNode())) {
      nodes.push(current);
    }
    return nodes;
  }

  function enable(ratio) {
    if (active) {
      disable();
    }
    boldRatio = typeof ratio === 'number' ? ratio : 0.5;
    active = true;
    processedNodes = [];

    const textNodes = getTextNodes(document.body);
    let totalWords = 0;
    for (let i = 0; i < textNodes.length; i++) {
      totalWords += processTextNode(textNodes[i], boldRatio);
    }
    return totalWords;
  }

  function disable() {
    if (!active) return;
    active = false;
    // Remove all bionic spans — find them by marker attribute
    const bionics = document.querySelectorAll('[' + MARKER_ATTR + ']');
    bionics.forEach((span) => {
      const text = document.createTextNode(span.textContent);
      if (span.parentNode) {
        span.parentNode.replaceChild(text, span);
      }
    });
    processedNodes = [];
    // Normalize text nodes (merge adjacent text nodes)
    document.body.normalize();
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
      case 'ENABLE_BIONIC': {
        const words = enable(msg.boldRatio);
        sendResponse({ active: true, wordsProcessed: words });
        break;
      }
      case 'DISABLE_BIONIC':
        disable();
        sendResponse({ active: false });
        break;
      case 'GET_STATUS':
        sendResponse({ active });
        break;
      default:
        sendResponse({ error: 'Unknown message' });
    }
  });
})();
