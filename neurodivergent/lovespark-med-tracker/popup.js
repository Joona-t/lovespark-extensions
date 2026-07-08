import { getMedications, getDoses, getDosesForDate, logDose, undoDose, getSettings, updateSettings } from './utils/storage.js';
import { todayStr, yesterdayStr, formatTime, calculateStreak, adherenceForDate, getMonthDays, getMonthLabel } from './utils/dates.js';
import { TIME_SLOTS, MESSAGES, MED_TYPES } from './utils/constants.js';
import { getCurvePoints, getStatusMessage, getConcentration } from './utils/pharma.js';

let medications = [];
let todayDoses = [];
let allDoses = [];
let settings = {};
let lastUndoId = null;
let undoTimer = null;
let calYear, calMonth;

// ── Init ─────────────────────────────────────────────────

function updateBadge() {
  try {
    chrome.runtime.sendMessage({ type: 'UPDATE_BADGE' });
  } catch (err) {
    console.warn('[LoveSpark Med Tracker] sendMessage error:', err.message);
  }
}

async function init() {
  // Apply theme before render
  settings = await getSettings();
  const themeData = await new Promise(r => chrome.storage.local.get(['theme'], r));
  let theme = themeData.theme;
  if (!theme && settings.darkMode) theme = 'dark';
  LoveSparkTheme.apply(theme || 'retro');

  if (!settings.onboardingComplete) {
    document.getElementById('emptyState').style.display = '';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('setupBtn').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
    });
    bindHeaderActions();
    return;
  }

  document.getElementById('emptyState').style.display = 'none';
  document.getElementById('mainContent').style.display = '';

  medications = await getMedications();
  allDoses = await getDoses();
  todayDoses = allDoses.filter(d => d.date === todayStr());

  // If no meds, show empty state
  if (medications.length === 0) {
    document.getElementById('emptyState').style.display = '';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('setupBtn').addEventListener('click', () => {
      chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
    });
    bindHeaderActions();
    return;
  }

  renderTodayView();
  renderTimeline();
  checkMissedDoses();
  bindHeaderActions();
  bindViewTabs();
  initCalendar();

  // React to storage changes
  chrome.storage.onChanged.addListener(async (changes, area) => {
    if (area !== 'local') return;
    medications = await getMedications();
    allDoses = await getDoses();
    todayDoses = allDoses.filter(d => d.date === todayStr());
    renderTodayView();
  });
}

// Theme dropdown — uses shared LoveSparkTheme.apply() (lib/lovespark-theme.js).
// Custom init (not LoveSparkTheme.init()) preserves the legacy darkMode-boolean
// fallback that predates the theme migration (BUG-CWS-A11Y-1).
(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      LoveSparkTheme.apply(theme);
      chrome.storage.local.set({ theme });
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }
  chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    LoveSparkTheme.apply(theme || 'retro');
  });
})();

// ── Header Actions ───────────────────────────────────────

function bindHeaderActions() {
  document.getElementById('settingsBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
  });
}

// ── View Tabs ────────────────────────────────────────────

function bindViewTabs() {
  const tabs = document.querySelectorAll('.view-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
      tab.classList.add('active');
      tab.setAttribute('aria-selected', 'true');

      const view = tab.dataset.view;
      document.getElementById('todayView').style.display = view === 'today' ? '' : 'none';
      document.getElementById('calendarView').style.display = view === 'calendar' ? '' : 'none';

      if (view === 'calendar') renderCalendar();
    });
  });
}

// ── Today View ───────────────────────────────────────────

