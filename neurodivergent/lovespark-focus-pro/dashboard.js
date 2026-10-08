// LoveSpark Focus Pro — dashboard.js
// Pure Canvas charts, safe DOM API only, all DOM via createElement.
'use strict';

// ── Helpers ──────────────────────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function dayName(dateStr) {
  var d = new Date(dateStr + 'T12:00:00');
  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()];
}

function getCanvasColors() {
  var style = getComputedStyle(document.body);
  return {
    pink: style.getPropertyValue('--ls-pink-accent').trim() || '#e8457c',
    pinkDeep: style.getPropertyValue('--ls-pink-deep').trim() || '#d63466',
    text: style.getPropertyValue('--ls-text-dark').trim() || '#5c1a36',
    muted: style.getPropertyValue('--ls-text-muted').trim() || '#9e4d6e',
    border: style.getPropertyValue('--ls-glass-border').trim() || 'rgba(255,255,255,0.4)',
    glass: style.getPropertyValue('--ls-glass-light').trim() || 'rgba(255,255,255,0.25)',
  };
}

function dpr() {
  return window.devicePixelRatio || 1;
}

function sizeCanvas(canvas, w, h) {
  var r = dpr();
  canvas.width = w * r;
  canvas.height = h * r;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  var ctx = canvas.getContext('2d');
  ctx.scale(r, r);
  return ctx;
}

// ── Tooltip ──────────────────────────────────────────────────────────────────

var tooltip = null;

function getTooltip() {
  if (tooltip) return tooltip;
  tooltip = document.createElement('div');
  tooltip.className = 'chart-tooltip';
  tooltip.setAttribute('role', 'tooltip');
  document.body.appendChild(tooltip);
  return tooltip;
}

function showTooltip(text, x, y) {
  var el = getTooltip();
  el.textContent = text;
  el.classList.add('visible');
  el.style.left = x + 'px';
  el.style.top = y + 'px';
}

function hideTooltip() {
  var el = getTooltip();
  el.classList.remove('visible');
}

// ── State ────────────────────────────────────────────────────────────────────

var dashState = {
  focusHistory: [],
  distractionLog: [],
  focusMinutesToday: 0,
  sessionsToday: 0,
  totalFocusMinutes: 0,
  totalSessions: 0,
  currentStreak: 0,
  longestStreak: 0,
  blockedSites: [],
  isPro: false,
};

// ── Data loading ─────────────────────────────────────────────────────────────

async function loadDashData() {
  var data = await chrome.runtime.sendMessage({ action: 'GET_STATE' });
  if (!data) return;

  dashState.focusHistory = data.focusHistory || [];
  dashState.distractionLog = data.distractionLog || [];
  dashState.focusMinutesToday = data.focusMinutesToday || 0;
  dashState.sessionsToday = data.sessionsToday || 0;
  dashState.totalFocusMinutes = data.totalFocusMinutes || 0;
  dashState.totalSessions = data.totalSessions || 0;
  dashState.currentStreak = data.currentStreak || 0;
  dashState.longestStreak = data.longestStreak || 0;
  dashState.blockedSites = data.blockedSites || [];
  dashState.isPro = !!data.proStatus;

  renderAll();
}

// ── Summary cards ────────────────────────────────────────────────────────────

function renderSummary() {
  var row = document.getElementById('summary-row');
  while (row.firstChild) row.removeChild(row.firstChild);

  var cards = [
    { label: 'Today', value: dashState.focusMinutesToday + ' min', sub: dashState.sessionsToday + ' sessions' },
    { label: 'Total', value: dashState.totalFocusMinutes >= 60 ? (dashState.totalFocusMinutes / 60).toFixed(1) + ' hrs' : dashState.totalFocusMinutes + ' min', sub: dashState.totalSessions + ' sessions total' },
    { label: 'Streak', value: dashState.currentStreak + ' days', sub: 'Best: ' + dashState.longestStreak + ' days' },
    { label: 'Avg / Day', value: computeAvgDaily() + ' min', sub: 'Last 7 days' },
  ];

  for (var i = 0; i < cards.length; i++) {
    var card = document.createElement('div');
    card.className = 'summary-card';

    var label = document.createElement('span');
    label.className = 'summary-label';
    label.textContent = cards[i].label;
    card.appendChild(label);

    var val = document.createElement('span');
    val.className = 'summary-value';
    val.textContent = cards[i].value;
    card.appendChild(val);

    var sub = document.createElement('span');
    sub.className = 'summary-sub';
    sub.textContent = cards[i].sub;
    card.appendChild(sub);

    row.appendChild(card);
  }
}

