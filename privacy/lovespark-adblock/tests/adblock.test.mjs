import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import test from 'node:test';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { convertList, lineToDNR } from '../scripts/build-rules.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const readJson = (path) => JSON.parse(readFileSync(join(ROOT, path), 'utf8'));

test('filter conversion preserves safe path rules, domains, types, and exceptions', () => {
  const block = lineToDNR('||ads.example/path/*$script,third-party,domain=example.com|~shop.example.com').rule;
  assert.equal(block.action.type, 'block');
  assert.equal(block.condition.urlFilter, '||ads.example/path/*');
  assert.deepEqual(block.condition.resourceTypes, ['script']);
  assert.equal(block.condition.domainType, 'thirdParty');
  assert.deepEqual(block.condition.initiatorDomains, ['example.com']);
  assert.deepEqual(block.condition.excludedInitiatorDomains, ['shop.example.com']);

  const allow = lineToDNR('@@||cdn.example/ads.js$image').rule;
  assert.equal(allow.action.type, 'allow');
  assert.ok(allow.priority > block.priority);
});

test('unsafe or unsupported filter operations fail closed', () => {
  for (const line of [
    'example.com##.ad',
    '/ad[sx]+/$script',
    '||example.com/a|b$script',
    '||example.com/ad.js$redirect=noopjs',
    '||example.com/ad.js$removeparam=utm_source',
  ]) assert.ok(lineToDNR(line).skip, line);
});

test('rule selection is deterministic, deduplicated, and budgeted', () => {
  const input = [
    '||b.example^$third-party',
    '||a.example^',
    '||a.example^',
    '@@||a.example/allowed.js$script',
    '/narrow/ad.js$script',
  ].join('\n');
  const first = convertList(input, 3);
  const second = convertList(input, 3);
  assert.deepEqual(first, second);
  assert.equal(first.rules.length, 3);
  assert.deepEqual(first.rules.map(({ id }) => id), [1, 2, 3]);
  assert.ok(first.rules.some(({ action }) => action.type === 'block'));
  assert.ok(convertList(input, 10).rules.some(({ action }) => action.type === 'allow'));
});

test('manifest wires the generated tiers and a narrow YouTube content layer', () => {
  const manifest = readJson('manifest.json');
  assert.equal(manifest.manifest_version, 3);
  assert.equal(manifest.version, '1.1.1');
  assert.equal(manifest.host_permissions, undefined);
  const resourceIds = new Set(manifest.declarative_net_request.rule_resources.map(({ id }) => id));
  for (const id of ['ruleset_ads', 'ruleset_easylist', 'ruleset_youtube', 'ruleset_tracking', 'ruleset_easyprivacy']) {
    assert.ok(resourceIds.has(id), id);
  }
  assert.equal(manifest.content_scripts.length, 2);
  assert.ok(manifest.content_scripts.every(({ matches }) => matches.every((match) => match.includes('youtube'))));
  const [mainWorld, isolated] = manifest.content_scripts;
  assert.deepEqual(mainWorld.js, ['youtube-main.js']);
  assert.equal(mainWorld.world, 'MAIN');
  assert.equal(mainWorld.run_at, 'document_start');
  assert.deepEqual(isolated.js, ['youtube-logic.js', 'youtube-content.js']);
  assert.ok(manifest.content_scripts.every(({ all_frames }) => all_frames === true));
  assert.ok(manifest.declarative_net_request.rule_resources.length <= 100);
  assert.ok(manifest.declarative_net_request.rule_resources
    .filter(({ id }) => id.includes('_extra_')).every(({ enabled }) => enabled === false));
});

test('the default core remains within the guaranteed 30k static-rule budget', () => {
  const manifest = readJson('manifest.json');
  let total = 0;
  for (const resource of manifest.declarative_net_request.rule_resources) {
    const rules = readJson(resource.path);
    assert.ok(rules.length > 0, resource.id);
    assert.equal(new Set(rules.map(({ id }) => id)).size, rules.length, resource.id);
    if (['ruleset_ads', 'ruleset_easylist', 'ruleset_youtube', 'ruleset_tracking', 'ruleset_easyprivacy', 'ruleset_annoyances', 'ruleset_fanboy_annoyances'].includes(resource.id)) {
      total += rules.length;
    }
  }
  assert.ok(total <= 30000, `all tiers use ${total} rules`);
  const maxBlockPriority = Math.max(...manifest.declarative_net_request.rule_resources.flatMap((resource) =>
    readJson(resource.path).filter(({ action }) => action.type === 'block').map(({ priority = 1 }) => priority)));
  assert.ok(maxBlockPriority < 100, `whitelist priority must beat block priority ${maxBlockPriority}`);
});

test('the package indexes every full-coverage ruleset and preserves more than 100k converted rules', () => {
  const manifest = readJson('manifest.json');
  const index = readJson('ruleset-index.json');
  const resourceIds = manifest.declarative_net_request.rule_resources.map(({ id }) => id).sort();
  assert.deepEqual(Object.keys(index).sort(), resourceIds);
  for (const resource of manifest.declarative_net_request.rule_resources) {
    assert.equal(index[resource.id].count, readJson(resource.path).length, resource.id);
  }
  const metadata = readJson('rules-metadata.json');
  assert.ok(metadata.sources.reduce((sum, source) => sum + source.emittedRules, 0) > 100000);
});

