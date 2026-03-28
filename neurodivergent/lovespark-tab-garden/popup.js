'use strict';

/* ── Domain-to-plant mapping ────────────────────────── */
const PLANT_MAP = {
  social: { emoji: '\u{1F33B}', domains: ['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'reddit.com', 'tiktok.com', 'linkedin.com', 'mastodon.social', 'threads.net', 'bsky.app', 'tumblr.com'] },
  news:   { emoji: '\u{1F33F}', domains: ['bbc.com', 'bbc.co.uk', 'cnn.com', 'nytimes.com', 'reuters.com', 'theguardian.com', 'washingtonpost.com', 'apnews.com', 'news.ycombinator.com', 'techcrunch.com', 'arstechnica.com', 'theverge.com'] },
  dev:    { emoji: '\u{1F335}', domains: ['github.com', 'gitlab.com', 'stackoverflow.com', 'developer.mozilla.org', 'dev.to', 'codepen.io', 'replit.com', 'npmjs.com', 'pypi.org', 'docs.python.org', 'rust-lang.org', 'crates.io'] },
  video:  { emoji: '\u{1F33A}', domains: ['youtube.com', 'twitch.tv', 'vimeo.com', 'netflix.com', 'disneyplus.com', 'hulu.com', 'hbomax.com', 'crunchyroll.com', 'dailymotion.com'] }
};
const DEFAULT_PLANT = '\u{1F331}';

function getPlantEmoji(domain) {
  for (const category of Object.values(PLANT_MAP)) {
    if (category.domains.some(d => domain === d || domain.endsWith('.' + d))) {
      return category.emoji;
    }
  }
  return DEFAULT_PLANT;
}

/* ── Time formatting ────────────────────────────────── */
function timeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return minutes + 'm ago';
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  const days = Math.floor(hours / 24);
  return days + 'd ago';
}

/* ── State ──────────────────────────────────────────── */
let currentState = null;
let searchQuery = '';

/* ── DOM helpers (NO innerHTML) ─────────────────────── */
function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'textContent') {
        node.textContent = val;
      } else if (key === 'className') {
        node.className = val;
      } else if (key.startsWith('on')) {
        node.addEventListener(key.slice(2).toLowerCase(), val);
      } else if (key.startsWith('aria-') || key.startsWith('data-') || key === 'role' || key === 'tabindex' || key === 'title') {
        node.setAttribute(key, val);
      } else {
        node[key] = val;
      }
    }
  }
  if (children) {
    for (const child of children) {
      if (typeof child === 'string') {
        node.appendChild(document.createTextNode(child));
      } else if (child) {
        node.appendChild(child);
      }
    }
  }
  return node;
}

/* ── Render Garden Grid ─────────────────────────────── */
function renderGarden(garden) {
  const grid = document.getElementById('gardenGrid');
  const emptyEl = document.getElementById('gardenEmpty');
  const noResults = document.getElementById('gardenNoResults');

  // Clear grid
  while (grid.firstChild) {
    grid.removeChild(grid.firstChild);
  }

  // Filter by search
  let filtered = garden;
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    filtered = garden.filter(entry =>
      entry.title.toLowerCase().includes(q) ||
      entry.domain.toLowerCase().includes(q)
    );
  }

  if (garden.length === 0) {
    emptyEl.hidden = false;
    noResults.hidden = true;
    grid.hidden = true;
    return;
  }

  if (filtered.length === 0) {
    emptyEl.hidden = true;
    noResults.hidden = false;
    grid.hidden = true;
    return;
  }

  emptyEl.hidden = true;
  noResults.hidden = true;
  grid.hidden = false;

  // Sort newest first
  const sorted = [...filtered].sort((a, b) => b.archivedAt - a.archivedAt);

  for (const entry of sorted) {
    const card = el('div', {
      className: 'plant-card',
      tabindex: '0',
      role: 'button',
      'aria-label': 'Restore ' + entry.title + ' from ' + entry.domain,
      title: entry.title + '\n' + entry.url,
      'data-id': entry.id,
      onClick: function () { restoreTab(entry.id, this); },
      onKeydown: function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          restoreTab(entry.id, this);
        }
      }
    }, [
      el('button', {
        className: 'plant-remove',
        'aria-label': 'Remove ' + entry.title + ' from garden',
        onClick: function (e) {
          e.stopPropagation();
          removeFromGarden(entry.id, card);
        }
      }, ['\u00D7']),
      el('span', { className: 'plant-emoji', 'aria-hidden': 'true', textContent: getPlantEmoji(entry.domain) }),
      el('span', { className: 'plant-title', textContent: truncate(entry.title, 24) }),
      el('span', { className: 'plant-domain', textContent: entry.domain }),
      el('span', { className: 'plant-time', textContent: timeAgo(entry.archivedAt) })
    ]);

    grid.appendChild(card);
  }
}

function truncate(str, max) {
  if (str.length <= max) return str;
  return str.slice(0, max - 1) + '\u2026';
}

