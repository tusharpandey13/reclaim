/** Today's two coarse readings: what a day is free above the soft cushion, and the Line's projections rolled up by kind. Pure, so the arithmetic is tested by hand. */
import { dayDiff, dayMonth, inr } from './format';

const k = (v: number): string => `₹${Math.round(v / 1000)}k`;

/** Per day to ₹10 under ₹1,000 a day, to ₹50 above, always rounded down: the safe direction for money said to be free. */
export function perDayRound(v: number): number {
  if (v <= 0) return 0;
  return v >= 1000 ? Math.floor(v / 50) * 50 : Math.floor(v / 10) * 10;
}

export interface PerDayIn {
  /** The hero's figure: the balance expected on `date`, after usual spending, or null with no forecast. */
  m: number | null;
  soft: number;
  asOf: string;
  /** The figure's day: the eve of salary, or the month's last day. */
  date: string;
  /** `salary` when `date` is the eve of the next salary, `month_end` when the salary date is not known, null on a snapshot from before it. */
  basis: 'salary' | 'month_end' | null;
  /** The range is too wide to lean on, so no figure is told. */
  early: boolean;
}

export interface PerDay { kind: 'room' | 'under' | 'early' | 'none'; text: string; perDay: number | null; days: number }

/**
 * One plain line under the hero. The figure is already after usual spending, so what is above the soft cushion is extra,
 * spread over every day from today to the figure's day, both counted.
 */
export function perDayLine(p: PerDayIn): PerDay {
  const days = Math.max(1, dayDiff(p.date, p.asOf) + 1);
  const cushion = `your ${k(p.soft)} soft cushion`;
  if (p.m == null) return { kind: 'none', text: 'No daily figure yet: there is no forecast to work it from.', perDay: null, days };
  if (p.early) return { kind: 'early', text: 'This is not money free to spend: it is too early to tell how much a day is.', perDay: null, days };
  const salary = p.basis === 'salary';
  const until = salary ? 'before salary' : `before ${dayMonth(p.date)}`;
  const above = p.m - p.soft;
  if (above <= 0) {
    const where = above === 0 ? `right at ${cushion}` : `about ${k(-above)} under ${cushion}`;
    return { kind: 'under', text: `Nothing extra to spend ${until}: this is ${where}.`, perDay: null, days };
  }
  const y = perDayRound(above / days);
  const span = days === 1 ? (salary ? 'for today, until salary' : 'for today') : salary ? `for the ${days} days until salary` : `for the ${days} days to ${dayMonth(p.date)}`;
  const daily = y > 0 ? `about ${inr(y)} a day extra ${span}` : `under ₹10 a day extra ${span}`;
  const unknown = p.basis === 'month_end' ? ' Your salary date is not known.' : '';
  return { kind: 'room', text: `About ${k(above)} above ${cushion} after usual spending: ${daily}.${unknown}`, perDay: y, days };
}

/** The Line's coarse groups, in the owner's words. Everyday spending is its own row already. */
export type LineGroup = 'rent' | 'cards' | 'subs' | 'bills' | 'invest';
export const GROUP_LABEL: Record<LineGroup, string> = { rent: 'Rent', cards: 'Card bills', subs: 'Subscriptions', bills: 'Other bills', invest: 'Investing' };
/** The icon a group row borrows: its ledger group, or a keyword the icon map knows. */
export const GROUP_ICON: Record<LineGroup, { name: string; group?: string }> = { rent: { name: 'Rent', group: 'Housing:Rent' }, cards: { name: 'Card' }, subs: { name: 'Subscriptions', group: 'Bills:Subscriptions' }, bills: { name: 'Bills', group: 'Bills' }, invest: { name: 'SIP' } };

/** Which group a projected payment falls in, from its kind first, then its ledger category. */
export function groupOf(kind: string, category: string | null | undefined): LineGroup {
  if (kind === 'card_bill' || kind === 'card_bill_estimate') return 'cards';
  if (kind === 'sip') return 'invest';
  if (kind === 'rent' || category === 'Housing:Rent') return 'rent';
  if (category === 'Bills:Subscriptions') return 'subs';
  return 'bills';
}

export interface Projected<T> { item: T; group: LineGroup; date: string; amount: number; h: number; range: { low: number; high: number } | null }
export interface Rolled<T> { group: LineGroup; label: string; items: T[]; date: string; amount: number; h: number; range: { low: number; high: number } | null }

/**
 * One row per group, in the order each group first falls due. The total is the sum; the spread adds as variances do, so the Line's
 * ± at Likely left is the same as with every item drawn; the printed range is the sum of each item's own ends.
 */
export function rollUp<T>(rows: Projected<T>[]): Rolled<T>[] {
  const by = new Map<LineGroup, Projected<T>[]>();
  for (const r of rows) by.set(r.group, [...(by.get(r.group) ?? []), r]);
  return [...by.entries()].map(([group, rs]) => {
    const ranged = rs.some((r) => r.range);
    return {
      group,
      label: GROUP_LABEL[group],
      items: rs.map((r) => r.item),
      date: rs.map((r) => r.date).sort()[0],
      amount: rs.reduce((t, r) => t + r.amount, 0),
      h: Math.sqrt(rs.reduce((t, r) => t + r.h * r.h, 0)),
      range: ranged ? { low: rs.reduce((t, r) => t + (r.range?.low ?? r.amount), 0), high: rs.reduce((t, r) => t + (r.range?.high ?? r.amount), 0) } : null,
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}
