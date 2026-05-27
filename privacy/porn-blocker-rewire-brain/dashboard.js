// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Dashboard Script
// Full-screen: sobriety timer, brain tree, stats, journal, resources
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

// ── Load data from background ──
safeSend({ type: 'GET_SETTINGS' }, (data) => {
  if (chrome.runtime.lastError || !data) return;

  const xp = data.xp || 0;
  const streakDays = data.streakDays || 0;
  const blockedCount = data.blockedCount || 0;

  // Stats
  document.getElementById('statBlocked').textContent = blockedCount;
  document.getElementById('statStreak').textContent = streakDays;
  document.getElementById('statXp').textContent = xp;

  // XP progress
  if (typeof getXpProgress === 'function') {
    const progress = getXpProgress(xp);
    document.getElementById('levelBadge').textContent =
      'Level ' + progress.level + ' \u2014 ' + progress.name;
    document.getElementById('xpBarFill').style.width = progress.percent + '%';
    document.getElementById('xpText').textContent =
      xp + ' / ' + progress.neededXp + ' XP';

    const stage = getTreeStage(progress.level);
    document.getElementById('treeContainer').className =
      'tree-container tree-stage-' + stage;
  }

  // Milestone
  if (typeof getMilestoneLabel === 'function') {
    const ms = getMilestoneLabel(streakDays);
    document.getElementById('milestoneLabel').textContent =
      'Day ' + streakDays + ' \u2014 ' + ms.label;
  }

  // Next milestone
  if (typeof getNextMilestone === 'function') {
    const next = getNextMilestone(streakDays);
    if (next) {
      document.getElementById('nmLabel').textContent = next.label;
      const daysLeft = next.days - streakDays;
      document.getElementById('nmDays').textContent =
        daysLeft + ' day' + (daysLeft !== 1 ? 's' : '') + ' to go';
    } else {
      document.getElementById('nmLabel').textContent = 'All milestones reached!';
      document.getElementById('nmDays').textContent = 'You are fully rewired.';
    }
  }

  // ── Live Sobriety Timer ──
  const sobrietyStart = data.sobrietyStartTime;
  if (sobrietyStart) {
    const startDate = new Date(sobrietyStart);
    document.getElementById('timerStartDate').textContent =
      'Since ' + startDate.toLocaleDateString(undefined, {
        year: 'numeric', month: 'long', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
      });

    function tickTimer() {
      const elapsed = Date.now() - startDate.getTime();
      if (elapsed < 0) return;
      const d = Math.floor(elapsed / 86400000);
      const h = Math.floor((elapsed % 86400000) / 3600000);
      const m = Math.floor((elapsed % 3600000) / 60000);
      const s = Math.floor((elapsed % 60000) / 1000);
      document.getElementById('timerDays').textContent = d;
      document.getElementById('timerHours').textContent = h;
      document.getElementById('timerMins').textContent = m;
      document.getElementById('timerSecs').textContent = s;
    }
    tickTimer();
    setInterval(tickTimer, 1000);
  }

  // ── Motivation section ──
  if (data.userReason || data.userGoal) {
    const section = document.getElementById('motivationSection');
    section.classList.add('visible');
    if (data.userReason) {
      document.getElementById('motivReason').textContent =
        '\u201C' + data.userReason + '\u201D';
    }
    if (data.userGoal) {
      document.getElementById('motivGoal').textContent =
        '\u201C' + data.userGoal + '\u201D';
      document.getElementById('motivGoalWrap').style.display = 'block';
    }
  }

  // ── Journal: load today's entry + past entries ──
  const entries = data.journalEntries || [];
  const today = new Date().toISOString().split('T')[0];
  const todayEntry = entries.find(e => e.date === today);
  if (todayEntry) {
    document.getElementById('journalInput').value = todayEntry.text;
  }

  // Render past entries (last 7, excluding today)
  const past = entries.filter(e => e.date !== today).slice(-7).reverse();
  if (past.length > 0) {
    document.getElementById('pastHeader').style.display = 'block';
    const container = document.getElementById('journalPastEntries');
    past.forEach(entry => {
      const div = document.createElement('div');
      div.className = 'journal-entry';

      const dateDiv = document.createElement('div');
      dateDiv.className = 'journal-entry-date';
      dateDiv.textContent = new Date(entry.date + 'T00:00:00').toLocaleDateString(
        undefined, { weekday: 'short', month: 'short', day: 'numeric' }
      );

      const textDiv = document.createElement('div');
      textDiv.textContent = entry.text;

      div.appendChild(dateDiv);
      div.appendChild(textDiv);
      container.appendChild(div);
    });
  }

  // Scroll to journal if URL hash is #journal
  if (window.location.hash === '#journal') {
    document.getElementById('journalSection').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('journalInput').focus();
  }
});

// ── Journal save ──
document.getElementById('journalSaveBtn').addEventListener('click', () => {
  const text = document.getElementById('journalInput').value.trim();
  const feedback = document.getElementById('journalFeedback');
  if (!text) {
    feedback.textContent = 'Write something first';
    return;
  }

  const today = new Date().toISOString().split('T')[0];
  safeSend({
    type: 'SAVE_JOURNAL_ENTRY',
    date: today,
    text: text
  }, (res) => {
    if (res && res.saved) {
      feedback.textContent = '\u2713 Saved! +15 XP for journaling';
      setTimeout(() => { feedback.textContent = ''; }, 3000);
    }
  });
});

// ── Render resources ──
function renderDashResources() {
  const grid = document.getElementById('dashResources');
  if (!grid || typeof RESOURCES === 'undefined') return;

  const all = getAllResources();
  all.forEach(item => {
    const a = document.createElement('a');
    a.className = 'res-card-d';
    a.href = item.url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    a.setAttribute('aria-label', item.title + ' \u2014 opens in new tab');

    const emojiSpan = document.createElement('span');
    emojiSpan.className = 'rcd-emoji';
    emojiSpan.textContent = item.emoji;

    const infoDiv = document.createElement('div');

    const titleDiv = document.createElement('div');
    titleDiv.className = 'rcd-title';
    titleDiv.textContent = item.title;

    const descDiv = document.createElement('div');
    descDiv.className = 'rcd-desc';
    descDiv.textContent = item.description;

    infoDiv.appendChild(titleDiv);
    infoDiv.appendChild(descDiv);
    a.appendChild(emojiSpan);
    a.appendChild(infoDiv);
    grid.appendChild(a);
  });
}
renderDashResources();

// ── Settings link ──
document.getElementById('openSettings').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
