'use strict';

LoveSparkTheme.init();

const medListEl = document.getElementById('medList');
const allDoneEl = document.getElementById('allDone');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

if (typeof LoveSparkFooter !== 'undefined') footerMount.innerHTML = LoveSparkFooter.render();

async function sendBg(msg) {
  try { return await chrome.runtime.sendMessage(msg); }
  catch (_) { return null; }
}

function renderMeds(reminders) {
  medListEl.textContent = '';
  let allTaken = true;

  for (const r of reminders) {
    if (!r.taken) allTaken = false;

    const item = document.createElement('div');
    item.className = 'med-item' + (r.taken ? ' taken' : '');
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', r.label + ' at ' + r.time + (r.taken ? ' (taken)' : ' (not taken)'));

    const check = document.createElement('span');
    check.className = 'med-check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = '\u2713';

    const info = document.createElement('div');
    info.className = 'med-info';

    const label = document.createElement('div');
    label.className = 'med-label';
    label.textContent = r.label;

    const time = document.createElement('div');
    time.className = 'med-time';
    time.textContent = r.time;

    info.appendChild(label);
    info.appendChild(time);

    const emoji = document.createElement('span');
    emoji.className = 'med-emoji';
    emoji.setAttribute('aria-hidden', 'true');
    emoji.textContent = r.taken ? '\u2705' : '\u{1F48A}';

    item.appendChild(check);
    item.appendChild(info);
    item.appendChild(emoji);

    item.addEventListener('click', async () => {
      if (r.taken) {
        await sendBg({ type: 'UNDO_MED', id: r.id });
      } else {
        await sendBg({ type: 'TAKE_MED', id: r.id });
      }
      await refreshData();
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); item.click(); }
    });

    medListEl.appendChild(item);
  }

  allDoneEl.hidden = !allTaken || reminders.length === 0;
}

async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    todayEl.textContent = data.takenToday || 0;
    totalEl.textContent = data.takenTotal || 0;
    renderMeds(data.reminders || []);
  }
}

refreshData();