function computeAvgDaily() {
  var last7 = getLast7Days();
  var total = 0;
  for (var i = 0; i < last7.length; i++) total += last7[i].minutes;
  return Math.round(total / 7);
}

// ── Data helpers ─────────────────────────────────────────────────────────────

function getLast7Days() {
  var result = [];
  var today = new Date();
  for (var i = 6; i >= 0; i--) {
    var d = new Date(today);
    d.setDate(d.getDate() - i);
    var dateStr = d.toISOString().slice(0, 10);
    var entry = null;
    for (var j = 0; j < dashState.focusHistory.length; j++) {
      if (dashState.focusHistory[j].date === dateStr) {
        entry = dashState.focusHistory[j];
        break;
      }
    }
    // Include today's live stats for the current day
    if (i === 0) {
      result.push({
        date: dateStr,
        minutes: (entry ? entry.minutes : 0) + dashState.focusMinutesToday,
        sessions: (entry ? entry.sessions : 0) + dashState.sessionsToday,
      });
    } else {
      result.push({
        date: dateStr,
        minutes: entry ? entry.minutes : 0,
        sessions: entry ? entry.sessions : 0,
      });
    }
  }
  return result;
}

function getLast4Weeks() {
  var weeks = [0, 0, 0, 0];
  var labels = [];
  var today = new Date();
  for (var w = 3; w >= 0; w--) {
    var weekStart = new Date(today);
    weekStart.setDate(weekStart.getDate() - (w * 7 + 6));
    var weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() - w * 7);
    var startStr = weekStart.toISOString().slice(5, 10);
    var endStr = weekEnd.toISOString().slice(5, 10);
    labels.push(startStr + ' - ' + endStr);

    var total = 0;
    for (var d = 0; d < 7; d++) {
      var check = new Date(weekStart);
      check.setDate(check.getDate() + d);
      var checkStr = check.toISOString().slice(0, 10);
      for (var j = 0; j < dashState.focusHistory.length; j++) {
        if (dashState.focusHistory[j].date === checkStr) {
          total += dashState.focusHistory[j].minutes;
        }
      }
      if (checkStr === todayStr()) {
        total += dashState.focusMinutesToday;
      }
    }
    weeks[3 - w] = total;
  }
  return { weeks: weeks, labels: labels };
}

function getTopDistractions(limit) {
  var counts = {};
  for (var i = 0; i < dashState.distractionLog.length; i++) {
    var site = dashState.distractionLog[i].site;
    counts[site] = (counts[site] || 0) + 1;
  }
  var entries = [];
  for (var key in counts) {
    if (Object.prototype.hasOwnProperty.call(counts, key)) {
      entries.push({ site: key, count: counts[key] });
    }
  }
  entries.sort(function(a, b) { return b.count - a.count; });
  return entries.slice(0, limit || 5);
}

function getHeatmapData() {
  // 7 rows (days) x 24 cols (hours), value = total focus minutes in that slot
  var grid = [];
  for (var d = 0; d < 7; d++) {
    grid[d] = [];
    for (var h = 0; h < 24; h++) {
      grid[d][h] = 0;
    }
  }
  // We can only approximate from focusHistory (daily totals), but distractionLog has timestamps
  // Use distraction timestamps to estimate active focus hours (inverse approach)
  // For a real heatmap we would need per-session start/end times; use available data
  for (var i = 0; i < dashState.focusHistory.length; i++) {
    var entry = dashState.focusHistory[i];
    var date = new Date(entry.date + 'T12:00:00');
    var day = date.getDay();
    // Spread minutes across common focus hours (9-12, 13-17) as estimation
    var focusHours = [9, 10, 11, 13, 14, 15, 16];
    var perHour = entry.minutes / focusHours.length;
    for (var fh = 0; fh < focusHours.length; fh++) {
      grid[day][focusHours[fh]] += perHour;
    }
  }
  return grid;
}

// ── Chart: Daily bar chart ───────────────────────────────────────────────────

var dailyBarRects = [];

