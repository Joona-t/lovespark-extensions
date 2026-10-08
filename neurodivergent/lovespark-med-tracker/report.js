import { getMedications, getDoses, getSettings } from './utils/storage.js';
import { todayStr, daysAgo, adherenceForDate, adherenceForRange, getMonthDays, getMonthLabel } from './utils/dates.js';
import { FREQUENCIES, MED_TYPES } from './utils/constants.js';

let medications = [];
let allDoses = [];
let rangeDays = 30;

async function init() {
  const settings = await getSettings();
  document.documentElement.setAttribute('data-theme', settings.darkMode ? 'dark' : 'light');

  medications = await getMedications();
  allDoses = await getDoses();

  document.getElementById('reportDate').textContent = new Date().toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  renderReport();
  bindEvents();
}

function bindEvents() {
  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.range-btn').forEach(b => { b.classList.remove('active'); b.setAttribute('aria-checked', 'false'); });
      btn.classList.add('active');
      btn.setAttribute('aria-checked', 'true');
      rangeDays = parseInt(btn.dataset.days, 10);
      renderReport();
    });
  });

  document.getElementById('printBtn').addEventListener('click', () => window.print());
}

function renderReport() {
  renderMedTable();
  renderAdherence();
  renderCalendar();
  renderMoodPatterns();
}

// ── Medication Table ─────────────────────────────────────

function renderMedTable() {
  const container = document.getElementById('medTable');
  container.textContent = '';

  const table = document.createElement('table');
  table.className = 'med-table';

  const thead = document.createElement('thead');
  const headerRow = document.createElement('tr');
  ['', 'Medication', 'Dosage', 'Frequency', 'Type', 'Supply'].forEach(text => {
    const th = document.createElement('th');
    th.textContent = text;
    headerRow.appendChild(th);
  });
  thead.appendChild(headerRow);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const activeMeds = medications.filter(m => m.active);

  for (const med of activeMeds) {
    const row = document.createElement('tr');
    const freq = FREQUENCIES.find(f => f.id === med.frequency);
    const type = MED_TYPES.find(t => t.id === med.medType);

    [med.emoji, med.name, med.dosage, freq?.label || med.frequency, type?.label || med.medType,
     med.supply !== null ? `${med.supply} left` : '—'].forEach(text => {
      const td = document.createElement('td');
      td.textContent = text;
      row.appendChild(td);
    });

    tbody.appendChild(row);
  }

  table.appendChild(tbody);
  container.appendChild(table);
}

// ── Adherence Stats ──────────────────────────────────────

function renderAdherence() {
  const container = document.getElementById('adherenceStats');
  container.textContent = '';

  const grid = document.createElement('div');
  grid.className = 'adherence-grid';

  // Overall adherence
  const startDate = daysAgo(rangeDays);
  const endDate = todayStr();
  const overall = adherenceForRange(allDoses, medications, startDate, endDate);

  const overallCard = createAdherenceCard(
    overall !== null ? Math.round(overall * 100) + '%' : '—',
    `Overall (${rangeDays} days)`,
    overall >= 0.8
  );
  grid.appendChild(overallCard);

  // Per-medication adherence
  const activeMeds = medications.filter(m => m.active && m.frequency !== 'as_needed');
  for (const med of activeMeds) {
    const medAdherence = adherenceForRange(allDoses, [med], startDate, endDate);
    const card = createAdherenceCard(
      medAdherence !== null ? Math.round(medAdherence * 100) + '%' : '—',
      `${med.emoji} ${med.name}`,
      medAdherence >= 0.8
    );
    grid.appendChild(card);
  }

  container.appendChild(grid);
}

function createAdherenceCard(value, label, isGood) {
  const card = document.createElement('div');
  card.className = 'adherence-card';

  const pct = document.createElement('div');
  pct.className = `adherence-pct${isGood ? ' good' : ''}`;
  pct.textContent = value;

  const lbl = document.createElement('div');
  lbl.className = 'adherence-label';
  lbl.textContent = label;

  card.append(pct, lbl);
  return card;
}

// ── Calendar Heatmap ─────────────────────────────────────

function renderCalendar() {
  const container = document.getElementById('reportCalendar');
  container.textContent = '';

  const startDate = daysAgo(rangeDays);
  const start = new Date(startDate + 'T12:00:00');
  const endMonth = new Date();

  // Render each month in range
  let current = new Date(start.getFullYear(), start.getMonth(), 1);
  while (current <= endMonth) {
    const year = current.getFullYear();
    const month = current.getMonth();

    const monthLabel = document.createElement('div');
    monthLabel.style.cssText = 'font-size:12px;font-weight:500;margin:12px 0 6px;color:var(--ls-text-dark)';
    monthLabel.textContent = getMonthLabel(year, month);
    container.appendChild(monthLabel);

    const grid = document.createElement('div');
    grid.className = 'report-cal-grid';

    // Weekday headers
    ['S','M','T','W','T','F','S'].forEach(d => {
      const h = document.createElement('div');
      h.className = 'report-cal-header';
      h.textContent = d;
      grid.appendChild(h);
    });

    const days = getMonthDays(year, month);
    days.forEach(dateStr => {
      const cell = document.createElement('div');
      cell.className = 'report-cal-day';

      if (!dateStr) {
        cell.classList.add('empty');
        grid.appendChild(cell);
        return;
      }

      const dayNum = parseInt(dateStr.slice(8), 10);
      cell.textContent = dayNum;

      if (dateStr < startDate || dateStr > todayStr()) {
        cell.classList.add('empty');
        cell.style.opacity = '0.3';
      } else {
        const adherence = adherenceForDate(allDoses, medications, dateStr);
        if (adherence === null) cell.classList.add('empty');
        else if (adherence >= 1) cell.classList.add('full');
        else if (adherence > 0) cell.classList.add('partial');
        else cell.classList.add('none');
      }

      grid.appendChild(cell);
    });

    container.appendChild(grid);
    current.setMonth(current.getMonth() + 1);
  }
}

// ── Mood Patterns ────────────────────────────────────────

function renderMoodPatterns() {
  const startDate = daysAgo(rangeDays);
  const dosesInRange = allDoses.filter(d => d.date >= startDate && d.mood !== null && d.mood !== undefined);

  if (dosesInRange.length === 0) {
    document.getElementById('moodSection').style.display = 'none';
    return;
  }

  document.getElementById('moodSection').style.display = '';
  const container = document.getElementById('moodStats');
  container.textContent = '';

  const moods = ['😞 Bad', '😣 Rough', '😐 Okay', '😊 Good', '🤩 Great'];
  const counts = [0, 0, 0, 0, 0];
  dosesInRange.forEach(d => { if (d.mood >= 1 && d.mood <= 5) counts[d.mood - 1]++; });

  const max = Math.max(...counts, 1);

  moods.forEach((label, i) => {
    const row = document.createElement('div');
    row.className = 'mood-row';

    const labelSpan = document.createElement('span');
    labelSpan.style.width = '80px';
    labelSpan.textContent = label;

    const bar = document.createElement('div');
    bar.className = 'mood-bar';

    const fill = document.createElement('div');
    fill.className = 'mood-bar-fill';
    fill.style.width = `${(counts[i] / max) * 100}%`;
    bar.appendChild(fill);

    const countSpan = document.createElement('span');
    countSpan.style.width = '30px';
    countSpan.style.textAlign = 'right';
    countSpan.textContent = counts[i];

    row.append(labelSpan, bar, countSpan);
    container.appendChild(row);
  });
}

init();
