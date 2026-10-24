'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  strippedToday: 0,
  strippedTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
};

const stats = LoveSparkStats.createAccumulator('strippedToday', 'strippedTotal',
  () => LoveSparkBadge.update('isEnabled', 'strippedToday'));

/* Tracking parameters to strip */
const TRACKING_PARAMS = [
  /* UTM */
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
  'utm_id', 'utm_source_platform', 'utm_creative_format', 'utm_marketing_tactic',
  /* Facebook / Meta */
  'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_ref', 'fb_source',
  /* Google */
  'gclid', 'gclsrc', 'dclid', 'gbraid', 'wbraid',
  /* Microsoft */
  'msclkid',
  /* HubSpot */
  'hsa_cam', 'hsa_grp', 'hsa_mt', 'hsa_src', 'hsa_ad', 'hsa_acc',
  'hsa_net', 'hsa_ver', 'hsa_la', 'hsa_ol', 'hsa_kw',
  /* Mailchimp */
  'mc_cid', 'mc_eid',
  /* General tracking */
  '_ga', '_gl', '_ke', 'igshid',
  // Generic names such as ref, feature, si and trk can be application inputs.
  // Preserve them unless a future domain-specific rule establishes their meaning.
];

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'strippedToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('strippedToday');
  await LoveSparkBadge.update('isEnabled', 'strippedToday');
});

/* Strip tracking params on navigation */
chrome.webNavigation.onBeforeNavigate.addListener(async (details) => {
  /* Only process main frame navigations */
  if (details.frameId !== 0) return;

  const data = await chrome.storage.local.get(['isEnabled']);
  if (data.isEnabled === false) return;

  let url;
  try {
    url = new URL(details.url);
  } catch (e) {
    return;
  }

  /* Skip non-http(s) URLs */
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  let stripped = 0;
  const params = new URLSearchParams(url.search);

  for (const param of TRACKING_PARAMS) {
    if (params.has(param)) {
      params.delete(param);
      stripped++;
    }
  }

  if (stripped > 0) {
    url.search = params.toString();
    const cleanUrl = url.toString();

    /* Only redirect if URL actually changed */
    if (cleanUrl !== details.url) {
      try {
        await chrome.tabs.update(details.tabId, { url: cleanUrl });
        stats.bump(stripped);
      } catch (e) {
        /* Tab may have closed */
      }
    }
  }
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('strippedToday');
      return chrome.storage.local.get(['strippedToday', 'strippedTotal', 'isEnabled']);
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'strippedToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