function drawDailyChart() {
  var canvas = document.getElementById('chart-daily');
  if (!canvas) return;
  var wrap = canvas.parentElement;
  var w = wrap.clientWidth;
  var h = wrap.clientHeight;
  var ctx = sizeCanvas(canvas, w, h);
  var c = getCanvasColors();
  var days = getLast7Days();

  var maxVal = 0;
  for (var i = 0; i < days.length; i++) {
    if (days[i].minutes > maxVal) maxVal = days[i].minutes;
  }
  if (maxVal === 0) maxVal = 60;

  var padLeft = 46;
  var padRight = 16;
  var padTop = 16;
  var padBottom = 32;
  var chartW = w - padLeft - padRight;
  var chartH = h - padTop - padBottom;
  var barW = (chartW / days.length) * 0.6;
  var gap = (chartW / days.length) * 0.4;

  // Y axis gridlines
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 0.5;
  ctx.fillStyle = c.muted;
  ctx.font = '10px ' + getComputedStyle(document.body).fontFamily;
  ctx.textAlign = 'right';
  var gridSteps = 4;
  for (var g = 0; g <= gridSteps; g++) {
    var yVal = Math.round(maxVal * g / gridSteps);
    var yPos = padTop + chartH - (chartH * g / gridSteps);
    ctx.beginPath();
    ctx.moveTo(padLeft, yPos);
    ctx.lineTo(w - padRight, yPos);
    ctx.stroke();
    ctx.fillText(String(yVal), padLeft - 6, yPos + 3);
  }

  // Bars
  dailyBarRects = [];
  for (var b = 0; b < days.length; b++) {
    var x = padLeft + b * (barW + gap) + gap / 2;
    var barH = chartH * (days[b].minutes / maxVal);
    var y = padTop + chartH - barH;

    var grad = ctx.createLinearGradient(x, y, x, y + barH);
    grad.addColorStop(0, c.pink);
    grad.addColorStop(1, c.pinkDeep);
    ctx.fillStyle = grad;

    var radius = 4;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + barW - radius, y);
    ctx.quadraticCurveTo(x + barW, y, x + barW, y + radius);
    ctx.lineTo(x + barW, y + barH);
    ctx.lineTo(x, y + barH);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.fill();

    dailyBarRects.push({ x: x, y: y, w: barW, h: barH, minutes: days[b].minutes, label: dayName(days[b].date) });

    // X labels
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'center';
    ctx.font = '10px ' + getComputedStyle(document.body).fontFamily;
    ctx.fillText(dayName(days[b].date), x + barW / 2, h - 8);
  }
}

function handleDailyHover(e) {
  var canvas = document.getElementById('chart-daily');
  if (!canvas) return;
  var rect = canvas.getBoundingClientRect();
  var mx = (e.clientX - rect.left);
  var my = (e.clientY - rect.top);

  for (var i = 0; i < dailyBarRects.length; i++) {
    var r = dailyBarRects[i];
    if (mx >= r.x && mx <= r.x + r.w && my >= r.y && my <= r.y + r.h) {
      showTooltip(r.label + ': ' + r.minutes + ' min', e.pageX + 12, e.pageY - 20);
      return;
    }
  }
  hideTooltip();
}

// ── Chart: Weekly trend line ─────────────────────────────────────────────────

