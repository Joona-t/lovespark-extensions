'use strict';

// ── Config ────────────────────────────────────────────────────────────────────

// Selectors for MutationObserver — mirrors critical entries from content-styles.css.
// CSS handles document_start visual hiding; this JS handles dynamic injection + stats.
const CONTAINER_SELECTORS = [
  '#CybotCookiebotDialog',
  '#CybotCookiebotDialogBodyUnderlay',
  '#CybotCookiebotBackdrop',
  '#onetrust-consent-sdk',
  '#onetrust-banner-sdk',
  '#onetrust-pc-sdk',
  '.onetrust-pc-dark-filter',
  '#cookie-law-info-bar',
  '#cookie-law-info-again',
  '.cli-modal-backdrop',
  '#qc-cmp2-container',
  '#qc-cmp2-ui',
  '#truste-consent-track',
  '.truste_overlay',
  '.truste_box_overlay',
  '#termly-code-snippet-support',
  '.t-consentPrompt',
  '#iubenda-cs-banner',
  '.iubenda-cs-container',
  '.iubenda-backdrop',
  '.osano-cm-window',
  '.osano-cm-dialog',
  '#cmplz-cookiebanner-container',
  '.cmplz-cookiebanner',
  '#cookiescript_injected',
  '#didomi-host',
  '#didomi-consent-popup',
  '.didomi-overlay',
  '#axeptio_overlay',
  '.klaro',
  'div[id^="sp_message_container"]',
  '.admiral-cmp',
  '#_evidon-banner',
  '#usercentrics-root',
  '#cookiehub-overlay',
  '.ch2-container',
  '#cmpbox',
  '#cmpbox2',
  '#ccc',
  '#BorlabsCookie',
  '#cookiefirst-root',
  '.rcb-backdrop',
  '.cc-window',
  '.cc-banner',
  '#cookie-notice',
  '#gdpr-cookie-compliance',
  '.moove-gdpr-infobar',
  '.termsfeed-com---nb',
  '#hs-banner-parent',
  '#sliding-popup',
  '.eu-cookie-compliance-popup',
  '#ppms_cm_consent_popup',
  '.ppms_cm_popup_overlay',
  '#sirdata-cmp-container',
  '[data-hook="cookie-banner"]',
  '.sqs-cookie-banner-v2',
  '[data-testid="cookie-policy-banner"]',
  '.js-consent-banner',
  '#cookie-consent-banner',
  '#bbccookies',
  '[data-testid="gdpr-consent-notice"]',
  '#consent_blackbar',
  '.cn-privacy-notification-widget',
];

// Selectors for reject/decline buttons — tried in order, first match wins
const REJECT_SELECTORS = [
  // Named CMP reject buttons (highest specificity first)
  '#CybotCookiebotDialogBodyButtonDecline',
  '#CybotCookiebotDialogBodyLevelButtonLevelOptinDeclineAll',
  '.onetrust-reject-all-handler',
  '#onetrust-reject-all-handler',
  '#accept-necessary',
  '.cookie-consent-deny',
  '[data-action="reject"]',
  '[data-action="decline"]',
  '[data-action="deny"]',
  '[data-cookiefirst-action="reject"]',
  '[data-testid*="reject" i]',
  '[data-testid*="decline" i]',
  '.cmplz-deny',
  '#cmplz-btn-deny',
  '.didomi-components-button--secondary',
  '#didomi-notice-disagree-button',
  '.osano-cm-denyAll',
  '.cookiescript_reject',
  '#cookiescript_reject',
  '.ch2-btn-secondary',
  '#ch2-reject',
  '[aria-label*="reject" i]',
  '[aria-label*="decline" i]',
  '[aria-label*="deny" i]',
  '[aria-label*="refuse" i]',
  '[aria-label*="only necessary" i]',
  '[aria-label*="essential only" i]',
];

