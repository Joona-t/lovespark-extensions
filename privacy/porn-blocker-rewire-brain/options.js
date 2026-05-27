// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Options Page Script
// ═══════════════════════════════════════════════════════════════════

// ── Safe sendMessage wrapper ──
function safeSend(message, callback) {
  try {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        console.warn('[Rewire Brain]', message.type, 'failed:', chrome.runtime.lastError.message);
        if (callback) callback({ error: chrome.runtime.lastError.message });
        return;
      }
      if (callback) callback(response);
    });
  } catch (err) {
    console.warn('[Rewire Brain] sendMessage threw for', message.type, err);
    if (callback) callback({ error: err.message });
  }
}

// ── Load everything on page open ──
safeSend({ type: 'GET_SETTINGS' }, (data) => {
  if (chrome.runtime.lastError || !data) return;

  document.getElementById('statBlocked').textContent = data.blockedCount || 0;
  document.getElementById('statStreak').textContent = data.streakDays || 0;
  document.getElementById('statBypasses').textContent = (data.bypassLog || []).length;

  renderDomainTags(data.userDomains || []);
  renderSubTags(data.userSubreddits || []);
  document.getElementById('redirectUrl').value = data.redirectUrl || '';
  document.getElementById('cooldownSec').value = data.bypassCooldownSec || 30;
  renderBypassLog(data.bypassLog || []);
  renderReportedSites(data.reportedSites || []);

  // Image blur settings
  const blurEnabled = data.imageBlurEnabled !== false;
  document.getElementById('imageBlurEnabledOpt').checked = blurEnabled;
  document.getElementById('imagesBlurredOpt').textContent = data.imagesBlurredCount || 0;
  const sensitivity = data.imageBlurSensitivity || 'strict';
  const radio = document.querySelector(
    'input[name="blurSensitivity"][value="' + sensitivity + '"]'
  );
  if (radio) radio.checked = true;
});

// ═══ Image Blur Save ═══

document.getElementById('saveBlurSettings').addEventListener('click', () => {
  const enabled = document.getElementById('imageBlurEnabledOpt').checked;
  const sensitivity = document.querySelector('input[name="blurSensitivity"]:checked')?.value || 'strict';
  chrome.storage.local.set({
    imageBlurEnabled: enabled,
    imageBlurSensitivity: sensitivity
  }, () => {
    const msg = document.getElementById('blurSaved');
    msg.classList.add('visible');
    setTimeout(() => msg.classList.remove('visible'), 2000);
  });
});

// ═══ Custom Domains ═══

function renderDomainTags(domains) {
  const container = document.getElementById('domainList');
  container.replaceChildren();
  if (domains.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'empty-state';
    empty.textContent = 'No custom domains added yet';
    container.appendChild(empty);
    return;
  }
  domains.forEach(d => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.appendChild(document.createTextNode(d + ' '));
    const btn = document.createElement('button');
    btn.className = 'tag-remove';
    btn.dataset.domain = d;
    btn.title = 'Remove';
    btn.textContent = '\u00d7';
    btn.addEventListener('click', () => {
      safeSend({ type: 'REMOVE_DOMAIN', domain: d }, (res) => {
        renderDomainTags(res?.userDomains || []);
      });
    });
    tag.appendChild(btn);
    container.appendChild(tag);
  });
}

document.getElementById('addDomain').addEventListener('click', addDomain);
document.getElementById('domainInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addDomain();
});

function addDomain() {
  const input = document.getElementById('domainInput');
  const feedback = document.getElementById('domainFeedback');
  const val = input.value.trim();
  if (!val) { feedback.textContent = 'Enter a domain'; return; }

  safeSend({ type: 'ADD_DOMAIN', domain: val }, (res) => {
    if (chrome.runtime.lastError) { feedback.textContent = 'Error'; return; }
    feedback.textContent = '\u2713 Added';
    input.value = '';
    renderDomainTags(res?.userDomains || []);
    setTimeout(() => { feedback.textContent = ''; }, 2000);
  });
}

// ═══ Custom Subreddits ═══

function renderSubTags(subs) {
  const container = document.getElementById('subList');
  container.replaceChildren();
  if (subs.length === 0) {
    const empty = document.createElement('span');
    empty.className = 'empty-state';
    empty.textContent = 'No custom subreddits added yet';
    container.appendChild(empty);
    return;
  }
  subs.forEach(s => {
    const tag = document.createElement('span');
    tag.className = 'tag';
    tag.appendChild(document.createTextNode('r/' + s + ' '));
    const btn = document.createElement('button');
    btn.className = 'tag-remove';
    btn.dataset.sub = s;
    btn.title = 'Remove';
    btn.textContent = '\u00d7';
    btn.addEventListener('click', () => {
      safeSend({ type: 'REMOVE_SUBREDDIT', subreddit: s }, (res) => {
        renderSubTags(res?.userSubreddits || []);
      });
    });
    tag.appendChild(btn);
    container.appendChild(tag);
  });
}

document.getElementById('addSub').addEventListener('click', addSub);
document.getElementById('subInput').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addSub();
});

