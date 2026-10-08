'use strict';

document.addEventListener('DOMContentLoaded', () => {
  LoveSparkTheme.init();

  const addForm = document.getElementById('addForm');
  const itemInput = document.getElementById('itemInput');
  const itemList = document.getElementById('itemList');
  const emptyState = document.getElementById('emptyState');
  const todayEl = document.getElementById('todayCount');
  const totalEl = document.getElementById('totalCount');
  const progressFill = document.getElementById('progressFill');
  const progressLabel = document.getElementById('progressLabel');
  const progressWrap = progressFill.parentElement;

  let prevToday = 0;
  let prevTotal = 0;

  function renderItems(items) {
    itemList.textContent = '';

    if (!items || items.length === 0) {
      emptyState.classList.remove('hidden');
      updateProgress(0, 0);
      return;
    }
    emptyState.classList.add('hidden');

    const total = items.length;
    const done = items.filter(i => i.done).length;
    updateProgress(done, total);

    for (const item of items) {
      const row = document.createElement('div');
      row.className = 'check-item' + (item.done ? ' done' : '');
      row.setAttribute('role', 'listitem');

      const cb = document.createElement('input');
      cb.type = 'checkbox';
      cb.className = 'check-cb';
      cb.checked = item.done;
      cb.setAttribute('aria-label', (item.done ? 'Uncheck: ' : 'Check: ') + item.text);
      cb.addEventListener('change', () => {
        chrome.runtime.sendMessage({ type: 'TOGGLE_ITEM', id: item.id }).then(refresh);
      });

      const text = document.createElement('span');
      text.className = 'check-text';
      text.textContent = item.text;

      const del = document.createElement('button');
      del.className = 'check-delete';
      del.textContent = '\u00D7';
      del.setAttribute('aria-label', 'Delete: ' + item.text);
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage({ type: 'DELETE_ITEM', id: item.id }).then(refresh);
      });

      row.append(cb, text, del);
      itemList.appendChild(row);
    }
  }

  function updateProgress(done, total) {
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    progressFill.style.width = pct + '%';
    progressFill.classList.toggle('complete', pct === 100 && total > 0);
    progressLabel.textContent = pct + '% complete (' + done + '/' + total + ')';
    progressWrap.setAttribute('aria-valuenow', String(pct));
  }

  function updateStats(data) {
    const today = data.checklistCompletedToday || 0;
    const total = data.checklistCompletedTotal || 0;

    LoveSparkPopup.animateCount(todayEl, prevToday, today);
    LoveSparkPopup.animateCount(totalEl, prevTotal, total);
    if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

    prevToday = today;
    prevTotal = total;
  }

  function refresh() {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }).then((data) => {
      updateStats(data);
      renderItems(data.checklistItems || []);
    });
  }

  addForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = itemInput.value.trim();
    if (!text) return;
    chrome.runtime.sendMessage({ type: 'ADD_ITEM', text: text }).then(() => {
      itemInput.value = '';
      refresh();
    });
  });

  chrome.storage.onChanged.addListener(refresh);
  refresh();
});

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
