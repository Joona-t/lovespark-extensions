// Are You Cooked? — background.js
// Watches tab opens and fires milestone notifications every 5 tabs.
'use strict';

const MILESTONE_MESSAGES = {
  5:  "bestie... are you sure you need this many tabs? 🌸",
  10: "i thought we were staying focused & practicing mindfulness... 👀",
  15: "ok we need to talk. this is getting concerning 🤨",
  20: "you're getting cooked bestie. close some tabs pls 🔥",
  25: "BESTIE. PUT THE TABS DOWN. 💀",
};

const MSG_30_PLUS = "call 911. we are fully cooked. there is no saving us. 💀🔥";

function getMilestoneMessage(count) {
  if (count < 5 || count % 5 !== 0) return null;
  if (count >= 30) return MSG_30_PLUS;
  return MILESTONE_MESSAGES[count] || null;
}

chrome.tabs.onCreated.addListener(() => {
  chrome.tabs.query({}, (tabs) => {
    const count = tabs.length;
    const message = getMilestoneMessage(count);
    if (!message) return;

    chrome.notifications.create(`cooked-${count}-${Date.now()}`, {
      type:     'basic',
      iconUrl:  'Mascot.png',
      title:    'are you cooked? 🔥',
      message:  message,
      priority: 1,
    });
  });
});
