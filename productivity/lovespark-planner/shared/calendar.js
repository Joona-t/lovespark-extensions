// LoveSpark Planner — Calendar Rendering (DOM-safe, no innerHTML)
'use strict';

const PlannerCalendar = (() => {
  function getMonthData(year, month, weekStartsOn) {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    let startDow = firstDay.getDay();
    startDow = (startDow - weekStartsOn + 7) % 7;

    const cells = [];
    for (let i = 0; i < startDow; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return { year, month, daysInMonth, cells };
  }

  function dateStr(year, month, day) {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  function monthLabel(year, month) {
    return new Date(year, month, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }

  function dayHeaders(weekStartsOn) {
    const names = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
    const result = [];
    for (let i = 0; i < 7; i++) result.push(names[(i + weekStartsOn) % 7]);
    return result;
  }

  function el(tag, cls, text) {
    const e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text) e.textContent = text;
    return e;
  }

  function renderMonth(container, year, month, weekStartsOn, contentMap, selectedDate, onDayClick) {
    const today = PlannerCore.todayStr();
    const data = getMonthData(year, month, weekStartsOn);
    const headers = dayHeaders(weekStartsOn);

    container.textContent = '';

    // Header with nav
    const header = el('div', 'cal-header');
    const prevBtn = el('button', 'cal-nav', '\u25C2');
    prevBtn.setAttribute('aria-label', 'Previous month');
    prevBtn.dataset.dir = '-1';
    const title = el('span', 'cal-title', monthLabel(year, month));
    const nextBtn = el('button', 'cal-nav', '\u25B8');
    nextBtn.setAttribute('aria-label', 'Next month');
    nextBtn.dataset.dir = '1';
    header.append(prevBtn, title, nextBtn);
    container.appendChild(header);

    // Grid
    const grid = el('div', 'cal-grid');
    grid.setAttribute('role', 'grid');
    grid.setAttribute('aria-label', 'Calendar');

    // Day header row
    const headerRow = el('div', 'cal-row cal-header-row');
    headerRow.setAttribute('role', 'row');
    for (const h of headers) {
      const cell = el('div', 'cal-cell cal-day-header', h);
      cell.setAttribute('role', 'columnheader');
      headerRow.appendChild(cell);
    }
    grid.appendChild(headerRow);

    // Day cells
    for (let i = 0; i < data.cells.length; i += 7) {
      const row = el('div', 'cal-row');
      row.setAttribute('role', 'row');
      for (let j = 0; j < 7; j++) {
        const day = data.cells[i + j];
        if (day === null) {
          const empty = el('div', 'cal-cell cal-empty');
          empty.setAttribute('role', 'gridcell');
          row.appendChild(empty);
        } else {
          const ds = dateStr(year, month, day);
          const isToday = ds === today;
          const isSelected = ds === selectedDate;
          const content = contentMap[ds];

          const cell = el('div', 'cal-cell cal-day');
          if (isToday) cell.classList.add('cal-today');
          if (isSelected) cell.classList.add('cal-selected');
          cell.setAttribute('role', 'gridcell');
          cell.dataset.date = ds;
          cell.setAttribute('tabindex', (isSelected || (isToday && !selectedDate)) ? '0' : '-1');

          const num = el('span', 'cal-day-num', String(day));
          cell.appendChild(num);

          if (content) {
            const dots = el('div', 'cal-dots');
            if (content.tasks) {
              const dot = el('span', 'cal-dot cal-dot-task');
              dot.setAttribute('aria-hidden', 'true');
              dots.appendChild(dot);
            }
            if (content.focus) {
              const dot = el('span', 'cal-dot cal-dot-focus');
              dot.setAttribute('aria-hidden', 'true');
              dots.appendChild(dot);
            }
            if (content.notes) {
              const dot = el('span', 'cal-dot cal-dot-note');
              dot.setAttribute('aria-hidden', 'true');
              dots.appendChild(dot);
            }
            cell.appendChild(dots);
          }
          row.appendChild(cell);
        }
      }
      grid.appendChild(row);
    }
    container.appendChild(grid);

    // Legend
    const legend = el('div', 'cal-legend');
    const items = [
      { cls: 'cal-dot-task', label: 'tasks' },
      { cls: 'cal-dot-focus', label: 'focus' },
      { cls: 'cal-dot-note', label: 'notes' },
    ];
    for (const item of items) {
      const span = el('span', 'cal-legend-item');
      const dot = el('span', 'cal-dot ' + item.cls);
      dot.setAttribute('aria-hidden', 'true');
      span.appendChild(dot);
      span.appendChild(document.createTextNode(' ' + item.label));
      legend.appendChild(span);
    }
    container.appendChild(legend);

    // Navigation click handler
    container.addEventListener('click', function handler(e) {
      const nav = e.target.closest('.cal-nav');
      if (nav) {
        container.removeEventListener('click', handler);
        const dir = parseInt(nav.dataset.dir);
        let newMonth = month + dir;
        let newYear = year;
        if (newMonth < 0) { newMonth = 11; newYear--; }
        if (newMonth > 11) { newMonth = 0; newYear++; }
        renderMonth(container, newYear, newMonth, weekStartsOn, contentMap, selectedDate, onDayClick);
        return;
      }
      const dayCell = e.target.closest('.cal-day');
      if (dayCell && onDayClick) {
        onDayClick(dayCell.dataset.date);
      }
    });

    // Keyboard nav
    container.addEventListener('keydown', (e) => {
      const dayCell = e.target.closest('.cal-day');
      if (!dayCell) return;
      const allDays = [...container.querySelectorAll('.cal-day')];
      const idx = allDays.indexOf(dayCell);
      let targetIdx = -1;

      if (e.key === 'ArrowRight') targetIdx = idx + 1;
      else if (e.key === 'ArrowLeft') targetIdx = idx - 1;
      else if (e.key === 'ArrowDown') targetIdx = idx + 7;
      else if (e.key === 'ArrowUp') targetIdx = idx - 7;
      else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        if (onDayClick) onDayClick(dayCell.dataset.date);
        return;
      } else return;

      e.preventDefault();
      if (targetIdx >= 0 && targetIdx < allDays.length) {
        allDays[idx].setAttribute('tabindex', '-1');
        allDays[targetIdx].setAttribute('tabindex', '0');
        allDays[targetIdx].focus();
      }
    });
  }

  return { getMonthData, dateStr, monthLabel, dayHeaders, renderMonth };
})();

if (typeof globalThis !== 'undefined') globalThis.PlannerCalendar = PlannerCalendar;
