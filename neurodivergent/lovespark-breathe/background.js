'use strict';

/* background.js — Service worker for LoveSpark Breathe
   Handles keyboard shortcuts, message relay, and session logging. */

chrome.commands.onCommand.addListener((command) => {
  if (command === 'quick-breathe') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'quick-breathe' }).catch(() => {
          /* Content script not loaded on this page — open popup instead */
          chrome.action.openPopup();
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'toggle-dimmer') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'set-dimmer',
          enabled: msg.enabled
        }).catch(() => {});
      }
    });
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === 'step-back') {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'step-back' }).catch(() => {});
      }
    });
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === 'log-session') {
    logSession(msg.type).then(() => sendResponse({ ok: true }));
    return true;
  }

  if (msg.action === 'get-log') {
    getTodayLog().then((log) => sendResponse(log));
    return true;
  }
});

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

async function getTodayLog() {
  const key = 'log_' + todayStr();
  const data = await chrome.storage.local.get([key]);
  return data[key] || { breathing: 0, grounding: 0, stepBack: 0, date: todayStr() };
}

async function logSession(type) {
  const key = 'log_' + todayStr();
  const log = await getTodayLog();
  if (type === 'breathing') log.breathing++;
  else if (type === 'grounding') log.grounding++;
  else if (type === 'stepBack') log.stepBack++;
  log.date = todayStr();
  await chrome.storage.local.set({ [key]: log });
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(['defaultPattern'], (data) => {
    if (data.defaultPattern === undefined) {
      chrome.storage.local.set({
        defaultPattern: 'box',
        cycles: 5,
        dimmerMode: 'manual',
        dimmerEnabled: false
      });
    }
  });
});
