'use strict';

importScripts('lib/lovespark-lifecycle.js');

const DEFAULTS = {
  enabled: true,
  bubbles: [],
  totalBubbles: 0,
  totalReviews: 0,
};

chrome.runtime.onInstalled.addListener(function() {
  LoveSparkLifecycle.initDefaults(DEFAULTS);
});

chrome.runtime.onStartup.addListener(function() {
  LoveSparkLifecycle.initDefaults(DEFAULTS);
});

LoveSparkLifecycle.setupMessageHandler(async function(msg) {
  if (msg.type === 'GET_BUBBLES') {
    var data = await chrome.storage.local.get(['bubbles', 'enabled']);
    return { bubbles: data.bubbles || [], enabled: data.enabled !== false };
  }

  if (msg.type === 'ADD_BUBBLE') {
    var data = await chrome.storage.local.get(['bubbles', 'totalBubbles']);
    var bubbles = data.bubbles || [];
    var bubble = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      front: msg.front,
      back: msg.back || '',
      source: msg.source || '',
      domain: msg.domain || '',
      created: Date.now(),
      nextReview: Date.now(),
      interval: 1,
      ease: 2.5,
      reps: 0,
    };
    bubbles.push(bubble);
    await chrome.storage.local.set({
      bubbles: bubbles,
      totalBubbles: (data.totalBubbles || 0) + 1,
    });
    return { ok: true, bubble: bubble };
  }

  if (msg.type === 'REVIEW_BUBBLE') {
    var data = await chrome.storage.local.get(['bubbles', 'totalReviews']);
    var bubbles = data.bubbles || [];
    var idx = bubbles.findIndex(function(b) { return b.id === msg.id; });
    if (idx === -1) return { ok: false };

    var b = bubbles[idx];
    var quality = msg.quality;

    // SM-2 algorithm
    if (quality >= 3) {
      if (b.reps === 0) {
        b.interval = 1;
      } else if (b.reps === 1) {
        b.interval = 6;
      } else {
        b.interval = Math.round(b.interval * b.ease);
      }
      b.reps++;
    } else {
      b.reps = 0;
      b.interval = 1;
    }

    b.ease = Math.max(1.3, b.ease + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02)));
    b.nextReview = Date.now() + b.interval * 24 * 60 * 60 * 1000;

    bubbles[idx] = b;
    await chrome.storage.local.set({
      bubbles: bubbles,
      totalReviews: (data.totalReviews || 0) + 1,
    });
    return { ok: true };
  }

  if (msg.type === 'DELETE_BUBBLE') {
    var data = await chrome.storage.local.get('bubbles');
    var bubbles = (data.bubbles || []).filter(function(b) { return b.id !== msg.id; });
    await chrome.storage.local.set({ bubbles: bubbles });
    return { ok: true };
  }

  if (msg.type === 'UPDATE_BUBBLE') {
    var data = await chrome.storage.local.get('bubbles');
    var bubbles = data.bubbles || [];
    var idx = bubbles.findIndex(function(b) { return b.id === msg.id; });
    if (idx === -1) return { ok: false };
    if (msg.front !== undefined) bubbles[idx].front = msg.front;
    if (msg.back !== undefined) bubbles[idx].back = msg.back;
    await chrome.storage.local.set({ bubbles: bubbles });
    return { ok: true };
  }

  return {};
});
