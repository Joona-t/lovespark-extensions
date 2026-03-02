'use strict';

chrome.tabs.query({}, (tabs) => {
  const count = tabs.length;

  document.getElementById('tabCount').textContent = count;

  let verdict, state, panicLevel;

  if (count < 5) {
    verdict    = "you're fine bestie 🌸";
    state      = 'fine';
    panicLevel = 0;
  } else if (count <= 9) {
    verdict    = 'getting spicy in here 🌶️';
    state      = 'spicy';
    panicLevel = 1;
  } else if (count <= 14) {
    verdict    = 'bestie... this is a lot 👀';
    state      = 'spicy';
    panicLevel = 2;
  } else if (count <= 19) {
    verdict    = 'ok we need to talk 🤨';
    state      = 'cooked';
    panicLevel = 3;
  } else if (count <= 24) {
    verdict    = "you're getting cooked bestie 🔥";
    state      = 'cooked';
    panicLevel = 4;
  } else if (count <= 29) {
    verdict    = 'BESTIE. PUT THE TABS DOWN. 💀';
    state      = 'cooked';
    panicLevel = 5;
  } else {
    verdict    = 'call 911. this is not a drill 💀🔥';
    state      = '911';
    panicLevel = 6;
  }

  document.getElementById('verdict').textContent = verdict;
  document.body.classList.add(`state-${state}`);

  const mascot = document.getElementById('mascot');
  mascot.className = `mascot panic-${panicLevel}`;
});