/* ── Render Active Tabs ─────────────────────────────── */
function renderActiveTabs(tabs) {
  const container = document.getElementById('activeTabsContainer');
  const countEl = document.getElementById('activeTabsCount');

  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }

  countEl.textContent = String(tabs.length);

  if (tabs.length === 0) {
    container.appendChild(el('p', { className: 'active-tabs-empty', textContent: 'No active tabs.' }));
    return;
  }

  const scrollWrap = el('div', { className: 'active-tabs-scroll' });

  for (const tab of tabs) {
    const item = el('div', { className: 'active-tab-item' }, [
      tab.favicon
        ? el('img', { className: 'active-tab-favicon', src: tab.favicon, alt: '' })
        : el('span', { className: 'active-tab-favicon', textContent: '\u{1F310}' }),
      el('span', { className: 'active-tab-title', textContent: truncate(tab.title, 40), title: tab.title }),
      tab.pinned ? el('span', { className: 'active-tab-badge', textContent: 'pinned' }) : null,
      tab.audible ? el('span', { className: 'active-tab-badge', textContent: 'audio' }) : null,
      el('button', {
        className: 'active-tab-close',
        'aria-label': 'Close tab: ' + tab.title,
        onClick: function () { closeActiveTab(tab.id, item); }
      }, ['\u00D7'])
    ]);
    scrollWrap.appendChild(item);
  }

  container.appendChild(scrollWrap);
}

/* ── Render Stats ───────────────────────────────────── */
function renderStats(state) {
  document.getElementById('activeCount').textContent = String(state.tabCount);
  document.getElementById('archivedCount').textContent = String(state.garden.length);
  document.getElementById('memorySaved').textContent = String(state.stats.memoryEstimate);
}

/* ── Render Settings ────────────────────────────────── */
function renderSettings(settings) {
  document.getElementById('idleThreshold').value = String(settings.idleThreshold);
  document.getElementById('maxGarden').value = String(settings.maxGarden);
  document.getElementById('autoArchiveToggle').checked = settings.autoArchive;
  document.getElementById('excludedDomains').value = (settings.excludedDomains || []).join('\n');
}

/* ── Actions ────────────────────────────────────────── */
function restoreTab(id, cardEl) {
  if (cardEl) cardEl.classList.add('restoring');
  chrome.runtime.sendMessage({ action: 'restoreTab', id: id }, function () {
    refreshState();
  });
}

function removeFromGarden(id, cardEl) {
  if (cardEl) cardEl.classList.add('removing');
  chrome.runtime.sendMessage({ action: 'removeFromGarden', id: id }, function () {
    refreshState();
  });
}

function closeActiveTab(tabId, itemEl) {
  chrome.tabs.remove(tabId, function () {
    if (itemEl && itemEl.parentNode) {
      itemEl.parentNode.removeChild(itemEl);
    }
    refreshState();
  });
}

function saveSettings() {
  var threshold = parseInt(document.getElementById('idleThreshold').value, 10);
  var maxG = parseInt(document.getElementById('maxGarden').value, 10);
  var autoArc = document.getElementById('autoArchiveToggle').checked;
  var domains = document.getElementById('excludedDomains').value
    .split('\n')
    .map(function (d) { return d.trim(); })
    .filter(function (d) { return d.length > 0; });

  chrome.runtime.sendMessage({
    action: 'updateSettings',
    settings: {
      idleThreshold: threshold,
      maxGarden: maxG,
      autoArchive: autoArc,
      excludedDomains: domains
    }
  });
}

function clearGarden() {
  if (!confirm('Remove all plants from your garden? This cannot be undone.')) return;
  chrome.runtime.sendMessage({ action: 'clearGarden' }, function () {
    refreshState();
  });
}

/* ── Refresh ────────────────────────────────────────── */
function refreshState() {
  chrome.runtime.sendMessage({ action: 'getState' }, function (state) {
    if (!state) return;
    currentState = state;
    renderStats(state);
    renderGarden(state.garden);
    renderActiveTabs(state.activeTabs);
    renderSettings(state.settings);
  });
}

/* ── Collapsible Sections ───────────────────────────── */
function setupCollapsible(toggleId, contentId) {
  var toggle = document.getElementById(toggleId);
  var content = document.getElementById(contentId);

  toggle.addEventListener('click', function () {
    var expanded = toggle.getAttribute('aria-expanded') === 'true';
    toggle.setAttribute('aria-expanded', String(!expanded));
    content.hidden = expanded;
  });
}

/* ── Init ───────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
  // Theme
  LoveSparkTheme.init();

  // Collapsible sections
  setupCollapsible('activeTabsToggle', 'activeTabsList');
  setupCollapsible('settingsToggle', 'settingsPanel');

  // Search
  document.getElementById('searchInput').addEventListener('input', function (e) {
    searchQuery = e.target.value;
    if (currentState) {
      renderGarden(currentState.garden);
    }
  });

  // Settings change listeners
  document.getElementById('idleThreshold').addEventListener('change', saveSettings);
  document.getElementById('maxGarden').addEventListener('change', saveSettings);
  document.getElementById('autoArchiveToggle').addEventListener('change', saveSettings);
  document.getElementById('excludedDomains').addEventListener('change', saveSettings);

  // Clear garden
  document.getElementById('clearGardenBtn').addEventListener('click', clearGarden);

  // Aria-expanded for theme dropdown
  var themeToggle = document.getElementById('themeToggle');
  var themeMenu = document.getElementById('themeMenu');
  if (themeToggle && themeMenu) {
    var observer = new MutationObserver(function () {
      var isOpen = themeMenu.classList.contains('open');
      themeToggle.setAttribute('aria-expanded', String(isOpen));
    });
    observer.observe(themeMenu, { attributes: true, attributeFilter: ['class'] });
  }

  // Load initial state
  refreshState();
});

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
