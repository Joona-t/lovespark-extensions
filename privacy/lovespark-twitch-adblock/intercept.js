/*
 * LoveSpark Twitch AdBlock — HLS Ad Segment Interception
 * MAIN world, document_start
 *
 * Overrides fetch (main thread + web workers) to strip ad segments
 * from Twitch's m3u8 playlists before the video player sees them.
 * Twitch uses server-side ad insertion (SSAI) — ads are stitched into
 * the HLS manifest as #EXT-X-DATERANGE tags with CLASS="twitch-stitched-ad".
 * Removing these + their media segments prevents the player from loading ads.
 */

(function() {
  'use strict';

  if (window.__lovespark_twitch_intercept__) return;
  window.__lovespark_twitch_intercept__ = true;

  // Ad break state — only dispatch event on false→true transition
  var inAdBreak = false;

  // ── M3U8 URL detection ──────────────────────────────────

  function isM3U8(url) {
    if (!url) return false;
    var s = typeof url === 'string' ? url : url.toString();
    return s.includes('.m3u8') || s.includes('usher.ttvnw.net') ||
           (s.includes('twitch.tv') && s.includes('/playlist'));
  }

  // ── Ad segment stripping ────────────────────────────────
  //
  // Twitch m3u8 ad structure:
  //   #EXT-X-DATERANGE:ID="stitched-ad-...",CLASS="twitch-stitched-ad",...
  //   #EXT-X-DISCONTINUITY
  //   #EXTINF:2.000,...
  //   https://...ad-segment.ts
  //   ...more ad segments...
  //   #EXT-X-DISCONTINUITY
  //   (stream resumes)
  //
  // Strategy: detect ad DATERANGE tags, enter "ad" state, skip all
  // EXTINF + segment URL pairs until a non-ad DATERANGE or end of
  // ad markers. Also strip SCTE35 and ad-boundary discontinuities.

  function stripAdSegments(text) {
    if (!text || text.indexOf('#EXTM3U') === -1) return { text: text, stripped: false };

    var lines = text.split('\n');
    var output = [];
    var inAd = false;
    var skipNextURL = false;
    var stripped = false;

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];

      // Ad start: DATERANGE with stitched-ad or advertisement class
      if (line.indexOf('#EXT-X-DATERANGE') !== -1) {
        if (line.indexOf('stitched-ad') !== -1 || line.indexOf('advertisement') !== -1) {
          inAd = true;
          stripped = true;
          continue;
        }
        // Non-ad DATERANGE = ad ended
        if (inAd) inAd = false;
      }

      // SCTE35 ad boundary markers
      if (line.indexOf('EXT-X-SCTE35') !== -1 || line.indexOf('SCTE35') !== -1) {
        stripped = true;
        continue;
      }

      if (inAd) {
        // Skip EXTINF tags (segment duration metadata)
        if (line.indexOf('#EXTINF') !== -1) {
          skipNextURL = true;
          continue;
        }
        // Skip the segment URL following an EXTINF
        if (skipNextURL && line.charAt(0) !== '#') {
          skipNextURL = false;
          continue;
        }
        // Skip discontinuity markers inside ad blocks
        if (line.indexOf('#EXT-X-DISCONTINUITY') !== -1) {
          continue;
        }
        // Skip bare segment URLs
        if (line.charAt(0) !== '#' && line.trim()) {
          continue;
        }
        // Skip other ad-only metadata
        continue;
      }

      output.push(line);
    }

    return { text: output.join('\n'), stripped: stripped };
  }

  // ── Enabled state (DOM flag bridge) ─────────────────────
  // content.js (ISOLATED world) sets data-lovespark-enabled="false" to disable.
  // Missing attribute = enabled. Only explicit "false" disables stripping.

  function isDisabled() {
    return document.documentElement.dataset.lovesparkEnabled === 'false';
  }

  // ── Fetch interception (main thread) ────────────────────

  var originalFetch = window.fetch;

  window.fetch = function() {
    var args = arguments;
    var url = typeof args[0] === 'string' ? args[0] : (args[0] && args[0].url);

    if (!isM3U8(url) || isDisabled()) return originalFetch.apply(this, args);

    return originalFetch.apply(this, args).then(function(response) {
      if (!response.ok) return response;
      var clone = response.clone();
      return clone.text().then(function(body) {
        var result = stripAdSegments(body);
        if (result.stripped) {
          if (!inAdBreak) {
            inAdBreak = true;
            try { document.dispatchEvent(new CustomEvent('lovespark-ad-stripped')); } catch (e) {}
          }
          return new Response(result.text, {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          });
        }
        inAdBreak = false;
        return response;
      });
    });
  };

  // ── Worker interception ─────────────────────────────────
  //
  // Twitch's video player fetches m3u8 playlists inside Web Workers.
  // Main-thread fetch override alone won't catch those requests.
  // Override the Worker constructor to inject our fetch patch via
  // importScripts — no sync XHR, handles all URL types.

  var OriginalWorker = window.Worker;

  // Worker fetch override — references isM3U8/stripAdSegments injected alongside it
  var workerFetchOverride = function() {
    var a = arguments;
    var u = typeof a[0] === 'string' ? a[0] : (a[0] && a[0].url);
    if (!isM3U8(u)) return _fetch.apply(this, a);
    return _fetch.apply(this, a).then(function(r) {
      if (!r.ok) return r;
      var c = r.clone();
      return c.text().then(function(t) {
        var result = stripAdSegments(t);
        if (result.stripped) return new Response(result.text, {
          status: r.status, statusText: r.statusText, headers: r.headers
        });
        return r;
      });
    });
  };

  // Generate worker patch from actual source functions (single source of truth)
  var workerPatch = '(function(){'
    + 'var _fetch=self.fetch;'
    + 'var isM3U8=' + isM3U8.toString() + ';'
    + 'var stripAdSegments=' + stripAdSegments.toString() + ';'
    + 'self.fetch=' + workerFetchOverride.toString() + ';'
    + '})();';

  window.Worker = function(url, options) {
    // Module workers don't support importScripts — pass through unpatched
    if (options && options.type === 'module') return new OriginalWorker(url, options);

    try {
      var href = url instanceof URL ? url.href : String(url);
      var src = workerPatch + '\nimportScripts(' + JSON.stringify(href) + ');';
      var blob = new Blob([src], { type: 'application/javascript' });
      var blobUrl = URL.createObjectURL(blob);
      return new OriginalWorker(blobUrl, options);
    } catch (e) {
      return new OriginalWorker(url, options);
    }
  };

  window.Worker.prototype = OriginalWorker.prototype;

})();
