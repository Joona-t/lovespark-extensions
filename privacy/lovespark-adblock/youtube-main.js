// Pink Ad Blocker — YouTube page-world ad remover (independent MIT implementation).
// Runs in the page's MAIN world at document_start, before YouTube's player code.
// It deletes the ad schedule from player data before the player reads it, so video
// ads never load. It never talks to the network or to chrome.* — its only input is the
// html[data-lovespark-adblock] flag set by youtube-content.js (missing flag = on).
(function lovesparkYouTubeMain(win) {
  'use strict';

  const AD_KEYS = ['adPlacements', 'playerAds', 'adSlots', 'adBreakHeartbeatParams'];
  const AD_KIND_PREFIX = 'AD_PLACEMENT_KIND_';

  function enabled() {
    return win.document?.documentElement?.dataset?.lovesparkAdblock !== 'off';
  }

  function isObject(value) {
    return value !== null && typeof value === 'object';
  }

  function stripKeys(obj, removed) {
    if (!isObject(obj) || Object.isFrozen(obj)) return;
    for (const key of AD_KEYS) {
      if (key in obj) {
        delete obj[key];
        removed.push(key);
      }
    }
  }

  // Removes ad fields from a player response, wherever YouTube nests it:
  // top level, .playerResponse, or an array of { playerResponse } (the /next wrapper).
  function prunePlayerResponse(obj) {
    const removed = [];
    if (!isObject(obj)) return removed;
    stripKeys(obj, removed);
    stripKeys(obj.playerResponse, removed);
    if (Array.isArray(obj)) for (const item of obj) stripKeys(item?.playerResponse, removed);
    return removed;
  }

  // Shorts: drop feed entries YouTube marks as ads.
  function pruneReelEntries(obj) {
    if (!isObject(obj) || !Array.isArray(obj.entries) || Object.isFrozen(obj)) return 0;
    const before = obj.entries.length;
    obj.entries = obj.entries.filter((entry) => entry?.command?.reelWatchEndpoint?.adClientParams?.isAd !== true
      && entry?.command?.reelWatchEndpoint?.adClientParams?.isAd !== 'true');
    return before - obj.entries.length;
  }

  function pruneAny(obj) {
    if (!isObject(obj) || !enabled()) return obj;
    try {
      prunePlayerResponse(obj);
      pruneReelEntries(obj);
    } catch {
      // Never break the page: on any surprise, hand back the data as-is.
    }
    return obj;
  }

  // Wrap a native function with a Proxy so it keeps its native name/length/toString.
  function wrap(owner, name, after) {
    const original = owner?.[name];
    if (typeof original !== 'function') return;
    owner[name] = new Proxy(original, {
      apply(target, thisArg, args) {
        return after(Reflect.apply(target, thisArg, args), args, thisArg);
      },
    });
  }

  // 1) JSON.parse — covers responses read as text and parsed by YouTube's code.
  wrap(win.JSON, 'parse', (result) => pruneAny(result));

  // 2) Response.json() — covers fetch('/youtubei/v1/player' | '/next' | '/reel/...').
  wrap(win.Response?.prototype, 'json', (promise, _args, response) => {
    if (!/\/youtubei\/v1\/(player|next|reel|get_watch)/.test(response?.url || '')) return promise;
    return promise.then(pruneAny);
  });

  // 3) Ad placements that reach the player through a Map: neutralise their kind.
  wrap(win.Map?.prototype, 'set', (result, args) => {
    const value = args[1];
    if (isObject(value) && typeof value.kind === 'string' && value.kind.startsWith(AD_KIND_PREFIX) && enabled()) {
      try { value.kind = ''; } catch { /* frozen: leave it */ }
    }
    return result;
  });

  // 4) Inline page data: `var ytInitialPlayerResponse = {...}` assigns through this setter.
  function trapGlobal(name) {
    let stored;
    try {
      Object.defineProperty(win, name, {
        configurable: true,
        get() { return stored; },
        set(value) { stored = pruneAny(value); },
      });
    } catch {
      // Already defined non-configurably: the JSON/Response hooks still cover fetches.
    }
  }
  trapGlobal('ytInitialPlayerResponse');
  trapGlobal('ytInitialData');

  if (win.__LOVESPARK_TEST__) win.__lovesparkYt = { AD_KEYS, prunePlayerResponse, pruneReelEntries, pruneAny };
})(globalThis);