function renderTodayView() {
  const activeMeds = medications.filter(m => m.active);
  const scheduledMeds = activeMeds.filter(m => m.frequency !== 'as_needed');
  const asNeededMeds = activeMeds.filter(m => m.frequency === 'as_needed');

  // Progress ring
  let expected = 0;
  let taken = 0;
  for (const med of scheduledMeds) {
    for (const slot of med.timeSlots) {
      expected++;
      if (todayDoses.some(d => d.medicationId === med.id && d.scheduledSlot === slot && d.status === 'taken')) taken++;
    }
  }
  renderProgressRing(taken, expected);

  // Streak
  const streak = calculateStreak(allDoses, medications);
  document.getElementById('streakCount').textContent = streak;

  // Motivation
  const msgs = taken >= expected && expected > 0 ? MESSAGES.allDone : MESSAGES.greeting;
  document.getElementById('motivation').textContent = msgs[Math.floor(Math.random() * msgs.length)];

  // Group meds by time slot
  const groups = document.getElementById('slotGroups');
  groups.textContent = '';

  for (const slot of TIME_SLOTS) {
    const slotMeds = scheduledMeds.filter(m => m.timeSlots.includes(slot.id));
    if (slotMeds.length === 0) continue;

    const group = document.createElement('div');
    group.className = 'slot-group';

    const header = document.createElement('div');
    header.className = 'slot-header';
    header.textContent = `${slot.emoji} ${slot.label}`;
    group.appendChild(header);

    for (const med of slotMeds) {
      const dose = todayDoses.find(d => d.medicationId === med.id && d.scheduledSlot === slot.id && d.status === 'taken');
      group.appendChild(createMedCard(med, slot.id, dose));
    }

    groups.appendChild(group);
  }

  // As-needed meds
  if (asNeededMeds.length > 0) {
    const group = document.createElement('div');
    group.className = 'slot-group';

    const header = document.createElement('div');
    header.className = 'slot-header';
    header.textContent = '📋 As Needed';
    group.appendChild(header);

    for (const med of asNeededMeds) {
      const doses = todayDoses.filter(d => d.medicationId === med.id && d.status === 'taken');
      group.appendChild(createAsNeededCard(med, doses));
    }

    groups.appendChild(group);
  }
}

function createMedCard(med, slotId, dose) {
  const card = document.createElement('div');
  card.className = `med-card${dose ? ' taken' : ''}`;

  const emoji = document.createElement('span');
  emoji.className = 'med-emoji';
  emoji.textContent = med.emoji;

  const info = document.createElement('div');
  info.className = 'med-info';

  const name = document.createElement('div');
  name.className = 'med-name';
  name.textContent = med.name;

  const dosage = document.createElement('div');
  dosage.className = 'med-dosage';
  dosage.textContent = med.dosage;

  info.appendChild(name);
  info.appendChild(dosage);

  if (dose) {
    const status = document.createElement('div');
    status.className = 'med-status';
    status.textContent = `Taken at ${formatTime(dose.timestamp)} ✅`;
    info.appendChild(status);
  }

  if (med.supply !== null) {
    const supply = document.createElement('div');
    supply.className = `med-supply${med.supply <= med.supplyWarning ? ' low' : ''}`;
    supply.textContent = `${med.supply} left`;
    info.appendChild(supply);
  }

  card.appendChild(emoji);
  card.appendChild(info);

  if (dose) {
    const check = document.createElement('span');
    check.className = 'taken-check';
    check.textContent = '✓';
    card.appendChild(check);
  } else {
    const btn = document.createElement('button');
    btn.className = 'take-btn';
    btn.textContent = 'Take';
    btn.setAttribute('aria-label', `Log ${med.name} dose`);
    btn.addEventListener('click', () => handleDoseLog(med.id, slotId));
    card.appendChild(btn);
  }

  return card;
}

function createAsNeededCard(med, doses) {
  const card = document.createElement('div');
  card.className = 'med-card';

  const emoji = document.createElement('span');
  emoji.className = 'med-emoji';
  emoji.textContent = med.emoji;

  const info = document.createElement('div');
  info.className = 'med-info';

  const name = document.createElement('div');
  name.className = 'med-name';
  name.textContent = med.name;

  const dosage = document.createElement('div');
  dosage.className = 'med-dosage';
  dosage.textContent = med.dosage;

  info.appendChild(name);
  info.appendChild(dosage);

  if (doses.length > 0) {
    const status = document.createElement('div');
    status.className = 'med-status';
    status.textContent = `Taken ${doses.length}x today`;
    info.appendChild(status);
  }

  card.appendChild(emoji);
  card.appendChild(info);

  const btn = document.createElement('button');
  btn.className = 'take-btn';
  btn.textContent = 'Take';
  btn.setAttribute('aria-label', `Log ${med.name} dose`);
  btn.addEventListener('click', () => handleDoseLog(med.id, 'as_needed'));
  card.appendChild(btn);

  return card;
}

// ── Dose Logging ─────────────────────────────────────────

