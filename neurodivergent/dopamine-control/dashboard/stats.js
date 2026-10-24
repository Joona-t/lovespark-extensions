const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const CIRCUMFERENCE = 2 * Math.PI * 56; // r=56

  function xpForNextLevel(level) {
    return level * 100 + 200;
  }

  function render(data) {
    const limit = data.isWeekend ? data.weekendLimit : data.weekdayLimit;
    const used = data.watchTime || 0;
    const remaining = Math.max(0, limit - used);
    const pct = Math.min(100, (used / limit) * 100);

    // Header dopa
    const dopa = document.getElementById('header-dopa');
    if (pct >= 100) dopa.textContent = '😴';
    else if (pct >= 85) dopa.textContent = '😰';
    else if (pct >= 70) dopa.textContent = '😟';
    else if (pct >= 50) dopa.textContent = '😐';
    else dopa.textContent = '😊';

    // Ring
    const offset = CIRCUMFERENCE - (pct / 100) * CIRCUMFERENCE;
    const ringFill = document.getElementById('ring-fill');
    ringFill.style.strokeDashoffset = offset;
    if (pct >= 95) ringFill.style.stroke = 'var(--danger-deep)';
    else if (pct >= 80) ringFill.style.stroke = 'var(--danger)';
    else if (pct >= 60) ringFill.style.stroke = 'var(--caution)';
    else ringFill.style.stroke = 'var(--safe)';

    document.getElementById('ring-pct').textContent = Math.round(pct) + '%';

    // Stats
    document.getElementById('stat-used').textContent = formatTime(used);
    document.getElementById('stat-limit').textContent = formatTime(limit);
    document.getElementById('stat-remaining').textContent = formatTime(remaining);

    if (data.whitelistTime > 0) {
      document.getElementById('whitelist-stat').style.display = 'block';
      document.getElementById('stat-whitelist').textContent = formatTime(data.whitelistTime);
    }

    // Streak + level
    document.getElementById('streak-val').textContent = data.streak || 0;
    document.getElementById('best-streak').textContent = data.bestStreak || 0;
    document.getElementById('level-val').textContent = data.level || 1;

    const xpNeeded = xpForNextLevel(data.level || 1);
    const xp = data.xp || 0;
    document.getElementById('xp-cur').textContent = xp;
    document.getElementById('xp-next').textContent = xpNeeded;
    document.getElementById('xp-bar').style.width = Math.min(100, (xp / xpNeeded) * 100) + '%';

    // Weekly chart
    renderWeekChart(data.dailyHistory || [], limit, used);
  }

  function renderWeekChart(history, todayLimit, todayUsed) {
    const chart = document.getElementById('week-chart');
    const today = new Date();
    const todayStr = getTodayString();

    // Build the last 7 days
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
      const isToday = dateStr === todayStr;
      const hist = history.find(h => h.date === dateStr);
      days.push({
        name: DAYS[d.getDay()],
        isToday,
        watchTime: isToday ? todayUsed : (hist ? hist.watchTime : null),
        limit: hist ? hist.limit : todayLimit,
        underLimit: isToday ? (todayUsed <= todayLimit) : (hist ? hist.underLimit : true),
        hasData: isToday || !!hist
      });
    }

    // Find max for scaling
    const maxTime = Math.max(...days.map(d => d.watchTime || 0), 1);

    chart.innerHTML = '';
    days.forEach(day => {
      const col = document.createElement('div');
      col.className = 'day-col';

      const barWrap = document.createElement('div');
      barWrap.className = 'day-bar-wrap';

      const bar = document.createElement('div');
      bar.className = 'day-bar';

      if (!day.hasData) {
        bar.classList.add('empty');
        bar.style.height = '4px';
      } else {
        bar.classList.add(day.underLimit ? 'under' : 'over');
        const heightPct = day.watchTime ? Math.max(8, (day.watchTime / maxTime) * 100) : 4;
        bar.style.height = heightPct + '%';
        if (day.isToday) bar.classList.add('today');

        bar.title = `${day.name}: ${formatTime(day.watchTime || 0)} / ${formatTime(day.limit)}`;
      }

      const name = document.createElement('div');
      name.className = 'day-name' + (day.isToday ? ' today' : '');
      name.textContent = day.name;

      barWrap.appendChild(bar);
      col.appendChild(barWrap);
      col.appendChild(name);
      chart.appendChild(col);
    });
  }

  // Load data
  chrome.runtime.sendMessage({ type: 'GET_FULL_STATUS' }, (data) => {
    if (chrome.runtime.lastError || !data) {
      document.querySelector('.container').innerHTML =
        '<div class="card"><p data-initial-style="initial-style-4">Could not load stats. Open the extension popup first.</p></div>';
      return;
    }
    render(data);
  });

  // Refresh every 10s
  setInterval(() => {
    chrome.runtime.sendMessage({ type: 'GET_FULL_STATUS' }, (data) => {
      if (data) render(data);
    });
  }, 10000);
