// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Onboarding Script
// Single-question first-install flow
// ═══════════════════════════════════════════════════════════════════

const btnStart = document.getElementById('btnStart');
const inputReason = document.getElementById('inputReason');

function completeOnboarding() {
  const reason = inputReason.value.trim();
  try {
    chrome.runtime.sendMessage({
      type: 'COMPLETE_ONBOARDING',
      reason: reason,
      goal: '',
      journalTime: ''
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn('[Rewire Brain] onboarding complete failed:', chrome.runtime.lastError.message);
      }
      window.location.href = chrome.runtime.getURL('dashboard.html');
    });
  } catch (err) {
    console.warn('[Rewire Brain] onboarding sendMessage threw:', err);
    window.location.href = chrome.runtime.getURL('dashboard.html');
  }
}

btnStart.addEventListener('click', completeOnboarding);

// Allow Enter key (Shift+Enter for newline in textarea)
inputReason.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
    e.preventDefault();
    completeOnboarding();
  }
});
