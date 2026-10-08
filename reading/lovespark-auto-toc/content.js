'use strict';

(() => {
  if (window.__lsAutoTocInit) return;
  window.__lsAutoTocInit = true;

  const HEADING_SELECTOR = 'h1, h2, h3, h4, h5, h6';
  const TOC_ID = 'ls-auto-toc-sidebar';
  let sidebar = null;
  let currentPosition = 'right';

  function getHeadings() {
    const headings = [];
    const els = document.querySelectorAll(HEADING_SELECTOR);
    els.forEach((el, i) => {
      const text = (el.textContent || '').trim();
      if (!text) return;
      // Ensure each heading has an id for scroll-to
      if (!el.id) {
        el.id = 'ls-toc-heading-' + i;
      }
      headings.push({
        id: el.id,
        text: text,
        level: parseInt(el.tagName.charAt(1), 10)
      });
    });
    return headings;
  }

  function removeToc() {
    if (sidebar && sidebar.parentNode) {
      sidebar.parentNode.removeChild(sidebar);
    }
    sidebar = null;
  }

  function buildToc(headings, position) {
    removeToc();
    currentPosition = position || 'right';

    sidebar = document.createElement('nav');
    sidebar.id = TOC_ID;
    sidebar.setAttribute('aria-label', 'Table of Contents');
    sidebar.setAttribute('role', 'navigation');

    // Styles
    const isRight = currentPosition === 'right';
    sidebar.style.cssText = [
      'position: fixed',
      'top: 60px',
      isRight ? 'right: 12px' : 'left: 12px',
      'width: 240px',
      'max-height: calc(100vh - 120px)',
      'overflow-y: auto',
      'z-index: 2147483640',
      'background: rgba(255, 255, 255, 0.95)',
      'border: 1px solid rgba(232, 69, 124, 0.25)',
      'border-radius: 12px',
      'padding: 14px 12px',
      'box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1)',
      'font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      'font-size: 13px',
      'line-height: 1.4',
      'transition: opacity 0.2s ease'
    ].join(';');

    // Header row with title and close button
    const header = document.createElement('div');
    header.style.cssText = 'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;';

    const title = document.createElement('div');
    title.style.cssText = 'font-weight:700;font-size:12px;color:#e8457c;letter-spacing:0.03em;';
    title.textContent = 'Table of Contents';
    header.appendChild(title);

    const closeBtn = document.createElement('button');
    closeBtn.setAttribute('aria-label', 'Close table of contents');
    closeBtn.style.cssText = [
      'background: none',
      'border: 1px solid rgba(232, 69, 124, 0.3)',
      'border-radius: 4px',
      'cursor: pointer',
      'font-size: 14px',
      'color: #e8457c',
      'width: 24px',
      'height: 24px',
      'display: flex',
      'align-items: center',
      'justify-content: center',
      'padding: 0',
      'line-height: 1'
    ].join(';');
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', removeToc);
    header.appendChild(closeBtn);

    sidebar.appendChild(header);

    // List
    const list = document.createElement('ul');
    list.style.cssText = 'list-style:none;margin:0;padding:0;';

    const minLevel = Math.min(...headings.map(h => h.level));

    headings.forEach((h) => {
      const li = document.createElement('li');
      const indent = (h.level - minLevel) * 14;
      li.style.cssText = 'margin: 0; padding: 0;';

      const link = document.createElement('a');
      link.href = '#' + h.id;
      link.style.cssText = [
        'display: block',
        'padding: 4px 6px',
        'padding-left: ' + (6 + indent) + 'px',
        'color: #333',
        'text-decoration: none',
        'border-radius: 4px',
        'transition: background 0.15s, color 0.15s',
        'cursor: pointer',
        'font-size: ' + (h.level <= 2 ? '13px' : '12px'),
        'font-weight: ' + (h.level <= 2 ? '600' : '400')
      ].join(';');

      // Truncate very long headings
      const maxLen = 50;
      link.textContent = h.text.length > maxLen ? h.text.slice(0, maxLen) + '...' : h.text;
      link.title = h.text;

      link.addEventListener('mouseenter', () => {
        link.style.background = 'rgba(232, 69, 124, 0.1)';
        link.style.color = '#e8457c';
      });
      link.addEventListener('mouseleave', () => {
        link.style.background = 'transparent';
        link.style.color = '#333';
      });
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const target = document.getElementById(h.id);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
          // Briefly flash the heading
          const orig = target.style.outline;
          target.style.outline = '2px solid #e8457c';
          setTimeout(() => { target.style.outline = orig; }, 1500);
        }
      });

      li.appendChild(link);
      list.appendChild(li);
    });

    sidebar.appendChild(list);
    document.body.appendChild(sidebar);

    // Respect prefers-reduced-motion
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (motionQuery.matches) {
      sidebar.style.transition = 'none';
    }
  }

  function setPosition(position) {
    if (!sidebar) return;
    currentPosition = position;
    if (position === 'right') {
      sidebar.style.right = '12px';
      sidebar.style.left = 'auto';
    } else {
      sidebar.style.left = '12px';
      sidebar.style.right = 'auto';
    }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
      case 'GENERATE_TOC': {
        const headings = getHeadings();
        if (headings.length === 0) {
          sendResponse({ headingCount: 0 });
          return;
        }
        buildToc(headings, msg.position);
        sendResponse({ headingCount: headings.length });
        break;
      }
      case 'REMOVE_TOC':
        removeToc();
        sendResponse({ ok: true });
        break;
      case 'SET_POSITION':
        setPosition(msg.position);
        sendResponse({ ok: true });
        break;
      case 'GET_STATUS':
        sendResponse({ active: sidebar !== null, headingCount: getHeadings().length });
        break;
      default:
        sendResponse({ error: 'Unknown message' });
    }
  });
})();