function addSub() {
  const input = document.getElementById('subInput');
  const feedback = document.getElementById('subFeedback');
  const val = input.value.trim();
  if (!val) { feedback.textContent = 'Enter a subreddit name'; return; }

  safeSend({ type: 'ADD_SUBREDDIT', subreddit: val }, (res) => {
    if (chrome.runtime.lastError) { feedback.textContent = 'Error'; return; }
    feedback.textContent = '\u2713 Added';
    input.value = '';
    renderSubTags(res?.userSubreddits || []);
    setTimeout(() => { feedback.textContent = ''; }, 2000);
  });
}

// ═══ Redirect URL ═══

document.getElementById('saveRedirect').addEventListener('click', () => {
  const url = document.getElementById('redirectUrl').value.trim();
  const feedback = document.getElementById('redirectSaved');
  safeSend({ type: 'SET_REDIRECT', url }, () => {
    feedback.textContent = url ? '\u2713 Redirect saved' : '\u2713 Redirect cleared';
    setTimeout(() => { feedback.textContent = ''; }, 2000);
  });
});

// ═══ Bypass Cooldown ═══

document.getElementById('saveCooldown').addEventListener('click', () => {
  const sec = parseInt(document.getElementById('cooldownSec').value) || 30;
  const feedback = document.getElementById('cooldownSaved');
  safeSend({ type: 'SET_BYPASS_COOLDOWN', seconds: sec }, (res) => {
    document.getElementById('cooldownSec').value = res?.bypassCooldownSec || sec;
    feedback.textContent = `\u2713 Set to ${res?.bypassCooldownSec || sec} seconds`;
    setTimeout(() => { feedback.textContent = ''; }, 2000);
  });
});

// ═══ Reset Stats ═══

document.getElementById('resetStats').addEventListener('click', () => {
  const feedback = document.getElementById('resetSaved');
  if (!confirm('Are you sure you want to reset all stats? This cannot be undone.')) return;
  safeSend({ type: 'RESET_STATS' }, () => {
    document.getElementById('statBlocked').textContent = '0';
    document.getElementById('statStreak').textContent = '0';
    document.getElementById('statBypasses').textContent = '0';
    renderBypassLog([]);
    feedback.textContent = '\u2713 Stats reset';
    setTimeout(() => { feedback.textContent = ''; }, 3000);
  });
});

// ═══ Bypass Log ═══

function renderBypassLog(log) {
  const container = document.getElementById('bypassLog');
  container.replaceChildren();
  if (log.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'log-empty';
    empty.textContent = 'No bypasses recorded. Keep it up! \uD83D\uDCAA';
    container.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'log-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['When', 'URL', 'Reason'].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  log.slice().reverse().slice(0, 50).forEach(entry => {
    const tr = document.createElement('tr');
    const tdWhen = document.createElement('td');
    tdWhen.textContent = formatDate(entry.timestamp);
    const tdUrl = document.createElement('td');
    tdUrl.textContent = truncate(entry.url, 40);
    const tdReason = document.createElement('td');
    tdReason.textContent = entry.reason || '\u2014';
    tr.appendChild(tdWhen);
    tr.appendChild(tdUrl);
    tr.appendChild(tdReason);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

// ═══ Reported Sites ═══

function renderReportedSites(reports) {
  const container = document.getElementById('reportedLog');
  container.replaceChildren();
  if (reports.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'log-empty';
    empty.textContent = 'No reported sites yet';
    container.appendChild(empty);
    return;
  }

  const table = document.createElement('table');
  table.className = 'log-table';
  const thead = document.createElement('thead');
  const headRow = document.createElement('tr');
  ['When', 'Site', 'Action'].forEach(h => {
    const th = document.createElement('th');
    th.textContent = h;
    headRow.appendChild(th);
  });
  thead.appendChild(headRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  reports.slice().reverse().slice(0, 50).forEach(entry => {
    const tr = document.createElement('tr');
    const tdWhen = document.createElement('td');
    tdWhen.textContent = formatDate(entry.timestamp);
    const tdUrl = document.createElement('td');
    tdUrl.textContent = entry.url;
    const tdAction = document.createElement('td');
    const blockBtn = document.createElement('button');
    blockBtn.className = 'btn-save';
    blockBtn.style.cssText = 'font-size:0.65rem;padding:4px 10px;';
    blockBtn.textContent = '+ Block';
    blockBtn.addEventListener('click', () => {
      const url = entry.url;
      if (url.includes('r/') || url.startsWith('/r/')) {
        const sub = url.replace(/.*r\//, '').replace(/\/.*/, '').toLowerCase();
        safeSend({ type: 'ADD_SUBREDDIT', subreddit: sub }, (res) => {
          blockBtn.textContent = '\u2713';
          blockBtn.disabled = true;
          renderSubTags(res?.userSubreddits || []);
        });
      } else {
        safeSend({ type: 'ADD_DOMAIN', domain: url }, (res) => {
          blockBtn.textContent = '\u2713';
          blockBtn.disabled = true;
          renderDomainTags(res?.userDomains || []);
        });
      }
    });
    tdAction.appendChild(blockBtn);
    tr.appendChild(tdWhen);
    tr.appendChild(tdUrl);
    tr.appendChild(tdAction);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

// ═══ Utilities ═══

function escHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.substring(0, len) + '\u2026' : str;
}

function formatDate(ts) {
  if (!ts) return '\u2014';
  const d = new Date(ts);
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  const hours = d.getHours().toString().padStart(2, '0');
  const mins = d.getMinutes().toString().padStart(2, '0');
  return `${month}/${day} ${hours}:${mins}`;
}
