// LoveSpark Planner — Full-Page App
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  LoveSparkTheme.init();

  // ── State ──
  let state = { todos: [], events: [], sync: {}, prefs: {} };
  let selectedDate = PlannerCore.todayStr();
  let currentView = 'today';
  let calYear = new Date().getFullYear();
  let calMonth = new Date().getMonth();
  let editingTodoId = null;

  // ── DOM refs ──
  const viewBtns = document.querySelectorAll('.view-btn');
  const todayView = document.getElementById('todayView');
  const monthView = document.getElementById('monthView');

  // Today view
  const todayHeader = document.getElementById('todayHeader');
  const todayTaskList = document.getElementById('todayTaskList');
  const todayAddForm = document.getElementById('todayAddForm');
  const todayTaskInput = document.getElementById('todayTaskInput');
  const todayTaskPriority = document.getElementById('todayTaskPriority');
  const undatedToggle = document.getElementById('undatedToggle');
  const undatedTaskList = document.getElementById('undatedTaskList');
  const todayFocusSection = document.getElementById('todayFocusSection');
  const todayFocusList = document.getElementById('todayFocusList');
  const todayNoteSection = document.getElementById('todayNoteSection');
  const todayNotePreview = document.getElementById('todayNotePreview');

  // Month view
  const calendarPanel = document.getElementById('calendarPanel');
  const dayDetailHeader = document.getElementById('dayDetailHeader');
  const dayTaskList = document.getElementById('dayTaskList');
  const dayAddForm = document.getElementById('dayAddForm');
  const dayTaskInput = document.getElementById('dayTaskInput');
  const dayTaskPriority = document.getElementById('dayTaskPriority');
  const dayFocusSection = document.getElementById('dayFocusSection');
  const dayFocusList = document.getElementById('dayFocusList');
  const dayNoteSection = document.getElementById('dayNoteSection');
  const dayNotePreview = document.getElementById('dayNotePreview');

  // Sidebar
  const syncFocusState = document.getElementById('syncFocusState');
  const syncNotesState = document.getElementById('syncNotesState');
  const btnSync = document.getElementById('btnSync');
  const btnSettings = document.getElementById('btnSettings');
  const statStreak = document.getElementById('statStreak');
  const statCompleted = document.getElementById('statCompleted');

  // Modals
  const settingsModal = document.getElementById('settingsModal');
  const btnCloseSettings = document.getElementById('btnCloseSettings');
  const btnSaveSettings = document.getElementById('btnSaveSettings');
  const editModal = document.getElementById('editModal');
  const btnCloseEdit = document.getElementById('btnCloseEdit');
  const btnSaveEdit = document.getElementById('btnSaveEdit');
  const btnDeleteEdit = document.getElementById('btnDeleteEdit');

  // ── Load State ──
  async function loadState() {
    const resp = await chrome.runtime.sendMessage({ action: 'GET_STATE' });
    state = resp;
    return state;
  }

  // ── View Switching ──
  function switchView(view) {
    currentView = view;
    viewBtns.forEach(b => b.classList.toggle('active', b.dataset.view === view));
    todayView.style.display = view === 'today' ? '' : 'none';
    monthView.style.display = view === 'month' ? '' : 'none';
    if (view === 'today') renderTodayView();
    if (view === 'month') renderMonthView();
  }

  viewBtns.forEach(btn => {
    btn.addEventListener('click', () => switchView(btn.dataset.view));
  });

  // ── Task Rendering (shared) ──
  function buildTaskItem(todo) {
    const item = document.createElement('div');
    item.className = 'task-item' + (todo.completed ? ' completed' : '');
    item.setAttribute('role', 'listitem');

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'task-checkbox';
    cb.checked = todo.completed;
    cb.setAttribute('aria-label', (todo.completed ? 'Mark incomplete: ' : 'Mark complete: ') + todo.text);
    cb.addEventListener('change', async (e) => {
      e.stopPropagation();
      await chrome.runtime.sendMessage({ action: 'COMPLETE_TODO', id: todo.id });
      await loadState();
      renderCurrentView();
    });

    const text = document.createElement('span');
    text.className = 'task-text';
    text.textContent = todo.text;

    const meta = document.createElement('div');
    meta.className = 'task-meta';

    if (todo.dueDate && currentView !== 'today') {
      const dateSpan = document.createElement('span');
      dateSpan.className = 'task-date';
      dateSpan.textContent = PlannerCore.formatDateShort(todo.dueDate);
      meta.appendChild(dateSpan);
    }

    if (todo.source === 'focus') {
      const src = document.createElement('span');
      src.className = 'task-source';
      src.textContent = 'Focus';
      meta.appendChild(src);
    }

    if (todo.estimatedPomos) {
      const pomo = document.createElement('span');
      pomo.className = 'task-pomo';
      pomo.textContent = (todo.completedPomos || 0) + '/' + todo.estimatedPomos;
      meta.appendChild(pomo);
    }

    const pri = document.createElement('span');
    pri.className = 'task-priority';
    pri.textContent = LSP.PRIORITY[todo.priority]?.dot || '';
    pri.setAttribute('aria-label', 'Priority: ' + (LSP.PRIORITY[todo.priority]?.label || todo.priority));

    const del = document.createElement('button');
    del.className = 'task-delete';
    del.textContent = '\u00D7';
    del.setAttribute('aria-label', 'Delete: ' + todo.text);
    del.addEventListener('click', async (e) => {
      e.stopPropagation();
      await chrome.runtime.sendMessage({ action: 'DELETE_TODO', id: todo.id });
      await loadState();
      renderCurrentView();
    });

    // Click to edit
    item.addEventListener('click', (e) => {
      if (e.target.matches('input, button')) return;
      openEditModal(todo);
    });

    item.append(cb, text, meta, pri, del);
    return item;
  }

  function renderTasksInto(container, todos) {
    container.textContent = '';
    const showCompleted = state.prefs.showCompletedTasks !== false;
    const filtered = showCompleted ? todos : todos.filter(t => !t.completed);
    const sorted = PlannerCore.sortTodos(filtered);

    if (sorted.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No tasks here yet';
      container.appendChild(empty);
    } else {
      for (const todo of sorted) {
        container.appendChild(buildTaskItem(todo));
      }
    }
  }

  function renderEventsInto(container, section, events, type) {
    const filtered = events.filter(e => e.type === type);
    if (filtered.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    container.textContent = '';

    for (const evt of filtered) {
      const item = document.createElement('div');
      item.className = 'event-item';

      const icon = document.createElement('span');
      icon.className = 'event-icon';
      icon.textContent = type === 'focus-session' ? '\u{1F345}' : '\u{1F4CB}';

      const text = document.createElement('span');
      text.className = 'event-text';
      text.textContent = evt.title;

      const meta = document.createElement('span');
      meta.className = 'event-meta';
      if (type === 'focus-session') {
        meta.textContent = (evt.metadata?.duration || 25) + 'min';
      } else {
        meta.textContent = (evt.metadata?.wordCount || 0) + ' words';
      }

      item.append(icon, text, meta);
      container.appendChild(item);
    }
  }

  function renderNotePreview(container, section, events) {
    const notes = events.filter(e => e.type === 'daily-note');
    if (notes.length === 0) {
      section.style.display = 'none';
      return;
    }
    section.style.display = '';
    container.textContent = '';

    for (const note of notes) {
      const p = document.createElement('div');
      p.textContent = note.metadata?.snippet || note.title;
      container.appendChild(p);

      if (note.metadata?.wordCount) {
        const wc = document.createElement('div');
        wc.className = 'note-word-count';
        wc.textContent = note.metadata.wordCount + ' words';
        container.appendChild(wc);
      }
    }
  }

  // ── Today View ──
  function renderTodayView() {
    const today = PlannerCore.todayStr();
    todayHeader.textContent = PlannerCore.formatDate(today);

    // Today's tasks
    const todayTodos = PlannerCore.todosForDate(state.todos, today, false);
    renderTasksInto(todayTaskList, todayTodos);

    // Undated tasks
    const undatedTodos = state.todos.filter(t => !t.dueDate);
    renderTasksInto(undatedTaskList, undatedTodos);

    // Today events
    const todayEvents = PlannerCore.eventsForDate(state.events, today);
    renderEventsInto(todayFocusList, todayFocusSection, todayEvents, 'focus-session');
    renderNotePreview(todayNotePreview, todayNoteSection, todayEvents);
  }

  // ── Month View ──
  function renderMonthView() {
    const contentMap = PlannerCore.datesWithContent(state.todos, state.events);
    const weekStart = state.prefs.weekStartsOn || 1;

    PlannerCalendar.renderMonth(
      calendarPanel, calYear, calMonth, weekStart,
      contentMap, selectedDate, onDayClick
    );

    renderDayDetail(selectedDate);
  }

  function onDayClick(dateStr) {
    selectedDate = dateStr;
    // Parse date to update cal navigation if needed
    const parts = dateStr.split('-');
    calYear = parseInt(parts[0]);
    calMonth = parseInt(parts[1]) - 1;
    renderMonthView();
  }

  function renderDayDetail(dateStr) {
    dayDetailHeader.textContent = PlannerCore.formatDate(dateStr);

    const dayTodos = PlannerCore.todosForDate(state.todos, dateStr, false);
    renderTasksInto(dayTaskList, dayTodos);

    const dayEvents = PlannerCore.eventsForDate(state.events, dateStr);
    renderEventsInto(dayFocusList, dayFocusSection, dayEvents, 'focus-session');
    renderNotePreview(dayNotePreview, dayNoteSection, dayEvents);
  }

  // ── Add Task Forms ──
  todayAddForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = todayTaskInput.value.trim();
    if (!text) return;
    await chrome.runtime.sendMessage({
      action: 'ADD_TODO',
      text,
      dueDate: PlannerCore.todayStr(),
      priority: todayTaskPriority.value,
    });
    todayTaskInput.value = '';
    todayTaskPriority.value = 'normal';
    await loadState();
    renderCurrentView();
  });

  dayAddForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = dayTaskInput.value.trim();
    if (!text) return;
    await chrome.runtime.sendMessage({
      action: 'ADD_TODO',
      text,
      dueDate: selectedDate,
      priority: dayTaskPriority.value,
    });
    dayTaskInput.value = '';
    dayTaskPriority.value = 'normal';
    await loadState();
    renderCurrentView();
  });

  // ── Undated Toggle ──
  undatedToggle.addEventListener('click', () => {
    const expanded = undatedToggle.getAttribute('aria-expanded') === 'true';
    undatedToggle.setAttribute('aria-expanded', !expanded);
    undatedTaskList.classList.toggle('collapsed', expanded);
  });

  undatedToggle.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      undatedToggle.click();
    }
  });

  // ── Sync ──
  function updateSyncStatus() {
    const sync = state.sync || {};
    if (sync.focusExtensionId) {
      syncFocusState.textContent = sync.lastFocusSync
        ? 'Synced ' + new Date(sync.lastFocusSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Ready';
      syncFocusState.classList.add('connected');
    } else {
      syncFocusState.textContent = 'Not set';
      syncFocusState.classList.remove('connected');
    }

    if (sync.notesExtensionId) {
      syncNotesState.textContent = sync.lastNotesSync
        ? 'Synced ' + new Date(sync.lastNotesSync).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : 'Ready';
      syncNotesState.classList.add('connected');
    } else {
      syncNotesState.textContent = 'Not set';
      syncNotesState.classList.remove('connected');
    }
  }

  function updateStats() {
    const completed = state.todos.filter(t => t.completed).length;
    const total = state.todos.length;
    statCompleted.textContent = completed + '/' + total + ' tasks done';

    // Streak from focus events
    const focusEvents = state.events.filter(e => e.type === 'focus-session');
    const focusDates = [...new Set(focusEvents.map(e => e.date))].sort().reverse();
    let streak = 0;
    let checkDate = PlannerCore.todayStr();
    for (const d of focusDates) {
      if (d === checkDate) {
        streak++;
        const prev = new Date(checkDate + 'T12:00:00');
        prev.setDate(prev.getDate() - 1);
        checkDate = prev.toISOString().slice(0, 10);
      } else break;
    }
    statStreak.textContent = streak > 0 ? '\u{1F525} ' + streak + '-day streak' : 'No streak yet';
  }

  btnSync.addEventListener('click', async () => {
    btnSync.textContent = 'Syncing...';
    btnSync.disabled = true;

    const sync = state.sync || {};
    const results = [];

    if (sync.focusExtensionId) {
      const r = await chrome.runtime.sendMessage({ action: 'SYNC_FOCUS' });
      results.push(r.ok ? 'Focus: ' + r.tasksImported + ' tasks, ' + r.sessionsImported + ' sessions' : 'Focus: ' + (r.error || 'failed'));
    }
    if (sync.notesExtensionId) {
      const r = await chrome.runtime.sendMessage({ action: 'SYNC_NOTES' });
      results.push(r.ok ? 'Notes: ' + r.notesImported + ' entries' : 'Notes: ' + (r.error || 'failed'));
    }

    if (results.length === 0) {
      results.push('No extensions configured. Open Settings to add IDs.');
    }

    await loadState();
    updateSyncStatus();
    updateStats();
    renderCurrentView();

    btnSync.textContent = 'Sync Now';
    btnSync.disabled = false;
  });

  // ── Settings Modal ──
  btnSettings.addEventListener('click', () => {
    document.getElementById('settingWeekStart').value = state.prefs.weekStartsOn || 1;
    document.getElementById('settingDefaultView').value = state.prefs.defaultView || 'today';
    document.getElementById('settingShowCompleted').checked = state.prefs.showCompletedTasks !== false;
    document.getElementById('settingFocusId').value = state.sync.focusExtensionId || '';
    document.getElementById('settingNotesId').value = state.sync.notesExtensionId || '';
    settingsModal.style.display = '';
  });

  btnCloseSettings.addEventListener('click', () => settingsModal.style.display = 'none');

  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) settingsModal.style.display = 'none';
  });

  btnSaveSettings.addEventListener('click', async () => {
    const prefs = {
      ...state.prefs,
      weekStartsOn: parseInt(document.getElementById('settingWeekStart').value),
      defaultView: document.getElementById('settingDefaultView').value,
      showCompletedTasks: document.getElementById('settingShowCompleted').checked,
    };
    const sync = {
      ...state.sync,
      focusExtensionId: document.getElementById('settingFocusId').value.trim() || null,
      notesExtensionId: document.getElementById('settingNotesId').value.trim() || null,
    };

    await chrome.runtime.sendMessage({ action: 'SAVE_PREFS', prefs });
    await chrome.runtime.sendMessage({ action: 'SAVE_SYNC', sync });

    state.prefs = prefs;
    state.sync = sync;
    updateSyncStatus();
    renderCurrentView();
    settingsModal.style.display = 'none';
  });

  // ── Edit Modal ──
  function openEditModal(todo) {
    editingTodoId = todo.id;
    document.getElementById('editText').value = todo.text;
    document.getElementById('editDueDate').value = todo.dueDate || '';
    document.getElementById('editPriority').value = todo.priority || 'normal';
    editModal.style.display = '';
    document.getElementById('editText').focus();
  }

  btnCloseEdit.addEventListener('click', () => editModal.style.display = 'none');

  editModal.addEventListener('click', (e) => {
    if (e.target === editModal) editModal.style.display = 'none';
  });

  btnSaveEdit.addEventListener('click', async () => {
    if (!editingTodoId) return;
    await chrome.runtime.sendMessage({
      action: 'UPDATE_TODO',
      id: editingTodoId,
      patch: {
        text: document.getElementById('editText').value.trim(),
        dueDate: document.getElementById('editDueDate').value || null,
        priority: document.getElementById('editPriority').value,
      },
    });
    editModal.style.display = 'none';
    await loadState();
    renderCurrentView();
  });

  btnDeleteEdit.addEventListener('click', async () => {
    if (!editingTodoId) return;
    await chrome.runtime.sendMessage({ action: 'DELETE_TODO', id: editingTodoId });
    editModal.style.display = 'none';
    await loadState();
    renderCurrentView();
  });

  // ── Keyboard shortcuts ──
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      settingsModal.style.display = 'none';
      editModal.style.display = 'none';
    }
  });

  // ── Render Helper ──
  function renderCurrentView() {
    if (currentView === 'today') renderTodayView();
    else renderMonthView();
  }

  // ── Init ──
  await loadState();
  updateSyncStatus();
  updateStats();

  const defaultView = state.prefs.defaultView || 'today';
  switchView(defaultView);
});
