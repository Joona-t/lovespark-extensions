// Deterministic web fixtures with the actual extension installed. The website/API
// responses are fixtures; Chrome storage, messaging, content scripts and DNR are real.
const {expect} = require('playwright/test');
const assert = require('node:assert/strict');
module.exports = async ({context, folder, id, manifest, result}) => {
  const name=folder.split('/').pop();
  const supported=['lovespark-link-cleaner','lovespark-reddit-promoted-block','anti-brainrot','i-dont-want-cookies','lovespark-popup-blocker','lovespark-retro-cursor','public-knowledge-unblocker','lovespark-adblock'];
  if(!supported.includes(name)) return;
  const pages=[];
  const api = manifest.action?.default_popup ? await context.newPage() : null;
  if(api) {pages.push(api); await api.goto(`chrome-extension://${id}/${manifest.action.default_popup}`);}
  const page=await context.newPage();pages.push(page);
  const errors=[]; page.on('pageerror', e=>errors.push(e.message));
  const set=async values=>api.evaluate(values=>chrome.storage.local.set(values),values);
  let body='<main id="normal">Article content remains visible</main>';
  let url='https://example.com/articles/current';
  if(name==='lovespark-link-cleaner') body+='<script>history.replaceState({audit:42},"","?utm_source=audit")</script><a id="relative" href="next?id=7&utm_source=audit">Next</a>';
  if(name==='lovespark-reddit-promoted-block') {url='https://www.reddit.com/';body+='<shreddit-ad-post id="ad">Promoted</shreddit-ad-post><article id="organic">Organic post</article>';}
  if(name==='anti-brainrot') {url='https://www.youtube.com/watch?v=abcdefghijk';body+='<ytd-comments id="comments">Comments</ytd-comments><video class="video-stream html5-main-video"></video>';}
  if(name==='i-dont-want-cookies') body+='<div id="onetrust-banner-sdk">Cookie banner</div>';
  if(name==='public-knowledge-unblocker') {url='https://www.nature.com/articles/audit';body='<meta name="citation_doi" content="10.1234/audit">'+body;}
  await context.route('https://**/*',async route=>{
    const req=route.request();
    if(req.url().startsWith('https://api.openalex.org/')) return route.fulfill({json:{title:'Audit paper',doi:'https://doi.org/10.1234/audit',primary_location:{is_oa:true,pdf_url:'https://repository.example/paper.pdf',source:{display_name:'Audit repository'}}},headers:{'access-control-allow-origin':'*'}});
    return route.fulfill({contentType:'text/html',body:'<!doctype html><html><head><title>Extension audit fixture</title></head><body>'+body+'</body></html>'});
  });
  const check=async(title, fn)=>{try{await fn();(result.scenarios||=[]).push({name:title,passed:true});}catch(e){(result.scenarios||=[]).push({name:title,passed:false,error:e.message});result.errors.push(`${title}: ${e.message}`);}};
  try {
    await page.goto(url);
    await page.waitForTimeout(350);
    if(name==='lovespark-link-cleaner') {
      await check('Link cleaning preserves relative destination',async()=>{await expect.poll(()=>page.locator('#relative').evaluate(a=>a.href)).toBe('https://example.com/articles/next?id=7');});
      await check('URL cleaning preserves application history state',async()=>{assert.deepEqual(await page.evaluate(()=>history.state),{audit:42});assert.equal(new URL(page.url()).search,'');});
      await check('Reused SPA links are cleaned after href changes',async()=>{await page.locator('#relative').evaluate(a=>a.href='/changed?utm_source=again&id=8');await expect.poll(()=>page.locator('#relative').evaluate(a=>a.href)).toBe('https://example.com/changed?id=8');});
    }
    if(name==='lovespark-reddit-promoted-block') await check('Reddit ads hide while organic posts remain',async()=>{
      await expect(page.locator('#ad')).toBeHidden();await expect(page.locator('#organic')).toBeVisible();
      await page.evaluate(()=>{const ad=document.createElement('shreddit-ad-post');ad.id='dynamic-ad';ad.textContent='Promoted';document.body.append(ad)});
      await expect(page.locator('#dynamic-ad')).toBeHidden();
    });
    if(name==='anti-brainrot') await check('YouTube comments restore when disabled',async()=>{
      await expect(page.locator('#comments')).toBeHidden();await set({masterToggle:false});await expect(page.locator('#comments')).toBeVisible();
    });
    if(name==='i-dont-want-cookies') await check('Cookie banner removal respects disabled state',async()=>{
      await expect(page.locator('#onetrust-banner-sdk')).toBeHidden();await expect(page.locator('#normal')).toBeVisible();
      await set({isEnabled:false});await expect(page.locator('#onetrust-banner-sdk')).toBeVisible();
      await page.reload();await expect(page.locator('#onetrust-banner-sdk')).toBeVisible();
      await set({isEnabled:true});await expect(page.locator('#onetrust-banner-sdk')).toBeHidden();
      await set({whitelistedDomains:['example.com']});await expect(page.locator('#onetrust-banner-sdk')).toBeVisible();
      await set({whitelistedDomains:[]});await expect(page.locator('#onetrust-banner-sdk')).toBeHidden();
    });
    if(name==='lovespark-popup-blocker') await check('Unsolicited popup blocked, disabled state restores it',async()=>{
      assert.equal(await page.evaluate(()=>window.open('https://example.org/')===null),true);
      await api.evaluate(()=>chrome.runtime.sendMessage({action:'setEnabled',enabled:false}));await page.waitForTimeout(150);
      const opened=context.waitForEvent('page',{timeout:3000});
      await page.evaluate(()=>{window.open('https://example.org/')});const popup=await opened;await popup.close();
    });
    if(name==='lovespark-retro-cursor') await check('Cursor style applies and is removed when disabled',async()=>{
      await expect.poll(()=>page.locator('body').evaluate(e=>getComputedStyle(e).cursor)).toContain('chrome-extension://');
      await api.locator('label').filter({has:api.locator('#cursorToggle')}).click();
      await expect.poll(()=>page.locator('body').evaluate(e=>getComputedStyle(e).cursor)).not.toContain('chrome-extension://');
    });
    if(name==='public-knowledge-unblocker') await check('DOI lookup renders an open-access result',async()=>{
      await expect(page.locator('#aaron-panel')).toContainText('Audit repository');
      await expect(page.locator('#aaron-panel a[href="https://repository.example/paper.pdf"]')).toBeAttached();
    });
    if(name==='lovespark-adblock') await check('Chromium DNR matches an advertising request',async()=>{
      const matched=await api.evaluate(()=>chrome.declarativeNetRequest.testMatchOutcome({url:'https://doubleclick.net/pagead/ads',type:'script',initiator:'https://example.com'}));
      assert.ok(matched.matchedRules.length>0);
    });
    await check('Content script has no uncaught exceptions',async()=>assert.deepEqual(errors,[]));
  } finally {await context.unrouteAll({behavior:'wait'});for(const p of pages) if(!p.isClosed()) await p.close();}
};
