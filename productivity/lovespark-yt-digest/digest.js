'use strict';

// ── Theme ─────────────────────────────────────────────────────────
const THEMES = ['retro', 'dark', 'beige', 'slate'];
const THEME_NAMES = { retro: 'Retro Pink', dark: 'Dark', beige: 'Beige', slate: 'Slate' };

function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = THEME_NAMES[t] || t;
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === t);
  });
}

(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (!toggle || !menu) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
  });

  menu.addEventListener('click', (e) => {
    const opt = e.target.closest('.theme-option');
    if (!opt) return;
    const theme = opt.dataset.theme;
    applyTheme(theme);
    chrome.storage.local.set({ theme });
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('click', () => {
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded', 'false');
  });

  document.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('open')) return;
    const opts = [...menu.querySelectorAll('.theme-option')];
    const focused = document.activeElement;
    const idx = opts.indexOf(focused);

    if (e.key === 'Escape') {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      const next = idx < opts.length - 1 ? idx + 1 : 0;
      opts[next].focus();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      const prev = idx > 0 ? idx - 1 : opts.length - 1;
      opts[prev].focus();
      e.preventDefault();
    }
  });

  chrome.storage.local.get(['theme'], ({ theme }) => {
    applyTheme(theme || 'retro');
  });
})();

// ── DOM refs ──────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const videoTitle      = $('videoTitle');
const videoMeta       = $('videoMeta');
const loadingState    = $('loadingState');
const errorState      = $('errorState');
const errorMessage    = $('errorMessage');
const digestContent   = $('digestContent');
const summaryBody     = $('summaryBody');
const transcriptText  = $('transcriptText');
const autoNotice      = $('autoNotice');
const btnCopySummary  = $('btnCopySummary');
const btnCopyTranscript = $('btnCopyTranscript');
const btnResummarize  = $('btnResummarize');
const transcriptToggle = $('transcriptToggle');
const transcriptChevron = $('transcriptChevron');
const transcriptBody  = $('transcriptBody');
const copyToast       = $('copyToast');

let currentVideoId = null;
let rawSummary = '';
let rawTranscript = '';

// ── Get video ID from URL ─────────────────────────────────────────
function getVideoIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get('v') || null;
}

// ── Markdown → safe DOM ───────────────────────────────────────────
function renderMarkdown(container, markdown) {
  container.textContent = '';
  const lines = markdown.split('\n');
  let currentList = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      currentList = null;
      continue;
    }

    // Heading: ## text
    if (trimmed.startsWith('## ')) {
      currentList = null;
      const h2 = document.createElement('h2');
      h2.textContent = trimmed.slice(3);
      container.appendChild(h2);
      continue;
    }

    // Blockquote: > text
    if (trimmed.startsWith('> ')) {
      currentList = null;
      const bq = document.createElement('blockquote');
      appendInlineFormatted(bq, trimmed.slice(2));
      container.appendChild(bq);
      continue;
    }

    // List item: - text
    if (trimmed.startsWith('- ')) {
      if (!currentList) {
        currentList = document.createElement('ul');
        container.appendChild(currentList);
      }
      const li = document.createElement('li');
      appendInlineFormatted(li, trimmed.slice(2));
      currentList.appendChild(li);
      continue;
    }

    // Paragraph
    currentList = null;
    const p = document.createElement('p');
    appendInlineFormatted(p, trimmed);
    container.appendChild(p);
  }
}

function appendInlineFormatted(parent, text) {
  // Handle **bold** and *italic* using safe DOM methods
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  for (const part of parts) {
    if (part.startsWith('**') && part.endsWith('**')) {
      const strong = document.createElement('strong');
      strong.textContent = part.slice(2, -2);
      parent.appendChild(strong);
    } else if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      const em = document.createElement('em');
      em.textContent = part.slice(1, -1);
      parent.appendChild(em);
    } else {
      parent.appendChild(document.createTextNode(part));
    }
  }
}

// ── Copy to clipboard ─────────────────────────────────────────────
function showToast(message) {
  copyToast.textContent = message;
  copyToast.classList.add('visible');
  setTimeout(() => copyToast.classList.remove('visible'), 2000);
}

async function copyText(text, label) {
  try {
    await navigator.clipboard.writeText(text);
    showToast(label + ' copied!');
  } catch (_) {
    showToast('Copy failed — check permissions');
  }
}

// ── Transcript toggle ─────────────────────────────────────────────
transcriptToggle.addEventListener('click', () => {
  const expanded = transcriptToggle.getAttribute('aria-expanded') === 'true';
  transcriptToggle.setAttribute('aria-expanded', !expanded);
  transcriptBody.classList.toggle('collapsed', expanded);
  transcriptChevron.textContent = expanded ? '▸' : '▾';
});

// ── Load summary ──────────────────────────────────────────────────
function loadSummary() {
  const videoId = getVideoIdFromUrl();
  if (!videoId) {
    showError('No video ID in URL.');
    return;
  }

  currentVideoId = videoId;

  chrome.storage.local.get('digest_' + videoId, (result) => {
    const data = result['digest_' + videoId];
    if (!data?.summary) {
      showError('No summary found for this video. Try summarizing from the popup first.');
      return;
    }

    displaySummary(data);
  });
}

function displaySummary(data) {
  loadingState.style.display = 'none';
  digestContent.style.display = 'block';

  // Video info
  if (data.videoDetails) {
    videoTitle.textContent = data.videoDetails.title || 'Video Summary';
    const parts = [];
    if (data.videoDetails.author) parts.push(data.videoDetails.author);
    if (data.videoDetails.lengthSeconds) {
      const m = Math.floor(data.videoDetails.lengthSeconds / 60);
      const h = Math.floor(m / 60);
      if (h > 0) parts.push(h + 'h ' + (m % 60) + 'm');
      else parts.push(m + 'm');
    }
    if (data.language) parts.push(data.language.toUpperCase());
    videoMeta.textContent = parts.join(' · ');
  }

  // Auto-caption notice
  if (data.isAutoGenerated) {
    autoNotice.style.display = 'block';
  }

  // Render summary
  rawSummary = data.summary;
  renderMarkdown(summaryBody, data.summary);

  // Transcript
  rawTranscript = data.transcript || '';
  transcriptText.textContent = rawTranscript || 'No transcript available.';

  document.title = 'YT Digest — ' + (data.videoDetails?.title || 'Summary');
}

function showError(msg) {
  loadingState.style.display = 'none';
  errorState.style.display = 'block';
  errorMessage.textContent = msg;
}

// ── Event listeners ───────────────────────────────────────────────
btnCopySummary.addEventListener('click', () => copyText(rawSummary, 'Summary'));
btnCopyTranscript.addEventListener('click', () => copyText(rawTranscript, 'Transcript'));

btnResummarize.addEventListener('click', () => {
  if (!currentVideoId) return;
  btnResummarize.disabled = true;
  btnResummarize.textContent = 'Summarizing...';

  chrome.runtime.sendMessage({ action: 'summarize', videoId: currentVideoId }, (resp) => {
    btnResummarize.disabled = false;
    btnResummarize.textContent = 'Re-summarize';

    if (resp?.error) {
      showToast('Error: ' + resp.error);
      return;
    }

    if (resp?.success && resp.data) {
      displaySummary(resp.data);
      showToast('Re-summarized!');
    }
  });
});

// ── Footer ────────────────────────────────────────────────────────
LoveSparkFooter.appendTo(document.getElementById('footerArea'));

// ── Init ──────────────────────────────────────────────────────────
loadSummary();
