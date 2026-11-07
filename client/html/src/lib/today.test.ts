/** Today's Tight readings. Invented figures; every expected value is worked by hand in the comment beside it. */
import { describe, expect, it } from 'vitest';
import { groupScale, rowMin, shortK1, spendingTrend, type MonthSpent } from './today';

const months = (vals: number[]): MonthSpent[] => vals.map((v, i) => ({ month: `2026-${String(i + 1).padStart(2, '0')}`, spent: v }));

describe('spending headline: lately against before', () => {
  it('up: the last 3 average ₹1,62,000 against a median of ₹1,18,000 for the 9 before', () => {
    // Before, Jan..Sep: 110k 112k 115k 117k 118k 120k 121k 125k 130k. Sorted, the 5th of 9 is 118,000: the median.
    // ± is half the range after dropping the lowest and highest: (125,000 − 112,000) / 2 = 6,500.
    // Lately, Oct..Dec: (172,000 + 152,000 + 162,000) / 3 = 162,000. 162,000 − 118,000 = 44,000, z = 44,000 / 6,500 ≈ 6.8 > 2: r3, up.
    const t = spendingTrend(months([110000, 112000, 115000, 117000, 118000, 120000, 121000, 125000, 130000, 172000, 152000, 162000]))!;
    expect(t.lately).toBe(162000);
    expect(t.from).toBe(118000);
    expect(t.before).toHaveLength(9);
    expect(t.recent.map((m) => m.month)).toEqual(['2026-10', '2026-11', '2026-12']);
    expect(t.step).toBe('r3');
    expect(t.dir).toBe('up');
  });
  it('held: lately within one ± of before is not called a rise', () => {
    // Before: 100k 104k 96k 102k 98k 100k. Sorted 96 98 100 100 102 104: median (100 + 100) / 2 = 100,000.
    // ± = (102,000 − 98,000) / 2 = 2,000 after the ends. Lately: (101k + 99k + 103k) / 3 = 101,000. Gap 1,000 is under the ₹2,000 floor: held.
    const t = spendingTrend(months([100000, 104000, 96000, 102000, 98000, 100000, 101000, 99000, 103000]))!;
    expect(t.from).toBe(100000);
    expect(t.lately).toBe(101000);
    expect(t.dir).toBe('held');
  });
  it('down: below by more than one ± and ₹2,000', () => {
    // Before: 90k 80k 85k. Median 85,000; ± over 3 values is the whole range: (90,000 − 80,000) / 2 = 5,000.
    // Lately: (70k + 72k + 68k) / 3 = 70,000. Gap −15,000, z = −3: g2, down.
    const t = spendingTrend(months([90000, 80000, 85000, 70000, 72000, 68000]))!;
    expect(t.from).toBe(85000);
    expect(t.lately).toBe(70000);
    expect(t.step).toBe('g2');
    expect(t.dir).toBe('down');
  });
  it('takes only the 9 months before the last 3, and sorts by month first', () => {
    // 13 months: the oldest (999,999) is dropped by the 12-month window; out-of-order input is put in order.
    const ms = months([999999, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 50000, 60000, 60000, 60000]).map((m, i) => ({ ...m, month: `20${25 + Math.floor((i + 1) / 13)}-${String(((i) % 12) + 1).padStart(2, '0')}` }));
    const t = spendingTrend([...ms].reverse())!;
    expect(t.before).toHaveLength(9);
    expect(t.before.every((m) => m.spent === 50000)).toBe(true);
    expect(t.lately).toBe(60000);
  });
  it('says nothing under 6 complete months', () => {
    expect(spendingTrend(months([1, 2, 3, 4, 5]))).toBeNull();
  });
});

describe('a group on its own scale', () => {
  it('centre is the usual, the band ±1 spread, the ends ±3', () => {
    // At the median: 50%. One spread over: 50 + 50/3 = 66.7%. One under: 33.3%.
    expect(groupScale(8000, 8000, 3700).at).toBe(50);
    expect(groupScale(11700, 8000, 3700).at).toBe(66.7);
    expect(groupScale(4300, 8000, 3700).at).toBe(33.3);
  });
  it('Food at ₹13,322 against a usual ₹8,000 ± ₹3,700 sits 1.44 spreads over, at 74%', () => {
    // Gap 5,322; z = 5,322 / 3,700 = 1.438; 50 + 1.438 × 16.67 = 73.97 → 74.0.
    const s = groupScale(13322, 8000, 3700);
    expect(s.gap).toBe(5322);
    expect(s.z).toBeCloseTo(1.438, 3);
    expect(s.at).toBe(74);
    expect(s.off).toBe(false);
  });
  it('a small group and rent read the same at the same z', () => {
    // Both are 2 spreads over: 50 + 2 × 16.67 = 83.3%.
    expect(groupScale(1400, 1000, 200).at).toBe(groupScale(70000, 50000, 10000).at);
    expect(groupScale(1400, 1000, 200).at).toBe(83.3);
  });
  it('past the ends the marker stays inside the track', () => {
    // Clamped to 2.9 spreads: 50 ± 2.9 × 16.67 = 98.3% and 1.7%.
    expect(groupScale(100000, 8000, 1000)).toMatchObject({ at: 98.3, off: true });
    expect(groupScale(0, 8000, 1000)).toMatchObject({ at: 1.7, off: true });
  });
});

describe('Timeline row heights by weight', () => {
  it('salary and rent tallest, subscriptions shortest', () => {
    expect(rowMin('salary')).toBe(84);
    expect(rowMin('rent')).toBe(80);
    expect(rowMin('subs')).toBe(44);
    const order = (['salary', 'rent', 'plan', 'end', 'everyday', 'today', 'cards', 'invest', 'bills', 'subs'] as const).map(rowMin);
    expect([...order].sort((a, b) => b - a)).toEqual(order);
  });
});

describe('one decimal under ₹10k', () => {
  it('₹5.3k, ₹8.0k, ₹950, ₹12k', () => {
    expect(shortK1(5322, true)).toBe('+₹5.3k');
    expect(shortK1(8000)).toBe('₹8.0k');
    expect(shortK1(-2450, true)).toBe('−₹2.5k');
    expect(shortK1(950)).toBe('₹950');
    expect(shortK1(12400)).toBe('₹12k');
  });
});
