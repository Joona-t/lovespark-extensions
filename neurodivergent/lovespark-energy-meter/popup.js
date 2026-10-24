'use strict';

LoveSparkTheme.init();

const CUTE_MSGS = [
  'Track your energy patterns',
  'You deserve to understand your body',
  'Patterns reveal power',
  'One tap, one data point',
  'Self-awareness is a superpower'
];

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const avgLabel = document.getElementById('avgLabel');
const chartBars = document.getElementById('chartBars');
const chartEmpty = document.getElementById('chartEmpty');
const loggedMsg = document.getElementById('loggedMsg');
const cuteMsg = document.getElementById('cuteMsg');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

// -- Safe message to background ----------------
async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Energy Meter] sendBg error:', err.message);
    return null;
  }
}

// -- DOM helper (NO innerHTML) -----------------
function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'textContent') node.textContent = val;
      else if (key === 'className') node.className = val;
      else node.setAttribute(key, val);
    }
  }
  if (children) {
    for (const child of children) {
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    }
  }
  return node;
}

// -- Render chart bars -------------------------
function renderChart(todayLogs) {
  chartBars.textContent = '';
  if (!todayLogs || todayLogs.length === 0) {
    chartEmpty.hidden = false;
    chartBars.hidden = true;
    return;
  }
  chartEmpty.hidden = true;
  chartBars.hidden = false;

  for (const log of todayLogs) {
    const heightPct = (log.level / 5) * 100;
    const bar = el('div', {
      className: 'chart-bar',
      'data-level': String(log.level),
      'aria-label': 'Energy ' + log.level + ' at ' + log.time
    }, [
      el('span', { className: 'chart-bar-tooltip', textContent: log.time })
    ]);
    bar.style.height = heightPct + '%';
    chartBars.appendChild(bar);
  }
}

// -- Update UI ---------------------------------
function updateUI(data) {
  if (!data) return;
  const today = data.logsToday || 0;
  const total = data.logsTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  avgLabel.textContent = data.avgToday > 0 ? 'avg: ' + data.avgToday : 'avg: --';
  renderChart(data.todayLogs);
}

// -- Energy button clicks ----------------------
document.querySelectorAll('.energy-btn').forEach(function(btn) {
  btn.addEventListener('click', async function() {
    var level = parseInt(btn.dataset.level, 10);
    var result = await sendBg({ type: 'LOG_ENERGY', level: level });
    if (result && result.ok) {
      loggedMsg.textContent = 'Logged energy level ' + level + '!';
      loggedMsg.hidden = false;
      setTimeout(function() { loggedMsg.hidden = true; }, 2000);
      await refreshData();
    }
  });
});

// -- Refresh -----------------------------------
async function refreshData() {
  var data = await sendBg({ type: 'GET_STATS' });
  if (data) updateUI(data);
}

// -- Listen for storage changes ----------------
chrome.storage.onChanged.addListener(function() { refreshData(); });

// -- Init --------------------------------------
LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
refreshData();
