#!/usr/bin/env node
/*
 * build-rules.mjs — DEV-ONLY, build-time blocklist compiler. NOT shipped in the extension.
 * ─────────────────────────────────────────────────────────────────────────────────────────
 * Compiles community filter lists (EasyList / EasyPrivacy / AdGuard Base) into bundled static
 * declarativeNetRequest (DNR) rulesets, split to stay under Chrome MV3's caps. No runtime
 * network and no remote code — MV3-compliant and zero data collection (rule #10). Updating the
 * blocklist = re-run this, review the diff, bump the version, rebuild zips, resubmit.
 *
 *   Usage:   npm install            # installs @ghostery/adblocker (MPL-2.0) as a DEV dependency only
 *            npm run build:rules    # regenerates rules-*.json + manifest.rule_resources
 *
 * ⚠ VERIFY LOCALLY before committing generated rules: load unpacked, hit known ad/track domains,
 *   confirm the counter increments, spot-check for over-blocking (logins/players/payment widgets),
 *   and assert headroom with chrome.declarativeNetRequest.getAvailableStaticRuleCount().
 *
 * License posture: @ghostery/adblocker is MPL-2.0 and used here ONLY at build time to validate
 * filter syntax — it is never bundled, so the shipped extension stays MIT. The GENERATED rules are
 * derived from EasyList (GPL-3.0 + CC BY-SA 3.0): see ATTRIBUTION.md (mandatory, content license).
 *
 * Scope: converts hostname-anchored network rules (||domain^ and @@||domain^ exceptions) with their
 * resource-type / third-party / $domain options. Cosmetic (##), regex (/.../$), and path/generic
 * rules are intentionally SKIPPED (no content scripts here) and their counts are logged — never
 * silently dropped. Full-fidelity conversion (path/regex) is a documented future upgrade via
 * @ghostery/adblocker's native DNR conversion.
 */
import { NetworkFilter } from '@ghostery/adblocker';
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..'); // scripts/.. = extension root

// Tier -> upstream lists. Fetched at build time on YOUR machine/CI, never at runtime.
const LISTS = {
  ads: [
    'https://easylist.to/easylist/easylist.txt',
    'https://filters.adtidy.org/extension/chromium/filters/2.txt', // AdGuard Base
  ],
  tracking: ['https://easylist.to/easylist/easyprivacy.txt'],
  annoyances: ['https://easylist.to/easylist/fanboy-annoyance.txt'],
};

const ENABLED_CAP = 30000; // GUARANTEED_MINIMUM_STATIC_RULES across all ENABLED rulesets
const PER_FILE = 5000;     // keep each generated ruleset file readable
let   REGEX_BUDGET = 1000; // MAX_NUMBER_OF_REGEX_RULES (static+dynamic) — we emit none, but guard anyway

// Map filter $type option -> DNR resourceType.
const TYPE_MAP = {
  script: 'script', image: 'image', stylesheet: 'stylesheet', object: 'object',
  xmlhttprequest: 'xmlhttprequest', subdocument: 'sub_frame', ping: 'ping',
  media: 'media', font: 'font', websocket: 'websocket', other: 'other', document: 'main_frame',
};

// Parse a single filter LINE into a DNR rule, or return a skip reason.
// We read options from the raw text (not Ghostery internals) so the output is fully under our control.
function lineToDNR(line, id) {
  const isException = line.startsWith('@@');
  const body = isException ? line.slice(2) : line;
  const hashIdx = body.indexOf('$');
  const pattern = hashIdx === -1 ? body : body.slice(0, hashIdx);
  const opts = hashIdx === -1 ? '' : body.slice(hashIdx + 1);

  // Only clean hostname anchors: ||domain^  (optionally trailing ^). No paths, no regex, no wildcards mid-host.
  const m = /^\|\|([a-z0-9.-]+)\^?$/i.exec(pattern);
  if (!m) return { skip: 'non-hostname (path/regex/generic)' };

  const condition = { urlFilter: `||${m[1]}^` };
  const resourceTypes = [];
  let thirdParty = false;
  const initiator = [];
  const excludedInitiator = [];

  for (const raw of opts.split(',').filter(Boolean)) {
    const opt = raw.trim();
    if (opt === 'third-party' || opt === '3p') { thirdParty = true; continue; }
    if (opt === 'first-party' || opt === '1p') { continue; }
    if (opt.startsWith('domain=')) {
      for (const d of opt.slice(7).split('|')) {
        if (d.startsWith('~')) excludedInitiator.push(d.slice(1).toLowerCase());
        else if (d) initiator.push(d.toLowerCase());
      }
      continue;
    }
    const neg = opt.startsWith('~');
    const key = neg ? opt.slice(1) : opt;
    if (TYPE_MAP[key]) { if (!neg) resourceTypes.push(TYPE_MAP[key]); continue; }
    // Unsupported option (important, redirect, csp, popup, badfilter, etc.) -> skip to stay safe.
    return { skip: `unsupported option: ${key}` };
  }

  if (resourceTypes.length) condition.resourceTypes = [...new Set(resourceTypes)];
  if (thirdParty) condition.domainType = 'thirdParty';
  if (initiator.length) condition.initiatorDomains = initiator;
  if (excludedInitiator.length) condition.excludedInitiatorDomains = excludedInitiator;

  return {
    rule: {
      id,
      priority: isException ? 2 : 1, // exceptions beat blocks; whitelist allowAllRequests sits above at 2 too
      action: { type: isException ? 'allow' : 'block' },
      condition,
    },
  };
}

