'use strict';

document.addEventListener('DOMContentLoaded', () => {
  LoveSparkTheme.init();

  const pasteBtn = document.getElementById('pasteBtn');
  const todayEl = document.getElementById('todayCount');
  const totalEl = document.getElementById('totalCount');
  const noteList = document.getElementById('noteList');
  const noteCountEl = document.getElementById('noteCount');
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

  function renderNotes(notes) {
    noteList.textContent = '';
    noteCountEl.textContent = String(notes.length);

    if (notes.length === 0) {
      emptyState.classList.remove('hidden');
      return;
    }
    emptyState.classList.add('hidden');

    for (const note of notes) {
      const item = document.createElement('div');
      item.className = 'note-item';
      item.setAttribute('role', 'listitem');

      const text = document.createElement('div');
      text.className = 'note-text';
      text.textContent = note.text;

      const meta = document.createElement('div');
      meta.className = 'note-meta';

      const time = document.createElement('span');
      time.className = 'note-time';
      time.textContent = formatTime(note.createdAt);

      const del = document.createElement('button');
      del.className = 'note-delete';
      del.textContent = '\u00D7';
      del.setAttribute('aria-label', 'Delete note from ' + formatTime(note.createdAt));
      del.addEventListener('click', (e) => {
        e.stopPropagation();
        chrome.runtime.sendMessage({ type: 'DELETE_NOTE', id: note.id }).then(refresh);
      });

      meta.append(time, del);
      item.append(text, meta);
      noteList.appendChild(item);
    }
  }

  function updateStats(data) {
    const today = data.clipNotesToday || 0;
    const total = data.clipNotesTotal || 0;

    LoveSparkPopup.animateCount(todayEl, prevToday, today);
    LoveSparkPopup.animateCount(totalEl, prevTotal, total);
    if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

    prevToday = today;
    prevTotal = total;
  }

  function refresh() {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }).then((data) => {
      updateStats(data);
      renderNotes(data.clipNotes || []);
    });
  }

  pasteBtn.addEventListener('click', async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text || !text.trim()) {
        pasteBtn.textContent = 'Clipboard is empty';
        setTimeout(() => { pasteBtn.textContent = 'Paste from Clipboard'; }, 1200);
        return;
      }
      chrome.runtime.sendMessage({ type: 'ADD_NOTE', text: text }).then(() => {
        pasteBtn.textContent = 'Pasted!';
        pasteBtn.classList.add('pasted');
        setTimeout(() => {
          pasteBtn.textContent = 'Paste from Clipboard';
          pasteBtn.classList.remove('pasted');
        }, 1200);
        refresh();
      });
    } catch (err) {
      pasteBtn.textContent = 'Clipboard access denied';
      setTimeout(() => { pasteBtn.textContent = 'Paste from Clipboard'; }, 2000);
    }
  });

  chrome.storage.onChanged.addListener(refresh);
  refresh();
});

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