test('every packaged network rule stays inside the conservative DNR schema subset', () => {
  const manifest = readJson('manifest.json');
  const conditionKeys = new Set([
    'urlFilter', 'isUrlFilterCaseSensitive', 'resourceTypes', 'excludedResourceTypes',
    'domainType', 'initiatorDomains', 'excludedInitiatorDomains', 'requestDomains',
    'excludedRequestDomains',
  ]);
  for (const resource of manifest.declarative_net_request.rule_resources) {
    for (const rule of readJson(resource.path)) {
      assert.ok(Number.isInteger(rule.id) && rule.id > 0, resource.id);
      assert.ok(['block', 'allow'].includes(rule.action.type), resource.id);
      assert.equal(typeof rule.condition.urlFilter, 'string', resource.id);
      assert.ok(rule.condition.urlFilter.length > 0 && rule.condition.urlFilter.length <= 1024, resource.id);
      assert.ok(!/[^\x00-\x7F]/.test(rule.condition.urlFilter), resource.id);
      assert.ok(!rule.condition.urlFilter.startsWith('||*'), resource.id);
      assert.ok(Object.keys(rule.condition).every((key) => conditionKeys.has(key)), resource.id);
    }
  }
});

test('capacity planner enables supplements only when they fit and never exceeds 50 rulesets', () => {
  const context = { globalThis: {} };
  runInNewContext(readFileSync(join(ROOT, 'ruleset-planner.js'), 'utf8'), context);
  const planner = context.globalThis.LoveSparkRulesetPlanner;
  const manifest = readJson('manifest.json');
  const resources = manifest.declarative_net_request.rule_resources;
  const index = readJson('ruleset-index.json');
  const guaranteed = planner.select(index, resources, 'medium', 30000);
  assert.ok(guaranteed.used <= 30000);
  assert.ok(guaranteed.ids.every((id) => index[id].core));
  const expanded = planner.select(index, resources, 'strong', 150000);
  assert.ok(expanded.ids.some((id) => !index[id].core));
  assert.ok(expanded.used <= 150000);
  assert.ok(expanded.ids.length <= 50);
});

test('YouTube DNR blocks only ad-specific endpoints, not regular media playback', () => {
  const rules = readJson('rules-youtube.json');
  assert.ok(rules.some(({ condition }) => condition.urlFilter.includes('/youtubei/v1/player/ad_break')));
  assert.ok(rules.some(({ condition }) => condition.urlFilter.includes('/api/stats/ads')));
  assert.ok(rules.every(({ condition }) => !condition.urlFilter.includes('googlevideo.com')));
  assert.ok(rules.every(({ condition }) => !condition.urlFilter.endsWith('/youtubei/v1/player')));
});

test('generated coverage closes representative gaps in the old curated-only rules', () => {
  const curatedAds = new Set(readJson('rules-ads.json').map(({ condition }) => condition.urlFilter));
  const easylist = new Set(readJson('rules-easylist.json').map(({ condition }) => condition.urlFilter));
  const curatedTracking = new Set(readJson('rules-tracking.json').map(({ condition }) => condition.urlFilter));
  const easyprivacy = new Set(readJson('rules-easyprivacy.json').map(({ condition }) => condition.urlFilter));
  assert.equal(curatedAds.has('||ads.cc^'), false);
  assert.equal(easylist.has('||ads.cc^'), true);
  assert.equal(curatedTracking.has('||l2.io^'), false);
  assert.equal(easyprivacy.has('||l2.io^'), true);
});

function loadYouTubeLogic() {
  const context = { globalThis: {} };
  runInNewContext(readFileSync(join(ROOT, 'youtube-logic.js'), 'utf8'), context);
  return context.globalThis.LoveSparkYouTubeLogic;
}

test('YouTube page layer honors global disable and site allowlisting', () => {
  const logic = loadYouTubeLogic();
  assert.equal(logic.shouldActivate('www.youtube.com', { isEnabled: true, whitelistedDomains: [] }), true);
  assert.equal(logic.shouldActivate('www.youtube.com', { isEnabled: false, whitelistedDomains: [] }), false);
  assert.equal(logic.shouldActivate('music.youtube.com', { isEnabled: true, whitelistedDomains: ['youtube.com'] }), false);
  assert.equal(logic.shouldActivate('www.youtube.com', { isEnabled: true, whitelistedDomains: ['example.com'] }), true);
});

test('YouTube fallback clicks skip first and only seeks video inside an ad-showing player', () => {
  const logic = loadYouTubeLogic();
  let clicked = 0;
  const button = { disabled: false, click: () => { clicked += 1; } };
  const buttonPlayer = { querySelector: (selector) => selector === '.ytp-ad-skip-button-modern' ? button : null };
  assert.equal(logic.skipActiveAd({ querySelector: () => buttonPlayer }).action, 'button');
  assert.equal(clicked, 1);

  const video = { currentTime: 3, duration: 15 };
  const videoPlayer = { querySelector: (selector) => selector.includes('video') ? video : null };
  assert.equal(logic.skipActiveAd({ querySelector: () => videoPlayer }).action, 'seek');
  assert.equal(video.currentTime, 15);

  video.currentTime = 4;
  assert.equal(logic.skipActiveAd({ querySelector: () => null }).action, 'none');
  assert.equal(video.currentTime, 4);
});

