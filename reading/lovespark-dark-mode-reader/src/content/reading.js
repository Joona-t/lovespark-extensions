/* Dark Mode Reader — reading.js
   The reading layer: flips data attributes on <html>; theme.css does the work.
   In-place typography only — article extraction is lovespark-reader's job. */
(function (root) {
  'use strict';
  const html = document.documentElement;
  function apply(reading, enabled) {
    html.classList.toggle('dmr-read', !!enabled);
    if (!enabled) { remove(); return; }
    html.setAttribute('data-dmr-font', reading.font || 'default');
    html.setAttribute('data-dmr-width', reading.width ? '1' : '0');
    html.setAttribute('data-dmr-lh', reading.lineHeight ? '1' : '0');
    html.setAttribute('data-dmr-links', reading.links ? '1' : '0');
  }
  function remove() {
    html.classList.remove('dmr-read');
    ['data-dmr-font', 'data-dmr-width', 'data-dmr-lh', 'data-dmr-links'].forEach(a => html.removeAttribute(a));
  }
  root.DMR.reading = { apply, remove };
})(typeof globalThis !== 'undefined' ? globalThis : this);
