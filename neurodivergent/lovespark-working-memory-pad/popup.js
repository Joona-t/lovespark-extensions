'use strict';

LoveSparkTheme.init();

const pad0 = document.getElementById('pad0');
const pad1 = document.getElementById('pad1');
const pad2 = document.getElementById('pad2');
const pads = [pad0, pad1, pad2];
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

let saveTimeout = null;

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Working Memory Pad] sendBg error:', err.message);
    return null;
  }
}

function getPadValues() {
  return pads.map(p => p.value);
}

function debouncedSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await sendBg({ type: 'SAVE_PADS', pads: getPadValues() });
  }, 500);
}

// Auto-save on input
pads.forEach(pad => {
  pad.addEventListener('input', debouncedSave);
  pad.addEventListener('blur', async () => {
    clearTimeout(saveTimeout);
    await sendBg({ type: 'SAVE_PADS', pads: getPadValues() });
  });
});

// Clear buttons
document.querySelectorAll('.pad-clear').forEach(btn => {
  btn.addEventListener('click', async () => {
    const idx = parseInt(btn.dataset.pad);
    pads[idx].value = '';
    pads[idx].focus();
    await sendBg({ type: 'SAVE_PADS', pads: getPadValues() });
  });
});

// Log use when user types in any pad
let hasLoggedThisSession = false;
pads.forEach(pad => {
  pad.addEventListener('input', () => {
    if (!hasLoggedThisSession && pad.value.trim()) {
      hasLoggedThisSession = true;
      sendBg({ type: 'LOG_USE' });
    }
  });
});

async function init() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    todayEl.textContent = data.notesUsedToday || 0;
    totalEl.textContent = data.notesUsedTotal || 0;
    const savedPads = data.pads || ['', '', ''];
    for (let i = 0; i < 3; i++) {
      pads[i].value = savedPads[i] || '';
    }
  }
}

init();
