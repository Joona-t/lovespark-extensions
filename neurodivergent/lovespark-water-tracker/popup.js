'use strict';

document.addEventListener('DOMContentLoaded', () => {
  LoveSparkTheme.init();

  const GOAL = 8;
  const glassGrid = document.getElementById('glassGrid');
  const fillLevel = document.getElementById('fillLevel');
  const fillLabel = document.getElementById('fillLabel');
  const undoBtn = document.getElementById('undoBtn');
  const todayEl = document.getElementById('todayCount');
  const totalEl = document.getElementById('totalCount');
  const cuteMsg = document.getElementById('cuteMsg');

  const CUTE_MSGS = [
    'Stay hydrated!',
    'Water is brain fuel!',
    'Your body thanks you!',
    'Sip sip hooray!',
    'Hydration = focus!',
  ];

  const GOAL_MSGS = [
    'Goal reached! Amazing!',
    'You did it! So proud!',
    'Fully hydrated today!',
  ];

  let prevToday = 0;
  let prevTotal = 0;

  // Build 8 glass buttons using DOM API (zero innerHTML)
  for (let i = 0; i < GOAL; i++) {
    const btn = document.createElement('button');
    btn.className = 'glass-btn';
    btn.setAttribute('aria-label', 'Log cup ' + (i + 1) + ' of ' + GOAL);
    btn.dataset.index = String(i);

    const icon = document.createElement('span');
    icon.className = 'glass-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '\uD83E\uDD64'; // glass of water emoji

    btn.appendChild(icon);
    btn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'LOG_WATER' }).then(refresh);
    });
    glassGrid.appendChild(btn);
  }

  function updateGlasses(cups) {
    const buttons = glassGrid.querySelectorAll('.glass-btn');
    buttons.forEach((btn, idx) => {
      const isFilled = idx < cups;
      btn.classList.toggle('filled', isFilled);
      btn.setAttribute('aria-label',
        isFilled
          ? 'Cup ' + (idx + 1) + ' filled'
          : 'Log cup ' + (idx + 1) + ' of ' + GOAL
      );
    });
  }

  function updateFillMeter(cups, goal) {
    const pct = Math.min(100, (cups / goal) * 100);
    fillLevel.style.width = pct + '%';
    fillLevel.classList.toggle('complete', cups >= goal);
    fillLabel.textContent = cups + ' / ' + goal + ' cups';
  }

  function updateUI(data) {
    const today = data.waterToday || 0;
    const total = data.waterTotal || 0;
    const goal = data.waterGoal || GOAL;

    updateGlasses(today);
    updateFillMeter(today, goal);

    LoveSparkPopup.animateCount(todayEl, prevToday, today);
    LoveSparkPopup.animateCount(totalEl, prevTotal, total);
    if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

    // Show goal message if just completed
    if (today >= goal && prevToday < goal && prevToday > 0) {
      const goalMsg = GOAL_MSGS[Math.floor(Math.random() * GOAL_MSGS.length)];
      cuteMsg.textContent = goalMsg;
    }

    prevToday = today;
    prevTotal = total;
  }

  function refresh() {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
  }

  undoBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'UNDO_WATER' }).then(refresh);
  });

  LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
  chrome.storage.onChanged.addListener(refresh);
  refresh();
});

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
