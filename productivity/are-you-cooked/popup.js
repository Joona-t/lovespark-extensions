chrome.tabs.query({}, (tabs) => {
  const count = tabs.length;

  document.getElementById('tabCount').textContent = count;

  let verdict, state, bg, panicLevel;

  if (count <= 5) {
    verdict    = "you're fine bestie 🌸";
    state      = 'fine';
    bg         = '#0d1f0d';
    panicLevel = 0;
  } else if (count <= 9) {
    verdict    = 'getting spicy in here 🌶️';
    state      = 'spicy';
    bg         = '#1f1508';
    panicLevel = 1;
  } else if (count <= 14) {
    verdict    = 'bestie... this is a lot 👀';
    state      = 'spicy';
    bg         = '#1f1508';
    panicLevel = 2;
  } else if (count <= 19) {
    verdict    = 'ok we need to talk 🤨';
    state      = 'cooked';
    bg         = '#1f0808';
    panicLevel = 3;
  } else if (count <= 24) {
    verdict    = "you're getting cooked bestie 🔥";
    state      = 'cooked';
    bg         = '#1f0808';
    panicLevel = 4;
  } else if (count <= 29) {
    verdict    = 'BESTIE. PUT THE TABS DOWN. 💀';
    state      = 'cooked';
    bg         = '#1a0505';
    panicLevel = 5;
  } else {
    verdict    = 'call 911. this is not a drill 💀🔥';
    state      = '911';
    bg         = '#0a0a0a';
    panicLevel = 6;
  }

  document.getElementById('verdict').textContent = verdict;
  document.body.style.backgroundColor = bg;
  document.body.classList.add(`state-${state}`);

  const mascot = document.getElementById('mascot');
  mascot.className = `mascot panic-${panicLevel}`;
});
