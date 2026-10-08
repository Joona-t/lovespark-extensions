'use strict';

// ── Gmail image proxy caveat ─────────────────────────────
// Gmail proxies all images through googleusercontent.com server-side.
// In the DOM, img.src shows https://ci3.googleusercontent.com/proxy/...
// not the tracker domain. This means:
// - DNR rules may not fire for Gmail (proxy fetches happen server-side)
// - URL pattern matching against src won't see tracker domains
// - Dimension + visibility checks are the PRIMARY defense for Gmail
// - For Outlook/Yahoo, images load directly — both DNR and URL matching work

const BLANK_PIXEL = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

// Known tracker domains for URL pattern matching (Outlook/Yahoo — not proxied)
const TRACKER_DOMAINS = new Set([
  't.mailchimp.com', 'mandrillapp.com', 'list-manage.com', 'links.m.mailchimp.com',
  't.hubspotemail.net', 'track.hubspot.com', 't.campaignmonitor.com',
  'o.sendinblue.com', 'track.getresponse.com', 't.emltrk.com',
  'links.convertkit.com', 'tracking.activehosted.com', 't.contactmonkey.com',
  'app.outreach.io', 't.yesware.com', 't.mailtrack.io', 'track.streak.com',
  'api.mixmax.com', 't.cirrusinsight.com', 'track.boomeranggmail.com',
  't.saleshandy.com', 'web.saleshandy.com', 'salesloft.com',
  't.sigopener.com', 't.emailtracker.website', 't.rdrtr.com',
  'api.nylas.com', 't.gronze.com', 't.bananatag.com', 't.polymail.io',
  't.postmarkapp.com', 'links.litmus.com', 't.close.com', 't.grooveapp.com',
  't.snov.io', 'go.readnotify.com', 't.getnotify.com', 't.getvero.com',
  't.customer.io', 't.dripemail2.com', 't.mailtag.io', 't.nethunt.com',
  'canarypixels.com', 't.emarsys.com', 't.icontact.com', 't.phplist.com',
  't.sparkpost.com', 't.sailthru.com', 't.iterable.com', 't.klaviyo.com',
  't.mailerlite.com', 't.aweber.com', 't.constantcontact.com',
  'media.superhumanapp.com', 't.sendgrid.net', 'sendgrid.net',
  't.mailjet.com', 't.thunderhead.com', 't.wixshoutout.com',
  't.freshmail.com', 't.growthdot.com', 't.gem.com',
  't.github.com', 't.zendesk.com', 'pixel.app.returnpath.net',
]);

// URL path patterns that indicate tracking endpoints
const TRACKING_PATHS = ['/track', '/open', '/pixel', '/beacon', '/wf/open'];

// ── State ────────────────────────────────────────────────
let isEnabled = true;
let observer = null;
let webmailType = null; // 'gmail' | 'outlook' | 'yahoo'

// ── Batched reporting ────────────────────────────────────
let pendingCount = 0;
let batchTimer = null;

function reportBlocked(n) {
  pendingCount += n;
  clearTimeout(batchTimer);
  batchTimer = setTimeout(flushReport, 1000);
}

function flushReport() {
  if (pendingCount <= 0) return;
  try {
    browser.runtime.sendMessage({
      type: 'TRACKERS_BLOCKED',
      count: pendingCount,
    });
  } catch (err) { console.warn('[lovespark-email-guard] flushReport:', err); }
  pendingCount = 0;
}

// ── Webmail detection ────────────────────────────────────
function detectWebmail() {
  const host = location.hostname;
  if (host === 'mail.google.com') return 'gmail';
  if (host.includes('outlook.live.com') || host.includes('outlook.office.com') || host.includes('outlook.office365.com')) return 'outlook';
  if (host === 'mail.yahoo.com') return 'yahoo';
  return null;
}

// ── Email body selectors per webmail ─────────────────────
function getEmailBodySelector() {
  switch (webmailType) {
    case 'gmail': return 'div.a3s.aiL';
    case 'outlook': return 'div[aria-label="Message body"]';
    case 'yahoo': return 'div.msg-body';
    default: return null;
  }
}

function getSenderAreaSelector() {
  switch (webmailType) {
    case 'gmail': return 'div.gE.iv.gt';
    case 'outlook': return 'div[data-testid="MessageHeader"]';
    case 'yahoo': return 'div.Y0UMc';
    default: return null;
  }
}

// ── Heuristic scoring ────────────────────────────────────
// An image is likely a tracking pixel if it matches 2+ of these signals.

function scoreDimension(img) {
  // Check HTML attributes
  const w = parseInt(img.getAttribute('width'), 10);
  const h = parseInt(img.getAttribute('height'), 10);
  if (!isNaN(w) && !isNaN(h) && w <= 3 && h <= 3) return true;

  // Check computed dimensions
  const rect = img.getBoundingClientRect();
  if (rect.width <= 3 && rect.height <= 3 && rect.width > 0) return true;

  return false;
}

