/** Unit tests for the pure rules. All data is invented. */
import { readdirSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { ageWords, fc, heroParts, inr, pm, rangeEnds, roundMedian, roundUp1, short, ymAdd, dayLabel, daysInMonth } from './format';
import { greens, kind, ladder, medianSpread, shortfall, step, todaySays } from './status';
import { afford, canInvestMore, couldBy, placeSay, foldEvents, headline, investPace, series, slots, statuses, verdict, type PlanEvent, type PlanRec, type Row, type YearInputs } from './plan';
import { csv, csvCell, pdf } from './files';
import { cardId, cardRoute, parse } from './router';
import { cardAnswer } from '../pages/Bills';
import type { CardBill } from './data';
import { confidenceWord, doubtWord, evidence, isWide, dataAbout, dataBrief, dataLine, noBuildSince, parseSnapshot, readSources, readStatus, SnapshotError } from './data';
import { overlayCorrections, pendingCorrections, snapshotPlans, yearInputs } from './store';
import { pickIcon } from '../ui/kit';
import { layoutTreemap } from '../ui/charts';
import { blockAbove, blockHistory, blockMatch, buildTreemap, fixedSays, hueOf, rangeLabel } from '../pages/Spend';
import { drillHref, drillItems, parseDrill, payeeHash, payeeRows } from './drill';

const C = { soft: 25000, hard: 10000 };

describe('format', () => {
  it('groups in lakh and crore, with U+2212', () => {
    expect(inr(111111)).toBe('₹1,11,111');
    expect(inr(-5)).toBe('−₹5');
    expect(inr(1234567890)).toBe('₹1,23,45,67,890');
    expect(inr(7, true)).toBe('+₹7');
  });
  it('summarises under the rules', () => {
    expect(short(30000)).toBe('₹30k');
    expect(short(130000)).toBe('₹1.3 L');
    expect(short(2400000)).toBe('₹24 L');
    expect(short(17000000)).toBe('₹1.7 Cr');
    expect(short(1330000000)).toBe('₹133 Cr');
    expect(short(-40000)).toBe('−₹40k');
  });
  it('rounds the ± up to one figure', () => {
    expect(roundUp1(4300)).toBe(5000);
    expect(roundUp1(280)).toBe(300);
    expect(roundUp1(28000)).toBe(30000);
    expect(roundUp1(0)).toBe(0);
    expect(pm(4300)).toBe('5k');
    expect(pm(280)).toBe('300');
  });
  it('keeps two figures when the first digit is 1, so 1.1 L never prints as 2 L', () => {
    expect(pm(110000)).toBe('1.1 L');
    expect(pm(102000)).toBe('1.1 L');
    expect(roundUp1(110000)).toBe(110000);
    expect(pm(12000)).toBe('12k');
    expect(pm(210000)).toBe('3 L');
    expect(fc(50000, 110000)).toBe('₹50k, usually −₹60k to ₹1.6 L');
  });
  it('states the range from the ± as printed', () => {
    expect(rangeEnds(50400, 110000)).toEqual({ low: -60000, high: 160000 });
  });
  it('rounds the median by the ±', () => {
    expect(roundMedian(30400, 5000)).toBe(30000);
    expect(roundMedian(1149, 200)).toBe(1100);
  });
  it('prints a forecast, with no ±0', () => {
    expect(fc(30000, 5000)).toBe('₹30k, usually ₹25k–₹35k');
    expect(fc(30000, 0)).toBe('₹30k');
    expect(fc(1100, 200)).toBe('₹1,100, usually ₹900–₹1,300');
    expect(fc(130000, 5000)).toBe('₹1.3 L, usually ₹1.3 L–₹1.4 L');
    expect(heroParts(30000, 0).range).toBeNull();
    expect(fc(24000, 30000, true)).toBe('₹24k, usually ₹0–₹54k'); // Spending never below zero.
    expect(fc(24000, 30000)).toBe('₹24k, usually −₹6k to ₹54k'); // A balance may: that is overdrawn.
    expect(heroParts(-40000, 5000).neg).toBe(true);
  });
  it('walks months and dates with no zone in play', () => {
    expect(ymAdd('2026-11', 2)).toBe('2027-01');
    expect(ymAdd('2027-01', -1)).toBe('2026-12');
    expect(daysInMonth('2028-02')).toBe(29);
    expect(dayLabel('2026-11-16')).toBe('Mon 16 Nov');
  });
});

describe('status', () => {
  it('follows the table, first match wins', () => {
    expect(kind(25000, 0, C)).toBe('fits');
    expect(kind(25000, 15000, C)).toBe('just');
    expect(kind(25000, 16000, C)).toBe('could');
    expect(kind(24000, 0, C)).toBe('dip');
    expect(kind(10000, 0, C)).toBe('dip');
    expect(kind(9000, 0, C)).toBe('sell');
  });
  it('goes deep only past the share of liquid money', () => {
    expect(step('sell', 88000, 2500000)).toBe('r2');
    expect(step('sell', 130000, 2500000)).toBe('r3');
    expect(step('dip', 1000, 2500000)).toBe('r1');
    expect(step('just', 0, 2500000)).toBe('n');
    expect(step('could', 20000, 2500000)).toBe('n'); // D1, owner 2026-11-06: could is a possibility, ink and words, never red.
  });
  it('makes green earned: 12 month-ends, beating 10, top 3', () => {
    const h = [44444, 38888, 52222, 30000, 131111, 47777, 140000, 41111, 35555, 58888, 122222, 33333]; // The third highest is the bar: 10 of 12.
    expect(greens([130000], h.slice(0, 11))).toEqual([null]);
    expect(greens([120000], h)).toEqual([null]);
    expect(greens([130000], h)).toEqual(['g1']);
    expect(greens([300000], h)).toEqual(['g2']);
  });
  it('one shortfall serves every page', () => {
    expect(shortfall(6000, C)).toEqual({ toHard: 4000, toSoft: 19000 });
    expect(shortfall(50000, C)).toEqual({ toHard: 0, toSoft: 0 });
    expect(todaySays('sell', 6000, C).words).toContain('₹4k');
    expect(todaySays('dip', 19000, C).words).toContain('₹6k');
  });
  it('the ladder needs both z and a rupee floor', () => {
    expect(ladder(64000 + 1500, 64000, 500)).toBe('n');
    expect(ladder(80000, 64000, 6000)).toBe('r3');
    expect(ladder(71000, 64000, 6000)).toBe('r2');
    expect(ladder(69000, 64000, 6000)).toBe('r1');
    expect(ladder(55000, 64000, 6000)).toBe('g1');
    expect(ladder(50000, 64000, 6000)).toBe('g2');
    expect(medianSpread([])).toBeNull();
  });
});

const Y: YearInputs = {
  start: '2026-11', open: 111111, cashToday: 111111, firstSalary: 0, firstOutgo: 69544, firstSpread: 3901, takehome: 222222, outgo: 111111, outgoSpread: 11111,
  invest: 66666, essentials: null, bills: [{ ym: '2027-01', name: 'Insurance', amount: 44444 }], vests: [], sellVests: false,
  history: [], liquid: 2500000, holdings: { india: 1500000, us: 933324, safe: null },
};
const plan = (over: Partial<PlanRec>): PlanRec => ({ id: 'pln_1', rev: 1, title: 'Car', amount: 222222, ym: '2027-08', by: null, flex: 'any', spread: 1, status: 'planned', note: null, paid: 0, changedElsewhere: false, ...over });
const S = { soft: 25000, hard: 10000, invest: 66666, eq: 80 };

describe('plan', () => {
  it('folds events: undo is one more, a stale base_rev wins and is noted, a repeat eid changes nothing', () => {
    const at = '2026-11-03T09:00:00Z';
    const log: PlanEvent[] = [
      { v: 1, eid: 'a', at, op: 'create', id: 'pln_1', data: { title: 'Car', amount: 100, ym: '2027-01', flex: 'any', spread: 1, status: 'planned' } },
      { v: 1, eid: 'a', at, op: 'create', id: 'pln_1', data: { title: 'Other', amount: 1, ym: '2027-02' } },
      { v: 1, eid: 'b', at, op: 'update', id: 'pln_1', base_rev: 5, set: { ym: '2027-03' } },
      { v: 1, eid: 'c', at, op: 'status', id: 'pln_1', to: 'cancelled' },
      { v: 1, eid: 'd', at, op: 'set', set: { soft: 40000 } },
    ];
    const { plans, set } = foldEvents(log);
    expect(plans).toHaveLength(1);
    expect(plans[0]).toMatchObject({ title: 'Car', ym: '2027-03', status: 'cancelled', changedElsewhere: true, rev: 3 });
    expect(set.soft).toBe(40000);
  });
  it('spreads a plan in equal parts, odd rupees first', () => {
    const rows = series(Y, [plan({ amount: 100, ym: '2026-11', spread: 3 })], S);
    expect(rows.slice(0, 3).map((r) => r.items[0].amount)).toEqual([34, 33, 33]);
  });
  it('rolls a late plan into the first month, so it stays counted', () => {
    const rows = series(Y, [plan({ ym: '2026-09', amount: 500 })], S);
    expect(rows[0].items[0].amount).toBe(500);
  });
  it('row sums hold: open plus flows is end', () => {
    series(Y, [plan({})], S).forEach((r: Row, i, all) => {
      expect(r.end).toBe(r.open + r.salary + r.vestT - r.outgo - r.invest - r.setup - r.bills.reduce((t, b) => t + b.amount, 0) - r.items.reduce((t, x) => t + x.amount, 0));
      if (i) expect(r.open).toBe(all[i - 1].end);
    });
  });
  it('picks the earliest month that fits', () => {
    const { best, slots: all } = slots(Y, [], plan({ id: '__new' }), S);
    expect(best.v.kind).toBe('fits');
    expect(all.slice(0, best.i).every((o) => o.v.kind !== 'fits')).toBe(true);
  });
  it('disables months a spread would run past', () => {
    const { slots: all } = slots(Y, [], plan({ id: '__new', spread: 6 }), S);
    expect(all.filter((o) => !o.ok)).toHaveLength(5);
  });
  it('Sell equals the shared shortfall', () => {
    const rows = series({ ...Y, open: 20000, cashToday: 20000, firstOutgo: 10000, takehome: 1000 }, [], S);
    const v = verdict(rows, 0, C);
    expect(v.short).toBe(shortfall(v.at.end, C).toSoft);
    expect(statuses(rows, C, Y)[0].x).toBe(shortfall(rows[0].end, C).toSoft);
  });
  it('blames the newest expense on a tie', () => {
    const a = plan({ id: 'a', title: 'Phone', ym: '2027-06', amount: 20000 });
    const b = plan({ id: 'b', title: 'Boat', ym: '2027-06', amount: 9999999 });
    expect(headline(series(Y, [a, b], S), [a, b], C, Y).blame?.title).toBe('Boat');
  });
});

describe('files', () => {
  it('neutralises formulas and quotes', () => {
    for (const bad of ['=1+1', '+1', '-1', '@A1']) expect(csvCell(bad)).toMatch(/^'/);
    expect(csvCell('a,b')).toBe('"a,b"');
    expect(csvCell('say "hi"')).toBe('"say ""hi"""');
    expect(csvCell(-5)).toBe('-5');
    expect(csv([['a'], ['b']]).startsWith('﻿')).toBe(true);
  });
  it('makes a real PDF, one page per list, with no metadata', () => {
    const text = new TextDecoder().decode(pdf([['# Title', 'Rent: ₹5,000 (paid)'], ['Two']]));
    expect(text.startsWith('%PDF-')).toBe(true);
    expect(text.match(/\/Type \/Page\b/g)).toHaveLength(2);
    expect(text).not.toContain('Rs ');
    expect(text).toContain('(Rent: ) Tj /F3 10.5 Tf (R) Tj /F1 10.5 Tf (5,000 \\(paid\\)) Tj');
    expect(text).toContain('/Subtype /Type3');
    expect(text).toContain('<52> <20B9>');
    expect(text).not.toMatch(/Producer|Creator|Author/);
    expect(text.trim().endsWith('%%EOF')).toBe(true);
  });
});

describe('routes', () => {
  it('reads pages, sections and params; unknown goes to Today', () => {
    expect(parse('#/spend/month?m=2026-03')).toMatchObject({ page: 'spend', section: 'month' });
    expect(parse('#/spend/month?m=2026-03').params.get('m')).toBe('2026-03');
    expect(parse('#/nonsense').page).toBe('today');
    expect(parse('').page).toBe('today');
  });
  it('names a card the way the snapshot does, and a card bill links to it', () => {
    expect(cardId('Acme Card 0004')).toBe('acme-card-0004');
    expect(cardId('ZED  Bank 0042 ')).toBe('zed-bank-0042');
    expect(cardRoute('Acme Card 0004')).toBe('bills/acme-card-0004');
    expect(cardRoute(null)).toBe('bills');
    expect(parse('#/bills/acme-card-0004')).toMatchObject({ page: 'bills', section: 'acme-card-0004' });
  });
});

describe('card bill answers', () => {
  const card = (over: Partial<CardBill>): CardBill => ({ id: 'zed-0004', card: 'ZED 0004', label: null, account: 'Liabilities:Card:ZED:0004', brand: null, statement_date: '2026-10-25',
    due: 3000000, minimum_due: null, due_date: '2026-11-15', paid: 0, status: 'unpaid', paid_date: null, confidence: 'provisional', may_be_paid: null, payments: [], ...over });
  it('says paid with its date, part paid with what is left, and late in red', () => {
    expect(cardAnswer(card({ status: 'paid', paid: 3000000, paid_date: '2026-10-30', confidence: 'statement' }), '2026-11-08')).toMatchObject({ step: 'g1', says: 'ZED 0004 was paid on Fri 30 Oct', sub: '₹30,000 due 15 Nov' });
    expect(cardAnswer(card({ status: 'part_paid', paid: 1000000, paid_date: '2026-11-02' }), '2026-11-08')).toMatchObject({ step: 'r1', says: 'ZED 0004 is part paid: ₹20,000 left' });
    expect(cardAnswer(card({}), '2026-11-08')).toMatchObject({ step: 'n', says: 'ZED 0004 is not paid yet' });
    expect(cardAnswer(card({}), '2026-11-17').step).toBe('r2');
    expect(cardAnswer(card({}), '2026-11-22').step).toBe('r3');
    expect(cardAnswer(card({ status: 'unknown' }), '2026-11-08').says).toBe('We cannot tell if ZED 0004 was paid');
  });
});

describe('icons', () => {
  it('no brand logos ship: a server brand slug falls back to the category, and a name never picks a logo', () => {
    expect(pickIcon({ name: 'Swiggy', group: null })).toBe('circle-dashed');
    expect(pickIcon({ name: 'Anything', brand: 'swiggy', group: 'Food:Groceries' })).toBe('shopping-basket');
    expect(pickIcon({ name: 'Anything', brand: 'swiggy' })).toBe('circle-dashed');
    expect(pickIcon({ name: 'Zara Tailors' })).toBe('circle-dashed');
    expect(pickIcon({ name: 'Rent' })).toBe('house');
    expect(pickIcon({ name: 'X', group: 'Food:Groceries' })).toBe('shopping-basket');
    expect(pickIcon({ unnamed: true, brand: null })).toBe('circle-dashed');
  });
});

describe('investing a month, from what went in (D2)', () => {
  const C12 = Array.from({ length: 12 }, (_, i) => `${i < 2 ? 2025 : 2026}-${String(i < 2 ? 11 + i : i - 1).padStart(2, '0')}`); // 2025-11 to 2026-10
  const went = [
    { month: '2025-10', amount: 50000 }, // Before the 12 months: left out.
    { month: '2025-11', amount: 30000 },
    { month: '2026-01', amount: 12000 },
    { month: '2026-06', amount: 60000 },
    { month: '2026-07', amount: 18500 },
    { month: '2026-11', amount: 9999 }, // This month, not whole yet: left out.
  ];
  it('averages lumpy months over the 12 whole months before this one', () => {
    expect(C12[0]).toBe('2025-11');
    expect(C12[11]).toBe('2026-10');
    // 30,000 + 12,000 + 60,000 + 18,500 = 120,500 over 12 known months = 10,041.67, to the nearest 1,000.
    expect(investPace(went, C12, '2026-11')).toEqual({ monthly: 10000, months: 12, total: 120500 });
  });
  it('a month counts as known only if something went in or every source covers it', () => {
    // Covered May to October 2026 (6), plus November 2025 and January 2026, which had money in: 8 months. 120,500 / 8 = 15,062.5.
    expect(investPace(went, ['2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10'], '2026-11')).toEqual({ monthly: 15000, months: 8, total: 120500 });
  });
  it('says nothing with under 3 known months, rather than a silent figure', () => {
    expect(investPace([{ month: '2026-06', amount: 60000 }, { month: '2026-07', amount: 1000 }], [], '2026-11')).toBeNull();
  });
  it('Plan takes it out every month after this one, so the line no longer climbs by it', () => {
    const with0 = series(Y, [], { invest: 0 });
    const with10 = series(Y, [], { invest: 10000 });
    expect(with10[0].invest).toBe(0); // This month is the hero's figure, which plans no transfer.
    with10.forEach((r, i) => expect(with0[i].end - r.end).toBe(10000 * i));
  });
  it('the raise starts in the month after the last one below the soft cushion', () => {
    const rows = series({ ...Y, open: 20000, cashToday: 20000, firstOutgo: 0 }, [], { invest: 66666 });
    // Row 0 ends at 20,000, under 25,000 soft. Row 1: 20,000 + 222,222 − 111,111 − 66,666 = 64,445, and its low end clears the cushion.
    expect(rows[1].end).toBe(64445);
    expect(rows[1].end - rows[1].h).toBeGreaterThan(25000);
    expect(canInvestMore(rows, 25000).from).toBe('2026-12');
  });
});

describe('can I afford it (D3), held in memory', () => {
  it('reads from that month on, against the real plan, by hand', () => {
    const plans = [plan({ ym: '2027-08' })];
    const A = afford(Y, plans, S, 50000, '2026-12');
    // Row 0: 111,111 − 69,544 = 41,567. Row 1 without: 41,567 + 222,222 − 111,111 − 66,666 = 86,012; with 50,000 out: 36,012.
    expect(A.without.end).toBe(86012);
    expect(A.at.end).toBe(36012);
    // Its range: ceil(√(3,901² + 11,111²)) = 11,776, so the low end is 24,236: under the 25,000 soft cushion, over the 10,000 hard one.
    expect(A.at.h).toBe(11776);
    expect(A.v.kind).toBe('just');
    // January pays the 44,444 bill: 36,013, range ceil(√(3,901² + 2 × 11,111²)) = 16,191, low end 19,822, the lowest after.
    expect(A.v.low.ym).toBe('2027-01');
    expect(A.v.low.end - A.v.low.h).toBe(19822);
    expect(plans).toHaveLength(1); // Nothing joins the plan.
  });
  it('an amount that takes the month under the hard cushion says sell, with the shortfall to the soft one', () => {
    const A = afford(Y, [], S, 80000, '2026-12');
    expect(A.at.end).toBe(6012);
    expect(A.v.kind).toBe('sell');
    expect(A.v.short).toBe(18988); // 25,000 − 6,012
  });
});

describe('the fake snapshot', () => {
  const dir = resolve(import.meta.dirname, '../../fake');
  const name = readdirSync(dir).find((f) => f.startsWith('snapshot-v2'))!;
  const raw = JSON.parse(readFileSync(resolve(dir, name), 'utf8'));

  it('passes the precompiled validator', () => {
    expect(() => parseSnapshot(raw)).not.toThrow();
  });
  it('a bad one is refused, naming a path and no value', () => {
    const bad = JSON.parse(JSON.stringify(raw));
    bad.position.cash.value = 'CANARYZZ';
    let err: unknown;
    try {
      parseSnapshot(bad);
    } catch (e) {
      err = e;
    }
    expect(err).toBeInstanceOf(SnapshotError);
    expect(String(err)).not.toContain('CANARYZZ');
  });
  it('investing a month from the real build: 25,000 and 15,000 leave the bank every month in the world inputs', () => {
    const pace = investPace(raw.invest.contributions.map((c: { month: string; amount: { value: number } }) => ({ month: c.month, amount: c.amount.value / 100 })), raw.invest.put_in_source.covered_months, raw.plan_inputs.year.start);
    expect(pace).toEqual({ monthly: 40000, months: 12, total: 480000 });
  });
  it('the client engine matches the server rows, to the rupee', () => {
    const y = yearInputs(raw, raw.plan_inputs.year.invest / 100)!;
    const rows = series(y, snapshotPlans(raw), { invest: y.invest });
    (raw.plan_inputs.year.before_salary ?? raw.plan_inputs.year).rows.forEach((r: { month: string; end: number; spread: number }, i: number) => {
      expect(rows[i].ym).toBe(r.month);
      expect(rows[i].end).toBeCloseTo(r.end / 100, 1);
      expect(Math.abs(rows[i].h - r.spread / 100)).toBeLessThanOrEqual(1);
    });
  });
  it('the client rule matches the server on Likely left', () => {
    const f = raw.forecast;
    const c = { soft: raw.plan_inputs.cushions.soft / 100, hard: raw.plan_inputs.cushions.hard / 100 };
    expect(kind(f.likely_left.value / 100, f.likely_left.spread.variance / 100, c)).toBe(f.status.kind);
    const b = f.before_salary;
    const [m, h] = [b.figure.value / 100, b.figure.spread.variance / 100];
    expect(h > c.soft && m >= c.soft ? null : kind(m, h, c)).toBe(b.status.kind); // Too wide to say "could": isTooWide, facts_v2.too_wide.
    expect(b.date >= raw.meta.as_of).toBe(true);
  });
  it('a saved correction names and regroups, and no amount moves', () => {
    const item = raw.payees.review.items[0];
    const pending = pendingCorrections([{ id: 'c1', at: 'x', key: item.key, scope: item.scope, merchant: 'Ravi Stores', group: 'Food:Groceries' }], 0);
    const out = overlayCorrections(raw, pending);
    expect(out.payees.review.items.some((i: { key: string }) => i.key === item.key)).toBe(false);
    const sum = (s: typeof raw) => s.spend.days.flatMap((d: any) => d.items).reduce((t: number, i: any) => t + i.amount.value, 0);
    expect(sum(out)).toBe(sum(raw));
    const key = item.payments[0].key;
    const named = out.spend.days.flatMap((d: any) => d.items).find((i: any) => i.key === key);
    expect(named.name).toBe('Ravi Stores');
    expect(named.group).toBe('Food');
  });
  it('a revoked correction is as if never written', () => {
    const item = raw.payees.review.items[0];
    const pending = pendingCorrections([{ id: 'c1', at: 'x', key: item.key, scope: item.scope, merchant: 'Ravi' }, { id: 'c2', at: 'x', revoke: 'c1' }], 0);
    expect(overlayCorrections(raw, pending)).toBe(raw);
  });
});

describe('undo and treemap, as real data needs them', () => {
  const at = '2026-11-03T09:00:00Z';
  it('folds an undo of a new plan as cancelled and undone, and a real cancel as not undone', () => {
    const create = (id: string, eid: string) => ({ v: 1, eid, at, op: 'create', id, data: { title: 'Car', amount: 5, ym: '2027-01', flex: 'any', spread: 1, status: 'planned' } });
    const { plans } = foldEvents([create('pln_1', 'a'), { v: 1, eid: 'undo-b', at, op: 'status', id: 'pln_1', to: 'cancelled' }, create('pln_2', 'c'), { v: 1, eid: 'd', at, op: 'status', id: 'pln_2', to: 'cancelled' }] as never);
    expect(plans.map((p) => [p.status, !!p.undone])).toEqual([['cancelled', true], ['cancelled', false]]);
  });
  it('does not let a tiny payee swallow the biggest block', () => {
    const item = (n: string, v: number) => ({ n, v, sub: '', group: 'G' });
    const blocks = layoutTreemap([{ n: 'A', items: [item('NEW LAKSHMI TIFFIN CENTRE', 50000), item('TINY', 50)] }, { n: 'B', items: [item('Old Town Bakery', 20000), item('RAJ ELECTRICALS', 15000)] }], 320, 400);
    expect(blocks.map((b) => b.item.n)).toContain('NEW LAKSHMI TIFFIN CENTRE');
  });
  it('keeps unnamed money as one whole strip however little it is, with nothing clipped', () => {
    const item = (n: string, v: number, st?: string) => ({ n, v, sub: '', group: 'G', st });
    // ₹500 of ₹1,00,500 would be 2 px of a 400 px map: the floor makes it 64 px, full width, along the foot, and the rest fits above it.
    const blocks = layoutTreemap([{ n: 'A', items: [item('Food', 60000), item('Travel', 40000)] }, { n: 'U', items: [item('No name yet', 500, 'unk')] }], 320, 400);
    const unk = blocks.filter((b) => b.item.st === 'unk');
    expect(unk.length).toBe(1);
    expect([unk[0].x, unk[0].y, unk[0].w, unk[0].h]).toEqual([0, 336, 320, 64]);
    for (const b of blocks) if (b.item.st !== 'unk') expect(b.y + b.h).toBeLessThanOrEqual(336.01);
    // A quarter of the money takes a quarter of the map.
    expect(layoutTreemap([{ n: 'A', items: [item('Food', 75)] }, { n: 'U', items: [item('No name yet', 25, 'unk')] }], 320, 400).find((b) => b.item.st === 'unk')!.h).toBe(100);
    // Nothing but unnamed money: the whole map, one block.
    expect(layoutTreemap([{ n: 'U', items: [item('No name yet', 9, 'unk')] }], 320, 400)).toHaveLength(1);
  });
  it('blocks by kind of spending name who got it, and a kind\'s small neighbours merge under the kind', () => {
    const line = (name: string, value: number, group: string, category: string) => ({ key: name, name, date: '2026-10-01', group, category, brand: null, amount: { value } }) as never;
    const tree = buildTreemap([line('Zed Mart', 500000, 'Food', 'Food:Groceries'), line('Zed Corner', 300000, 'Food', 'Food:Groceries'), line('Zed Eats', 200000, 'Food', 'Food:Delivery'), line('Unnamed payment', 100000, 'Uncategorized', 'Uncategorized:NeedsReview')], new Set(), 'category');
    const food = tree.groups.find((g) => g.n === 'Food')!.items;
    expect(food.map((i) => [i.n, i.v, i.hint])).toEqual([['Groceries', 8000, 'Zed Mart'], ['Food delivery', 2000, 'Zed Eats']]);
    expect(food[0].sub).toContain('Most at Zed Mart ₹5,000, Zed Corner ₹3,000');
    expect(tree.list.map((p) => p.n)).toEqual(['Zed Mart', 'Zed Corner', 'Zed Eats']);
    expect(tree.groups.flatMap((g) => g.items).filter((i) => i.st === 'unk').map((i) => i.v)).toEqual([1000]);
  });
  it('says what a fixed cost did, in words, only as much as it knows', () => {
    const row = (state: string, amount: number, usual: number | null) => ({ state, amount, usual, month: '2026-10', date: '2026-10-05', usual_day: 5 }) as never;
    expect(fixedSays(row('changed', 64900, 49900))).toBe('Up to ₹649 in October. Usually ₹499.');
    expect(fixedSays(row('changed', 49900, 64900))).toBe('Down to ₹499 in October. Usually ₹649.');
    expect(fixedSays(row('twice', 1000000, 500000))).toBe('Paid twice for October: ₹10,000 in all. Usually ₹5,000.');
    expect(fixedSays(row('missing', 500000, 500000))).toBe('Not seen since 5 Oct. Usually ₹5,000, around the 5th.');
    expect(fixedSays(row('new', 500000, null))).toBe('First seen 5 Oct.');
  });
  it('never lays out a blank map, at any width, and every rupee stays on it', () => {
    let seed = 7;
    const rnd = () => (seed = (seed * 48271) % 2147483647) / 2147483647;
    const names = ['Food', 'NEW LAKSHMI TIFFIN CENTRE', 'SRI VENKATESHWARA PROVISION AND STORES', 'Zed', 'Old Town Bakery', 'RAJ ELECTRICALS', 'Everything else entirely', 'Tea'];
    const world = (groups: number, each: number, unnamed: boolean) => {
      const out = Array.from({ length: groups }, (_, g) => ({ n: `G${g}`, items: Array.from({ length: each }, (_, i) => ({ n: `${names[i % names.length]} ${g}${i}`, v: Math.ceil(rnd() ** 4 * 90000) + 1, sub: '', group: `G${g}` })) }));
      return unnamed ? [...out, { n: 'U', items: [{ n: 'No name yet', v: 500, sub: '', group: 'U', st: 'unk' }] }] : out;
    };
    for (const W of [1, 20, 60, 120, 200, 280, 320, 340, 390, 480, 640, 760, 1000, 1280, 1600]) {
      for (const H of [240, 400]) {
        for (const [groups, each] of [[1, 1], [1, 12], [3, 3], [8, 1], [8, 8], [12, 30]]) {
          for (const unnamed of [false, true]) {
            const g = world(groups, each, unnamed);
            const total = g.reduce((t, x) => t + x.items.reduce((s, i) => s + i.v, 0), 0);
            const blocks = layoutTreemap(g, W, H);
            expect(blocks.length, `${W}x${H} ${groups}/${each}`).toBeGreaterThan(0);
            expect(blocks.reduce((s, b) => s + b.item.v, 0), `${W}x${H} ${groups}/${each}`).toBe(total);
            for (const b of blocks) expect(Number.isFinite(b.x + b.y + b.w + b.h)).toBe(true);
            if (W >= 280) for (const b of blocks) if (b.item.st !== 'unk' && blocks.length > 2) expect(Math.min(b.w, b.h), `${W}x${H} ${groups}/${each} sliver`).toBeGreaterThanOrEqual(46);
          }
        }
      }
    }
  });
  describe('the rollup, on the shape of the owner\'s screen', () => {
    const c = (n: string, v: number, group: string) => ({ id: `cat:${n}`, n, v, sub: '', group, byCategory: true });
    // One kind holds over half. Eleven more across five groups, one really called Other shopping.
    const shape = () => [
      { n: 'Food', items: [c('Groceries', 15354, 'Food'), c('Eating out', 2100, 'Food'), c('Food delivery', 1500, 'Food')] },
      { n: 'Shopping', items: [c('Online shopping', 2000, 'Shopping'), c('Other shopping', 1300, 'Shopping')] },
      { n: 'Travel', items: [c('Local travel', 1800, 'Travel'), c('Fuel', 700, 'Travel')] },
      { n: 'Personal', items: [c('Personal care', 900, 'Personal'), c('Entertainment', 800, 'Personal')] },
      { n: 'Health', items: [c('Health care', 700, 'Health')] },
      { n: 'Bills', items: [c('Fees', 159, 'Bills'), c('Phone', 850, 'Bills')] },
    ];
    const total = 28163; // 18954 Food + 3300 Shopping + 2500 Travel + 1700 Personal + 700 Health + 1009 Bills.
    for (const [W, H] of [[328, 400], [358, 400], [370, 330], [448, 400], [760, 400]]) {
      it(`at ${W}x${H}: one rollup, no label twice, every rupee on the map, and more than the big block and the rest`, () => {
        const blocks = layoutTreemap(shape(), W, H);
        const names = blocks.map((b) => b.item.n);
        expect(new Set(names).size).toBe(names.length);
        expect(new Set(blocks.map((b) => b.item.id)).size).toBe(blocks.length);
        expect(blocks.filter((b) => b.item.parts).length).toBeLessThanOrEqual(1);
        expect(blocks.reduce((t, b) => t + b.item.v, 0)).toBe(total);
        expect(blocks.length).toBeGreaterThanOrEqual(4);
        const held = blocks.flatMap((b) => b.item.members ?? [b.item]);
        expect(held).toHaveLength(12); // Each kind is in exactly one block, so its See all can find it.
        for (const b of blocks) expect(Math.min(b.w, b.h)).toBeGreaterThanOrEqual(46);
      });
    }
    it('a rollup of one group named like a real kind takes that kind in, rather than print it twice', () => {
      const blocks = layoutTreemap([{ n: 'Food', items: [c('Groceries', 50000, 'Food'), c('Other food', 300, 'Food'), c('Tea', 200, 'Food'), c('Eggs', 100, 'Food')] }], 320, 240);
      const names = blocks.map((b) => b.item.n);
      expect(new Set(names).size).toBe(names.length);
      expect(blocks.reduce((t, b) => t + b.item.v, 0)).toBe(50600);
    });
    it('the same detail in two groups gets two labels and two ids', () => {
      const line = (name: string, value: number, group: string, category: string) => ({ key: name, name, date: '2026-10-01', group, category, brand: null, amount: { value } }) as never;
      const tree = buildTreemap([line('Zed Bank', 50000, 'Bills', 'Bills:Fees'), line('Zed Gym', 40000, 'Personal', 'Personal:Fees')], new Set(), 'category');
      const items = tree.groups.flatMap((g) => g.items);
      expect(items.map((i) => i.n).sort()).toEqual(['Fees, bills', 'Fees, personal']);
      expect(new Set(items.map((i) => i.id)).size).toBe(2);
    });
  });
  it('gives a long all-caps name a block when it has the money, and merges it when it has not', () => {
    const name = 'SRI VENKATESHWARA PROVISION AND STORES';
    const items = (own: number, other: number) => [{ n: 'A', items: [{ n: name, v: own, sub: '', group: 'A' }, { n: 'Old Town Bakery', v: other, sub: '', group: 'A' }, { n: 'RAJ ELECTRICALS', v: other, sub: '', group: 'A' }] }];
    expect(layoutTreemap(items(800, 100), 320, 400).map((b) => b.item.n)).toContain(name);
    expect(layoutTreemap(items(3, 500), 320, 400).map((b) => b.item.n)).not.toContain(name);
  });
});

describe('the payments behind a figure', () => {
  const line = (name: string, rupees: number, category: string, kind = 'variable', date = '2026-10-10') => ({ key: `${name}${rupees}`, name, date, time: null, group: category.split(':')[0], category, brand: null, spend_kind: kind, amount: { value: rupees * 100, confidence: 'statement' } });
  const view = (items: ReturnType<typeof line>[]) => ({ payees: { review: { items: [] } }, spend: { days: [{ day: '2026-10-10', items }, { day: '2026-09-10', items: [line('Zed Late', 900, 'Food:Groceries', 'variable', '2026-09-10')] }] } }) as never;
  const range = { from: '2026-10-01', to: '2026-10-31' };
  it('a payee sits wholly under its first kind, as on the map, so a block and its page agree', () => {
    const v = view([line('Zed Mart', 500, 'Food:Groceries'), line('Zed Mart', 300, 'Food:Delivery'), line('Zed Eats', 200, 'Food:Delivery')]);
    const sum = (of: string) => drillItems(v, { by: 'category', of: [of], period: '30' }, range).reduce((t, i) => t + i.amount.value, 0);
    expect(sum('Food:Groceries')).toBe(80000); // 500 + 300, though the 300 says delivery.
    expect(sum('Food:Delivery')).toBe(20000);
    const tree = buildTreemap(drillItems(v, { by: 'all', period: '30' }, range), new Set(), 'category');
    expect(tree.groups.flatMap((g) => g.items).map((i) => [i.category, i.v])).toEqual([['Food:Groceries', 800], ['Food:Delivery', 200]]);
  });
  it('keeps fixed costs and one-offs out of a kind, and everyday leaves out rent and bills', () => {
    const v = view([line('Zed Mart', 500, 'Food:Groceries'), line('Zed Air', 20000, 'Food:Groceries', 'one_off'), line('Zed Homes', 30000, 'Housing:Rent', 'fixed'), line('Zed Phone', 600, 'Bills:Phone', 'fixed'), line('Zed Cook', 3000, 'Housing:Help', 'fixed')]);
    const names = (q: Parameters<typeof drillItems>[1]) => drillItems(v, q, range).map((i) => i.name);
    expect(names({ by: 'category', of: ['Food:Groceries'], period: '30' })).toEqual(['Zed Mart']);
    expect(names({ by: 'oneoff', period: '30' })).toEqual(['Zed Air']);
    expect(names({ by: 'everyday', period: '30' })).toEqual(['Zed Mart', 'Zed Air', 'Zed Cook']);
    expect(names({ by: 'all', period: '30' })).not.toContain('Zed Late'); // September is outside the range.
  });
  it('sorts payees by money with refunds counted, and a URL round-trips with no name in it', () => {
    const rows = payeeRows(view([line('Zed A', 100, 'Food:Groceries'), line('Zed B', 400, 'Food:Groceries'), line('Zed B', -100, 'Food:Groceries'), line('Zed C', -50, 'Food:Groceries')]), [line('Zed A', 100, 'Food:Groceries'), line('Zed B', 400, 'Food:Groceries'), line('Zed B', -100, 'Food:Groceries'), line('Zed C', -50, 'Food:Groceries')] as never);
    expect(rows.map((r) => [r.name, r.total, r.refunds])).toEqual([['Zed B', 30000, 1], ['Zed A', 10000, 0], ['Zed C', -5000, 1]]);
    const href = drillHref({ by: 'category', of: ['Food:Groceries', 'Food:Delivery'], period: '30', open: payeeHash('Zed B') });
    expect(href).not.toContain('Zed');
    expect(parseDrill(new URLSearchParams(href.split('?')[1]))).toMatchObject({ by: 'category', of: ['Food:Groceries', 'Food:Delivery'], period: '30', open: payeeHash('Zed B') });
    expect(parseDrill(new URLSearchParams('by=category&period=30'))).toBeNull();
  });
});

describe('status sources', () => {
  const NOW = Date.parse('2026-11-18T12:00:00Z');
  const HOUR = 3600e3;
  const fake = () => ({
    state: 'published',
    reason: null,
    attempt: { generated_at: '2026-11-18T06:00:00Z' },
    sources: {
      data_age: { sms_at: '2026-11-18T10:00:00Z' },
      numbers: { cash: { confidence: 'low', line: 'Invented line.', because: ['sms'] }, due: { confidence: 'firm', line: null } },
      set_aside: [{ file: 'bank-oct.tsv', code: 'empty', reason: 'It is empty.', what_to_do: 'Push it again.', set_aside: true }],
      sources: [
        { id: 'sms', group: 'messages', label: 'Bank SMS', state: 'ok', last_at: '2026-11-18T10:00:00Z', last_date: '2026-11-18', line: 'Coming in.', what_to_do: null, connected: true },
        { id: 'a', group: 'banks', label: 'Bank 1111', state: 'ok', last_date: '2026-11-14', line: 'Last statement 14 Nov.', connected: true },
        { id: 'b', group: 'cards', label: 'Card 2222', state: 'stale', last_date: '2026-10-26', line: 'Last statement 26 Oct.', connected: true },
        { id: 'c', group: 'invest', label: 'Broker', state: 'not_connected', last_date: null, line: 'Not connected.', connected: false },
      ],
    },
    invariants: { state: 'warn', checks: [{ id: 'one', ok: true, count: 0, reason: null }, { id: 'two', ok: false, count: 11, reason: 'Invented reason.' }] },
  });

  it('words an age from the clock it is given', () => {
    expect(ageWords(NOW, NOW)).toBe('just now');
    expect(ageWords(NOW - 60e3, NOW)).toBe('1 minute ago');
    expect(ageWords(NOW - 59 * 60e3, NOW)).toBe('59 minutes ago');
    expect(ageWords(NOW - HOUR, NOW)).toBe('1 hour ago');
    expect(ageWords(NOW - 2 * HOUR, NOW)).toBe('2 hours ago');
    expect(ageWords(NOW - 23.9 * HOUR, NOW)).toBe('23 hours ago');
    expect(ageWords(NOW - 24 * HOUR, NOW)).toBe('1 day ago');
    expect(ageWords(NOW - 72 * HOUR, NOW)).toBe('3 days ago');
  });
  it('gives no age for a moment ahead of the clock, past a small skew', () => {
    expect(ageWords(NOW + 60e3, NOW)).toBe('just now');
    expect(ageWords(NOW + HOUR, NOW)).toBeNull();
  });
  it('reads the fake block', () => {
    const st = readStatus(fake());
    expect(st.held).toBeNull();
    expect(st.attemptMs).toBe(Date.parse('2026-11-18T06:00:00Z'));
    expect(st.sources?.rows.map((r) => r.connected)).toEqual([true, true, true, false]);
    expect(st.sources?.numbers.cash).toEqual({ confidence: 'low', line: 'Invented line.' });
    expect(st.sources?.setAside).toEqual([{ file: 'bank-oct.tsv', reason: 'It is empty.', whatToDo: 'Push it again.', partial: false }]);
    expect(st.invariants).toEqual({ ran: true, total: 2, failing: [{ reason: 'Invented reason.', count: 11 }] });
  });
  it('says the strip line by the bank, and names an old card apart', () => {
    expect(dataLine(readSources(fake().sources)!, NOW)).toBe('Data: bank messages 2 hours ago, bank statement to 14 Nov. No newer statement for Card 2222 since 26 Oct');
  });
  it('says one short line on every page, amber only for a source the owner can act on', () => {
    const quiet = readSources(fake().sources)!; // Card 2222 is old but says nothing to do: no action, so no amber and no name.
    expect(dataBrief(quiet, NOW)).toEqual({ text: 'Data: bank messages 2 hours ago, bank statement to 14 Nov', act: 0 });
    const raw = fake();
    (raw.sources.sources[2] as Record<string, unknown>).what_to_do = 'Add the newer statement.';
    expect(dataBrief(readSources(raw.sources)!, NOW)).toEqual({ text: 'Data: bank messages 2 hours ago. One source needs a look', act: 1 });
    (raw.sources.sources[0] as Record<string, unknown>).state = 'stale';
    (raw.sources.sources[0] as Record<string, unknown>).what_to_do = 'Open the collector.';
    (raw.sources.sources[3] as Record<string, unknown>).what_to_do = 'Run its export.'; // Not connected is never a fault.
    expect(dataBrief(readSources(raw.sources)!, NOW)).toEqual({ text: 'Data: bank messages 2 hours ago. 2 sources need a look', act: 2 });
  });
  it('says the About this data row and its pairs from the same parts', () => {
    expect(dataAbout(readSources(fake().sources)!, NOW)).toEqual({ line: 'bank messages 2 hours ago, bank statement to 14 Nov', rows: [['Bank messages', '2 hours ago'], ['Bank statement', 'to 14 Nov']], old: ['Card 2222 since 26 Oct'] });
    expect(dataAbout({ rows: [], numbers: {}, setAside: [], smsAtMs: null }, NOW)).toEqual({ line: 'no bank messages yet', rows: [['Bank messages', 'none yet']], old: [] });
  });
  it('says the strip line with parts missing, never a wrong age', () => {
    expect(dataLine({ rows: [], numbers: {}, setAside: [], smsAtMs: null }, NOW)).toBe('Data: no bank messages yet');
    expect(dataLine({ rows: [], numbers: {}, setAside: [], smsAtMs: NOW + 72 * HOUR }, NOW)).toBe('Data: bank messages 21 Nov');
  });
  it.each([
    ['null', null], ['a number', 7], ['a string', 'x'], ['an array', []], ['an empty object', {}],
    ['sources of the wrong type', { sources: 7, invariants: 'x', attempt: 5 }],
    ['a block with no rows', { sources: { numbers: {}, data_age: {} }, invariants: { checks: 'x' } }],
    ['nulls throughout', { state: null, reason: null, attempt: null, sources: null, invariants: null, last_good: null }],
  ])('has nothing to say for %s', (_name, raw) => {
    expect(readStatus(raw)).toEqual({ held: null, attemptMs: null, sources: null, invariants: null });
  });
  it('drops the malformed parts and keeps the rest', () => {
    const s = readSources({
      data_age: { sms_at: 'not a date' },
      numbers: { cash: 'x', due: { confidence: 'sure' }, spend: { confidence: 'estimate', line: 5 }, invest: null },
      set_aside: [null, 3, {}, { reason: 'Only a reason.' }],
      sources: [null, 'x', { state: 'ok' }, { label: 'Kept', group: 'nowhere', state: 9, line: 4, what_to_do: {}, last_at: 'nope', last_date: 'yesterday' }],
    })!;
    expect(s.smsAtMs).toBeNull();
    expect(s.numbers).toEqual({ spend: { confidence: 'estimate', line: null } });
    expect(s.setAside).toEqual([{ file: 'A file', reason: 'Only a reason.', whatToDo: null, partial: false }]);
    expect(s.rows).toEqual([{ id: null, group: 'other', label: 'Kept', state: 'ok', line: null, whatToDo: null, lastAtMs: null, lastDate: null, connected: true }]);
  });
  it('reads a blocked status whatever else is broken', () => {
    const st = readStatus({ state: 'blocked', reason: 'Invented block.', last_good: null, sources: 7 });
    expect(st.held).toEqual({ reason: 'Invented block.', asOf: null, state: 'blocked' });
    expect(st.sources).toBeNull();
  });
  it('marks every confidence but firm', () => {
    expect(confidenceWord('firm')).toBeNull();
    expect(confidenceWord('estimate')).toBe('Estimate');
    expect(confidenceWord('low')).toBe('Low confidence');
    expect(confidenceWord('unknown')).toBe('Not sure');
  });
  describe('the Estimate chip rule (G5)', () => {
    const fig = (rupees: number, confidence = 'statement') => ({ value: rupees * 100, confidence });
    // Invented: soft cushion ₹25k. Statement balance ₹80k, ₹20k by message since: 80 / (80 + 20) = 0.8 on a statement.
    const view = (o: { stmt?: number; since?: number; owed?: [number, number][]; items?: [number, string][]; h?: number | null; held?: [number, boolean][] }) => ({
      position: { cash_parts: { statement: o.stmt != null ? fig(o.stmt) : null, since: o.since != null ? fig(o.since, 'provisional') : null }, owed: (o.owed ?? []).map(([a, b]) => ({ statement: fig(a), since: fig(b, 'provisional') })) },
      spend: { month: '2026-11', days: [{ day: '2026-11-02', items: (o.items ?? []).map(([v, c]) => ({ amount: fig(v, c) })) }, { day: '2026-10-30', items: [{ amount: fig(99999, 'provisional') }] }] },
      forecast: { likely_left: o.h === undefined ? null : { spread: o.h == null ? undefined : { variance: o.h * 100 } } },
      invest: { holdings: (o.held ?? []).map(([v, e]) => ({ value: fig(v), estimated: e })) },
    }) as never;
    it('firm never shows, low and unknown always do', () => {
      expect(doubtWord('firm', { onStatement: 0, wide: true })).toBeNull();
      expect(doubtWord('low', { onStatement: 1, wide: false })).toBe('Low confidence');
      expect(doubtWord('unknown', { onStatement: 1, wide: false })).toBe('Not sure');
    });
    it('an estimate shows only when mostly off a statement, or wide', () => {
      expect(doubtWord('estimate', { onStatement: 0.8, wide: false })).toBeNull();
      expect(doubtWord('estimate', { onStatement: 0.5, wide: false })).toBeNull(); // Half proven is not mostly messages.
      expect(doubtWord('estimate', { onStatement: 0.49, wide: false })).toBe('Estimate');
      expect(doubtWord('estimate', { onStatement: 0.9, wide: true })).toBe('Estimate');
      expect(doubtWord('estimate', { onStatement: null, wide: false })).toBeNull();
    });
    it('a range is wide past half the soft cushion each way', () => {
      expect(isWide(12500, 25000)).toBe(false);
      expect(isWide(12501, 25000)).toBe(true);
    });
    it('cash weighs the statement balance against what came since by message', () => {
      expect(evidence(view({ stmt: 80000, since: -20000 }), 'cash', 25000)).toEqual({ onStatement: 0.8, wide: false });
      expect(evidence(view({ stmt: 10000, since: 30000 }), 'cash', 25000).onStatement).toBe(0.25);
      expect(evidence(view({}), 'cash', 25000).onStatement).toBeNull();
    });
    it('card dues add every card: (40 + 0) / (40 + 10 + 0 + 50) = 0.4', () => {
      expect(evidence(view({ owed: [[40000, 10000], [0, 50000]] }), 'due', 25000).onStatement).toBe(0.4);
    });
    it('spend counts this month only; likely left adds its range', () => {
      const v = view({ items: [[300, 'statement'], [100, 'provisional']], h: 16000 });
      expect(evidence(v, 'spend', 25000)).toEqual({ onStatement: 0.75, wide: false });
      expect(evidence(v, 'likely_left', 25000)).toEqual({ onStatement: 0.75, wide: true });
      expect(evidence(view({ items: [[300, 'statement']], h: 12500 }), 'likely_left', 25000).wide).toBe(false);
    });
    it('investments count the share not estimated: 300 / (300 + 100)', () => {
      expect(evidence(view({ held: [[300, false], [100, true]] }), 'invest', 25000).onStatement).toBe(0.75);
    });
  });
  it('says no build has run only past 30 hours, the attempt before the manifest', () => {
    const at = NOW - 31 * HOUR;
    expect(noBuildSince(at, null, NOW)).toBe(at);
    expect(noBuildSince(null, at, NOW)).toBe(at);
    expect(noBuildSince(NOW - 30 * HOUR, null, NOW)).toBeNull();
    expect(noBuildSince(NOW - HOUR, at, NOW)).toBeNull();
    expect(noBuildSince(null, null, NOW)).toBeNull();
    expect(noBuildSince(NOW + 99 * HOUR, null, NOW)).toBeNull();
  });
});

describe("this month on Plan follows the hero's too-early rule", () => {
  const c = { soft: 25000, hard: 10000 };
  const y = { history: [], liquid: null } as unknown as Parameters<typeof statuses>[2];
  const row = (end: number, h: number, ym = '2026-11') => ({ ym, end, h }) as unknown as Row;

  it('a range wider than the soft cushion is too early to tell, not could, and the headline stays out of it', () => {
    const rows = [row(45000, 40000), row(75000, 10000, '2026-12')];
    const st = statuses(rows, c, y);
    expect(st[0]).toMatchObject({ kind: 'just', early: true, step: 'n' });
    expect(headline(rows, [], c, y as never).line.kind).toBe('lowest');
  });
  it('the same range below the soft cushion still warns, as the hero does', () => {
    expect(statuses([row(15000, 40000)], c, y)[0]).toMatchObject({ early: false, kind: kind(15000, 40000, c) });
  });
  it('a narrow range keeps its could, and a later month is not touched', () => {
    expect(statuses([row(28000, 20000)], c, y)[0]).toMatchObject({ kind: 'could', early: false });
    expect(statuses([row(85000, 1000), row(28000, 40000, '2026-12')], c, y)[1].early).toBe(false);
  });
  it('a could month is ink, says it likely holds, and how far a costly month goes: 10k − (28k − 20k) = 2k under', () => {
    const rows = [row(28000, 20000)];
    expect(statuses(rows, c, y)[0].step).toBe('n');
    const H = headline(rows, [], c, y as never);
    expect(H.h).toBe("November could dip, but likely won't.");
    expect(H.line).toMatchObject({ kind: 'could', amount: 2000 });
    expect(H.tone).toBe('ok');
    expect(couldBy(28000, 20000, c)).toBe(2000);
    expect(couldBy(35000, 20000, c)).toBe(0);
    const say = placeSay(verdict(rows, 0, c), '2026-11', 'n', c, null);
    expect(`${say.text}${say.fig}${say.tail}`).toBe('November likely works. A costly month could take it ₹2k under your ₹10k hard cushion.');
  });
});

describe('Spend, Tight: block lines, tags, colours and the range label', () => {
  const line = (name: string, value: number, group: string, category: string | null, kind = 'variable') => ({ key: name, name, date: '2026-10-01', group, category, brand: null, spend_kind: kind, amount: { value } }) as never;
  it('a block\'s faint line is its kind of spending in each complete month, fixed and one-offs left out, a month with none at 0', () => {
    const days = [
      { day: '2026-08-03', items: [line('Zed Mart', 120000, 'Food', 'Food:Groceries'), line('Zed Eats', 50000, 'Food', 'Food:Delivery')] },
      { day: '2026-08-20', items: [line('Zed Corner', 30000, 'Food', 'Food:Groceries'), line('Zed Mart', 900000, 'Food', 'Food:Groceries', 'one_off')] },
      { day: '2026-10-02', items: [line('Zed Mart', 45000, 'Food', 'Food:Groceries'), line('Zed Rent', 4000000, 'Housing', 'Housing:Rent', 'fixed')] },
      { day: '2026-11-01', items: [line('Zed Mart', 70000, 'Food', 'Food:Groceries')] },
    ];
    const groceries = { id: 'cat:Food:Groceries', n: 'Groceries', v: 1, sub: '', group: 'Food', category: 'Food:Groceries', byCategory: true };
    // August: ₹1,200 + ₹300 (the ₹9,000 one-off is out). September: nothing. October: ₹450. November is not complete, so not asked for.
    expect(blockHistory(days as never, ['2026-08', '2026-09', '2026-10'], blockMatch(groceries, new Set(), false))).toEqual([1500, 0, 450]);
    // Asked for one group, the map holds all of it: the one-off comes back.
    expect(blockHistory(days as never, ['2026-08', '2026-09', '2026-10'], blockMatch(groceries, new Set(), true))).toEqual([10500, 0, 450]);
    // A payee block matches by name; a rollup by its members.
    const both = { id: 'rollup', n: '2 small payees', v: 1, sub: '', group: 'Food', parts: 2, members: [{ n: 'Zed Eats', v: 1, sub: '', group: 'Food' }, { n: 'Zed Corner', v: 1, sub: '', group: 'Food' }] };
    expect(blockHistory(days as never, ['2026-08'], blockMatch(both, new Set(), false))).toEqual([800]);
    // An unnamed payment is never in a named block's line.
    expect(blockHistory(days as never, ['2026-08'], blockMatch(groceries, new Set(['Zed Corner']), false))).toEqual([1200]);
  });
  it('Above sits on a block only when the block is the whole of a group that is above its usual', () => {
    const b = (id: string, group: string, extra = {}) => ({ id, n: id, v: 1, sub: '', group, ...extra });
    const travel = b('Trips', 'Travel');
    const groups = [{ n: 'Food', items: [b('Groceries', 'Food'), b('Eating out', 'Food')] }, { n: 'Travel', items: [travel] }];
    expect(blockAbove(groups[0].items[0], groups, new Set(['Food']))).toBe(false); // Food is above, but Groceries alone may not be.
    expect(blockAbove(travel, groups, new Set(['Travel']))).toBe(true);
    expect(blockAbove(travel, groups, new Set(['Food']))).toBe(false);
    expect(blockAbove(b('rollup', 'Travel', { parts: 2 }), groups, new Set(['Travel']))).toBe(false);
  });
  it('one hue per spending family, the rest one Other', () => {
    expect(['Food', 'Shopping', 'Housing', 'Travel', 'Uncategorized'].map(hueOf)).toEqual(['food', 'shop', 'home', 'other', 'other']);
  });
  it('the range label reads the 30 days, a month, or a run of months', () => {
    const p = (id: string, from: string, to: string) => ({ id, label: '', from, to, partial: null }) as never;
    expect(rangeLabel(p('month', '2026-11', '2026-11'), true, '2026-11-18')).toBe('To 18 Nov 2026');
    expect(rangeLabel(p('prev', '2026-10', '2026-10'), false, '2026-11-18')).toBe('October 2026');
    expect(rangeLabel(p('q', '2026-09', '2026-11'), false, '2026-11-18')).toBe('Sep to Nov 2026');
    expect(rangeLabel(p('q', '2026-12', '2027-02'), false, '2027-02-03')).toBe('Dec 2026 to Feb 2027');
  });
});
