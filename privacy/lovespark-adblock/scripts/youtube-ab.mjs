#!/usr/bin/env node
// Live A/B check: does Pink Ad Blocker stop YouTube video ads?
// Arm A = no extension (qualifies URLs that really serve ads), arm B = extension loaded.
// Usage: node scripts/youtube-ab.mjs [--arms=A,B] [--trials=1] [--secs=25] [--background]
// Dev-only (never shipped). Uses the installed Chrome via puppeteer-core (pipe transport,
// which is the supported way to load an unpacked extension in branded Chrome 137+).
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ROOT = resolve(join(dirname(fileURLToPath(import.meta.url)), '..'));
const CHROME = process.env.LOVESPARK_CHROME_BIN || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const arg = (name, fallback) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split('=')[1] ?? fallback;
const ARMS = arg('arms', 'A,B').split(',');
const TRIALS = Number(arg('trials', '1'));
const SECS = Number(arg('secs', '25'));
const BACKGROUND = process.argv.includes('--background');

const URLS = readFileSync(join(ROOT, 'tests/fixtures/yt-candidate-urls.txt'), 'utf8')
  .split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
  .slice(0, Number(arg('limit', '99')));

const wait = (ms) => new Promise((r) => setTimeout(r, ms));

// Runs in the page every 250 ms. Pure DOM reads; no interaction.
function probe() {
  const player = document.querySelector('#movie_player');
  const video = document.querySelector('#movie_player video');
  const r = window.ytInitialPlayerResponse;
  return {
    ad: !!player && (player.classList.contains('ad-showing') || player.classList.contains('ad-interrupting')),
    wall: !!document.querySelector('ytd-enforcement-message-view-model'),
    t: video ? video.currentTime : -1,
    paused: video ? video.paused : null,
    initAds: r ? ['adPlacements', 'playerAds', 'adSlots'].filter((k) => r[k] != null) : null,
    flag: document.documentElement.dataset.lovesparkAdblock || null,
  };
}

async function runArm(arm, trial) {
  const profile = mkdtempSync(join(tmpdir(), `ls-yt-${arm}-`));
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: false,
    pipe: true,
    userDataDir: profile,
    enableExtensions: arm === 'B' ? [ROOT] : false,
    args: ['--window-position=-2400,0', '--window-size=1280,800', '--autoplay-policy=no-user-gesture-required',
      '--mute-audio', '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding', '--disable-background-timer-throttling', '--no-first-run', '--no-default-browser-check', '--lang=en-US'],
  });
  const results = [];
  try {
    for (const url of URLS) {
      const page = await browser.newPage();
      const playerResponses = [];
      page.on('response', async (res) => {
        if (!/\/youtubei\/v1\/player/.test(res.url())) return;
        try { playerResponses.push(/"adPlacements"|"playerAds"|"adSlots"/.test(await res.text())); } catch { /* body gone */ }
      });
      let other = null;
      if (BACKGROUND) {
        await page.goto('about:blank');
      }
      const rec = { arm, trial, url, adMs: 0, firstAdAtMs: null, wall: false, maxT: 0, initAds: null, flag: null, error: null };
      try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        if (BACKGROUND) { other = await browser.newPage(); await other.goto('about:blank'); await other.bringToFront(); }
        const t0 = Date.now();
        let consentDone = false;
        while (Date.now() - t0 < SECS * 1000) {
          // Fresh EU profiles get a cookie-consent lightbox that blocks autoplay in BOTH arms. Reject it once.
          if (!consentDone) {
            for (const btn of await page.$$('ytd-consent-bump-v2-lightbox button').catch(() => [])) {
              if (/reject/i.test(await btn.evaluate((e) => e.innerText).catch(() => ''))) {
                await btn.click().catch(() => {}); consentDone = true; rec.consentRejected = true; break;
              }
            }
          }
          const p = await page.evaluate(probe).catch(() => null);
          if (p) {
            if (p.ad) { rec.adMs += 250; if (rec.firstAdAtMs == null) rec.firstAdAtMs = Date.now() - t0; }
            rec.wall ||= p.wall;
            if (!p.ad) rec.maxT = Math.max(rec.maxT, p.t);
            if (rec.initAds == null && p.initAds) rec.initAds = p.initAds;
            rec.flag = p.flag; rec.paused = p.paused; rec.lastT = p.t;
          }
          await wait(250);
        }
      } catch (e) { rec.error = String(e.message || e).slice(0, 200); }
      rec.networkAdResponses = playerResponses.filter(Boolean).length;
      rec.adSeen = rec.adMs > 0;
      results.push(rec);
      console.log(`[${arm}#${trial}] ${url.slice(-11)} adMs=${rec.adMs} initAds=${JSON.stringify(rec.initAds)} netAds=${rec.networkAdResponses} progress=${rec.maxT.toFixed(1)}s wall=${rec.wall} consent=${!!rec.consentRejected} paused=${rec.paused} lastT=${(rec.lastT ?? -1).toFixed(1)} flag=${rec.flag}${rec.error ? ` ERR ${rec.error}` : ''}`);
      await other?.close().catch(() => {});
      await page.close().catch(() => {});
    }
  } finally {
    await browser.close();
    rmSync(profile, { recursive: true, force: true });
  }
  return results;
}

const all = [];
for (let trial = 1; trial <= TRIALS; trial += 1) {
  for (const arm of ARMS) all.push(...await runArm(arm, trial));
}

// Qualify: a URL counts only if arm A actually showed an ad for it in the same trial.
const summary = {};
for (const arm of ARMS) {
  const rows = all.filter((r) => r.arm === arm);
  summary[arm] = {
    runs: rows.length,
    adSeen: rows.filter((r) => r.adSeen).length,
    walls: rows.filter((r) => r.wall).length,
    stalled: rows.filter((r) => r.maxT < 3).length,
    errors: rows.filter((r) => r.error).length,
  };
}
if (ARMS.includes('A') && ARMS.includes('B')) {
  const qualified = all.filter((r) => r.arm === 'A' && r.adSeen).map((r) => `${r.trial}|${r.url}`);
  const b = all.filter((r) => r.arm === 'B' && qualified.includes(`${r.trial}|${r.url}`));
  summary.blockRate = b.length ? (b.filter((r) => !r.adSeen).length / b.length) : null;
  summary.qualified = b.length;
}
console.log(JSON.stringify(summary, null, 2));
mkdirSync(join(ROOT, 'work'), { recursive: true });
const out = join(ROOT, 'work', `yt-ab-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
writeFileSync(out, JSON.stringify({ background: BACKGROUND, secs: SECS, summary, all }, null, 2));
console.log(`saved ${out}`);
