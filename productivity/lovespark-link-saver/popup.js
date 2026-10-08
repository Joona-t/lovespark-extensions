'use strict';

document.addEventListener('DOMContentLoaded', () => {
  LoveSparkTheme.init();

  const saveBtn = document.getElementById('saveBtn');
  const todayEl = document.getElementById('todayCount');
  const totalEl = document.getElementById('totalCount');
  const linkList = document.getElementById('linkList');
  const linkCountEl = document.getElementById('linkCount');
  const emptyState = document.getElementById('emptyState');

  let prevToday = 0;
  let prevTotal = 0;

  function formatTime(isoStr) {
    const d = new Date(isoStr);
    const now = new Date();
    const diffMs = now - d;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return diffMin + 'm ago';
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return diffHr + 'h ago';
    const diffDay = Math.floor(diffHr / 24);
    return diffDay + 'd ago';
  }

  function renderLinks(links) {
    linkList.textContent = '';
    linkCountEl.textContent = String(links.length);

    if (links.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    for (const link of links) {
      const item = document.createElement('div');
      item.className = 'link-item';
      item.setAttribute('role', 'listitem');

      const anchor = document.createElement('a');
      anchor.className = 'link-anchor';
      anchor.href = link.url;
      anchor.textContent = link.title || link.url;
      anchor.title = link.url;
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noopener noreferrer');

      const time = document.createElement('span');
      time.className = 'link-time';
      time.textContent = formatTime(link.savedAt);

      const del = document.createElement('button');
      del.className = 'link-delete';
      del.textContent = '\u00D7';
      del.setAttribute('aria-label', 'Delete: ' + (link.title || link.url));
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage({ type: 'DELETE_LINK', id: link.id }).then(refresh);
      });

      item.append(anchor, time, del);
      linkList.appendChild(item);
    }
  }

  function updateStats(data) {
    const today = data.linkSaverToday || 0;
    const total = data.linkSaverTotal || 0;

    LoveSparkPopup.animateCount(todayEl, prevToday, today);
    LoveSparkPopup.animateCount(totalEl, prevTotal, total);
    if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

    prevToday = today;
    prevTotal = total;
  }

  function refresh() {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }).then((data) => {
      updateStats(data);
      renderLinks(data.savedLinks || []);
    });
  }

  saveBtn.addEventListener('click', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs[0]) return;
      const tab = tabs[0];
      chrome.runtime.sendMessage({
        type: 'SAVE_LINK',
        url: tab.url,
        title: tab.title,
      }).then((res) => {
        if (res && res.ok) {
          saveBtn.textContent = 'Saved!';
          saveBtn.classList.add('saved');
        } else if (res && res.reason === 'duplicate') {
          saveBtn.textContent = 'Already saved';
          saveBtn.classList.add('duplicate');
        }
        setTimeout(() => {
          saveBtn.textContent = 'Save This Page';
          saveBtn.classList.remove('saved', 'duplicate');
        }, 1200);
        refresh();
      });
    });
  });

  chrome.storage.onChanged.addListener(refresh);
  refresh();
});

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
