'use strict';

LoveSparkTheme.init();

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const trackedEl = document.getElementById('trackedCount');
const toggleEl = document.getElementById('enableToggle');
const recentListEl = document.getElementById('recentList');
const emptyStateEl = document.getElementById('emptyState');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;

if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Reading Progress] sendBg error:', err.message);
    return null;
  }
}

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'textContent') node.textContent = val;
      else if (key === 'className') node.className = val;
      else node.setAttribute(key, val);
    }
  }
  if (children) {
    for (const child of children) {
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    }
  }
  return node;
}

function createSvgEl(tag, attrs) {
  const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      node.setAttribute(key, val);
    }
  }
  return node;
}

function renderRecentPages(pages) {
  recentListEl.textContent = '';
  if (!pages || pages.length === 0) {
    emptyStateEl.hidden = false;
    recentListEl.hidden = true;
    return;
  }
  emptyStateEl.hidden = true;
  recentListEl.hidden = false;

  const circumference = 2 * Math.PI * 13;

  for (const page of pages) {
    const pct = page.percent || 0;
    const offset = circumference - (pct / 100) * circumference;

    const svg = createSvgEl('svg', { class: 'recent-progress-ring', viewBox: '0 0 32 32' });
    svg.appendChild(createSvgEl('circle', { class: 'recent-ring-bg', cx: '16', cy: '16', r: '13' }));
    const fill = createSvgEl('circle', {
      class: 'recent-ring-fill', cx: '16', cy: '16', r: '13',
      'stroke-dasharray': String(circumference),
      'stroke-dashoffset': String(offset)
    });
    svg.appendChild(fill);

    const wrap = el('div', { className: 'recent-progress-wrap' }, []);
    wrap.appendChild(svg);
    wrap.appendChild(el('span', { className: 'recent-percent', textContent: pct + '%' }));

    let hostname = '';
    try { hostname = new URL(page.url).hostname.replace(/^www\./, ''); } catch (err) { console.warn('[lovespark-reading-progress] unknown:', err); }

    const item = el('div', { className: 'recent-item', role: 'listitem' }, [
      wrap,
      el('div', { className: 'recent-info' }, [
        el('div', { className: 'recent-title', title: page.title || '', textContent: page.title || hostname }),
        el('div', { className: 'recent-url', textContent: hostname })
      ])
    ]);
    recentListEl.appendChild(item);
  }
}

function updateStats(data) {
  const today = data.pagesReadToday || 0;
  const total = data.pagesReadTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
  trackedEl.textContent = data.totalTracked || 0;

  toggleEl.checked = data.isEnabled !== false;
  renderRecentPages(data.recentPages);
}

toggleEl.addEventListener('change', async () => {
  await sendBg({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateStats(data);
}

chrome.storage.onChanged.addListener(() => refreshData());
refreshData();
