// LoveSpark Notes — DOM replacement helper (replaces innerHTML assignments).
// Parses pre-escaped markup in an inert DOMParser document (no script execution,
// no resource loads during parse) and swaps it in with replaceChildren().
// Callers remain responsible for escaping user data (see formatters.escapeHtml).

const parser = new DOMParser();

export function setHTML(el, html) {
  const doc = parser.parseFromString(`<body>${html}</body>`, 'text/html');
  el.replaceChildren(...doc.body.childNodes);
}