async function handleDoseLog(medId, slotId) {
  const dose = {
    id: 'dose_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    medicationId: medId,
    timestamp: Date.now(),
    scheduledSlot: slotId,
    date: todayStr(),
    status: 'taken',
    mood: null,
    note: '',
  };

  await logDose(dose);

  // Refresh data
  medications = await getMedications();
  allDoses = await getDoses();
  todayDoses = allDoses.filter(d => d.date === todayStr());
  renderTodayView();
  renderTimeline();

  // Update badge
  updateBadge();

  // Show undo toast
  showUndoToast(dose.id);

  // Show mood picker on the card that was just logged
  setTimeout(() => {
    const cards = document.querySelectorAll('.med-card.taken');
    const lastCard = cards[cards.length - 1];
    if (lastCard) showMoodPicker(dose.id, lastCard);
  }, 400);
}

function showUndoToast(doseId) {
  lastUndoId = doseId;
  const toast = document.getElementById('undoToast');
  const msg = MESSAGES.taken[Math.floor(Math.random() * MESSAGES.taken.length)];
  document.getElementById('undoMsg').textContent = msg;
  toast.style.display = '';

  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = setTimeout(() => {
    toast.style.display = 'none';
    lastUndoId = null;
  }, 10000);
}

document.getElementById('undoBtn').addEventListener('click', async () => {
  if (!lastUndoId) return;
  await undoDose(lastUndoId);
  document.getElementById('undoToast').style.display = 'none';
  if (undoTimer) clearTimeout(undoTimer);
  lastUndoId = null;

  medications = await getMedications();
  allDoses = await getDoses();
  todayDoses = allDoses.filter(d => d.date === todayStr());
  renderTodayView();
  updateBadge();
});

// ── Progress Ring ────────────────────────────────────────

function renderProgressRing(taken, total) {
  const ring = document.getElementById('progressRing');
  const fraction = document.getElementById('ringFraction');
  const container = document.getElementById('progressContainer');
  const circumference = 2 * Math.PI * 42; // r=42

  fraction.textContent = `${taken}/${total}`;
  container.setAttribute('aria-valuenow', taken);
  container.setAttribute('aria-valuemax', total);

  if (total === 0) {
    ring.style.strokeDashoffset = circumference;
    return;
  }

  const progress = taken / total;
  const offset = circumference * (1 - progress);
  ring.style.strokeDashoffset = offset;

  // Color: teal when complete
  ring.style.stroke = progress >= 1 ? 'var(--ls-teal)' : 'var(--ls-pink-accent)';
}

// ── Missed Dose Backfill ─────────────────────────────────

async function checkMissedDoses() {
  if (!settings.missedDosePrompt) return;

  const yesterday = yesterdayStr();
  const activeMeds = medications.filter(m => m.active && m.frequency !== 'as_needed');
  const yesterdayDoses = allDoses.filter(d => d.date === yesterday);

  let missed = false;
  for (const med of activeMeds) {
    const medCreated = new Date(med.createdAt).toISOString().slice(0, 10);
    if (yesterday < medCreated) continue;

    for (const slot of med.timeSlots) {
      if (!yesterdayDoses.some(d => d.medicationId === med.id && d.scheduledSlot === slot)) {
        missed = true;
        break;
      }
    }
    if (missed) break;
  }

  if (!missed) return;

  const prompt = document.getElementById('backfillPrompt');
  prompt.style.display = '';

  const text = document.createElement('span');
  text.className = 'backfill-text';
  text.textContent = "Yesterday wasn't fully logged. Want to fill it in? 💖";

  const actions = document.createElement('div');
  actions.className = 'backfill-actions';

  const skipBtn = document.createElement('button');
  skipBtn.className = 'btn-ghost-sm';
  skipBtn.textContent = 'Skip';
  skipBtn.addEventListener('click', () => { prompt.style.display = 'none'; });

  const fillBtn = document.createElement('button');
  fillBtn.className = 'btn-pink btn-sm';
  fillBtn.textContent = 'Fill in';
  fillBtn.addEventListener('click', () => backfillYesterday(prompt));

  actions.append(skipBtn, fillBtn);
  prompt.append(text, actions);
}

async function backfillYesterday(promptEl) {
  const yesterday = yesterdayStr();
  const activeMeds = medications.filter(m => m.active && m.frequency !== 'as_needed');
  const yesterdayDoses = allDoses.filter(d => d.date === yesterday);

  for (const med of activeMeds) {
    const medCreated = new Date(med.createdAt).toISOString().slice(0, 10);
    if (yesterday < medCreated) continue;

    for (const slot of med.timeSlots) {
      const exists = yesterdayDoses.some(d => d.medicationId === med.id && d.scheduledSlot === slot);
      if (exists) continue;

      const dose = {
        id: 'dose_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        medicationId: med.id,
        timestamp: Date.now(),
        scheduledSlot: slot,
        date: yesterday,
        status: 'taken',
        mood: null,
        note: '',
      };
      await logDose(dose);
    }
  }

  promptEl.style.display = 'none';
  allDoses = await getDoses();
  updateBadge();
}

