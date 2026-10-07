#!/usr/bin/env node
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, rmSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(process.env.LOVESPARK_EXTENSION_DIR || join(dirname(fileURLToPath(import.meta.url)), '..'));
const CHROME = process.env.LOVESPARK_CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const profile = mkdtempSync(join(tmpdir(), 'lovespark-adblock-smoke-'));
let chrome;
let fixturePageServer;
let fixtureResourceServer;

const wait = (ms) => new Promise((resolveWait) => setTimeout(resolveWait, ms));

async function waitForDebuggerUrl(child) {
  return new Promise((resolveUrl, reject) => {
    let stderr = '';
    const timeout = setTimeout(() => reject(new Error(`Chrome debugging endpoint did not start: ${stderr}`)), 15000);
    child.stderr.on('data', (chunk) => {
      stderr += chunk;
      const match = stderr.match(/DevTools listening on (ws:\/\/127\.0\.0\.1:(\d+)\/[^\s]+)/);
      if (match) {
        clearTimeout(timeout);
        resolveUrl({ browserUrl: match[1], port: Number(match[2]) });
      }
    });
    child.once('exit', (code) => reject(new Error(`Chrome exited before validation (code ${code}): ${stderr}`)));
  });
}

async function waitForExtensionTarget(port) {
  let lastTargets = [];
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
    lastTargets = targets
      .filter(({ type, url }) => type === 'service_worker' && url.startsWith('chrome-extension://'));
    for (const target of lastTargets) {
      const candidate = await connect(target.webSocketDebuggerUrl);
      try {
        await candidate.call('Runtime.enable');
        const version = await evaluate(candidate, 'chrome.runtime?.getManifest?.().version');
        if (version === '1.1.0') return target;
      } catch {
        // Other built-in extension workers can expose similarly named scripts.
      } finally {
        candidate.close();
      }
    }
    await wait(100);
  }
  throw new Error(`LoveSpark service worker did not appear. Observed: ${lastTargets.map(({ url }) => url).join(', ') || 'none'}. Chrome 137+ branded builds ignore --load-extension; set LOVESPARK_CHROME_BIN to Chrome for Testing or Chromium.`);
}

async function connect(url) {
  const socket = new WebSocket(url);
  const pending = new Map();
  const listeners = new Set();
  let nextId = 1;
  socket.addEventListener('message', ({ data }) => {
    const message = JSON.parse(data);
    if (!message.id) {
      for (const listener of listeners) listener(message);
      return;
    }
    if (!pending.has(message.id)) return;
    const { resolve: resolveCall, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message)); else resolveCall(message.result);
  });
  await new Promise((resolveOpen, reject) => {
    socket.addEventListener('open', resolveOpen, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });
  return {
    async call(method, params = {}) {
      const id = nextId++;
      const result = new Promise((resolveCall, reject) => pending.set(id, { resolve: resolveCall, reject }));
      socket.send(JSON.stringify({ id, method, params }));
      return result;
    },
    onEvent(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    close: () => socket.close(),
  };
}

async function evaluate(client, expression) {
  const result = await client.call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
  return result.result.value;
}

async function listen(server) {
  await new Promise((resolveListen, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', resolveListen);
  });
  return server.address().port;
}

async function startFixture() {
  const hits = { ordinary: 0, ad: 0 };
  fixtureResourceServer = createServer((request, response) => {
    response.setHeader('Content-Type', 'application/javascript');
    if (request.url === '/a-ads.js') {
      hits.ad += 1;
      response.end('window.adFixtureLoaded = true;');
      return;
    }
    hits.ordinary += 1;
    response.end('window.ordinaryFixtureLoaded = true;');
  });
  const resourcePort = await listen(fixtureResourceServer);
  fixturePageServer = createServer((_request, response) => {
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.end(`<!doctype html><title>LoveSpark DNR fixture</title>
      <script>window.ordinaryFixtureLoaded=false;window.adFixtureLoaded=false;window.adFixtureErrored=false;</script>
      <script src="http://fixture.test:${resourcePort}/ordinary.js"></script>
      <script src="http://fixture.test:${resourcePort}/a-ads.js" onerror="window.adFixtureErrored=true"></script>`);
  });
  const pagePort = await listen(fixturePageServer);
  return { hits, url: `http://lovespark.test:${pagePort}/` };
}

async function connectPage(port) {
  const targets = await fetch(`http://127.0.0.1:${port}/json/list`).then((response) => response.json());
  const target = targets.find(({ type }) => type === 'page');
  assert.ok(target, 'Chrome page target must exist');
  const client = await connect(target.webSocketDebuggerUrl);
  await client.call('Runtime.enable');
  await client.call('Page.enable');
  await client.call('Network.enable');
  return client;
}

async function navigate(client, url) {
  await client.call('Page.navigate', { url });
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const state = await evaluate(client, 'document.readyState');
    if (state === 'complete') return;
    await wait(50);
  }
  throw new Error(`Page did not finish loading: ${url}`);
}

