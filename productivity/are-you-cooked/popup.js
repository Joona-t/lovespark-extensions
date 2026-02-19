chrome.tabs.query({}, (tabs) => {
  const count = tabs.length;

  document.getElementById('tabCount').textContent = count;

  let verdict, state, bg;

  if (count <= 5) {
    verdict = "you're fine bestie 🌸";
    state   = 'fine';
    bg      = '#0d1f0d';
  } else if (count <= 15) {
    verdict = 'getting spicy in here 🌶️';
    state   = 'spicy';
    bg      = '#1f1508';
  } else if (count <= 30) {
    verdict = "you're cooked sis 🔥";
    state   = 'cooked';
    bg      = '#1f0808';
  } else {
    verdict = 'call 911. this is not a drill 💀';
    state   = '911';
    bg      = '#0a0a0a';
  }

  document.getElementById('verdict').textContent = verdict;
  document.body.style.backgroundColor = bg;
  document.body.classList.add(`state-${state}`);
});
