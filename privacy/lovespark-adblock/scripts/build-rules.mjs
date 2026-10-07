#!/usr/bin/env node
/*
 * Build-time only: convert maintained EasyList-family subscriptions into a
 * conservative subset of Chrome/Firefox MV3 declarativeNetRequest rules.
 *
 * The converter deliberately skips operations DNR cannot reproduce safely
 * (redirects, header/CSP changes, scriptlets and regular expressions). The
 * shipped extension never downloads lists or executes remote code.
 */
import { NetworkFilter } from '@ghostery/adblocker';
import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const isGeneratedResource = (id) => /^(ruleset_easylist|ruleset_easyprivacy|ruleset_fanboy_annoyances)(?:_extra_\d+)?$/.test(id);
const EXTRA_CHUNK_SIZE = 2500;

export const SOURCES = [
  {
    tier: 'ads', id: 'ruleset_easylist', path: 'rules-easylist.json',
    url: 'https://easylist.to/easylist/easylist.txt', budget: 22500, enabled: true,
  },
  {
    tier: 'tracking', id: 'ruleset_easyprivacy', path: 'rules-easyprivacy.json',
    url: 'https://easylist.to/easylist/easyprivacy.txt', budget: 6800, enabled: true,
  },
  {
    tier: 'annoyances', id: 'ruleset_fanboy_annoyances', path: 'rules-fanboy-annoyances.json',
    url: 'https://easylist.to/easylist/fanboy-annoyance.txt', budget: 200, enabled: false,
  },
];

const TYPE_MAP = {
  script: 'script', image: 'image', stylesheet: 'stylesheet', object: 'object',
  object_subrequest: 'object', xmlhttprequest: 'xmlhttprequest', xhr: 'xmlhttprequest',
  subdocument: 'sub_frame', frame: 'sub_frame', ping: 'ping', media: 'media',
  font: 'font', websocket: 'websocket', other: 'other', document: 'main_frame', doc: 'main_frame',
};

const UNSUPPORTED_OPTIONS = new Set([
  'badfilter', 'csp', 'elemhide', 'empty', 'extension', 'genericblock', 'generichide',
  'ghide', 'header', 'html', 'inline-font', 'inline-script', 'permissions', 'popup',
  'popunder', 'redirect', 'redirect-rule', 'removeheader', 'removeparam', 'rewrite',
  'shide', 'sitekey', 'specifichide', 'urltransform', 'webrtc',
]);

function cleanDomains(raw) {
  const included = [];
  const excluded = [];
  for (const item of raw.split('|')) {
    const negated = item.startsWith('~');
    const domain = (negated ? item.slice(1) : item).trim().toLowerCase();
    if (!/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)*[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(domain)) return null;
    (negated ? excluded : included).push(domain);
  }
  return { included: [...new Set(included)], excluded: [...new Set(excluded)] };
}

function normalizePattern(pattern) {
  if (!pattern || pattern.length > 1024 || /[^\x00-\x7F]/.test(pattern) || /\s/.test(pattern)) return null;
  if (pattern.startsWith('/') && pattern.endsWith('/') && pattern.length > 2) return null;
  if (pattern.startsWith('||*')) return null;
  let body = pattern;
  if (body.startsWith('||')) body = body.slice(2);
  else if (body.startsWith('|')) body = body.slice(1);
  if (body.endsWith('|')) body = body.slice(0, -1);
  if (body.includes('|')) return null;
  return pattern.replace(/\*{2,}/g, '*');
}

