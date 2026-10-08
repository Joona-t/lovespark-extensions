// LoveSpark Notes — Enhanced Markdown Parser
// Line-by-line processing. No external dependencies.
// Supported: # headings, **bold**, *italic*, `code`, ```blocks``` (with lang hints),
// - lists, 1. lists, > quote, --- hr, ~~strike~~, - [ ] checkboxes, [[wiki links]]
// Safety: escapeHtml() first, then apply known-safe transforms.

import { escapeHtml } from './formatters.js';

/**
 * Parse markdown text to HTML.
 * @param {string} text — raw markdown content
 * @returns {string} — safe HTML string
 */
export function renderMarkdown(text) {
  if (!text) return '';

  const lines = text.split('\n');
  const output = [];
  let inCodeBlock = false;
  let codeLang = '';
  let codeLines = [];
  let inList = null; // 'ul' or 'ol' or null

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];

    // ── Code block fence ──
    if (raw.trimStart().startsWith('```')) {
      if (inList) { output.push(`</${inList}>`); inList = null; }
      if (inCodeBlock) {
        const codeContent = codeLines.join('\n');
        const highlighted = codeLang ? highlightCode(codeContent, codeLang) : escapeHtml(codeContent);
        output.push(highlighted);
        output.push('</code></pre>');
        inCodeBlock = false;
        codeLang = '';
        codeLines = [];
      } else {
        inCodeBlock = true;
        codeLang = raw.trimStart().slice(3).trim().toLowerCase();
        const langClass = codeLang ? ` class="language-${escapeHtml(codeLang)}"` : '';
        output.push(`<pre><code${langClass}>`);
      }
      continue;
    }

    // Inside code block — collect lines
    if (inCodeBlock) {
      codeLines.push(raw);
      continue;
    }

    const trimmed = raw.trimStart();

    // ── Horizontal rule ──
    if (/^-{3,}\s*$/.test(trimmed) || /^_{3,}\s*$/.test(trimmed) || /^\*{3,}\s*$/.test(trimmed)) {
      if (inList) { output.push(`</${inList}>`); inList = null; }
      output.push('<hr>');
      continue;
    }

    // ── Headings ──
    const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      if (inList) { output.push(`</${inList}>`); inList = null; }
      const level = headingMatch[1].length;
      output.push(`<h${level}>${inlineTransform(escapeHtml(headingMatch[2]))}</h${level}>`);
      continue;
    }

    // ── Blockquote ──
    if (trimmed.startsWith('> ')) {
      if (inList) { output.push(`</${inList}>`); inList = null; }
      output.push(`<blockquote>${inlineTransform(escapeHtml(trimmed.slice(2)))}</blockquote>`);
      continue;
    }

    // ── Checkbox list items ──
    const checkMatch = trimmed.match(/^[-*+]\s+\[([ xX])\]\s+(.+)$/);
    if (checkMatch) {
      if (inList !== 'ul') {
        if (inList) output.push(`</${inList}>`);
        output.push('<ul class="checklist">');
        inList = 'ul';
      }
      const checked = checkMatch[1] !== ' ';
      const cls = checked ? ' class="checked"' : '';
      const icon = checked ? '☑' : '☐';
      output.push(`<li${cls}><span class="checkbox">${icon}</span> ${inlineTransform(escapeHtml(checkMatch[2]))}</li>`);
      continue;
    }

    // ── Unordered list ──
    const ulMatch = trimmed.match(/^[-*+]\s+(.+)$/);
    if (ulMatch) {
      if (inList !== 'ul') {
        if (inList) output.push(`</${inList}>`);
        output.push('<ul>');
        inList = 'ul';
      }
      output.push(`<li>${inlineTransform(escapeHtml(ulMatch[1]))}</li>`);
      continue;
    }

    // ── Ordered list ──
    const olMatch = trimmed.match(/^\d+\.\s+(.+)$/);
    if (olMatch) {
      if (inList !== 'ol') {
        if (inList) output.push(`</${inList}>`);
        output.push('<ol>');
        inList = 'ol';
      }
      output.push(`<li>${inlineTransform(escapeHtml(olMatch[1]))}</li>`);
      continue;
    }

    // ── Close any open list ──
    if (inList && trimmed === '') {
      output.push(`</${inList}>`);
      inList = null;
      output.push('<br>');
      continue;
    }

    if (inList) {
      output.push(`</${inList}>`);
      inList = null;
    }

    // ── Empty line ──
    if (trimmed === '') {
      output.push('<br>');
      continue;
    }

    // ── Paragraph ──
    output.push(`<p>${inlineTransform(escapeHtml(raw))}</p>`);
  }

  // Close any open blocks
  if (inCodeBlock) {
    const codeContent = codeLines.join('\n');
    const highlighted = codeLang ? highlightCode(codeContent, codeLang) : escapeHtml(codeContent);
    output.push(highlighted);
    output.push('</code></pre>');
  }
  if (inList) output.push(`</${inList}>`);

  return output.join('\n');
}