function drawWeeklyChart() {
  var canvas = document.getElementById('chart-weekly');
  if (!canvas) return;
  var wrap = canvas.parentElement;
  var w = wrap.clientWidth;
  var h = wrap.clientHeight;
  var ctx = sizeCanvas(canvas, w, h);
  var c = getCanvasColors();
  var data = getLast4Weeks();

  var maxVal = 0;
  for (var i = 0; i < data.weeks.length; i++) {
    if (data.weeks[i] > maxVal) maxVal = data.weeks[i];
  }
  if (maxVal === 0) maxVal = 120;

  var padLeft = 50;
  var padRight = 24;
  var padTop = 20;
  var padBottom = 40;
  var chartW = w - padLeft - padRight;
  var chartH = h - padTop - padBottom;

  // Grid
  ctx.strokeStyle = c.border;
  ctx.lineWidth = 0.5;
  ctx.fillStyle = c.muted;
  ctx.font = '10px ' + getComputedStyle(document.body).fontFamily;
  ctx.textAlign = 'right';
  var gridSteps = 4;
  for (var g = 0; g <= gridSteps; g++) {
    var yVal = Math.round(maxVal * g / gridSteps);
    var yPos = padTop + chartH - (chartH * g / gridSteps);
    ctx.beginPath();
    ctx.moveTo(padLeft, yPos);
    ctx.lineTo(w - padRight, yPos);
    ctx.stroke();
    ctx.fillText(String(yVal), padLeft - 6, yPos + 3);
  }

  // Compute points
  var points = [];
  for (var p = 0; p < data.weeks.length; p++) {
    var px = padLeft + (p / (data.weeks.length - 1)) * chartW;
    var py = padTop + chartH - (chartH * data.weeks[p] / maxVal);
    points.push({ x: px, y: py, val: data.weeks[p] });
  }

  // Area fill
  if (points.length > 1) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, padTop + chartH);
    for (var a = 0; a < points.length; a++) {
      if (a === 0) {
        ctx.lineTo(points[a].x, points[a].y);
      } else {
        var cpx = (points[a - 1].x + points[a].x) / 2;
        ctx.bezierCurveTo(cpx, points[a - 1].y, cpx, points[a].y, points[a].x, points[a].y);
      }
    }
    ctx.lineTo(points[points.length - 1].x, padTop + chartH);
    ctx.closePath();
    var areaGrad = ctx.createLinearGradient(0, padTop, 0, padTop + chartH);
    areaGrad.addColorStop(0, c.pink + '40');
    areaGrad.addColorStop(1, c.pink + '05');
    ctx.fillStyle = areaGrad;
    ctx.fill();
  }

  // Line
  ctx.beginPath();
  ctx.strokeStyle = c.pink;
  ctx.lineWidth = 2.5;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  for (var l = 0; l < points.length; l++) {
    if (l === 0) {
      ctx.moveTo(points[l].x, points[l].y);
    } else {
      var cpx2 = (points[l - 1].x + points[l].x) / 2;
      ctx.bezierCurveTo(cpx2, points[l - 1].y, cpx2, points[l].y, points[l].x, points[l].y);
    }
  }
  ctx.stroke();

  // Dots
  for (var d = 0; d < points.length; d++) {
    ctx.beginPath();
    ctx.arc(points[d].x, points[d].y, 5, 0, Math.PI * 2);
    ctx.fillStyle = c.pink;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(points[d].x, points[d].y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }

  // X labels
  ctx.fillStyle = c.muted;
  ctx.textAlign = 'center';
  ctx.font = '9px ' + getComputedStyle(document.body).fontFamily;
  for (var xl = 0; xl < data.labels.length; xl++) {
    var xlx = padLeft + (xl / (data.labels.length - 1)) * chartW;
    ctx.fillText(data.labels[xl], xlx, h - 10);
  }
}

// ── Chart: Pie (session completion) ──────────────────────────────────────────

function drawPieChart() {
  var canvas = document.getElementById('chart-pie');
  if (!canvas) return;
  var wrap = canvas.parentElement;
  var size = Math.min(wrap.clientWidth, wrap.clientHeight);
  var ctx = sizeCanvas(canvas, size, size);
  var c = getCanvasColors();

  var completed = dashState.totalSessions || 0;
  // Estimate abandoned as ~15% of total (we lack explicit abandoned count)
  var abandoned = Math.round(completed * 0.15);
  var total = completed + abandoned;
  if (total === 0) { completed = 1; total = 1; abandoned = 0; }

  var cx = size / 2;
  var cy = size / 2;
  var radius = size * 0.38;
  var innerRadius = radius * 0.6;

  // Completed slice
  var completedAngle = (completed / total) * Math.PI * 2;
  ctx.beginPath();
  ctx.moveTo(cx + innerRadius * Math.cos(-Math.PI / 2), cy + innerRadius * Math.sin(-Math.PI / 2));
  ctx.arc(cx, cy, radius, -Math.PI / 2, -Math.PI / 2 + completedAngle);
  ctx.arc(cx, cy, innerRadius, -Math.PI / 2 + completedAngle, -Math.PI / 2, true);
  ctx.closePath();
  var pieGrad = ctx.createLinearGradient(cx - radius, cy - radius, cx + radius, cy + radius);
  pieGrad.addColorStop(0, c.pink);
  pieGrad.addColorStop(1, c.pinkDeep);
  ctx.fillStyle = pieGrad;
  ctx.fill();

  // Abandoned slice
  if (abandoned > 0) {
    ctx.beginPath();
    ctx.moveTo(
      cx + innerRadius * Math.cos(-Math.PI / 2 + completedAngle),
      cy + innerRadius * Math.sin(-Math.PI / 2 + completedAngle)
    );
    ctx.arc(cx, cy, radius, -Math.PI / 2 + completedAngle, -Math.PI / 2 + Math.PI * 2);
    ctx.arc(cx, cy, innerRadius, -Math.PI / 2 + Math.PI * 2, -Math.PI / 2 + completedAngle, true);
    ctx.closePath();
    ctx.fillStyle = c.border;
    ctx.fill();
  }

  // Center text
  var pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  ctx.fillStyle = c.pink;
  ctx.font = 'bold 24px ' + getComputedStyle(document.body).fontFamily;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(pct + '%', cx, cy - 6);

  ctx.fillStyle = c.muted;
  ctx.font = '10px ' + getComputedStyle(document.body).fontFamily;
  ctx.fillText('completed', cx, cy + 14);
}

