// LoveSpark Planner — Popup (Today at a Glance)
'use strict';

document.addEventListener('DOMContentLoaded', async () => {
  LoveSparkTheme.init();

  const taskList = document.getElementById('taskList');
  const addForm = document.getElementById('addTaskForm');
  const taskInput = document.getElementById('taskInput');
  const todayLabel = document.getElementById('todayLabel');
  const syncSummary = document.getElementById('syncSummary');
  const btnOpenApp = document.getElementById('btnOpenApp');
  const footerMsg = document.getElementById('footerMsg');

  const today = PlannerCore.todayStr();

  // Set today label
  todayLabel.textContent = PlannerCore.formatDate(today);

  // Rotate messages
  footerMsg.textContent = LSP.MESSAGES[Math.floor(Math.random() * LSP.MESSAGES.length)];
  LoveSparkPopup.rotateMessages(footerMsg, LSP.MESSAGES);

  // Load state
  async function loadState() {
    const resp = await chrome.runtime.sendMessage({ action: 'GET_STATE' });
    return resp;
  }

  function renderTasks(todos, events) {
    const todayTodos = PlannerCore.todosForDate(todos, today, false);
    const undatedTodos = todos.filter(t => !t.dueDate && !t.completed);
    const allForToday = PlannerCore.sortTodos([...todayTodos, ...undatedTodos.slice(0, 5)]);

    taskList.textContent = '';

    if (allForToday.length === 0) {
      const empty = document.createElement('div');
      empty.className = 'empty-state';
      empty.textContent = 'No tasks for today. Add one below!';
      taskList.appendChild(empty);
    } else {
      for (const todo of allForToday) {
        const item = document.createElement('div');
        item.className = 'task-item' + (todo.completed ? ' completed' : '');
        item.setAttribute('role', 'listitem');

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'task-checkbox';
        cb.checked = todo.completed;
        cb.setAttribute('aria-label', (todo.completed ? 'Mark incomplete: ' : 'Mark complete: ') + todo.text);
        cb.addEventListener('change', async () => {
          await chrome.runtime.sendMessage({ action: 'COMPLETE_TODO', id: todo.id });
          refresh();
        });

        const text = document.createElement('span');
        text.className = 'task-text';
        text.textContent = todo.text;

        const pri = document.createElement('span');
        pri.className = 'task-priority';
        pri.textContent = LSP.PRIORITY[todo.priority]?.dot || '';
        pri.setAttribute('aria-label', 'Priority: ' + (LSP.PRIORITY[todo.priority]?.label || todo.priority));

        const del = document.createElement('button');
        del.className = 'task-delete';
        del.textContent = '\u00D7';
        del.setAttribute('aria-label', 'Delete task: ' + todo.text);
        del.addEventListener('click', async () => {
          await chrome.runtime.sendMessage({ action: 'DELETE_TODO', id: todo.id });
          refresh();
        });

        item.append(cb, text, pri, del);
        taskList.appendChild(item);
      }
    }

    // Sync summary
    const todayEvents = PlannerCore.eventsForDate(events, today);
    const focusSessions = todayEvents.filter(e => e.type === 'focus-session');
    const dailyNotes = todayEvents.filter(e => e.type === 'daily-note');

    syncSummary.textContent = '';
    if (focusSessions.length > 0 || dailyNotes.length > 0) {
      if (focusSessions.length > 0) {
        const totalMin = focusSessions.reduce((s, e) => s + (e.metadata?.duration || 25), 0);
        const line = document.createElement('div');
        line.className = 'sync-line';
        const label = document.createElement('span');
        label.textContent = 'Focus: ' + focusSessions.length + ' session' + (focusSessions.length > 1 ? 's' : '');
        const value = document.createElement('span');
        value.textContent = totalMin + ' min';
        line.append(label, value);
        syncSummary.appendChild(line);
      }
      if (dailyNotes.length > 0) {
        const wc = dailyNotes.reduce((s, e) => s + (e.metadata?.wordCount || 0), 0);
        const line = document.createElement('div');
        line.className = 'sync-line';
        const label = document.createElement('span');
        label.textContent = 'Notes: Daily';
        const value = document.createElement('span');
        value.textContent = wc + ' words';
        line.append(label, value);
        syncSummary.appendChild(line);
      }
    }
  }

  async function refresh() {
    const state = await loadState();
    renderTasks(state.todos, state.events);
  }

  // Add task form
  addForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = taskInput.value.trim();
    if (!text) return;
    await chrome.runtime.sendMessage({ action: 'ADD_TODO', text, dueDate: today });
    taskInput.value = '';
    refresh();
  });

  // Open full planner
  btnOpenApp.addEventListener('click', () => {
    chrome.runtime.sendMessage({ action: 'OPEN_APP' });
    window.close();
  });

  // Initial load
  refresh();
});

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