export function lineToDNR(rawLine, id = 1) {
  const line = rawLine.trim();
  if (!line || line.startsWith('!') || line.startsWith('[')) return { skip: 'metadata' };
  if (line.includes('##') || line.includes('#@#') || line.includes('#?#') || line.includes('#$#')) return { skip: 'cosmetic-or-scriptlet' };
  if (!NetworkFilter.parse(line)) return { skip: 'invalid-filter' };

  const isException = line.startsWith('@@');
  const body = isException ? line.slice(2) : line;
  const optionAt = body.indexOf('$');
  const pattern = normalizePattern(optionAt === -1 ? body : body.slice(0, optionAt));
  if (!pattern) return { skip: 'unsupported-pattern' };

  const condition = { urlFilter: pattern, isUrlFilterCaseSensitive: false };
  const includedTypes = [];
  const excludedTypes = [];
  let domainType;
  let priority = isException ? 10 : 1;
  const options = optionAt === -1 ? [] : body.slice(optionAt + 1).split(',').filter(Boolean);

  for (const rawOption of options) {
    const option = rawOption.trim();
    const negated = option.startsWith('~');
    const unsigned = negated ? option.slice(1) : option;
    const equalAt = unsigned.indexOf('=');
    const key = (equalAt === -1 ? unsigned : unsigned.slice(0, equalAt)).toLowerCase();
    const value = equalAt === -1 ? '' : unsigned.slice(equalAt + 1);

    if (TYPE_MAP[key]) {
      (negated ? excludedTypes : includedTypes).push(TYPE_MAP[key]);
    } else if (key === 'third-party' || key === '3p') {
      domainType = negated ? 'firstParty' : 'thirdParty';
    } else if (key === 'first-party' || key === '1p') {
      domainType = negated ? 'thirdParty' : 'firstParty';
    } else if (key === 'domain') {
      const domains = cleanDomains(value);
      if (!domains) return { skip: 'invalid-domain-option' };
      if (domains.included.length) condition.initiatorDomains = domains.included;
      if (domains.excluded.length) condition.excludedInitiatorDomains = domains.excluded;
    } else if (key === 'denyallow') {
      const domains = cleanDomains(value);
      if (!domains || domains.excluded.length) return { skip: 'invalid-denyallow-option' };
      if (domains.included.length) condition.excludedRequestDomains = domains.included;
    } else if (key === 'to') {
      const domains = cleanDomains(value);
      if (!domains) return { skip: 'invalid-to-option' };
      if (domains.included.length) condition.requestDomains = domains.included;
      if (domains.excluded.length) condition.excludedRequestDomains = domains.excluded;
    } else if (key === 'match-case') {
      condition.isUrlFilterCaseSensitive = !negated;
    } else if (key === 'important') {
      if (negated) return { skip: 'unsupported-negated-important' };
      priority = isException ? 10 : 2;
    } else if (key === 'all') {
      // No additional DNR condition required.
    } else if (UNSUPPORTED_OPTIONS.has(key) || equalAt !== -1) {
      return { skip: `unsupported-option:${key}` };
    } else {
      return { skip: `unknown-option:${key}` };
    }
  }

  if (includedTypes.length && excludedTypes.length) return { skip: 'mixed-resource-types' };
  if (includedTypes.length) condition.resourceTypes = [...new Set(includedTypes)];
  if (excludedTypes.length) condition.excludedResourceTypes = [...new Set(excludedTypes)];
  if (domainType) condition.domainType = domainType;

  return { rule: { id, priority, action: { type: isException ? 'allow' : 'block' }, condition } };
}

function scoreRule(rule) {
  const pattern = rule.condition.urlFilter;
  let score = 0;
  if (/^\|\|[a-z0-9.-]+\^?$/.test(pattern)) score += 10000;
  if (rule.condition.domainType === 'thirdParty') score += 2000;
  if (rule.condition.initiatorDomains) score += 1000;
  return score + Math.max(0, 500 - pattern.length);
}

export function convertList(text, budget) {
  const skipped = {};
  const candidates = [];
  const seen = new Set();
  for (const rawLine of text.split(/\r?\n/)) {
    const result = lineToDNR(rawLine);
    if (!result.rule) {
      skipped[result.skip] = (skipped[result.skip] || 0) + 1;
      continue;
    }
    const key = `${result.rule.action.type}:${JSON.stringify(result.rule.condition)}`;
    if (seen.has(key)) continue;
    seen.add(key);
    candidates.push({ rule: result.rule, order: candidates.length });
  }
  const byScore = (a, b) => scoreRule(b.rule) - scoreRule(a.rule) || a.order - b.order;
  const allows = candidates.filter(({ rule }) => rule.action.type === 'allow').sort(byScore);
  const blocks = candidates.filter(({ rule }) => rule.action.type === 'block');
  const hostnameBlocks = blocks.filter(({ rule }) => /^\|\|[a-z0-9.-]+\^?$/.test(rule.condition.urlFilter)).sort(byScore);
  const specificBlocks = blocks.filter(({ rule }) => !/^\|\|[a-z0-9.-]+\^?$/.test(rule.condition.urlFilter)).sort(byScore);

  // Keep every exception when it is a modest share of the ruleset, but never let a small tier
  // become exception-only. Reserve space for path/generic filters instead of filling the whole
  // budget with alphabetically ordered ad-host domains.
  const selectedAllows = allows.slice(0, Math.floor(budget * 0.15));
  const blockBudget = budget - selectedAllows.length;
  const selectedHosts = hostnameBlocks.slice(0, Math.floor(blockBudget * 0.65));
  const selectedSpecific = specificBlocks.slice(0, blockBudget - selectedHosts.length);
  const selected = [...selectedAllows, ...selectedHosts, ...selectedSpecific];
  if (selected.length < budget) {
    const selectedSet = new Set(selected);
    selected.push(...[...hostnameBlocks, ...specificBlocks].filter((candidate) => !selectedSet.has(candidate)).slice(0, budget - selected.length));
  }
  const selectedSet = new Set(selected);
  const overflowRules = [...allows, ...hostnameBlocks, ...specificBlocks]
    .filter((candidate) => !selectedSet.has(candidate))
    .map(({ rule }) => rule);
  const rules = selected.map(({ rule }, index) => ({ ...rule, id: index + 1 }));
  return {
    rules,
    overflowRules,
    skipped,
    compatibleCount: candidates.length,
    selectedCounts: {
      allow: rules.filter(({ action }) => action.type === 'allow').length,
      hostnameBlock: rules.filter(({ action, condition }) => action.type === 'block' && /^\|\|[a-z0-9.-]+\^?$/.test(condition.urlFilter)).length,
      specificBlock: rules.filter(({ action, condition }) => action.type === 'block' && !/^\|\|[a-z0-9.-]+\^?$/.test(condition.urlFilter)).length,
    },
  };
}