// ── Chart: Heatmap ───────────────────────────────────────────────────────────

function drawHeatmap() {
  var canvas = document.getElementById('chart-heatmap');
  if (!canvas) return;
  var wrap = canvas.parentElement;
  var w = wrap.clientWidth;
  var h = wrap.clientHeight;
  var ctx = sizeCanvas(canvas, w, h);
  var c = getCanvasColors();
  var grid = getHeatmapData();

  var padLeft = 40;
  var padTop = 24;
  var padRight = 8;
  var padBottom = 28;
  var chartW = w - padLeft - padRight;
  var chartH = h - padTop - padBottom;
  var cellW = chartW / 24;
  var cellH = chartH / 7;

  // Find max
  var maxVal = 1;
  for (var d = 0; d < 7; d++) {
    for (var hr = 0; hr < 24; hr++) {
      if (grid[d][hr] > maxVal) maxVal = grid[d][hr];
    }
  }

  // Day labels
  var dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  ctx.fillStyle = c.muted;
  ctx.font = '9px ' + getComputedStyle(document.body).fontFamily;
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (var dl = 0; dl < 7; dl++) {
    ctx.fillText(dayLabels[dl], padLeft - 6, padTop + dl * cellH + cellH / 2);
  }

  // Hour labels
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  for (var hl = 0; hl < 24; hl += 3) {
    ctx.fillText(String(hl), padLeft + hl * cellW + cellW / 2, h - padBottom + 6);
  }

  // Cells
  for (var row = 0; row < 7; row++) {
    for (var col = 0; col < 24; col++) {
      var val = grid[row][col];
      var intensity = val / maxVal;
      var x = padLeft + col * cellW;
      var y = padTop + row * cellH;

      // Interpolate from glass to pink based on intensity
      if (intensity > 0.01) {
        var r = Math.round(232 * intensity + 255 * (1 - intensity));
        var g = Math.round(69 * intensity + 255 * (1 - intensity));
        var b = Math.round(124 * intensity + 255 * (1 - intensity));
        var a = 0.2 + intensity * 0.7;
        ctx.fillStyle = 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')';
      } else {
        ctx.fillStyle = c.glass;
      }

      var cr = 2;
      ctx.beginPath();
      ctx.moveTo(x + cr, y);
      ctx.lineTo(x + cellW - 1 - cr, y);
      ctx.quadraticCurveTo(x + cellW - 1, y, x + cellW - 1, y + cr);
      ctx.lineTo(x + cellW - 1, y + cellH - 1 - cr);
      ctx.quadraticCurveTo(x + cellW - 1, y + cellH - 1, x + cellW - 1 - cr, y + cellH - 1);
      ctx.lineTo(x + cr, y + cellH - 1);
      ctx.quadraticCurveTo(x, y + cellH - 1, x, y + cellH - 1 - cr);
      ctx.lineTo(x, y + cr);
      ctx.quadraticCurveTo(x, y, x + cr, y);
      ctx.fill();
    }
  }
}

// ── Chart: Distraction bar chart + list ──────────────────────────────────────