// Text patterns for reject button text-content matching (JS-only, not CSS)
const REJECT_TEXT = [
  /reject\s*all/i,
  /decline\s*all/i,
  /deny\s*all/i,
  /refuse\s*all/i,
  /no[,\s]+thanks/i,
  /only\s*(strictly\s*)?necessary/i,
  /essential\s*only/i,
  /strictly\s*necessary\s*only/i,
  /accept\s*necessary\s*only/i,
];

// ── State ─────────────────────────────────────────────────────────────────────

let settings = { isEnabled: true, whitelisted: false, autoDecline: false };
let initialized = false;
let observer = null;
let rootObserver = null;
let hiddenConsentObserved = false;
let consentLockTimer = null;
const hiddenConsentElements = new Set();

// Badge update batching (max 1 update/second)
let pendingCount = 0;
let batchTimer = null;

// Auto-decline debounce — wait for CMP to fully render before clicking
let declineTimer = null;

// ── Bootstrap ─────────────────────────────────────────────────────────────────

async function init() {
  try {
    const hostname = location.hostname.replace(/^www\./, '');
    if (!hostname) return;

    settings = await browser.runtime.sendMessage({ type: 'CHECK_SITE', domain: hostname });
  } catch (_) {
    // Background not ready yet — use safe defaults (enabled, not whitelisted)
    settings = { isEnabled: true, whitelisted: false, autoDecline: false };
  }

  if (!settings.isEnabled || settings.whitelisted) return;

  // Hide anything already in DOM that CSS may have missed
  hideExisting();

  // Watch for dynamic injections
  startObserver();

  initialized = true;
}

// ── Hiding logic ──────────────────────────────────────────────────────────────

function hideExisting() {
  for (const sel of CONTAINER_SELECTORS) {
    try {
      document.querySelectorAll(sel).forEach(hideEl);
    } catch (_) { /* ignore invalid selectors */ }
  }
}

function hideEl(el) {
  if (!el || el._idwcDone) return;
  el._idwcDone = true;
  el.style.setProperty('display', 'none', 'important');
  hiddenConsentObserved = true;
  hiddenConsentElements.add(el);
  clearTimeout(consentLockTimer);
  consentLockTimer = setTimeout(() => { hiddenConsentObserved = false; }, 5000);
  restoreConsentScrolling();
  scheduleBadgeUpdate(1);
}

// CMPs often lock the page with an inline `overflow: hidden !important` after
// injecting their banner. The document_start stylesheet cannot override an
// inline important declaration. Only remove inline locks shortly after a known
// consent element was hidden, and leave non-consent dialogs alone.
function hasOtherDialog() {
  return [...document.querySelectorAll('dialog[open], [role="dialog"], [aria-modal="true"]')]
    .some((el) => {
      const style = getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
}

function restoreConsentScrolling() {
  if (!hiddenConsentObserved || !document.body) return;
  for (const el of hiddenConsentElements) {
    if (!el.isConnected) hiddenConsentElements.delete(el);
  }
  const consentWasRemoved = hiddenConsentElements.size === 0;
  if (!settings.isEnabled || settings.whitelisted || hasOtherDialog()) {
    if (consentWasRemoved) hiddenConsentObserved = false;
    return;
  }

  for (const root of [document.documentElement, document.body]) {
    for (const property of ['overflow-y', 'overflow']) {
      if (['hidden', 'clip'].includes(root.style.getPropertyValue(property).trim())) {
        root.style.removeProperty(property);
      }
    }
    if (root.style.getPropertyValue('position').trim() === 'fixed') {
      root.style.removeProperty('position');
    }
  }
  // A consent dialog that was removed may leave its lock behind. Clear it
  // once, then stop treating later page dialogs as consent-related.
  if (consentWasRemoved) hiddenConsentObserved = false;
}

// ── MutationObserver ──────────────────────────────────────────────────────────

function startObserver() {
  if (!document.body) {
    // body not ready — wait for it
    document.addEventListener('DOMContentLoaded', startObserver, { once: true });
    return;
  }

  observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        checkNode(node);
      }
    }
    restoreConsentScrolling();
  });

  observer.observe(document.body, { childList: true, subtree: true });
  rootObserver = new MutationObserver(restoreConsentScrolling);
  for (const root of [document.documentElement, document.body]) {
    rootObserver.observe(root, { attributes: true, attributeFilter: ['style'] });
  }
}

