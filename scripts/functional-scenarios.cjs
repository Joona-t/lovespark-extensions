const assert = require('node:assert/strict');
const { expect } = require('playwright/test');
const toggles = {
  'lovespark-retro-cursor':'#cursorToggle', 'lovespark-adblock':'#main-toggle',
  'cozy-toolkit':'#master-toggle', 'i-dont-want-cookies':'#main-toggle',
  'anti-brainrot':'#masterToggle',
  'porn-blocker-rewire-brain':'#enableToggle', 'neurodivergent-reader':'#master-toggle',
  'lovespark-popup-blocker':'#toggle-enabled',
  'lovespark-link-cleaner':'#main-toggle',
};
module.exports = async function scenarios({page, context, folder, manifest, result}) {
  const name = folder.split('/').pop();
  result.scenarios ||= [];
  const check = async (name, run) => {
    try { await run(); result.scenarios.push({name, passed:true}); }
    catch(e) {result.scenarios.push({name, passed:false, error:e.message}); result.errors.push(`${name}: ${e.message}`);}
  };
  const trigger = page.locator('#themeToggle, #themeDropdownTrigger').first();
  if (await trigger.count()) await check('Theme selection and available persistence', async () => {
    await trigger.click();
    await page.locator('.theme-option[data-theme="dark"]').click({timeout:2000});
    await expect(page.locator('body')).toHaveClass(/theme-dark/);
    if (manifest.permissions?.includes('storage')) {
      await page.reload();
      await expect(page.locator('body')).toHaveClass(/theme-dark/);
    }
    await trigger.click();
    await page.locator('.theme-option[data-theme="retro"]').click();
  });
  if(toggles[name]) await check('Enable switch saves and restores both states', async () => {
    const input = page.locator(toggles[name]);
    const original = await input.isChecked();
    const label = page.locator('label').filter({has:input}).first();
    async function click() {
      if(await label.count()) await label.click(); else await input.click();
    }
    await click();
    if (name === 'porn-blocker-rewire-brain' && original) await page.locator('.pause-btn[data-minutes="5"]').click();
    await expect(input).toBeChecked({checked:!original});
    await page.waitForTimeout(200);
    await page.reload();
    await expect(input).toBeChecked({checked:!original});
    await click();
    await page.waitForTimeout(200);
    await page.reload();
    await expect(input).toBeChecked({checked:original});
  });
  if(name === 'lovespark-focus') await check('Timer start, pause, resume and reset', async () => {
    const read = () => page.evaluate(() => chrome.storage.local.get(['timerState']));
    await page.locator('#task-input').fill('Audit timer');
    await page.locator('#btn-start').click();
    await expect.poll(async () => (await read()).timerState).toBe('running');
    await page.reload();
    await expect(page.locator('#btn-start')).toContainText('Pause');
    await page.locator('#btn-start').click();
    await expect.poll(async () => (await read()).timerState).toBe('paused');
    await page.locator('#btn-start').click();
    await expect.poll(async () => (await read()).timerState).toBe('running');
    await page.locator('#btn-reset').click();
    await expect.poll(async () => (await read()).timerState).toBe('idle');
  });
  if(name === 'lovespark-notes') await check('Unicode note autosaves and survives reopening', async () => {
    const note='Audit note — café 🌸\nSecond line <script>plain text</script>';
    await page.locator('#noteContent').fill(note);
    await expect(page.locator('#saveStatus')).toContainText('saved');
    await page.reload();
    await expect(page.locator('#noteContent')).toHaveValue(note);
  });
  if(['dreamy-garden','lovespark-flappy-waifu'].includes(name)) await check('Play button opens a working game', async () => {
    const opened = context.waitForEvent('page');
    await page.locator('#play-btn').click();
    const game = await opened;
    const errors=[];game.on('pageerror', e=>errors.push(e.message));
    await game.waitForLoadState();
    await expect(game.locator('canvas').first()).toBeVisible();
    await game.keyboard.press('Space');
    await game.waitForTimeout(300);
    assert.deepEqual(errors,[]);
    await game.close();
  });
  if(name === 'focus-blossom') await check('Custom blocked site persists', async () => {
    await page.locator('#siteInput').fill('example.com');
    await page.locator('#addBtn').click();
    await expect(page.locator('body')).toContainText('example.com');
    await page.reload();
    await expect(page.locator('body')).toContainText('example.com');
  });
};