async function fetchText(url) {
  const response = await fetch(url, { headers: { 'user-agent': 'LoveSpark-AdBlock-build/1.1' } });
  if (!response.ok) throw new Error(`fetch ${url} -> HTTP ${response.status}`);
  return response.text();
}

export async function build({ root = ROOT, fetcher = fetchText } = {}) {
  const manifestPath = join(root, 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const resources = manifest.declarative_net_request.rule_resources.filter(({ id }) => !isGeneratedResource(id));
  for (const filename of readdirSync(root)) {
    if (/^rules-(easylist|easyprivacy|fanboy-annoyances)(?:-extra-\d+)?\.json$/.test(filename)) unlinkSync(join(root, filename));
  }
  const rulesetIndex = {};
  const tierByCuratedId = {
    ruleset_ads: 'ads', ruleset_youtube: 'ads', ruleset_tracking: 'tracking', ruleset_annoyances: 'annoyances',
  };
  for (const resource of resources) {
    rulesetIndex[resource.id] = {
      tier: tierByCuratedId[resource.id], core: true,
      count: JSON.parse(readFileSync(join(root, resource.path), 'utf8')).length,
    };
  }
  const metadata = { generatedAt: new Date().toISOString(), sources: [] };

  for (const source of SOURCES) {
    const text = await fetcher(source.url);
    const { rules, overflowRules, skipped, compatibleCount, selectedCounts } = convertList(text, source.budget);
    writeFileSync(join(root, source.path), `${JSON.stringify(rules)}\n`);
    resources.push({ id: source.id, enabled: source.enabled, path: source.path });
    rulesetIndex[source.id] = { tier: source.tier, core: true, count: rules.length };

    for (let offset = 0, chunkNumber = 1; offset < overflowRules.length; offset += EXTRA_CHUNK_SIZE, chunkNumber += 1) {
      const chunk = overflowRules.slice(offset, offset + EXTRA_CHUNK_SIZE).map((rule, index) => ({ ...rule, id: index + 1 }));
      const id = `${source.id}_extra_${chunkNumber}`;
      const path = `rules-${source.path.slice(6, -5)}-extra-${chunkNumber}.json`;
      writeFileSync(join(root, path), `${JSON.stringify(chunk)}\n`);
      resources.push({ id, enabled: false, path });
      rulesetIndex[id] = { tier: source.tier, core: false, count: chunk.length };
    }
    metadata.sources.push({
      tier: source.tier, url: source.url,
      sha256: createHash('sha256').update(text).digest('hex'),
      sourceBytes: Buffer.byteLength(text), compatibleRules: compatibleCount,
      emittedRules: rules.length + overflowRules.length, coreRules: rules.length,
      supplementalRules: overflowRules.length, budget: source.budget, selectedCounts, skipped,
    });
    console.log(`${source.tier}: ${rules.length}/${compatibleCount} compatible rules from ${source.url}`);
  }

  manifest.declarative_net_request.rule_resources = resources;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  writeFileSync(join(root, 'rules-metadata.json'), `${JSON.stringify(metadata, null, 2)}\n`);
  writeFileSync(join(root, 'ruleset-index.json'), `${JSON.stringify(rulesetIndex, null, 2)}\n`);
  return metadata;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  build().catch((error) => { console.error(error); process.exitCode = 1; });
}
