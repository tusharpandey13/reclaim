/** Which payments stand behind a figure. Pure: the page draws what this returns. A category, group, account and period may be in a URL; a payee travels only as a hash. */
import type { Item, Snapshot } from './data';

/** finance/snapshot.py's FALLBACK_NAME. On real data about a third of lines carry it, so it must not read as one payee. */
export const UNNAMED = 'Unnamed payment';

export type DrillBy = 'all' | 'group' | 'category' | 'everyday' | 'regular' | 'unnamed' | 'oneoff' | 'fixed';
const BYS: DrillBy[] = ['all', 'group', 'category', 'everyday', 'regular', 'unnamed', 'oneoff', 'fixed'];

export interface DrillQuery {
  by: DrillBy;
  /** Groups for `group`, `everyday` and `regular`, ledger categories for `category`. */
  of?: string[];
  /** `30`, a Spend period id, `30to2026-10-12`, `2026-10`, `2026-10-12` or `all`. */
  period: string;
  account?: string | null;
  only?: 'unconfirmed' | null;
  /** The payee to open, as `payeeHash`. */
  open?: string | null;
}

/** Short and one-way enough for a URL that must not name anyone. Only ever compared with another hash of a name on this device. */
export function payeeHash(name: string): string {
  let h = 5381;
  for (const c of name) h = ((h * 33) ^ c.codePointAt(0)!) >>> 0;
  return h.toString(36);
}

export function drillHref(q: DrillQuery): string {
  const p = new URLSearchParams({ by: q.by, period: q.period });
  if (q.of?.length) p.set('of', q.of.join(','));
  if (q.account) p.set('account', q.account);
  if (q.only) p.set('only', q.only);
  if (q.open) p.set('open', q.open);
  return `spending?${p}`;
}

export function parseDrill(params: URLSearchParams): DrillQuery | null {
  const by = params.get('by') as DrillBy | null;
  const period = params.get('period');
  if (!by || !BYS.includes(by) || !period) return null;
  const of = params.get('of')?.split(',').filter(Boolean);
  if ((by === 'group' || by === 'category') && !of?.length) return null;
  return { by, of, period, account: params.get('account'), only: params.get('only') === 'unconfirmed' ? 'unconfirmed' : null, open: params.get('open') };
}

export const isUnnamed = (it: Item, unnamedKeys: Set<string>): boolean =>
  it.name === UNNAMED || (it.group === 'Uncategorized' && unnamedKeys.size > 0) || (it.key != null && unnamedKeys.has(it.key));

/** finance/facts_v2.py's is_everyday: every expense but rent, utilities and bills. */
const isEveryday = (it: Item): boolean => it.category !== 'Housing:Rent' && it.category !== 'Housing:Utilities' && it.group !== 'Bills' && !it.category?.startsWith('Bills:');
const onMap = (it: Item): boolean => it.spend_kind !== 'fixed' && it.spend_kind !== 'one_off';
export const groupOf = (it: Item): string => it.group ?? 'Other';

export const reviewKeys = (view: Snapshot): Set<string> => new Set(view.payees.review.items.flatMap((i) => i.payments.map((p) => p.key)));

/** What the page reads: a day range goes by the date paid; `byMonth` goes by the month a payment counts in, as `spend.months` does. */
export interface ItemRange { from: string; to: string; byMonth?: boolean }

/** Rent paid across a month's edge: line key to the month it is for. The build's own decision, from the audit lines, so this cannot disagree with `spend.months`. */
const rentMonths = (view: Snapshot): Map<string, string> => new Map(view.reports.audit.lines.flatMap((l) => (l.for_month && l.key ? [[l.key, l.for_month] as [string, string]] : [])));

/** The payments in a range that a query asks for. `category` follows the map: a payee sits wholly under the kind its first payment has. */
export function drillItems(view: Snapshot, q: DrillQuery, range: ItemRange): Item[] {
  const unnamedKeys = reviewKeys(view);
  const rent = range.byMonth ? rentMonths(view) : null;
  const counts = (day: string, i: Item) => {
    if (!rent) return day >= range.from && day <= range.to;
    const month = (i.key ? rent.get(i.key) : undefined) ?? day.slice(0, 7);
    return month >= range.from.slice(0, 7) && month <= range.to.slice(0, 7);
  };
  const inRange = view.spend.days.flatMap((d) => d.items.filter((i) => counts(d.day, i)))
    .filter((i) => (!q.account || i.account === q.account) && (!q.only || i.amount.confidence !== 'statement'));
  const of = q.of ?? [];
  switch (q.by) {
    case 'all': return inRange;
    case 'group': return inRange.filter((i) => of.includes(groupOf(i)));
    case 'everyday': return inRange.filter((i) => isEveryday(i) && (!of.length || of.includes(groupOf(i))));
    case 'regular': return inRange.filter((i) => isEveryday(i) && i.spend_kind !== 'one_off' && (!of.length || of.includes(groupOf(i))));
    case 'oneoff': return inRange.filter((i) => i.spend_kind === 'one_off');
    case 'fixed': return inRange.filter((i) => i.spend_kind === 'fixed');
    case 'unnamed': return inRange.filter((i) => onMap(i) && isUnnamed(i, unnamedKeys));
    case 'category': {
      const named = inRange.filter((i) => onMap(i) && !isUnnamed(i, unnamedKeys));
      const kindOf = new Map<string, string>();
      for (const i of named) if (!kindOf.has(i.name)) kindOf.set(i.name, i.category ?? groupOf(i));
      return named.filter((i) => of.includes(kindOf.get(i.name)!));
    }
  }
}

/** Paise of rent a whole-month page counts from outside its dates, and leaves out from inside them. Both zero on any other page. */
export function rentMoved(view: Snapshot, q: DrillQuery, range: ItemRange): { into: number; away: number } {
  if (!range.byMonth) return { into: 0, away: 0 };
  const inDates = (i: Item) => i.date >= range.from && i.date <= range.to;
  const counted = new Set(drillItems(view, q, range));
  const into = [...counted].filter((i) => !inDates(i)).reduce((t, i) => t + i.amount.value, 0);
  const away = drillItems(view, q, { from: range.from, to: range.to }).filter((i) => !counted.has(i)).reduce((t, i) => t + i.amount.value, 0);
  return { into, away };
}

export interface PayeeRow { hash: string; name: string; total: number; items: Item[]; refunds: number; pending: number; first: Item }

/** Payees by money, largest first, each with its payments newest first. Refunds count against the payee. Payments with no name stay one row, or sit under the group Name payees knows them by. */
export function payeeRows(view: Snapshot, items: Item[]): PayeeRow[] {
  const reviewName = new Map<string, string>();
  for (const r of view.payees.review.items) if (r.name && r.name !== UNNAMED) for (const p of r.payments) reviewName.set(p.key, r.name);
  const by = new Map<string, Item[]>();
  for (const it of items) {
    const name = it.name === UNNAMED ? (it.key && reviewName.get(it.key)) || UNNAMED : it.name;
    (by.get(name) ?? by.set(name, []).get(name)!).push(it);
  }
  const moment = (i: Item) => `${i.date}T${i.time ?? '00:00'}`;
  return [...by.entries()].map(([name, list]) => ({
    hash: payeeHash(name),
    name: name === UNNAMED ? 'No name yet' : name,
    total: list.reduce((t, i) => t + i.amount.value, 0),
    items: [...list].sort((a, b) => moment(b).localeCompare(moment(a))),
    refunds: list.filter((i) => i.amount.value < 0).length,
    pending: list.filter((i) => i.amount.confidence !== 'statement').length,
    first: list[0],
  })).sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}
