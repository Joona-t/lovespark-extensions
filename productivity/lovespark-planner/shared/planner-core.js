// LoveSpark Planner — Core CRUD & Storage Logic
'use strict';

const PlannerCore = (() => {
  // ── ID generation ──
  function genId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  // ── Date helpers ──
  function todayStr() {
    return new Date().toISOString().slice(0, 10);
  }

  function formatDate(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function formatDateShort(dateStr) {
    const d = new Date(dateStr + 'T12:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // ── Storage helpers ──
  async function getAll() {
    return chrome.storage.local.get([
      LSP.KEY_TODOS, LSP.KEY_EVENTS, LSP.KEY_SYNC, LSP.KEY_PREFS,
    ]);
  }

  async function getTodos() {
    const data = await chrome.storage.local.get(LSP.KEY_TODOS);
    return data[LSP.KEY_TODOS] || [];
  }

  async function saveTodos(todos) {
    await chrome.storage.local.set({ [LSP.KEY_TODOS]: todos });
  }

  async function getEvents() {
    const data = await chrome.storage.local.get(LSP.KEY_EVENTS);
    return data[LSP.KEY_EVENTS] || [];
  }

  async function saveEvents(events) {
    await chrome.storage.local.set({ [LSP.KEY_EVENTS]: events });
  }

  async function getSync() {
    const data = await chrome.storage.local.get(LSP.KEY_SYNC);
    return data[LSP.KEY_SYNC] || { ...LSP.DEFAULT_SYNC };
  }

  async function saveSync(sync) {
    await chrome.storage.local.set({ [LSP.KEY_SYNC]: sync });
  }

  async function getPrefs() {
    const data = await chrome.storage.local.get(LSP.KEY_PREFS);
    return { ...LSP.DEFAULT_PREFS, ...(data[LSP.KEY_PREFS] || {}) };
  }

  async function savePrefs(prefs) {
    await chrome.storage.local.set({ [LSP.KEY_PREFS]: prefs });
  }

  // ── Todo CRUD ──

  async function addTodo(text, dueDate, priority) {
    const todos = await getTodos();
    const todo = {
      id: genId(),
      text: text.trim(),
      completed: false,
      dueDate: dueDate || null,
      createdAt: new Date().toISOString(),
      completedAt: null,
      priority: priority || 'normal',
      source: null,
      sourceId: null,
      estimatedPomos: null,
      completedPomos: null,
    };
    todos.push(todo);
    await saveTodos(todos);
    return todo;
  }

  async function updateTodo(id, patch) {
    const todos = await getTodos();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return null;
    todos[idx] = { ...todos[idx], ...patch };
    await saveTodos(todos);
    return todos[idx];
  }

  async function completeTodo(id) {
    const todos = await getTodos();
    const idx = todos.findIndex(t => t.id === id);
    if (idx === -1) return null;
    const wasCompleted = todos[idx].completed;
    todos[idx].completed = !wasCompleted;
    todos[idx].completedAt = wasCompleted ? null : new Date().toISOString();
    await saveTodos(todos);
    return todos[idx];
  }

  async function deleteTodo(id) {
    const todos = await getTodos();
    const filtered = todos.filter(t => t.id !== id);
    await saveTodos(filtered);
  }

  // ── Filtering & Sorting ──

  function todosForDate(todos, dateStr, includeUndated) {
    return todos.filter(t => {
      if (t.dueDate === dateStr) return true;
      if (includeUndated && !t.dueDate) return true;
      return false;
    });
  }

  function sortTodos(todos) {
    return [...todos].sort((a, b) => {
      // Incomplete first
      if (a.completed !== b.completed) return a.completed ? 1 : -1;
      // Then by priority
      const pa = LSP.PRIORITY[a.priority]?.sortOrder ?? 1;
      const pb = LSP.PRIORITY[b.priority]?.sortOrder ?? 1;
      if (pa !== pb) return pa - pb;
      // Then by creation date
      return new Date(a.createdAt) - new Date(b.createdAt);
    });
  }

  // ── Events ──

  function eventsForDate(events, dateStr) {
    return events.filter(e => e.date === dateStr);
  }

  // ── Calendar helpers ──

  function datesWithContent(todos, events) {
    const map = {};
    for (const t of todos) {
      if (t.dueDate) {
        if (!map[t.dueDate]) map[t.dueDate] = { tasks: false, focus: false, notes: false };
        map[t.dueDate].tasks = true;
      }
    }
    for (const e of events) {
      if (!map[e.date]) map[e.date] = { tasks: false, focus: false, notes: false };
      if (e.type === 'focus-session') map[e.date].focus = true;
      if (e.type === 'daily-note') map[e.date].notes = true;
    }
    return map;
  }

  return {
    genId, todayStr, formatDate, formatDateShort,
    getAll, getTodos, saveTodos, getEvents, saveEvents,
    getSync, saveSync, getPrefs, savePrefs,
    addTodo, updateTodo, completeTodo, deleteTodo,
    todosForDate, sortTodos, eventsForDate, datesWithContent,
  };
})();

if (typeof globalThis !== 'undefined') globalThis.PlannerCore = PlannerCore;
