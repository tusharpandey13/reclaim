/** The per-day line and the Line's coarse groups. Invented figures; every expected value is worked by hand in the comment beside it. */
import { describe, expect, it } from 'vitest';
import { groupOf, perDayLine, perDayRound, rollUp, type Projected } from './line';

const base = { soft: 25000, asOf: '2026-11-06', date: '2026-11-30', basis: 'salary' as const, early: false };

describe('per-day line under the hero', () => {
  it('rounds down, to ₹10 under ₹1,000 a day and to ₹50 above', () => {
    expect(perDayRound(347.8)).toBe(340);
    expect(perDayRound(999.99)).toBe(990);
    expect(perDayRound(1052.6)).toBe(1050);
    expect(perDayRound(1600)).toBe(1600);
    expect(perDayRound(-5)).toBe(0);
  });
  it('above the cushion: ₹65k on 30 Nov, today 6 Nov, is ₹40k over 25 days, ₹1,600 a day', () => {
    // 6 to 30 November, both counted: 25 days. 65,000 − 25,000 = 40,000; 40,000 / 25 = 1,600.
    const r = perDayLine({ ...base, m: 65000 });
    expect(r.kind).toBe('room');
    expect(r.days).toBe(25);
    expect(r.perDay).toBe(1600);
    expect(r.text).toBe('About ₹40k above your ₹25k soft cushion after usual spending: about ₹1,600 a day extra for the 25 days until salary.');
  });
  it('rounds the day figure to ₹50 above ₹1,000: ₹20k over 19 days is ₹1,050', () => {
    // 6 to 24 November: 19 days. 20,000 / 19 = 1,052.6, down to 1,050.
    expect(perDayLine({ ...base, m: 45000, date: '2026-11-24' }).perDay).toBe(1050);
  });
  it('rounds to ₹10 below ₹1,000: ₹8k over 23 days is ₹340', () => {
    // 6 to 28 November: 23 days. 8,000 / 23 = 347.8, down to 340.
    const r = perDayLine({ ...base, m: 33000, date: '2026-11-28' });
    expect(r.perDay).toBe(340);
    expect(r.text).toContain('about ₹340 a day extra for the 23 days until salary');
  });
  it('under the cushion: says how far, and no per-day figure', () => {
    const r = perDayLine({ ...base, m: 17000 });
    expect(r.kind).toBe('under');
    expect(r.perDay).toBeNull();
    expect(r.text).toBe('Nothing extra to spend before salary: this is about ₹8k under your ₹25k soft cushion.');
    expect(r.text).not.toMatch(/a day/);
    expect(perDayLine({ ...base, m: -17000 }).text).toContain('about ₹42k under your ₹25k soft cushion');
    expect(perDayLine({ ...base, m: 25000 }).text).toBe('Nothing extra to spend before salary: this is right at your ₹25k soft cushion.');
  });
  it('too early to tell, or no forecast: says so, with no number', () => {
    const early = perDayLine({ ...base, m: 68000, early: true });
    expect(early.kind).toBe('early');
    expect(early.text).not.toMatch(/₹|\d/);
    const none = perDayLine({ ...base, m: null });
    expect(none.kind).toBe('none');
    expect(none.text).not.toMatch(/₹|\d/);
  });
  it('salary date unknown: counts to the month end and says the date is not known', () => {
    // basis month_end, date 30 Nov: 25 days, 40,000 / 25 = 1,600.
    const r = perDayLine({ ...base, m: 65000, basis: 'month_end' });
    expect(r.text).toBe('About ₹40k above your ₹25k soft cushion after usual spending: about ₹1,600 a day extra for the 25 days to 30 Nov. Your salary date is not known.');
    expect(perDayLine({ ...base, m: 17000, basis: 'month_end' }).text).toContain('Nothing extra to spend before 30 Nov');
  });
  it('salary due today: one day, the whole amount above the cushion', () => {
    const r = perDayLine({ ...base, m: 26000, date: '2026-11-06' });
    expect(r.days).toBe(1);
    expect(r.perDay).toBe(1000);
    expect(r.text).toContain('about ₹1,000 a day extra for today, until salary');
  });
});

describe('the Line, rolled up by kind', () => {
  it('names each kind from the item kind first, then its category', () => {
    expect(groupOf('card_bill', 'Bills')).toBe('cards');
    expect(groupOf('card_bill_estimate', null)).toBe('cards');
    expect(groupOf('sip', null)).toBe('invest');
    expect(groupOf('rent', null)).toBe('rent');
    expect(groupOf('bill', 'Housing:Rent')).toBe('rent');
    expect(groupOf('bill', 'Bills:Subscriptions')).toBe('subs');
    expect(groupOf('bill', 'Bills:Phone')).toBe('bills');
    expect(groupOf('bill', 'Housing:Help')).toBe('bills');
    expect(groupOf('fixed', null)).toBe('bills');
  });
  it('one row per kind, its total, in the order each first falls due', () => {
    const p = (name: string, group: Projected<string>['group'], date: string, amount: number, range: { low: number; high: number } | null): Projected<string> =>
      ({ item: name, group, date, amount, h: range ? (range.high - range.low) / 2 : 0, range });
    const rows = rollUp([
      p('stream a', 'subs', '2026-11-20', 649, null),
      p('card a', 'cards', '2026-11-12', 12000, { low: 9000, high: 15000 }),
      p('stream b', 'subs', '2026-11-09', 199, null),
      p('card b', 'cards', '2026-11-18', 8000, { low: 4000, high: 12000 }),
      p('card c', 'cards', '2026-11-28', 1000, null),
      p('phone', 'bills', '2026-11-25', 399, null),
    ]);
    expect(rows.map((r) => r.label)).toEqual(['Subscriptions', 'Card bills', 'Other bills']); // first dates 9, 12, 25 Nov
    const [subs, cards, bills] = rows;
    expect(subs.items).toEqual(['stream a', 'stream b']);
    expect(subs.amount).toBe(848); // 649 + 199
    expect(subs.range).toBeNull();
    expect(subs.date).toBe('2026-11-09');
    expect(cards.amount).toBe(21000); // 12,000 + 8,000 + 1,000
    expect(cards.range).toEqual({ low: 14000, high: 28000 }); // 9,000 + 4,000 + 1,000; 15,000 + 12,000 + 1,000: a bill with no range counts as itself
    expect(cards.h).toBe(5000); // half-ranges 3,000, 4,000 and 0 add as variances: √(9,000,000 + 16,000,000) = 5,000
    expect(bills.amount).toBe(399);
  });
});