async function readFixture(client) {
  await wait(150);
  return evaluate(client, `({
    ordinaryLoaded: window.ordinaryFixtureLoaded === true,
    adLoaded: window.adFixtureLoaded === true,
    adErrored: window.adFixtureErrored === true
  })`);
}

async function testYouTubePlayback(client, url) {
  const network = { blocked: [], adRequests: [], mediaRequests: [], mediaFailures: [], mediaResponses: [] };
  const requestUrls = new Map();
  const stopListening = client.onEvent(({ method, params }) => {
    if (method === 'Network.requestWillBeSent') {
      requestUrls.set(params.requestId, params.request.url);
      if (/\/(?:api\/stats\/ads|pagead|ptracking|youtubei\/v1\/player\/ad_break)/i.test(params.request.url)) {
        network.adRequests.push(params.request.url);
      }
      if (/googlevideo\.com\/videoplayback/i.test(params.request.url)) network.mediaRequests.push(params.request.url);
    }
    if (method === 'Network.loadingFailed') {
      const requestUrl = requestUrls.get(params.requestId);
      if (requestUrl && /googlevideo\.com\/videoplayback/i.test(requestUrl)) {
        network.mediaFailures.push({ url: requestUrl, error: params.errorText, reason: params.blockedReason || null });
      }
      if (requestUrl && (params.blockedReason || /BLOCKED_BY_CLIENT/i.test(params.errorText || ''))) {
        network.blocked.push({ url: requestUrl, reason: params.blockedReason || params.errorText });
      }
    }
    if (method === 'Network.responseReceived' && /googlevideo\.com\/videoplayback/i.test(params.response.url)) {
      network.mediaResponses.push({ url: params.response.url, status: params.response.status, mimeType: params.response.mimeType });
    }
  });
  await client.call('Network.setCookie', {
    name: 'SOCS', value: 'CAI', domain: '.youtube.com', path: '/', secure: true,
  });
  await client.call('Page.navigate', { url });

  let before;
  let playRequested = false;
  for (let attempt = 0; attempt < 160; attempt += 1) {
    try {
      before = await evaluate(client, `(() => {
        const video = document.querySelector('video');
        const player = document.querySelector('.html5-video-player');
        return {
          title: document.title,
          hasVideo: Boolean(video),
          readyState: video?.readyState ?? 0,
          currentTime: video?.currentTime ?? 0,
          duration: video?.duration ?? null,
          paused: video?.paused ?? true,
          adShowing: player?.classList.contains('ad-showing') ?? false,
          pageLayerActive: document.documentElement.dataset.lovesparkAdblock === 'on'
        };
      })()`);
      if (before.hasVideo && !playRequested) {
        await evaluate(client, `(() => {
          const video = document.querySelector('video');
          video.muted = true;
          try { void video.play().catch(() => {}); return { ok: true }; }
          catch (error) { return { ok: false, error: String(error) }; }
        })()`);
        playRequested = true;
      }
      if (before.hasVideo && before.readyState >= 2 && Number.isFinite(before.duration) && before.duration > 0 && !before.adShowing) break;
    } catch {
      // The navigation can replace the execution context while polling.
    }
    await wait(250);
  }

  if (!before?.hasVideo || before.readyState < 2 || !Number.isFinite(before.duration) || before.duration <= 0) {
    stopListening();
    return { ok: false, before, network: summarizeNetwork(network) };
  }

  await wait(3000);
  const after = await evaluate(client, `(() => {
    const video = document.querySelector('video');
    const player = document.querySelector('.html5-video-player');
    return {
      currentTime: video?.currentTime ?? 0,
      readyState: video?.readyState ?? 0,
      paused: video?.paused ?? true,
      adShowing: player?.classList.contains('ad-showing') ?? false
    };
  })()`);
  stopListening();
  return {
    ok: after.readyState >= 2 && after.currentTime > before.currentTime + 1,
    before,
    after,
    network: summarizeNetwork(network),
  };
}