function loadYouTubeMain(flag) {
  const window = {
    __LOVESPARK_TEST__: true,
    document: { documentElement: { dataset: flag ? { lovesparkAdblock: flag } : {} } },
  };
  const context = { globalThis: window, JSON: { parse: JSON.parse }, Map, Proxy, Reflect, Object, Array };
  window.JSON = context.JSON;
  window.Map = class extends Map {};
  window.Response = class { json() { return Promise.resolve(this.body); } };
  context.window = window;
  runInNewContext(readFileSync(join(ROOT, 'youtube-main.js'), 'utf8'), context);
  return window;
}

const playerFixture = () => ({
  playabilityStatus: { status: 'OK' },
  streamingData: { formats: [{ itag: 18 }] },
  videoDetails: { videoId: 'x' },
  adPlacements: [{ adPlacementRenderer: {} }],
  playerAds: [{}],
  adSlots: [{}],
  adBreakHeartbeatParams: 'abc',
});

test('YouTube pruner strips the ad schedule and keeps playback data', () => {
  const { __lovesparkYt: yt } = loadYouTubeMain();
  const top = playerFixture();
  assert.deepEqual([...yt.prunePlayerResponse(top)].sort(), ['adBreakHeartbeatParams', 'adPlacements', 'adSlots', 'playerAds']);
  assert.deepEqual(Object.keys(top).sort(), ['playabilityStatus', 'streamingData', 'videoDetails']);
  assert.deepEqual(top.streamingData, { formats: [{ itag: 18 }] });

  const nested = { playerResponse: playerFixture() };
  yt.prunePlayerResponse(nested);
  assert.equal(nested.playerResponse.adPlacements, undefined);
  const list = [{ playerResponse: playerFixture() }, { response: {} }];
  yt.prunePlayerResponse(list);
  assert.equal(list[0].playerResponse.playerAds, undefined);

  for (const odd of [null, 'str', 5, [], Object.freeze(playerFixture())]) assert.doesNotThrow(() => yt.pruneAny(odd));
  assert.deepEqual(yt.pruneAny({ a: 1 }), { a: 1 });
});

test('YouTube pruner drops Shorts ad entries only', () => {
  const { __lovesparkYt: yt } = loadYouTubeMain();
  const reel = { entries: [
    { command: { reelWatchEndpoint: { videoId: 'a' } } },
    { command: { reelWatchEndpoint: { adClientParams: { isAd: true } } } },
    { command: { reelWatchEndpoint: { videoId: 'b' } } },
  ] };
  assert.equal(yt.pruneReelEntries(reel), 1);
  assert.deepEqual(reel.entries.map((e) => e.command.reelWatchEndpoint.videoId), ['a', 'b']);
});

test('YouTube page hooks prune JSON.parse, inline globals and ad Map entries; off flag passes through', async () => {
  const on = loadYouTubeMain();
  assert.equal(on.JSON.parse(JSON.stringify(playerFixture())).adPlacements, undefined);
  on.ytInitialPlayerResponse = playerFixture();
  assert.equal(on.ytInitialPlayerResponse.adSlots, undefined);
  assert.equal(on.ytInitialPlayerResponse.videoDetails.videoId, 'x');
  const entry = { kind: 'AD_PLACEMENT_KIND_START' };
  new on.Map().set('k', entry);
  assert.equal(entry.kind, '');
  const response = Object.assign(new on.Response(), { url: 'https://www.youtube.com/youtubei/v1/player?x=1', body: playerFixture() });
  assert.equal((await response.json()).playerAds, undefined);
  const other = Object.assign(new on.Response(), { url: 'https://www.youtube.com/other', body: playerFixture() });
  assert.ok((await other.json()).playerAds);

  const off = loadYouTubeMain('off');
  assert.ok(off.JSON.parse(JSON.stringify(playerFixture())).adPlacements);
  const kept = { kind: 'AD_PLACEMENT_KIND_START' };
  new off.Map().set('k', kept);
  assert.equal(kept.kind, 'AD_PLACEMENT_KIND_START');
});

test('YouTube cosmetic CSS is always gated on the on/off flag', () => {
  const css = readFileSync(join(ROOT, 'youtube-content.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
  const selectors = css.split('{')[0] && css.match(/[^{}]+(?=\{)/g).flatMap((block) => block.split(',')).map((s) => s.trim()).filter(Boolean);
  assert.ok(selectors.length > 20);
  assert.ok(selectors.every((s) => s.startsWith('html[data-lovespark-adblock="on"]')), selectors.find((s) => !s.startsWith('html[')));
  assert.ok(selectors.some((s) => s.includes('ytd-enforcement-message-view-model')));
});
