import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';
const envText = readFileSync(
  '/home/nevalenti/source/nevalenti/TestCraft/e2e/.env',
  'utf-8',
);
const env = Object.fromEntries(
  envText
    .split('\n')
    .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
    .map((l) => {
      const i = l.indexOf('=');
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    }),
);
const BASE = 'http://localhost:3000';
const browser = await chromium.launch({ args: ['--no-sandbox'] });
const page = await (
  await browser.newContext({ viewport: { width: 1600, height: 1000 } })
).newPage();
await page.goto(BASE);
await page.waitForURL(/\/realms\/testcraft\/protocol\/openid-connect\/auth/, {
  timeout: 20000,
});
await page.locator('#username').fill(env.E2E_USERNAME);
await page.locator('#password').fill(env.E2E_PASSWORD);
await page.locator('#kc-login').click();
await page.waitForURL(BASE + '/**', { timeout: 20000 });
await page
  .locator('main')
  .first()
  .waitFor({ state: 'visible', timeout: 15000 });
await page
  .context()
  .addCookies([{ name: 'cookies-consent', value: 'true', url: BASE }]);
await page.reload();
await page
  .locator('main')
  .first()
  .waitFor({ state: 'visible', timeout: 15000 });

page.on('response', async (res) => {
  if (res.url().includes('5000') && res.url().includes('plan')) {
    console.log(res.request().method(), res.url(), res.status());
  }
});

await page.goto(BASE + '/projects');
await page.waitForTimeout(600);
(await page.locator('a[href^="/projects/"]').all())[0].click();
await page.waitForTimeout(800);

// find a nav link/button to test plans - inspect all clickable text
const allText = await page.locator('a,button').evaluateAll((els) =>
  els
    .map((e) => ({
      t: e.textContent?.trim(),
      tag: e.tagName,
      href: e.getAttribute('href'),
    }))
    .filter((x) => x.t),
);
console.log('nav items:', JSON.stringify(allText.slice(0, 20)));
