'use strict';

/**
 * LoveSpark Read Aloud — Sentence highlighter and auto-scroller.
 * Wraps sentences in spans and highlights the active one.
 */
var LoveSparkHighlighter = (function () {
  const SENTENCE_ATTR = 'data-ls-sentence';
  const ACTIVE_CLASS = 'ls-reading-active';
  const DONE_CLASS = 'ls-reading-done';
  let styleInjected = false;
  let wrappedSentences = [];

  /**
   * Inject highlight CSS into the page (once).
   */
  function injectStyles() {
    if (styleInjected) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('content/highlighter.css');
    document.head.appendChild(link);
    styleInjected = true;
  }

  /**
   * Wrap sentences in the DOM with highlight spans.
   * Walks the content container and maps each sentence to a span.
   */
  function wrapSentences(sentences) {
    cleanup();
    injectStyles();

    const container = findContentContainer();
    if (!container) return [];

    wrappedSentences = [];
    let sentenceIdx = 0;

    // Build a text-to-sentence mapping
    const textNodes = [];
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript', 'nav', 'footer'].includes(tag)) return NodeFilter.FILTER_REJECT;
        if (node.textContent.trim().length < 2) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });

    let textNode;
    while ((textNode = walker.nextNode())) {
      textNodes.push(textNode);
    }

    // For each text node, wrap matching sentence text in spans
    let fullText = '';
    const nodeMap = [];
    for (const tn of textNodes) {
      const start = fullText.length;
      fullText += tn.textContent;
      nodeMap.push({ node: tn, start, end: fullText.length });
    }

    // Find sentence positions in the full text
    const sentencePositions = [];
    let searchFrom = 0;
    for (const sentence of sentences) {
      const normalized = sentence.replace(/\s+/g, ' ').trim();
      // Find best approximate match
      const idx = findApproxMatch(fullText, normalized, searchFrom);
      if (idx >= 0) {
        sentencePositions.push({ idx, len: normalized.length, sentence, sentenceIdx: sentenceIdx++ });
        searchFrom = idx + normalized.length;
      } else {
        sentencePositions.push({ idx: -1, len: 0, sentence, sentenceIdx: sentenceIdx++ });
      }
    }

    // Create wrapper spans for found sentences
    for (const sp of sentencePositions) {
      if (sp.idx < 0) {
        wrappedSentences.push(null);
        continue;
      }
      // Find the first text node that contains the start of this sentence
      const startNode = nodeMap.find(nm => nm.start <= sp.idx && nm.end > sp.idx);
      if (!startNode) {
        wrappedSentences.push(null);
        continue;
      }

      // Create a marker span near the sentence location
      const span = document.createElement('span');
      span.setAttribute(SENTENCE_ATTR, sp.sentenceIdx);
      span.className = 'ls-sentence-marker';

      try {
        startNode.node.parentElement.insertBefore(span, startNode.node);
        // Move the text node inside the span isn't reliable across complex DOM
        // Instead, use the span as a scroll anchor
        wrappedSentences.push(span);
      } catch (e) {
        wrappedSentences.push(null);
      }
    }

    return wrappedSentences;
  }

  function findApproxMatch(haystack, needle, fromIdx) {
    // Normalize whitespace for comparison
    const normalHay = haystack.replace(/\s+/g, ' ');
    const normalNeedle = needle.replace(/\s+/g, ' ');
    const idx = normalHay.indexOf(normalNeedle, fromIdx);
    return idx;
  }

  function findContentContainer() {
    const selectors = ['article', '[role="main"]', 'main', '.post-content', '.article-content', '.entry-content', '.content', '#content'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 200) return el;
    }
    return document.body;
  }

  /**
   * Highlight sentence at given index. Unhighlight previous.
   */
  function highlight(index, autoScroll) {
    // Remove active class from all
    document.querySelectorAll('.' + ACTIVE_CLASS).forEach(el => {
      el.classList.remove(ACTIVE_CLASS);
      el.classList.add(DONE_CLASS);
    });

    if (index < 0 || index >= wrappedSentences.length) return;
    const span = wrappedSentences[index];
    if (!span) return;

    span.classList.add(ACTIVE_CLASS);
    span.classList.remove(DONE_CLASS);

    if (autoScroll) {
      scrollToElement(span);
    }
  }

  function scrollToElement(el) {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({
      behavior: prefersReduced ? 'instant' : 'smooth',
      block: 'center'
    });
  }

  /**
   * Remove all highlight spans and styles.
   */
  function cleanup() {
    document.querySelectorAll('[' + SENTENCE_ATTR + ']').forEach(span => {
      // Move children out and remove span
      const parent = span.parentNode;
      if (parent) {
        while (span.firstChild) {
          parent.insertBefore(span.firstChild, span);
        }
        parent.removeChild(span);
      }
    });
    document.querySelectorAll('.' + ACTIVE_CLASS + ', .' + DONE_CLASS).forEach(el => {
      el.classList.remove(ACTIVE_CLASS, DONE_CLASS);
    });
    wrappedSentences = [];
  }

  return { wrapSentences, highlight, cleanup };
})();
