// Screenshots of the demo for the README, from the dev server on invented data.
// usage: npm run dev (in another shell), then: node e2e/shots.mjs [OUTDIR]
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const out = process.argv[2] ?? '../../docs/img';
const base = process.env.BASE ?? 'http://127.0.0.1:5171/';
mkdirSync(out, { recursive: true });
const shots = [
  // [name, route, width, theme, fullPage]
  ['today-phone-light', 'today', 390, 'light', false],
  ['today-phone-dark', 'today', 390, 'dark', false],
  ['spend-phone-light', 'spend', 390, 'light', false],
  ['plan-phone-dark', 'plan', 390, 'dark', false],
  ['bills-phone-light', 'bills', 390, 'light', false],
  ['invest-phone-dark', 'invest', 390, 'dark', false],
  ['today-desktop-light', 'today', 1280, 'light', false],
  ['spend-desktop-dark', 'spend', 1280, 'dark', false],
];
const browser = await chromium.launch();
for (const [name, route, w, theme, full] of shots) {
  const phone = w < 1000;
  const ctx = await browser.newContext({ viewport: { width: w, height: phone ? 844 : 860 }, deviceScaleFactor: 2, colorScheme: theme, hasTouch: phone, isMobile: phone, serviceWorkers: 'block', timezoneId: 'Asia/Kolkata', locale: 'en-IN' });
  const page = await ctx.newPage();
  await page.clock.setFixedTime(new Date('2026-11-18T18:00:00+05:30'));
  await page.addInitScript((t) => localStorage.setItem('reclaim-theme', t), theme);
  await page.goto(`${base}#/${route}`);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/${name}.png`, fullPage: full });
  console.log(name);
  await ctx.close();
}
await browser.close();