function summarizeNetwork(network) {
  const safeUrl = (url) => {
    const parsed = new URL(url);
    return `${parsed.origin}${parsed.pathname}`;
  };
  return {
    blocked: network.blocked.slice(0, 10).map(({ url, reason }) => ({ url: safeUrl(url), reason })),
    adRequestCount: network.adRequests.length,
    mediaRequestCount: network.mediaRequests.length,
    mediaHosts: [...new Set(network.mediaRequests.map((url) => new URL(url).hostname))].slice(0, 10),
    mediaFailures: network.mediaFailures.slice(0, 10).map(({ url, ...failure }) => ({ url: safeUrl(url), ...failure })),
    mediaResponses: network.mediaResponses.slice(0, 10).map(({ url, ...response }) => ({ url: safeUrl(url), ...response })),
  };
}

try {
  const chromeArgs = [
    ...(process.env.LOVESPARK_HEADFUL === '1' ? ['--window-position=-10000,-10000'] : ['--headless=new']),
    '--disable-gpu', '--no-first-run', '--no-default-browser-check',
    '--autoplay-policy=no-user-gesture-required',
    '--host-resolver-rules=MAP lovespark.test 127.0.0.1, MAP fixture.test 127.0.0.1',
    `--user-data-dir=${profile}`, `--disable-extensions-except=${ROOT}`, `--load-extension=${ROOT}`,
    '--remote-debugging-port=0', 'about:blank',
  ];
  chrome = spawn(CHROME, chromeArgs, { stdio: ['ignore', 'ignore', 'pipe'] });

  const { port } = await waitForDebuggerUrl(chrome);
  const target = await waitForExtensionTarget(port);
  const client = await connect(target.webSocketDebuggerUrl);
  await client.call('Runtime.enable');

  const evidence = await evaluate(client, `(async () => {
    const match = (url, type, initiator = 'https://example.com/') =>
      chrome.declarativeNetRequest.testMatchOutcome({ url, type, initiator });
    const initialEnabled = await chrome.declarativeNetRequest.getEnabledRulesets();
    const availableStaticRules = await chrome.declarativeNetRequest.getAvailableStaticRuleCount();
    const cases = {
      youtubeAdDecision: await match('https://www.youtube.com/youtubei/v1/player/ad_break?key=test', 'xmlhttprequest', 'https://www.youtube.com/watch?v=test'),
      youtubeAdTelemetry: await match('https://www.youtube.com/api/stats/ads?ver=2', 'ping', 'https://www.youtube.com/watch?v=test'),
      youtubeContentMedia: await match('https://r1---sn.test.googlevideo.com/videoplayback?id=content123&mime=video%2Fmp4', 'media', 'https://www.youtube.com/watch?v=test'),
      generalAd: await match('https://securepubads.g.doubleclick.net/tag/js/gpt.js', 'script'),
      generalTracker: await match('https://www.google-analytics.com/g/collect?v=2', 'ping'),
      ordinaryScript: await match('https://example.com/assets/application.js', 'script'),
    };
    await setEnabled(false);
    const disabledRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
    await applyIntensity('medium', true);
    const mediumRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
    await applyIntensity('strong', true);
    const strongRulesets = await chrome.declarativeNetRequest.getEnabledRulesets();
    await applyIntensity('medium', true);
    const allowResult = await handleMessage({ type: 'ADD_WHITELIST', domain: 'lovespark.test' });
    const allowRules = await chrome.declarativeNetRequest.getDynamicRules();
    return { version: chrome.runtime.getManifest().version, initialEnabled, availableStaticRules, cases, disabledRulesets, mediumRulesets, strongRulesets, allowResult, allowRules };
  })()`);

  const matched = (entry, rulesetId) => entry.matchedRules.some((rule) => !rulesetId || rule.rulesetId === rulesetId);
  assert.equal(evidence.version, '1.1.0');
  for (const id of ['ruleset_ads', 'ruleset_easylist', 'ruleset_youtube', 'ruleset_tracking', 'ruleset_easyprivacy']) {
    assert.ok(evidence.initialEnabled.includes(id), `initially enabled: ${id}`);
    assert.ok(evidence.mediumRulesets.includes(id), `medium enabled: ${id}`);
  }
  assert.equal(evidence.disabledRulesets.length, 0);
  assert.ok(matched(evidence.cases.youtubeAdDecision));
  assert.ok(matched(evidence.cases.youtubeAdTelemetry));
  assert.equal(evidence.cases.youtubeContentMedia.matchedRules.length, 0);
  assert.ok(matched(evidence.cases.generalAd));
  assert.ok(matched(evidence.cases.generalTracker));
  assert.equal(evidence.cases.ordinaryScript.matchedRules.length, 0);
  assert.deepEqual(evidence.allowResult, { ok: true });
  assert.ok(evidence.allowRules.some((rule) => rule.action.type === 'allowAllRequests' && rule.condition.requestDomains.includes('lovespark.test')));
  assert.ok(evidence.strongRulesets.length >= evidence.mediumRulesets.length);
  assert.ok(evidence.strongRulesets.length <= 50);

  const fixture = await startFixture();
  const page = await connectPage(port);
  await evaluate(client, `handleMessage({ type: 'REMOVE_WHITELIST', domain: 'lovespark.test' })`);
  await navigate(page, fixture.url);
  const blockedFixture = await readFixture(page);
  assert.deepEqual(blockedFixture, { ordinaryLoaded: true, adLoaded: false, adErrored: true });
  assert.deepEqual(fixture.hits, { ordinary: 1, ad: 0 });

  await evaluate(client, `handleMessage({ type: 'ADD_WHITELIST', domain: 'lovespark.test' })`);
  await navigate(page, `${fixture.url}?allowlisted=1`);
  const allowlistedFixture = await readFixture(page);
  assert.deepEqual(allowlistedFixture, { ordinaryLoaded: true, adLoaded: true, adErrored: false });
  assert.deepEqual(fixture.hits, { ordinary: 2, ad: 1 });

  await evaluate(client, `handleMessage({ type: 'REMOVE_WHITELIST', domain: 'lovespark.test' })`);
  await evaluate(client, 'setEnabled(false)');
  await navigate(page, `${fixture.url}?disabled=1`);
  const disabledFixture = await readFixture(page);
  assert.deepEqual(disabledFixture, { ordinaryLoaded: true, adLoaded: true, adErrored: false });
  assert.deepEqual(fixture.hits, { ordinary: 3, ad: 2 });
  await evaluate(client, 'setEnabled(true)');

  let youtubePlayback;
  if (process.env.LOVESPARK_YOUTUBE_URL) {
    if (process.env.LOVESPARK_YOUTUBE_NO_BLOCKING === '1') await evaluate(client, 'setEnabled(false)');
    youtubePlayback = await testYouTubePlayback(page, process.env.LOVESPARK_YOUTUBE_URL);
    if (process.env.LOVESPARK_YOUTUBE_ALLOW_FAILURE !== '1') {
      assert.equal(youtubePlayback.ok, true, `YouTube content playback did not progress: ${JSON.stringify(youtubePlayback)}`);
    }
    assert.equal(youtubePlayback.before.pageLayerActive, process.env.LOVESPARK_YOUTUBE_NO_BLOCKING !== '1');
  }
  page.close();

  console.log(JSON.stringify({
    chromeTarget: target.url,
    extensionVersion: evidence.version,
    initialEnabled: evidence.initialEnabled,
    availableStaticRules: evidence.availableStaticRules,
    matchedRules: Object.fromEntries(Object.entries(evidence.cases).map(([name, result]) => [name, result.matchedRules])),
    disableToggleRulesets: evidence.disabledRulesets,
    mediumToggleRulesets: evidence.mediumRulesets,
    strongToggleRulesets: evidence.strongRulesets,
    allowlistRuleCount: evidence.allowRules.length,
    actualRequestFixture: { blockedFixture, allowlistedFixture, disabledFixture, serverHits: fixture.hits },
    ...(youtubePlayback ? { youtubePlayback } : {}),
  }, null, 2));
  client.close();
} finally {
  chrome?.kill('SIGTERM');
  await wait(200);
  if (chrome && chrome.exitCode === null) chrome.kill('SIGKILL');
  fixturePageServer?.close();
  fixtureResourceServer?.close();
  rmSync(profile, { recursive: true, force: true });
}