/**
 * Apply inline markdown transforms to already-escaped HTML text.
 * Order matters: code first (prevents nested transforms inside code spans).
 */
function inlineTransform(text) {
  return text
    // Inline code: `text` — must come first
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    // Bold: **text**
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    // Italic: *text*
    .replace(/\*([^*]+)\*/g, '<em>$1</em>')
    // Strikethrough: ~~text~~
    .replace(/~~([^~]+)~~/g, '<del>$1</del>')
    // Wiki links: [[text]]
    .replace(/\[\[([^\]]+)\]\]/g, '<span class="wiki-link" data-link="$1">$1</span>');
}

/**
 * Basic CSS-only syntax highlighting for JS, Python, CSS tokens.
 * Input is raw (unescaped) text. Output is escaped HTML with <span> highlights.
 */
function highlightCode(text, lang) {
  const escaped = escapeHtml(text);

  if (lang === 'js' || lang === 'javascript' || lang === 'ts' || lang === 'typescript') {
    return escaped
      .replace(/\b(const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|new|this|class|extends|import|export|from|default|async|await|try|catch|finally|throw|typeof|instanceof|in|of|yield|static|get|set|null|undefined|true|false)\b/g, '<span class="hl-keyword">$1</span>')
      .replace(/(&#39;[^]*?&#39;|&quot;[^]*?&quot;|`[^]*?`)/g, '<span class="hl-string">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')
      .replace(/(\/\/.*$)/gm, '<span class="hl-comment">$1</span>');
  }

  if (lang === 'py' || lang === 'python') {
    return escaped
      .replace(/\b(def|class|return|if|elif|else|for|while|import|from|as|try|except|finally|raise|with|lambda|pass|break|continue|and|or|not|in|is|None|True|False|self|yield|async|await|global|nonlocal)\b/g, '<span class="hl-keyword">$1</span>')
      .replace(/(&#39;&#39;&#39;[^]*?&#39;&#39;&#39;|&quot;&quot;&quot;[^]*?&quot;&quot;&quot;|&#39;[^]*?&#39;|&quot;[^]*?&quot;)/g, '<span class="hl-string">$1</span>')
      .replace(/\b(\d+\.?\d*)\b/g, '<span class="hl-number">$1</span>')
      .replace(/(#.*$)/gm, '<span class="hl-comment">$1</span>');
  }

  if (lang === 'css') {
    return escaped
      .replace(/\b(color|background|border|padding|margin|display|flex|grid|position|width|height|font|opacity|transition|animation|transform|z-index|overflow|align|justify|gap|inset|top|right|bottom|left|none|auto|inherit|initial|important)\b/g, '<span class="hl-keyword">$1</span>')
      .replace(/(#[0-9a-fA-F]{3,8})\b/g, '<span class="hl-number">$1</span>')
      .replace(/(\d+\.?\d*(px|em|rem|%|vh|vw|s|ms|deg))/g, '<span class="hl-number">$1</span>')
      .replace(/(\/\*[^]*?\*\/)/g, '<span class="hl-comment">$1</span>');
  }

  return escaped;
}