// ── Calendar ─────────────────────────────────────────────

function initCalendar() {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();

  document.getElementById('calPrev').addEventListener('click', () => {
    calMonth--;
    if (calMonth < 0) { calMonth = 11; calYear--; }
    renderCalendar();
  });

  document.getElementById('calNext').addEventListener('click', () => {
    calMonth++;
    if (calMonth > 11) { calMonth = 0; calYear++; }
    renderCalendar();
  });
}

function renderCalendar() {
  document.getElementById('calMonth').textContent = getMonthLabel(calYear, calMonth);

  const grid = document.getElementById('calendarGrid');
  grid.textContent = '';

  const days = getMonthDays(calYear, calMonth);
  const today = todayStr();

  days.forEach(dateStr => {
    const cell = document.createElement('div');
    cell.className = 'cal-day';

    if (!dateStr) {
      cell.classList.add('empty');
      grid.appendChild(cell);
      return;
    }

    const dayNum = parseInt(dateStr.slice(8), 10);
    const numSpan = document.createElement('span');
    numSpan.textContent = dayNum;
    cell.appendChild(numSpan);

    if (dateStr === today) cell.classList.add('today');

    // Adherence dot
    const adherence = adherenceForDate(allDoses, medications, dateStr);
    if (adherence !== null) {
      const dot = document.createElement('span');
      dot.className = 'cal-dot';
      if (adherence >= 1) dot.classList.add('full');
      else if (adherence > 0) dot.classList.add('partial');
      else dot.classList.add('none');
      cell.appendChild(dot);
    }

    cell.setAttribute('role', 'gridcell');
    cell.setAttribute('tabindex', '0');
    const dateLabel = new Date(dateStr + 'T12:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    cell.setAttribute('aria-label', dateLabel + (adherence >= 1 ? ' — all taken' : adherence > 0 ? ' — partial' : adherence === 0 ? ' — none taken' : ''));

    const selectDay = () => {
      document.querySelectorAll('.cal-day.selected').forEach(d => d.classList.remove('selected'));
      cell.classList.add('selected');
      renderDayDetail(dateStr);
    };
    cell.addEventListener('click', selectDay);
    cell.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectDay(); } });

    grid.appendChild(cell);
  });

  document.getElementById('dayDetail').style.display = 'none';
}

function renderDayDetail(dateStr) {
  const detail = document.getElementById('dayDetail');
  detail.style.display = '';
  detail.textContent = '';

  const title = document.createElement('div');
  title.className = 'day-detail-title';
  const d = new Date(dateStr + 'T12:00:00');
  title.textContent = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  detail.appendChild(title);

  const dayDoses = allDoses.filter(dose => dose.date === dateStr);
  const activeMeds = medications.filter(m => m.active);

  if (activeMeds.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'day-detail-item';
    empty.textContent = 'No medications tracked';
    detail.appendChild(empty);
    return;
  }

  for (const med of activeMeds) {
    const medDoses = dayDoses.filter(dose => dose.medicationId === med.id && dose.status === 'taken');

    const item = document.createElement('div');
    item.className = 'day-detail-item';

    const emojiSpan = document.createElement('span');
    emojiSpan.textContent = med.emoji;

    const nameSpan = document.createElement('span');
    nameSpan.style.flex = '1';
    nameSpan.textContent = med.name;

    const statusSpan = document.createElement('span');
    if (medDoses.length > 0) {
      statusSpan.textContent = medDoses.map(d => formatTime(d.timestamp)).join(', ') + ' ✅';
      statusSpan.style.color = 'var(--ls-teal)';
    } else {
      statusSpan.textContent = '—';
      statusSpan.style.color = 'var(--ls-text-muted)';
    }

    item.append(emojiSpan, nameSpan, statusSpan);

    // Show mood if present
    if (medDoses.length > 0 && medDoses[0].mood) {
      const moodSpan = document.createElement('span');
      const moods = ['😞', '😣', '😐', '😊', '🤩'];
      moodSpan.textContent = moods[medDoses[0].mood - 1] || '';
      item.appendChild(moodSpan);
    }

    detail.appendChild(item);
  }
}

// ── Pharmacokinetic Timeline ─────────────────────────────

