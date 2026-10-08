/* Site Notes domain rules shared by the background runtime and Node tests. */
'use strict';

(function(root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.LoveSparkSiteNotesStore = api;
  root.SiteNotesStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  const FORMAT = 'lovespark-site-notes-backup';
  const VERSION = 1;
  const MAX_NOTE_LENGTH = 10000;
  const MAX_NOTE_COUNT = 1000;
  const MAX_TOTAL_LENGTH = 1000000;
  const MAX_BACKUP_BYTES = 5000000;
  const BACKUP_EPOCH = '1970-01-01T00:00:00.000Z';
  const FORBIDDEN_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

  class ValidationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'ValidationError';
    }
  }

  function fail(message) {
    throw new ValidationError(message);
  }

  function isPlainObject(value) {
    if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
    const prototype = Object.getPrototypeOf(value);
    return prototype === Object.prototype || prototype === null;
  }

  function canonicalHostname(value) {
    if (typeof value !== 'string' || value.length === 0 || FORBIDDEN_KEYS.has(value)) {
      fail('Invalid hostname');
    }

    let parsed;
    try {
      parsed = new URL('https://' + value + '/');
    } catch (_) {
      fail('Invalid hostname');
    }

    if (!parsed.hostname || parsed.hostname !== value || parsed.username || parsed.password || parsed.port) {
      fail('Hostname must be canonical');
    }
    return parsed.hostname;
  }

  function hostnameFromUrl(value) {
    if (typeof value !== 'string') fail('Invalid URL');
    let parsed;
    try {
      parsed = new URL(value);
    } catch (_) {
      fail('Invalid URL');
    }
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      fail('Only HTTP(S) pages are supported');
    }
    return canonicalHostname(parsed.hostname);
  }

  function validateNote(value) {
    if (typeof value !== 'string') fail('Note must be text');
    if (value.length > MAX_NOTE_LENGTH) {
      fail('Note exceeds ' + MAX_NOTE_LENGTH + ' characters');
    }
    return value;
  }

  function validateNotesMap(value) {
    if (!isPlainObject(value)) fail('Stored notes are corrupt');
    const keys = Object.keys(value);
    if (keys.length > MAX_NOTE_COUNT) fail('Stored note count exceeds the limit');

    const normalized = Object.create(null);
    let totalLength = 0;
    for (const key of keys.sort()) {
      const hostname = canonicalHostname(key);
      const note = validateNote(value[key]);
      totalLength += note.length;
      if (totalLength > MAX_TOTAL_LENGTH) fail('Stored note text exceeds the aggregate limit');
      normalized[hostname] = note;
    }
    const probe = JSON.stringify({ format: FORMAT, version: VERSION, exportedAt: BACKUP_EPOCH, notes: normalized }, null, 2);
    if (utf8Length(probe) > MAX_BACKUP_BYTES) fail('Backup exceeds the size limit');
    return normalized;
  }

  function updateNote(notes, url, note) {
    const current = validateNotesMap(notes);
    const hostname = hostnameFromUrl(url);
    validateNote(note);
    const existed = Object.prototype.hasOwnProperty.call(current, hostname);
    const next = Object.assign(Object.create(null), current);

    if (note.trim().length === 0) {
      delete next[hostname];
    } else {
      next[hostname] = note;
    }

    return {
      hostname,
      notes: validateNotesMap(next),
      isNew: !existed && note.trim().length > 0,
      changed: existed ? current[hostname] !== next[hostname] : note.trim().length > 0,
    };
  }

  function deleteNote(notes, url) {
    const current = validateNotesMap(notes);
    const hostname = hostnameFromUrl(url);
    const existed = Object.prototype.hasOwnProperty.call(current, hostname);
    const next = Object.assign(Object.create(null), current);
    delete next[hostname];
    return { hostname, notes: next, changed: existed };
  }

  function utf8Length(value) {
    return new TextEncoder().encode(value).byteLength;
  }

  function createBackup(notes, exportedAt) {
    const normalized = validateNotesMap(notes);
    const timestamp = exportedAt === undefined ? new Date().toISOString() : exportedAt;
    if (typeof timestamp !== 'string' || !Number.isFinite(Date.parse(timestamp)) || new Date(timestamp).toISOString() !== timestamp) {
      fail('Invalid export timestamp');
    }
    const backup = { format: FORMAT, version: VERSION, exportedAt: timestamp, notes: normalized };
    const text = JSON.stringify(backup, null, 2);
    if (utf8Length(text) > MAX_BACKUP_BYTES) fail('Backup exceeds the size limit');
    return { backup, text };
  }

  // Result-shaped helpers keep worker error paths explicit while the throwing
  // primitives above remain convenient for callers that want fail-closed
  // validation.
  function validateNotes(value) {
    try {
      const notes = validateNotesMap(value);
      return { ok: true, notes, count: Object.keys(notes).length, totalLength: Object.values(notes).reduce((n, note) => n + note.length, 0) };
    } catch (error) {
      return { ok: false, code: 'INVALID_STORAGE', error: error.message };
    }
  }

  function putNote(notes, hostname, note) {
    try {
      const result = updateNote(notes, 'https://' + hostname + '/', note);
      return { ok: true, notes: result.notes, isNew: result.isNew, deleted: !Object.prototype.hasOwnProperty.call(result.notes, result.hostname) };
    } catch (error) {
      return { ok: false, code: /Stored notes|note count|aggregate|Backup/.test(error.message) ? 'INVALID_STORAGE' : 'INVALID_NOTE', error: error.message };
    }
  }

  function parseBackup(text) {
    if (typeof text !== 'string') fail('Backup must be text');
    if (utf8Length(text) > MAX_BACKUP_BYTES) fail('Backup exceeds the size limit');

    let value;
    try {
      value = JSON.parse(text);
    } catch (_) {
      fail('Backup is not valid JSON');
    }
    if (!isPlainObject(value)) fail('Backup must be an object');
    const keys = Object.keys(value).sort();
    const expected = ['exportedAt', 'format', 'notes', 'version'];
    if (keys.length !== expected.length || keys.some((key, index) => key !== expected[index])) {
      fail('Backup schema is invalid');
    }
    if (value.format !== FORMAT) fail('Backup format is not supported');
    if (value.version !== VERSION) fail('Backup version is not supported');
    if (typeof value.exportedAt !== 'string' || !Number.isFinite(Date.parse(value.exportedAt)) ||
        new Date(value.exportedAt).toISOString() !== value.exportedAt) {
      fail('Backup timestamp is invalid');
    }
    return {
      format: FORMAT,
      version: VERSION,
      exportedAt: value.exportedAt,
      notes: validateNotesMap(value.notes),
    };
  }

  return {
    FORMAT,
    VERSION,
    MAX_NOTE_LENGTH,
    MAX_NOTE_COUNT,
    MAX_TOTAL_LENGTH,
    MAX_BACKUP_BYTES,
    ValidationError,
    canonicalHostname,
    hostnameFromUrl,
    validateNote,
    validateNotesMap,
    updateNote,
    deleteNote,
    utf8Length,
    createBackup,
    parseBackup,
    validateNotes,
    putNote,
  };
});
