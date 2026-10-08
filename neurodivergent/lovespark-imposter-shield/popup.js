'use strict';

LoveSparkTheme.init();

const thoughtEl = document.getElementById('thought');
const newThoughtBtn = document.getElementById('newThoughtBtn');
const shakeBtn = document.getElementById('shakeBtn');
const evidenceDisplay = document.getElementById('evidenceDisplay');
const evidenceText = document.getElementById('evidenceText');
const evidenceDate = document.getElementById('evidenceDate');
const evidenceInput = document.getElementById('evidenceInput');
const addBtn = document.getElementById('addBtn');
const vaultCount = document.getElementById('vaultCount');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

if (typeof LoveSparkFooter !== 'undefined') LoveSparkFooter.render(footerMount);

async function sendBg(msg) {
  try { return await chrome.runtime.sendMessage(msg); }
  catch (_) { return null; }
}

newThoughtBtn.addEventListener('click', async () => {
  thoughtEl.style.opacity = '0';
  const r = await sendBg({ type: 'GET_THOUGHT' });
  setTimeout(() => {
    if (r && r.thought) thoughtEl.textContent = r.thought;
    thoughtEl.style.opacity = '1';
  }, 300);
});

shakeBtn.addEventListener('click', async () => {
  const r = await sendBg({ type: 'SHAKE_VAULT' });
  if (r && r.evidence) {
    evidenceDisplay.hidden = false;
    evidenceText.textContent = r.evidence.text;
    evidenceDate.textContent = r.evidence.date;
  } else if (r && r.error) {
    evidenceDisplay.hidden = false;
    evidenceText.textContent = r.error;
    evidenceDate.textContent = '';
  }
});

async function addEvidence() {
  const text = evidenceInput.value.trim();
  if (!text) return;
  const r = await sendBg({ type: 'ADD_EVIDENCE', text });
  if (r && r.ok) {
    evidenceInput.value = '';
    vaultCount.textContent = (r.vault || []).length;
    shakeBtn.disabled = false;
  }
}

addBtn.addEventListener('click', addEvidence);
evidenceInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addEvidence();
});

async function init() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    todayEl.textContent = data.shieldsToday || 0;
    totalEl.textContent = data.shieldsTotal || 0;
    if (data.thought) thoughtEl.textContent = data.thought;
    const vault = data.vault || [];
    vaultCount.textContent = vault.length;
    shakeBtn.disabled = vault.length === 0;
  }
}

init();
