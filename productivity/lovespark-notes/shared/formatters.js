// LoveSpark Notes — Pure utility functions
// No DOM, no storage, no side effects. Importable everywhere.

import { TAG_PALETTE } from './constants.js';

/** Generate a unique ID: timestamp base36 + random suffix */
export function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Format a timestamp as relative time or short date */
export function formatDate(ts) {
  const d = new Date(ts);
  const now = Date.now();
  const diff = now - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
  return d.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

/** Format today's date for daily brain dump title */
export function formatToday() {
  return new Date().toLocaleDateString('en', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

/** Get today's date as ISO string (YYYY-MM-DD) for comparisons */
export function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

/** Count words in text */
export function wordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

/** Escape HTML special characters — prevents XSS in innerHTML */
export function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Sanitize a tag string: lowercase, alphanumeric + hyphens only, max length */
export function sanitizeTag(raw) {
  const tag = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
  return tag || null;
}

/**
 * Deterministic tag color from hash.
 * Same tag always gets the same color across sessions and contexts.
 */
export function tagColor(tag) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) & 0xffff;
  }
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
}

/** Auto-generate title from first N chars of content */
export function autoTitle(content, maxLen = 50) {
  if (!content) return '';
  const firstLine = content.split('\n')[0].trim();
  if (firstLine.length <= maxLen) return firstLine;
  return firstLine.slice(0, maxLen).trim() + '…';
}

/** Pick a random motivational message */
export function randomMessage(messages) {
  return messages[Math.floor(Math.random() * messages.length)];
}
