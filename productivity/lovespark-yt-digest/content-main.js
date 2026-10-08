'use strict';

/**
 * MAIN world content script — intercepts JSON.parse to capture YouTube's
 * captionTracks data embedded in player responses.
 */

(function () {
  const CHANNEL = 'lovespark-yt-digest';
  const origParse = JSON.parse;

  JSON.parse = function (text) {
    const result = origParse.apply(this, arguments);

    try {
      if (result && typeof result === 'object') {
        extractCaptions(result);
      }
    } catch (_) {
      // Never break YouTube — silently ignore extraction errors
    }

    return result;
  };

  function extractCaptions(obj) {
    // Path: captions.playerCaptionsTracklistRenderer.captionTracks
    const renderer =
      obj?.captions?.playerCaptionsTracklistRenderer ||
      obj?.playerCaptionsTracklistRenderer;

    if (!renderer?.captionTracks?.length) return;

    const tracks = renderer.captionTracks.map(t => ({
      baseUrl: t.baseUrl,
      name: t.name?.simpleText || t.name?.runs?.[0]?.text || '',
      languageCode: t.languageCode,
      kind: t.kind || '',  // 'asr' = auto-generated
      vssId: t.vssId || '',
    }));

    // Extract video details if available
    const videoDetails = obj?.videoDetails;
    const detail = videoDetails ? {
      videoId: videoDetails.videoId,
      title: videoDetails.title,
      author: videoDetails.author,
      lengthSeconds: parseInt(videoDetails.lengthSeconds, 10) || 0,
      isLiveContent: videoDetails.isLiveContent || false,
    } : null;

    window.postMessage({
      source: CHANNEL,
      type: 'captionTracks',
      tracks,
      videoDetails: detail,
    }, '*');
  }
})();
