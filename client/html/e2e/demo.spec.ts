/** The demo, end to end: every page renders the invented data in fake/, under hash routes, with no errors and nothing off the page. */
import { expect, test } from '@playwright/test';

const PAGES = ['today', 'spend', 'spending', 'names', 'bills', 'invest', 'plan', 'reports', 'flatmates', 'sources'];
// The invented snapshot is as of this day; a fixed clock keeps "updated ... ago" wording stable.
const AS_OF = new Date('2026-11-18T18:00:00+05:30');

for (const width of [390, 1280]) {
  for (const page of PAGES) {
    test(`${page} at ${width} px renders the demo data`, async ({ page: p }) => {
      const errors: string[] = [];
      p.on('pageerror', (e) => errors.push(e.message));
      await p.clock.setFixedTime(AS_OF);
      await p.setViewportSize({ width, height: width >= 1000 ? 860 : 844 });
      await p.goto(`./#/${page}`);
      await expect(p.locator('main')).toBeVisible();
      await expect(p.locator('main')).not.toBeEmpty();
      await expect(p.getByText(/damaged|could not be read|cannot reach/i)).toHaveCount(0);
      const overflow = await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });
  }
}

test('Today answers the headline question', async ({ page }) => {
  await page.clock.setFixedTime(AS_OF);
  await page.goto('./#/today');
  await expect(page.locator('main h1').first()).toBeVisible();
  await expect(page.locator('main')).toContainText('₹');
});

test('an unknown route falls back to Today', async ({ page }) => {
  await page.clock.setFixedTime(AS_OF);
  await page.goto('./#/nowhere');
  await expect(page.locator('main')).toContainText('₹');
});
