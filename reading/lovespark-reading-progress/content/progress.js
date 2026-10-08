'use strict';

(function () {
  if (document.querySelector('.ls-reading-progress-bar')) return;

  const WORDS_PER_MINUTE = 238;
  let progressBar = null;
  let infoEl = null;
  let infoTimeout = null;
  let lastPercent = 0;

  function createElements() {
    progressBar = document.createElement('div');
    progressBar.className = 'ls-reading-progress-bar';
    progressBar.setAttribute('role', 'progressbar');
    progressBar.setAttribute('aria-valuemin', '0');
    progressBar.setAttribute('aria-valuemax', '100');
    progressBar.setAttribute('aria-valuenow', '0');
    progressBar.setAttribute('aria-label', 'Reading progress');
    document.body.appendChild(progressBar);

    infoEl = document.createElement('div');
    infoEl.className = 'ls-reading-progress-info';
    infoEl.setAttribute('aria-live', 'polite');
    document.body.appendChild(infoEl);

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('content/progress-bar.css');
    document.head.appendChild(link);
  }

  function getArticleText() {
    const selectors = ['article', '[role="main"]', 'main', '.post-content', '.article-body', '.entry-content'];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent.trim().length > 200) return el;
    }
    return document.body;
  }

  function estimateReadTime(text) {
    const words = text.trim().split(/\s+/).length;
    return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
  }

  function getScrollPercent() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (docHeight <= 0) return 100;
    return Math.min(100, Math.round((window.scrollY / docHeight) * 100));
  }

  function showInfo(text) {
    if (!infoEl) return;
    infoEl.textContent = text;
    infoEl.classList.add('visible');
    clearTimeout(infoTimeout);
    infoTimeout = setTimeout(() => {
      infoEl.classList.remove('visible');
    }, 2000);
  }

  function updateProgress() {
    const percent = getScrollPercent();
    if (percent === lastPercent) return;
    lastPercent = percent;

    progressBar.style.width = percent + '%';
    progressBar.setAttribute('aria-valuenow', percent);

    const article = getArticleText();
    const readTime = estimateReadTime(article.textContent);
    const remaining = Math.max(0, Math.round(readTime * (1 - percent / 100)));

    if (percent > 0 && percent < 100) {
      showInfo(percent + '% · ' + remaining + ' min left');
    } else if (percent >= 100) {
      showInfo('Done reading!');
    }

    // Save position
    chrome.runtime.sendMessage({
      type: 'SAVE_POSITION',
      url: location.href,
      percent: percent,
      title: document.title
    }).catch(() => {});
  }

  function init() {
    if (document.documentElement.scrollHeight <= window.innerHeight * 1.5) return;
    createElements();

    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateProgress();
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });

    updateProgress();

    chrome.runtime.sendMessage({ type: 'PAGE_LOADED', url: location.href }).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
