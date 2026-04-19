// i18n-html.js — swap all [data-i18n*] placeholders with chrome.i18n.getMessage on load.
//
// Supported attributes (all text-only — no HTML interpolation to avoid XSS surface):
//   data-i18n              → element.textContent
//   data-i18n-placeholder  → element.placeholder (inputs)
//   data-i18n-title        → element.title
//   data-i18n-aria-label   → element.setAttribute("aria-label", ...)
//
// Silent fallback: if the key is missing, the existing text stays (helpful during development
// and when Chrome falls back from a missing locale to en).

(function () {
  function t(key) {
    if (typeof chrome === "undefined" || !chrome.i18n) return null;
    const s = chrome.i18n.getMessage(key);
    return s && s.length ? s : null;
  }

  function apply() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const s = t(el.dataset.i18n);
      if (s) el.textContent = s;
    });
    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      const s = t(el.dataset.i18nPlaceholder);
      if (s) el.placeholder = s;
    });
    document.querySelectorAll("[data-i18n-title]").forEach((el) => {
      const s = t(el.dataset.i18nTitle);
      if (s) el.title = s;
    });
    document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
      const s = t(el.dataset.i18nAriaLabel);
      if (s) el.setAttribute("aria-label", s);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", apply, { once: true });
  } else {
    apply();
  }
})();
