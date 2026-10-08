'use strict';

chrome.action.onClicked.addListener(async () => {
  const dashUrl = chrome.runtime.getURL('dashboard.html');
  const [existing] = await chrome.tabs.query({ url: dashUrl });

  if (existing) {
    await chrome.tabs.update(existing.id, { active: true });
    await chrome.windows.update(existing.windowId, { focused: true });
  } else {
    chrome.tabs.create({ url: dashUrl });
  }
});