function scoreVisibility(img) {
  const style = getComputedStyle(img);
  if (style.display === 'none') return true;
  if (style.visibility === 'hidden') return true;
  if (parseFloat(style.opacity) === 0) return true;

  // Offscreen positioning
  if (style.position === 'absolute' || style.position === 'fixed') {
    const rect = img.getBoundingClientRect();
    if (rect.right < 0 || rect.bottom < 0 || rect.left > window.innerWidth + 100) return true;
  }

  return false;
}

function scoreURL(src) {
  if (!src || src.startsWith('data:')) return false;

  let url;
  try { url = new URL(src); } catch (_) { return false; }

  // Check known tracker domains
  const host = url.hostname;
  if (TRACKER_DOMAINS.has(host)) return true;

  // Subdomain match (e.g. t.sendgrid.net matches sendgrid.net)
  for (const domain of TRACKER_DOMAINS) {
    if (host.endsWith('.' + domain) || host === domain) return true;
  }

  // Check tracking path patterns
  const path = url.pathname.toLowerCase();
  for (const pattern of TRACKING_PATHS) {
    if (path.includes(pattern)) return true;
  }

  // Check query params for pixel dimensions
  if (url.search.includes('width=1') && url.search.includes('height=1')) return true;

  return false;
}

function scoreContext(img) {
  // No alt text or empty alt
  const alt = img.getAttribute('alt');
  if (alt !== null && alt.trim() === '') {
    // Sole child of its container
    const parent = img.parentElement;
    if (parent && parent.children.length === 1 && parent.textContent.trim() === '') return true;
  }

  return false;
}

function isTrackingPixel(img) {
  let score = 0;
  if (scoreDimension(img)) score++;
  if (scoreVisibility(img)) score++;
  if (scoreURL(img.src)) score++;
  if (scoreContext(img)) score++;
  return score >= 2;
}

// ── Scanner ──────────────────────────────────────────────
function scanForTrackers(container) {
  if (!container || !isEnabled) return;

  const images = container.querySelectorAll('img:not([data-lovespark-blocked])');
  let blocked = 0;

  for (const img of images) {
    if (!img.src || img.src === BLANK_PIXEL) continue;

    if (isTrackingPixel(img)) {
      img.src = BLANK_PIXEL;
      img.dataset.lovesparkBlocked = 'true';
      img.removeAttribute('srcset');
      blocked++;
    }
  }

  if (blocked > 0) {
    reportBlocked(blocked);
    showBadge(container, blocked);
  }
}

// ── Visual indicator (shield badge) ──────────────────────
function showBadge(emailBody, count) {
  // Find the closest email container to place the badge near the sender
  const senderSelector = getSenderAreaSelector();
  if (!senderSelector) return;

  // Walk up from emailBody to find the email wrapper, then find sender area
  let emailWrapper = emailBody;
  for (let i = 0; i < 10; i++) {
    if (!emailWrapper.parentElement) break;
    emailWrapper = emailWrapper.parentElement;
    const sender = emailWrapper.querySelector(senderSelector);
    if (sender) {
      // Don't duplicate badges
      if (sender.querySelector('.lovespark-tracker-badge')) {
        const existing = sender.querySelector('.lovespark-badge-count');
        if (existing) {
          const prev = parseInt(existing.textContent, 10) || 0;
          existing.textContent = prev + count;
        }
        return;
      }

      const badge = document.createElement('span');
      badge.className = 'lovespark-tracker-badge';
      badge.title = `LoveSpark blocked ${count} tracking pixel${count !== 1 ? 's' : ''} in this email`;
      badge.textContent = '💌 ';
      const countSpan = document.createElement('span');
      countSpan.className = 'lovespark-badge-count';
      countSpan.textContent = count;
      badge.appendChild(countSpan);
      sender.appendChild(badge);
      return;
    }
  }
}

// ── MutationObserver ─────────────────────────────────────
function startObserver() {
  if (observer) return;

  const bodySelector = getEmailBodySelector();
  if (!bodySelector) return;

  observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;

        // Direct match
        if (node.matches?.(bodySelector)) {
          scanForTrackers(node);
          continue;
        }

        // Check children
        const bodies = node.querySelectorAll?.(bodySelector);
        if (bodies) {
          bodies.forEach(body => scanForTrackers(body));
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function stopObserver() {
  if (!observer) return;
  observer.disconnect();
  observer = null;
}

// ── Settings propagation via storage.onChanged ───────────
browser.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.isEnabled === undefined) return;

  isEnabled = changes.isEnabled.newValue !== false;

  if (isEnabled) {
    init();
  } else {
    stopObserver();
  }
});

// ── Init ─────────────────────────────────────────────────
async function init() {
  try {
    const data = await browser.storage.local.get('isEnabled');
    isEnabled = data.isEnabled !== false;
  } catch (err) { console.warn('[lovespark-email-guard] init:', err); }

  if (!isEnabled) return;

  webmailType = detectWebmail();
  if (!webmailType) return;

  // Scan any already-loaded email bodies
  const bodySelector = getEmailBodySelector();
  if (bodySelector) {
    document.querySelectorAll(bodySelector).forEach(body => scanForTrackers(body));
  }

  startObserver();
}

init();
