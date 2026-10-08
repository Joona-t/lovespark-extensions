// LoveSpark Planner — Focus Extension Sync
'use strict';

const SyncFocus = (() => {
  async function pull(focusExtensionId) {
    if (!focusExtensionId) throw new Error('No Focus extension ID configured');

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(focusExtensionId, { action: 'EXPORT_STATE' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response) {
          reject(new Error('No response from Focus extension'));
          return;
        }
        resolve(response);
      });
    });
  }

  function transformTasks(focusTasks) {
    return (focusTasks || []).map(t => ({
      id: 'focus_' + t.id,
      text: t.text || '',
      completed: !!t.completed,
      dueDate: null,
      createdAt: t.createdAt || new Date().toISOString(),
      completedAt: t.completedAt || null,
      priority: 'normal',
      source: 'focus',
      sourceId: t.id,
      estimatedPomos: t.estimatedPomos || null,
      completedPomos: t.completedPomos || 0,
    }));
  }

  function transformSessions(focusData) {
    const events = [];
    const completedTasks = focusData.completedTasks || [];
    for (const task of completedTasks) {
      if (!task.completedAt) continue;
      const date = task.completedAt.slice(0, 10);
      events.push({
        id: 'fs_' + date + '_' + Math.random().toString(36).slice(2, 6),
        date,
        type: 'focus-session',
        title: task.text || 'Focus session',
        metadata: {
          duration: task.duration || 25,
          completedAt: task.completedAt,
        },
      });
    }
    return events;
  }

  function transformStats(focusData) {
    return {
      sessionsToday: focusData.stats?.sessionsCompletedToday || 0,
      focusMinutesToday: focusData.stats?.focusMinutesToday || 0,
      totalSessions: focusData.stats?.totalSessionsCompleted || 0,
      currentStreak: focusData.stats?.currentStreak || 0,
    };
  }

  async function syncAll(focusExtensionId) {
    const data = await pull(focusExtensionId);

    // Get existing planner todos — merge Focus tasks
    const existingTodos = await PlannerCore.getTodos();
    const focusTodos = transformTasks(data.tasks || []);

    // Remove old Focus-sourced todos, add fresh ones
    const nonFocusTodos = existingTodos.filter(t => t.source !== 'focus');
    // Preserve dueDate from existing focus todos if user set them
    for (const ft of focusTodos) {
      const existing = existingTodos.find(t => t.sourceId === ft.sourceId && t.source === 'focus');
      if (existing && existing.dueDate) ft.dueDate = existing.dueDate;
      if (existing && existing.priority !== 'normal') ft.priority = existing.priority;
    }
    await PlannerCore.saveTodos([...nonFocusTodos, ...focusTodos]);

    // Transform and save focus session events
    const existingEvents = await PlannerCore.getEvents();
    const nonFocusEvents = existingEvents.filter(e => e.type !== 'focus-session');
    const focusEvents = transformSessions(data);
    await PlannerCore.saveEvents([...nonFocusEvents, ...focusEvents]);

    // Update sync timestamp
    const sync = await PlannerCore.getSync();
    sync.lastFocusSync = Date.now();
    await PlannerCore.saveSync(sync);

    return {
      tasksImported: focusTodos.length,
      sessionsImported: focusEvents.length,
      stats: transformStats(data),
    };
  }

  return { pull, syncAll, transformTasks, transformSessions, transformStats };
})();

if (typeof globalThis !== 'undefined') globalThis.SyncFocus = SyncFocus;