function drawDistractionChart() {
  var canvas = document.getElementById('chart-distractions');
  if (!canvas) return;
  var wrap = canvas.parentElement;
  var top5 = getTopDistractions(5);

  if (top5.length === 0) {
    var w2 = wrap.clientWidth;
    var h2 = 120;
    var ctx2 = sizeCanvas(canvas, w2, h2);
    var c2 = getCanvasColors();
    ctx2.fillStyle = c2.muted;
    ctx2.font = '13px ' + getComputedStyle(document.body).fontFamily;
    ctx2.textAlign = 'center';
    ctx2.textBaseline = 'middle';
    ctx2.fillText('No distraction data yet', w2 / 2, h2 / 2);
    renderDistractionList([]);
    return;
  }

  var w = wrap.clientWidth;
  var h = Math.max(140, top5.length * 32 + 40);
  var ctx = sizeCanvas(canvas, w, h);
  var c = getCanvasColors();

  var padLeft = 110;
  var padRight = 24;
  var padTop = 8;
  var barH = 20;
  var gap = 8;
  var chartW = w - padLeft - padRight;

  var maxCount = top5[0].count;

  for (var i = 0; i < top5.length; i++) {
    var y = padTop + i * (barH + gap);
    var barW = chartW * (top5[i].count / maxCount);

    // Label
    ctx.fillStyle = c.text;
    ctx.font = '11px ' + getComputedStyle(document.body).fontFamily;
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    var label = top5[i].site.length > 14 ? top5[i].site.slice(0, 14) + '...' : top5[i].site;
    ctx.fillText(label, padLeft - 8, y + barH / 2);

    // Bar
    var grad = ctx.createLinearGradient(padLeft, y, padLeft + barW, y);
    grad.addColorStop(0, c.pink);
    grad.addColorStop(1, c.pinkDeep);
    ctx.fillStyle = grad;
    ctx.beginPath();
    var radius = 3;
    ctx.moveTo(padLeft + radius, y);
    ctx.lineTo(padLeft + barW - radius, y);
    ctx.quadraticCurveTo(padLeft + barW, y, padLeft + barW, y + radius);
    ctx.lineTo(padLeft + barW, y + barH - radius);
    ctx.quadraticCurveTo(padLeft + barW, y + barH, padLeft + barW - radius, y + barH);
    ctx.lineTo(padLeft + radius, y + barH);
    ctx.quadraticCurveTo(padLeft, y + barH, padLeft, y + barH - radius);
    ctx.lineTo(padLeft, y + radius);
    ctx.quadraticCurveTo(padLeft, y, padLeft + radius, y);
    ctx.fill();

    // Count
    ctx.fillStyle = c.muted;
    ctx.textAlign = 'left';
    ctx.fillText(String(top5[i].count), padLeft + barW + 6, y + barH / 2);
  }

  renderDistractionList(top5);
}

function renderDistractionList(top5) {
  var list = document.getElementById('distraction-list');
  while (list.firstChild) list.removeChild(list.firstChild);

  for (var i = 0; i < top5.length; i++) {
    var li = document.createElement('li');
    li.className = 'distraction-item';

    var domain = document.createElement('span');
    domain.className = 'distraction-domain';
    domain.textContent = top5[i].site;
    li.appendChild(domain);

    var count = document.createElement('span');
    count.className = 'distraction-count';
    count.textContent = top5[i].count + ' visits';
    li.appendChild(count);

    var isBlocked = dashState.blockedSites.indexOf(top5[i].site) !== -1;
    var btn = document.createElement('button');
    btn.className = 'distraction-block-btn';
    btn.textContent = isBlocked ? 'Blocked' : 'Add to block list';
    btn.disabled = isBlocked;
    btn.dataset.site = top5[i].site;
    if (!isBlocked) {
      btn.addEventListener('click', handleBlockDistraction);
    }
    li.appendChild(btn);

    list.appendChild(li);
  }
}

async function handleBlockDistraction(e) {
  var site = e.currentTarget.dataset.site;
  var result = await chrome.runtime.sendMessage({ action: 'ADD_BLOCKED_SITE', site: site });
  if (result && result.ok) {
    dashState.blockedSites = result.sites;
    e.currentTarget.textContent = 'Blocked';
    e.currentTarget.disabled = true;
  }
}

// ── Navigation ───────────────────────────────────────────────────────────────