async function fetchList(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`fetch ${url} -> HTTP ${res.status}`);
  return res.text();
}

function convert(text, skips) {
  const rules = [];
  let id = 1;
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line || line.startsWith('!') || line.startsWith('[')) continue; // comment / list header
    if (line.includes('##') || line.includes('#@#') || line.includes('#?#')) { skips.cosmetic++; continue; }
    // Validate it is a real network filter Ghostery recognizes before we convert.
    if (!NetworkFilter.parse(line)) { skips.invalid++; continue; }
    const out = lineToDNR(line, id);
    if (out.skip) { skips.byReason[out.skip] = (skips.byReason[out.skip] || 0) + 1; skips.unsupported++; continue; }
    rules.push(out.rule);
    id++;
  }
  return rules;
}

function chunk(rules, size) {
  const out = [];
  for (let i = 0; i < rules.length; i += size) out.push(rules.slice(i, i + size));
  return out;
}

async function main() {
  const manifestPath = join(ROOT, 'manifest.json');
  const manifest = JSON.parse(await import('node:fs').then((fs) => fs.readFileSync(manifestPath, 'utf8')));
  const ruleResources = [];
  let enabledTotal = 0;
  const skips = { cosmetic: 0, invalid: 0, unsupported: 0, byReason: {} };

  for (const [tier, urls] of Object.entries(LISTS)) {
    const texts = await Promise.all(urls.map(fetchList));
    let rules = convert(texts.join('\n'), skips);

    // Deduplicate by stringified condition; re-number per file (DNR ids only need to be unique per ruleset).
    const seen = new Set();
    rules = rules.filter((r) => {
      const k = JSON.stringify(r.condition) + r.action.type;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });

    const enabled = tier !== 'annoyances'; // preserve current default (annoyances off)
    const files = chunk(rules, PER_FILE);
    files.forEach((fileRules, idx) => {
      fileRules.forEach((r, i) => { r.id = i + 1; });
      const path = `rules-${tier}-${idx + 1}.json`;
      writeFileSync(join(ROOT, path), JSON.stringify(fileRules, null, 2) + '\n');
      ruleResources.push({ id: `ruleset_${tier}_${idx + 1}`, enabled, path });
      if (enabled) enabledTotal += fileRules.length;
    });
    console.log(`${tier}: ${rules.length} rules -> ${files.length} file(s)${enabled ? '' : ' (disabled by default)'}`);
  }

  if (enabledTotal > ENABLED_CAP) {
    console.error(`\n✗ ${enabledTotal} enabled static rules exceeds the ${ENABLED_CAP} cap. Trim a list or move it to a disabled ruleset.`);
    process.exit(2);
  }

  // Regenerate the manifest's rule_resources (do not hand-edit).
  manifest.declarative_net_request = { rule_resources: ruleResources };
  writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

  console.log(`\nEnabled static rules: ${enabledTotal} / ${ENABLED_CAP}.`);
  console.log(`Skipped — cosmetic: ${skips.cosmetic}, invalid: ${skips.invalid}, unsupported: ${skips.unsupported}`);
  console.log('Top unsupported reasons:', Object.entries(skips.byReason).sort((a, b) => b[1] - a[1]).slice(0, 8));
  console.log('\n⚠ Update applyIntensity() in background.js to enable the new multi-file ruleset ids, then VERIFY on device.');
}

main().catch((err) => { console.error(err); process.exit(1); });