function renderTimeline() {
  const section = document.getElementById('timelineSection');
  section.textContent = '';

  if (!settings.showTimeline) { section.style.display = 'none'; return; }

  // Only show if user has stimulant meds with today's doses
  const stimDoses = todayDoses.filter(d => {
    const med = medications.find(m => m.id === d.medicationId);
    return med && (med.medType === 'stimulant_ir' || med.medType === 'stimulant_xr') && d.status === 'taken';
  });

  if (stimDoses.length === 0) { section.style.display = 'none'; return; }

  section.style.display = '';

  const container = document.createElement('div');
  container.className = 'timeline-container';

  // Canvas for curves
  const canvas = document.createElement('canvas');
  canvas.width = 332;
  canvas.height = 60;
  canvas.className = 'timeline-canvas';
  container.appendChild(canvas);

  // Hour labels
  const labels = document.createElement('div');
  labels.className = 'timeline-labels';
  for (let h = 6; h <= 24; h += 3) {
    const label = document.createElement('span');
    label.textContent = h === 24 ? '12a' : h <= 12 ? `${h}a` : `${h - 12}p`;
    labels.appendChild(label);
  }
  container.appendChild(labels);

  // Status message
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  let maxConcentration = 0;
  for (const dose of stimDoses) {
    const med = medications.find(m => m.id === dose.medicationId);
    const doseDate = new Date(dose.timestamp);
    const doseMinutes = doseDate.getHours() * 60 + doseDate.getMinutes();
    const minutesAfter = currentMinutes - doseMinutes;
    const c = getConcentration(med.medType, minutesAfter);
    maxConcentration = Math.max(maxConcentration, c);
  }

  const statusMsg = getStatusMessage(maxConcentration);
  if (statusMsg) {
    const status = document.createElement('div');
    status.className = 'timeline-status';
    status.textContent = statusMsg;
    container.appendChild(status);
  }

  // Disclaimer
  const disc = document.createElement('div');
  disc.className = 'timeline-disclaimer';
  disc.textContent = 'Estimates only. Not medical advice.';
  container.appendChild(disc);

  section.appendChild(container);

  // Draw curves on canvas
  const ctx = canvas.getContext('2d');
  const startHour = 6;
  const endHour = 24;

  // Draw "now" marker
  const nowX = ((currentMinutes - startHour * 60) / ((endHour - startHour) * 60)) * canvas.width;
  if (nowX >= 0 && nowX <= canvas.width) {
    ctx.strokeStyle = 'rgba(232, 69, 124, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(nowX, 0);
    ctx.lineTo(nowX, canvas.height);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Draw each dose's curve
  const colors = ['rgba(232, 69, 124, 0.5)', 'rgba(124, 58, 237, 0.5)', 'rgba(13, 148, 136, 0.5)'];
  stimDoses.forEach((dose, i) => {
    const med = medications.find(m => m.id === dose.medicationId);
    const points = getCurvePoints(med.medType, dose.timestamp, startHour, endHour, 100);

    ctx.beginPath();
    ctx.strokeStyle = colors[i % colors.length];
    ctx.fillStyle = colors[i % colors.length].replace('0.5', '0.15');
    ctx.lineWidth = 2;

    points.forEach((p, j) => {
      const x = p.x * canvas.width;
      const y = canvas.height - (p.y * canvas.height * 0.85);
      if (j === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Fill under curve
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.closePath();
    ctx.fill();
  });
}

// ── Mood Picker ──────────────────────────────────────────

function showMoodPicker(doseId, cardEl) {
  const existing = cardEl.querySelector('.mood-picker');
  if (existing) return;

  const picker = document.createElement('div');
  picker.className = 'mood-picker';

  const moods = [
    { value: 1, emoji: '😞' },
    { value: 2, emoji: '😣' },
    { value: 3, emoji: '😐' },
    { value: 4, emoji: '😊' },
    { value: 5, emoji: '🤩' },
  ];

  moods.forEach(({ value, emoji }) => {
    const btn = document.createElement('button');
    btn.className = 'mood-btn';
    btn.textContent = emoji;
    btn.setAttribute('aria-label', `Rate mood ${value}`);
    btn.addEventListener('click', async () => {
      const doses = await getDoses();
      const dose = doses.find(d => d.id === doseId);
      if (dose) {
        dose.mood = value;
        const { saveDoses } = await import('./utils/storage.js');
        await saveDoses(doses);
      }
      picker.remove();
    });
    picker.appendChild(btn);
  });

  cardEl.appendChild(picker);
}

init();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
