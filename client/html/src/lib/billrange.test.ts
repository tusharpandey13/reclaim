/** Bills' range chooser. All data is invented; expected values are worked by hand. */
import { describe, expect, it } from 'vitest';
import { hasEarlier, spanBilled, spanCal, spanLabel, spanMonths, type HistLine } from './billrange';

const lines: HistLine[] = [
  { name: 'Fibre', history: [{ month: '2026-09', amount: 100000 }, { month: '2026-10', amount: 100000 }, { month: '2026-11', amount: 120000 }] },
  { name: 'Rent', history: [{ month: '2026-10', amount: 5000000 }] },
  { name: 'Gym', history: [{ month: '2025-12', amount: 200000 }] },
];

describe('bill ranges', () => {
  it('covers the months that end the span, stepping back a whole span', () => {
    expect(spanMonths('2026-11', 'month', 0)).toEqual(['2026-11']);
    expect(spanMonths('2026-11', 'month', -1)).toEqual(['2026-10']);
    expect(spanMonths('2026-11', 'quarter', 0)).toEqual(['2026-09', '2026-10', '2026-11']);
    expect(spanMonths('2026-11', 'quarter', -1)).toEqual(['2026-06', '2026-07', '2026-08']);
    expect(spanMonths('2026-02', 'year', 0)[0]).toBe('2025-03');
  });
  it('labels and calendars a span', () => {
    expect(spanLabel(['2026-11'])).toBe('November 2026');
    expect(spanLabel(spanMonths('2026-11', 'quarter', 0))).toBe('Sep–Nov 2026');
    expect(spanLabel(spanMonths('2026-11', 'year', 0))).toBe('Dec 2025–Nov 2026');
    expect(spanCal(['2026-10'], 'month')).toBe('OCT');
    expect(spanCal([], 'quarter')).toBe('3M');
    expect(spanCal([], 'year')).toBe('Y');
  });
  it('totals each bill over the span, largest first, leaving out empty ones', () => {
    // Oct: Rent 50,000 + Fibre 1,000.
    expect(spanBilled(lines, ['2026-10'])).toEqual({ rows: [{ name: 'Rent', amount: 5000000, count: 1 }, { name: 'Fibre', amount: 100000, count: 1 }], total: 5100000 });
    // Sep to Nov: Rent 50,000; Fibre 1,000 + 1,000 + 1,200 = 3,200.
    expect(spanBilled(lines, spanMonths('2026-11', 'quarter', 0)).total).toBe(5320000);
    expect(spanBilled(lines, ['2026-01']).rows).toEqual([]);
  });
  it('allows a step back only while history reaches it', () => {
    expect(hasEarlier(lines, '2026-11', 'month', 0)).toBe(true);
    expect(hasEarlier(lines, '2026-11', 'month', -11)).toBe(false); // Before Dec 2025 there is nothing.
    expect(hasEarlier(lines, '2026-11', 'month', -10)).toBe(true); // Dec 2025 has the gym.
    expect(hasEarlier(lines, '2026-11', 'year', 0)).toBe(false);
    expect(hasEarlier([], '2026-11', 'month', 0)).toBe(false);
  });
});
