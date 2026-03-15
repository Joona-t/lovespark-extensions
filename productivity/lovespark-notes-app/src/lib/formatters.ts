// LoveSpark Notes — Pure utility functions
// Ported from extension's shared/formatters.js

import { TAG_PALETTE, MESSAGES } from './constants';

/** Generate a unique ID: 'n_' + timestamp + random suffix */
export function genId(): string {
  return 'n_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6);
}

/** Format a timestamp as relative time or short date */
export function formatDate(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return Math.floor(diff / 60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h ago';
  if (diff < 604800000) return Math.floor(diff / 86400000) + 'd ago';
  return new Date(ts).toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

/** Format today's date for daily brain dump title */
export function formatToday(): string {
  return new Date().toLocaleDateString('en', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });
}

/** Get today's date as ISO string (YYYY-MM-DD) */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Count words in text */
export function wordCount(text: string): number {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

/** Sanitize a tag string: lowercase, alphanumeric + hyphens only, max length */
export function sanitizeTag(raw: string): string | null {
  const tag = raw.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
  return tag || null;
}

/** Deterministic tag color from hash */
export function getDefaultTagColour(tag: string): { color: string; bg: string } {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = (hash * 31 + tag.charCodeAt(i)) & 0xffff;
  }
  return TAG_PALETTE[Math.abs(hash) % TAG_PALETTE.length];
}

/** Auto-generate title from first line of content */
export function autoTitle(content: string, maxLen = 50): string {
  if (!content) return '';
  const firstLine = content.split('\n')[0].trim();
  if (firstLine.length <= maxLen) return firstLine;
  return firstLine.slice(0, maxLen).trim() + '…';
}

/** Pick a random message from an array */
export function randomMessage(messages: string[] = MESSAGES): string {
  return messages[Math.floor(Math.random() * messages.length)];
}