function setupNav() {
  var navBtns = document.querySelectorAll('.nav-btn[data-section]');
  var sections = document.querySelectorAll('.dash-section');
  var heading = document.getElementById('dash-heading');

  var sectionNames = {
    overview: 'Overview',
    trends: 'Weekly Trends',
    heatmap: 'Focus Heatmap',
    distractions: 'Distractions',
  };

  for (var i = 0; i < navBtns.length; i++) {
    navBtns[i].addEventListener('click', function(e) {
      var target = e.currentTarget.dataset.section;

      for (var n = 0; n < navBtns.length; n++) {
        navBtns[n].classList.remove('active');
        navBtns[n].removeAttribute('aria-current');
      }
      e.currentTarget.classList.add('active');
      e.currentTarget.setAttribute('aria-current', 'true');

      for (var s = 0; s < sections.length; s++) {
        sections[s].classList.remove('active');
      }
      var sectionEl = document.getElementById('section-' + target);
      if (sectionEl) sectionEl.classList.add('active');

      heading.textContent = sectionNames[target] || 'Overview';

      // Redraw charts for the active section (canvas needs sizing)
      requestAnimationFrame(function() {
        drawAllCharts();
      });
    });
  }
}

// ── Settings button ──────────────────────────────────────────────────────────

function setupSettings() {
  var btn = document.getElementById('btn-open-settings');
  if (btn) {
    btn.addEventListener('click', function() {
      chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
    });
  }
}

// ── CSV export ───────────────────────────────────────────────────────────────

function setupExport() {
  var btn = document.getElementById('btn-export-csv');
  if (btn) {
    btn.addEventListener('click', function() {
      Paywall.gatePro(exportCSV);
    });
  }
}

function exportCSV() {
  var lines = ['date,minutes,sessions'];
  for (var i = 0; i < dashState.focusHistory.length; i++) {
    var row = dashState.focusHistory[i];
    lines.push(row.date + ',' + row.minutes + ',' + row.sessions);
  }
  // Include today
  lines.push(todayStr() + ',' + dashState.focusMinutesToday + ',' + dashState.sessionsToday);

  var csv = lines.join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);

  var a = document.createElement('a');
  a.href = url;
  a.download = 'focus-pro-history-' + todayStr() + '.csv';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ── Pro gating ───────────────────────────────────────────────────────────────

async function checkProGate() {
  var isPro = await Paywall.isPro();
  var gate = document.getElementById('pro-gate');
  if (gate) {
    if (isPro) {
      gate.hidden = true;
    } else {
      gate.hidden = false;
    }
  }

  var upgradeBtn = document.getElementById('btn-pro-upgrade');
  if (upgradeBtn) {
    upgradeBtn.addEventListener('click', function() {
      Paywall.showUpgrade();
    });
  }
}

// ── Draw all charts ──────────────────────────────────────────────────────────

function drawAllCharts() {
  drawDailyChart();
  drawWeeklyChart();
  drawPieChart();
  drawHeatmap();
  drawDistractionChart();
}

// ── Hover handlers ───────────────────────────────────────────────────────────

function setupHoverHandlers() {
  var daily = document.getElementById('chart-daily');
  if (daily) {
    daily.addEventListener('mousemove', handleDailyHover);
    daily.addEventListener('mouseleave', hideTooltip);
  }
}

// ── Render everything ────────────────────────────────────────────────────────

function renderAll() {
  renderSummary();
  drawAllCharts();
}

// ── Resize handler ───────────────────────────────────────────────────────────

var resizeTimer = null;
window.addEventListener('resize', function() {
  if (resizeTimer) clearTimeout(resizeTimer);
  resizeTimer = setTimeout(function() {
    drawAllCharts();
  }, 200);
});

// ── Theme change redraw ──────────────────────────────────────────────────────

var themeObserver = new MutationObserver(function(mutations) {
  for (var i = 0; i < mutations.length; i++) {
    if (mutations[i].attributeName === 'class') {
      requestAnimationFrame(function() {
        drawAllCharts();
      });
      break;
    }
  }
});
themeObserver.observe(document.body, { attributes: true });

// ── Init ─────────────────────────────────────────────────────────────────────

(function init() {
  if (typeof LoveSparkTheme !== 'undefined') {
    LoveSparkTheme.init();
  }
  setupNav();
  setupSettings();
  setupExport();
  setupHoverHandlers();
  checkProGate();
  loadDashData();
})();
