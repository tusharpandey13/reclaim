// Renders the frozen brand icon to the PNG sizes the install manifest needs. Run by hand when the icon changes: node scripts/make-icons.mjs
import { readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const out = new URL('../public/', import.meta.url);
const svg = readFileSync(new URL('reclaim-icon.svg', out), 'utf8');
const browser = await chromium.launch();
for (const [name, size, safe] of [['icon-180.png', 180, 1], ['icon-192.png', 192, 1], ['icon-512.png', 512, 1], ['icon-maskable-512.png', 512, 0.8]]) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<!doctype html><body style="margin:0;background:#111512;display:grid;place-items:center;height:100vh"><div style="width:${size * safe}px;height:${size * safe}px">${svg}</div></body>`);
  await page.screenshot({ path: new URL(name, out).pathname });
  await page.close();
}
await browser.close();
