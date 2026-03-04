// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Options Page Script
// ═══════════════════════════════════════════════════════════════════

// ── Load everything on page open ──
chrome.runtime.sendMessage({ type: 'GET_SETTINGS' }, (data) => {
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
});

// ═══ Custom Domains ═══

function renderDomainTags(domains) {
  const container = document.getElementById('domainList');
  if (domains.length === 0) {
    container.innerHTML = '<span class="empty-state">No custom domains added yet</span>';
    return;
  }
  container.innerHTML = domains.map(d => `
    <span class="tag">
      ${escHtml(d)}
      <button class="tag-remove" data-domain="${escHtml(d)}" title="Remove">&times;</button>
    </span>
  `).join('');

  container.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'REMOVE_DOMAIN', domain: btn.dataset.domain }, (res) => {
        renderDomainTags(res?.userDomains || []);
      });
    });
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

  chrome.runtime.sendMessage({ type: 'ADD_DOMAIN', domain: val }, (res) => {
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
  if (subs.length === 0) {
    container.innerHTML = '<span class="empty-state">No custom subreddits added yet</span>';
    return;
  }
  container.innerHTML = subs.map(s => `
    <span class="tag">
      r/${escHtml(s)}
      <button class="tag-remove" data-sub="${escHtml(s)}" title="Remove">&times;</button>
    </span>
  `).join('');

  container.querySelectorAll('.tag-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'REMOVE_SUBREDDIT', subreddit: btn.dataset.sub }, (res) => {
        renderSubTags(res?.userSubreddits || []);
      });
    });
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

  chrome.runtime.sendMessage({ type: 'ADD_SUBREDDIT', subreddit: val }, (res) => {
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
  chrome.runtime.sendMessage({ type: 'SET_REDIRECT', url }, () => {
    feedback.textContent = url ? '\u2713 Redirect saved' : '\u2713 Redirect cleared';
    setTimeout(() => { feedback.textContent = ''; }, 2000);
  });
});

// ═══ Bypass Cooldown ═══

document.getElementById('saveCooldown').addEventListener('click', () => {
  const sec = parseInt(document.getElementById('cooldownSec').value) || 30;
  const feedback = document.getElementById('cooldownSaved');
  chrome.runtime.sendMessage({ type: 'SET_BYPASS_COOLDOWN', seconds: sec }, (res) => {
    document.getElementById('cooldownSec').value = res?.bypassCooldownSec || sec;
    feedback.textContent = `\u2713 Set to ${res?.bypassCooldownSec || sec} seconds`;
    setTimeout(() => { feedback.textContent = ''; }, 2000);
  });
});

// ═══ Reset Stats ═══

document.getElementById('resetStats').addEventListener('click', () => {
  const feedback = document.getElementById('resetSaved');
  if (!confirm('Are you sure you want to reset all stats? This cannot be undone.')) return;
  chrome.runtime.sendMessage({ type: 'RESET_STATS' }, () => {
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
  if (log.length === 0) {
    container.innerHTML = '<div class="log-empty">No bypasses recorded. Keep it up! \uD83D\uDCAA</div>';
    return;
  }

  const rows = log.slice().reverse().slice(0, 50).map(entry => `
    <tr>
      <td>${formatDate(entry.timestamp)}</td>
      <td>${escHtml(truncate(entry.url, 40))}</td>
      <td>${escHtml(entry.reason || '\u2014')}</td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table class="log-table">
      <thead><tr><th>When</th><th>URL</th><th>Reason</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;
}

// ═══ Reported Sites ═══

function renderReportedSites(reports) {
  const container = document.getElementById('reportedLog');
  if (reports.length === 0) {
    container.innerHTML = '<div class="log-empty">No reported sites yet</div>';
    return;
  }

  const rows = reports.slice().reverse().slice(0, 50).map(entry => `
    <tr>
      <td>${formatDate(entry.timestamp)}</td>
      <td>${escHtml(entry.url)}</td>
      <td><button class="btn-save" data-report-url="${escHtml(entry.url)}" style="font-size:0.65rem;padding:4px 10px;">+ Block</button></td>
    </tr>
  `).join('');

  container.innerHTML = `
    <table class="log-table">
      <thead><tr><th>When</th><th>Site</th><th>Action</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `;

  container.querySelectorAll('[data-report-url]').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.reportUrl;
      if (url.includes('r/') || url.startsWith('/r/')) {
        const sub = url.replace(/.*r\//, '').replace(/\/.*/, '').toLowerCase();
        chrome.runtime.sendMessage({ type: 'ADD_SUBREDDIT', subreddit: sub }, (res) => {
          btn.textContent = '\u2713';
          btn.disabled = true;
          renderSubTags(res?.userSubreddits || []);
        });
      } else {
        chrome.runtime.sendMessage({ type: 'ADD_DOMAIN', domain: url }, (res) => {
          btn.textContent = '\u2713';
          btn.disabled = true;
          renderDomainTags(res?.userDomains || []);
        });
      }
    });
  });
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