function checkNode(el) {
  let found = false;

  for (const sel of CONTAINER_SELECTORS) {
    try {
      if (el.matches(sel)) {
        hideEl(el);
        found = true;
        break;
      }
      // Check children too
      el.querySelectorAll(sel).forEach((child) => {
        hideEl(child);
        found = true;
      });
    } catch (err) { console.warn('[i-dont-want-cookies] unknown:', err); }
  }

  if (found && settings.autoDecline) {
    scheduleDecline(el);
  }
}

// ── Auto-decline ──────────────────────────────────────────────────────────────

function scheduleDecline(nearEl) {
  // Debounce: wait 500ms for CMP to fully render before clicking
  clearTimeout(declineTimer);
  declineTimer = setTimeout(() => attemptDecline(nearEl), 500);
}

function attemptDecline(nearEl) {
  // Search the whole document — the button may not be inside the hidden container
  // (some CMPs inject buttons outside the main dialog)

  // 1. Try named selectors first
  for (const sel of REJECT_SELECTORS) {
    try {
      const btn = document.querySelector(sel);
      if (btn && isVisible(btn)) {
        btn.click();
        return;
      }
    } catch (err) { console.warn('[i-dont-want-cookies] unknown:', err); }
  }

  // 2. Fall back to text-content matching across all buttons
  const buttons = document.querySelectorAll(
    'button, [role="button"], a[class*="consent" i], a[class*="cookie" i]'
  );

  for (const btn of buttons) {
    const text = (btn.textContent || btn.innerText || '').trim();
    if (!text) continue;
    for (const pat of REJECT_TEXT) {
      if (pat.test(text)) {
        btn.click();
        return;
      }
    }
  }
}

// Elements are display:none (CSS-hidden) but we can still click them.
// This helper checks if an element EXISTS and is not permanently removed.
function isVisible(el) {
  return el && el.isConnected;
}

// ── Badge / stats ─────────────────────────────────────────────────────────────

function scheduleBadgeUpdate(n) {
  pendingCount += n;
  clearTimeout(batchTimer);
  batchTimer = setTimeout(flushBadge, 1000);
}

function flushBadge() {
  if (pendingCount <= 0) return;
  try {
    browser.runtime.sendMessage({
      type: 'HIDDEN',
      count: pendingCount,
      domain: location.hostname.replace(/^www\./, ''),
    });
  } catch (err) { console.warn('[i-dont-want-cookies] unknown:', err); }
  pendingCount = 0;
}

// ── Settings change listener (storage-based, no tabs permission needed) ───────

chrome.storage.onChanged.addListener((changes) => {
  const hostname = location.hostname.replace(/^www\./, '');
  let changed = false;

  if ('isEnabled' in changes) {
    settings.isEnabled = changes.isEnabled.newValue !== false;
    changed = true;
  }
  if ('autoDecline' in changes) {
    settings.autoDecline = !!changes.autoDecline.newValue;
    changed = true;
  }
  if ('whitelistedDomains' in changes) {
    settings.whitelisted = (changes.whitelistedDomains.newValue || []).includes(hostname);
    changed = true;
  }

  if (!changed) return;

  if (!settings.isEnabled || settings.whitelisted) {
    if (observer) { observer.disconnect(); observer = null; }
    if (rootObserver) { rootObserver.disconnect(); rootObserver = null; }
    restoreConsentScrolling();
  } else if (!observer && initialized) {
    startObserver();
    hideExisting();
    restoreConsentScrolling();
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────

init();
