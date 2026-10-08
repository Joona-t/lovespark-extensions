// LoveSpark Planner — Service Worker
'use strict';

importScripts(
  'shared/constants.js',
  'shared/planner-core.js',
  'shared/sync-focus.js',
  'shared/sync-notes.js'
);

// ── Storage initialization ──

async function initStorage() {
  const data = await chrome.storage.local.get([LSP.KEY_TODOS, LSP.KEY_EVENTS, LSP.KEY_SYNC, LSP.KEY_PREFS]);
  const updates = {};
  if (!data[LSP.KEY_TODOS]) updates[LSP.KEY_TODOS] = [];
  if (!data[LSP.KEY_EVENTS]) updates[LSP.KEY_EVENTS] = [];
  if (!data[LSP.KEY_SYNC]) updates[LSP.KEY_SYNC] = { ...LSP.DEFAULT_SYNC };
  if (!data[LSP.KEY_PREFS]) updates[LSP.KEY_PREFS] = { ...LSP.DEFAULT_PREFS };
  if (Object.keys(updates).length) await chrome.storage.local.set(updates);
}

// ── Message handler ──

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg.action) {
      case 'GET_STATE': {
        const data = await PlannerCore.getAll();
        sendResponse({
          todos: data[LSP.KEY_TODOS] || [],
          events: data[LSP.KEY_EVENTS] || [],
          sync: data[LSP.KEY_SYNC] || LSP.DEFAULT_SYNC,
          prefs: { ...LSP.DEFAULT_PREFS, ...(data[LSP.KEY_PREFS] || {}) },
        });
        break;
      }

      case 'ADD_TODO': {
        const todo = await PlannerCore.addTodo(msg.text, msg.dueDate, msg.priority);
        sendResponse({ ok: true, todo });
        break;
      }

      case 'UPDATE_TODO': {
        const todo = await PlannerCore.updateTodo(msg.id, msg.patch);
        sendResponse({ ok: true, todo });
        break;
      }

      case 'COMPLETE_TODO': {
        const todo = await PlannerCore.completeTodo(msg.id);
        sendResponse({ ok: true, todo });
        break;
      }

      case 'DELETE_TODO': {
        await PlannerCore.deleteTodo(msg.id);
        sendResponse({ ok: true });
        break;
      }

      case 'SAVE_PREFS': {
        await PlannerCore.savePrefs(msg.prefs);
        sendResponse({ ok: true });
        break;
      }

      case 'SAVE_SYNC': {
        await PlannerCore.saveSync(msg.sync);
        sendResponse({ ok: true });
        break;
      }

      case 'SYNC_FOCUS': {
        try {
          const sync = await PlannerCore.getSync();
          const result = await SyncFocus.syncAll(sync.focusExtensionId);
          sendResponse({ ok: true, ...result });
        } catch (err) {
          sendResponse({ ok: false, error: err.message });
        }
        break;
      }

      case 'SYNC_NOTES': {
        try {
          const sync = await PlannerCore.getSync();
          const result = await SyncNotes.syncAll(sync.notesExtensionId);
          sendResponse({ ok: true, ...result });
        } catch (err) {
          sendResponse({ ok: false, error: err.message });
        }
        break;
      }

      case 'OPEN_APP': {
        await chrome.tabs.create({ url: chrome.runtime.getURL('app/app.html') });
        sendResponse({ ok: true });
        break;
      }

      default:
        sendResponse({ ok: false, error: 'Unknown action' });
    }
  })();
  return true;
});

// ── Startup ──

chrome.runtime.onInstalled.addListener(initStorage);
chrome.runtime.onStartup.addListener(initStorage);
initStorage();
