/** Spend, Tight: a range, the answer as a stat, its 30-day bars and groups, fixed costs, who gets the money, then folded rows for the month. */
import { useMemo, useState, type ReactNode } from 'react';
import { PageHeader, StateBar } from '../App';
import { Chip, Hl, Ico, Link, N, Read, useSheet } from '../ui/kit';
import { Calendar, Pace, Rng, runningByDay, Treemap, TrendBars, TrendLegend, type CalCell, type PaceLine, type TmItem, type TrendBar } from '../ui/charts';
import { InfoButton, RangeChooser, Stat, WithInfo, type StatStatus } from '../ui/tight';
import { dateParts, dayLabel, dayMonth, daysInMonth, fc, inr, MONTHS, monthLong, rupees, short, ymAdd } from '../lib/format';
import { ladder, ladderChip, type Ladder } from '../lib/status';
import { go, useRoute } from '../lib/router';
import { useStore, useView } from '../lib/store';
import { DoubtNote, monthTiles, MonthTiles, monthTotals, type DayRow } from './shared';
import { CheckAgain } from './Today';
import { drillHref, isUnnamed, payeeHash, UNNAMED, type DrillQuery } from '../lib/drill';
import type { Item, Snapshot } from '../lib/data';
import type { FixedCost, SpendAllocation } from '../generated/snapshot-types';

type PeriodId = 'month' | 'prev' | 'q' | 'fy' | 'cal';
/** `thirty`: the running 30 days, which reads this month's period underneath. Off once Month or any other range is picked. */
export interface Filters { period: PeriodId; group: string | null; account: string | null; unconfirmed: boolean; thirty: boolean }

export const fyStartOf = (asOf: string): string => {
  const { y, m } = dateParts(asOf);
  return `${m >= 3 ? y : y - 1}-04`;
};

export interface PeriodDef { id: PeriodId; label: string; from: string; to: string; partial: string | null }
export function periods(view: Snapshot): PeriodDef[] {
  const cur = view.spend.month;
  const year = cur.slice(0, 4);
  const firstKnown = (view.spend.first_day ?? view.spend.days[0]?.day ?? `${cur}-01`).slice(0, 7);
  const fy = fyStartOf(view.meta.as_of);
  const prev = ymAdd(cur, -1);
  const partial = (from: string) => (from < firstKnown ? `Your data starts in ${monthLong(firstKnown)} ${firstKnown.slice(0, 4)}, so this is only part of it.` : null);
  const out: PeriodDef[] = [
    { id: 'month', label: monthLong(cur), from: cur, to: cur, partial: null },
    { id: 'prev', label: monthLong(prev), from: prev, to: prev, partial: partial(prev) },
    { id: 'q', label: 'Last 3 months', from: ymAdd(cur, -2), to: cur, partial: partial(ymAdd(cur, -2)) },
    { id: 'fy', label: 'This financial year', from: fy, to: cur, partial: partial(fy) },
  ];
  if (`${year}-01` >= firstKnown || year !== fy.slice(0, 4)) out.push({ id: 'cal', label: year, from: `${year}-01`, to: cur, partial: partial(`${year}-01`) });
  return out;
}

const inPeriod = (d: DayRow, p: PeriodDef) => d.day.slice(0, 7) >= p.from && d.day.slice(0, 7) <= p.to;
/** No data must not read as no spending: while a source is late, this says only what was seen. */
function NoneThisMonth() {
  const confidence = useStore().sources?.numbers?.spend?.confidence;
  return <p className="note">{confidence === 'estimate' || confidence === 'low' ? 'No payments seen in this month.' : 'Nothing spent in this month.'}</p>;
}

function matches(i: Item, f: Filters): boolean {
  if (f.group && i.group !== f.group) return false;
  if (f.account && i.account !== f.account) return false;
  if (f.unconfirmed && i.amount.confidence === 'statement') return false;
  return true;
}

function FilterSheet({ groups, accounts, value, onDone }: { groups: string[]; accounts: string[]; value: Filters; onDone: (f: Partial<Filters>) => void }) {
  const [g, setG] = useState(value.group);
  const [a, setA] = useState(value.account);
  const [u, setU] = useState(value.unconfirmed);
  const { close } = useSheet();
  return (
    <>
      <h2>Only show</h2>
      <div className="chips wrapped" role="group" aria-label="Group">
        <button className="chip flat" aria-pressed={g == null} onClick={() => setG(null)}>All groups</button>
        {groups.map((n) => <button key={n} className="chip flat" aria-pressed={g === n} onClick={() => setG(n)}><Ico q={{ name: n, group: n }} />{n}</button>)}
      </div>
      {accounts.length ? (
        <div className="chips wrapped" role="group" aria-label="Account">
          <button className="chip flat" aria-pressed={a == null} onClick={() => setA(null)}>All accounts</button>
          {accounts.map((n) => <button key={n} className="chip flat" aria-pressed={a === n} onClick={() => setA(n)}>{n}</button>)}
        </div>
      ) : null}
      <div className="chips wrapped">
        <button className="chip flat" aria-pressed={u} onClick={() => setU(!u)}>Unconfirmed only</button>
      </div>
      <button className="close" onClick={() => { onDone({ group: g, account: a, unconfirmed: u }); close(); }}>Show</button>
      <button className="close quiet" onClick={close}>Close</button>
    </>
  );
}

function ToneRead({ value }: { value: { n: ReactNode; tone: string } | null }) {
  return <Read text={value?.n ?? null} tone={value?.tone} />;
}

/** Day-by-day totals and items for a month with a filter. */
function daysFor(view: Snapshot, ym: string, f: Filters): { day: number; value: number; state: string; items: Item[] }[] {
  const { d: asOfDay } = dateParts(view.meta.as_of);
  const isNow = ym === view.spend.month;
  const dim = daysInMonth(ym);
  const by = new Map(view.spend.days.filter((d) => d.day.startsWith(ym)).map((d) => [Number(d.day.slice(8)), d]));
  return Array.from({ length: dim }, (_, i) => {
    const day = i + 1;
    const row = by.get(day);
    if ((isNow && day > asOfDay) || !row) return { day, value: 0, state: 'future', items: [] };
    if (row.state === 'no_data') return { day, value: 0, state: 'no_data', items: [] };
    const items = row.items.filter((it) => matches(it, f));
    return { day, value: items.reduce((t, it) => t + rupees(it.amount.value), 0), state: items.length ? 'spent' : 'none', items };
  });
}

const two = (items: Item[]): string => [...items].sort((a, b) => b.amount.value - a.amount.value).slice(0, 2).map((i) => `${i.name === UNNAMED ? 'No name yet' : i.name} ${inr(rupees(i.amount.value))}`).join(', ');

/** What every amount on this page links to: the same filters, one scope. */
const scopeOf = (f: Filters): Pick<DrillQuery, 'by' | 'of' | 'account' | 'only'> => ({ by: f.group ? 'group' : 'all', of: f.group ? [f.group] : undefined, account: f.account, only: f.unconfirmed ? 'unconfirmed' : null });
const SeeAll = ({ to, label }: { to: string; label: string }) => <Link className="tlink" to={to} data-see-all aria-label={`See all of ${label}`}>See all</Link>;

/**
 * A folded section: a full-width row whose title is the section's heading, and the section below it once opened.
 * The title has its own element, so a test or a reader of the title gets the title alone.
 */
function Fold({ id, title, titleId, open, onToggle, children, amount }: { id: string; title: ReactNode; titleId?: string; open: boolean; onToggle: () => void; children: ReactNode; amount?: number }) {
  return (
    <section className="sec fold" id={id} data-open={open ? 'yes' : 'no'}>
      <h2 className="fold-h"><button type="button" className="frow" aria-expanded={open} data-row={id} onClick={onToggle}><span className="frow-m"><span className="frow-t" id={titleId} data-amount={amount}>{title}</span></span><span className="frow-c" aria-hidden="true">›</span></button></h2>
      {open ? children : null}
    </section>
  );
}

/** Which folds are open, kept for the session in memory only, so Back and a tab return to Spend as it was. */
const remembered: Record<string, boolean> = {};
type FoldState = (id: string) => { open: boolean; onToggle: () => void };
/** The page's folds: as last left, plus the one a deep link names (spend/month opens the calendar). */
function useFolds(start: string | null): [FoldState, (id: string) => void] {
  const [folds, setFolds] = useState<Record<string, boolean>>(() => ({ ...remembered, ...(start ? { [start]: true } : {}) }));
  const set = (id: string, v: (was: boolean) => boolean) => setFolds((o) => {
    remembered[id] = v(!!o[id]);
    return { ...o, [id]: remembered[id] };
  });
  return [(id) => ({ open: !!folds[id], onToggle: () => set(id, (was) => !was) }), (id) => set(id, () => true)];
}

/** Your year and the month's calendar, each folded. Picking a month opens its calendar. */
function MonthSection({ view, f, initial, tiles, fold, show }: { view: Snapshot; f: Filters; initial: string; tiles: ReturnType<typeof monthTiles>; fold: FoldState; show: (id: string) => void }) {
  const [ym, setYm] = useState(initial);
  const [read, setRead] = useState<{ n: ReactNode; tone: string } | null>(null);
  const [picked, setPicked] = useState<number | null>(null);
  const days = useMemo(() => daysFor(view, ym, f), [view, ym, f]);
  const [y, m] = ym.split('-').map(Number);
  const first = (new Date(Date.UTC(y, m - 1, 1)).getUTCDay() + 6) % 7;
  const label = MONTHS[m - 1];
  const cells: CalCell[] = days.map((d) => {
    const iso = `${ym}-${String(d.day).padStart(2, '0')}`;
    const wd = dayLabel(iso).split(' ')[0];
    if (d.state === 'future' || d.state === 'no_data') return { day: d.day, value: null, state: 'future', s: '', step: 'n', label: '', read: null, tone: '' };
    const v = d.value;
    const st = v >= 10000 ? 'r3' : v >= 6000 ? 'r2' : v === 0 ? 'g1' : 'n';
    const s = st !== 'n' ? st : v < 1000 ? 't1' : v < 2500 ? 't2' : v < 4000 ? 't3' : 't4';
    const big = d.items.length ? ` Biggest: ${two(d.items)}.` : '';
    const msg = <><b>{wd} {d.day} {label}: {v ? inr(v) : 'nothing spent'}</b>{st === 'r3' ? '. Very heavy day, over ₹10,000.' : st === 'r2' ? '. Heavy day, over ₹6,000.' : st === 'g1' ? '. A no-spend day.' : '.'}{big}{d.items.length ? <> <SeeAll to={drillHref({ ...scopeOf(f), period: iso })} label={`${d.day} ${label}`} /></> : null}</>;
    return { day: d.day, value: v, state: v ? 'spent' : 'none', s, step: st, label: `${wd} ${d.day} ${label}, ${v ? inr(v) : 'nothing'}`, read: msg, tone: st[0] === 'r' ? 'crit' : st[0] === 'g' ? 'safe' : '' };
  });
  const rentMoved = (monthTotals(view).get(ym) ?? 0) - days.reduce((t, d) => t + d.value, 0);
  const largest = [...days].filter((d) => d.value > 0).sort((a, b) => b.value - a.value).slice(0, 5);
  return (
    <>
    <Fold id="year-pick" title="Your year, month by month" {...fold('year-pick')}>
      <p>Pick a month.</p>
      <MonthTiles tiles={tiles} picked={ym} onPick={(next) => { setYm(next); setRead(null); setPicked(null); show('month'); }} />
    </Fold>
    <Fold id="month" titleId="calt" title={`${monthLong(ym)} calendar`} {...fold('month')}>
      <p>Tap a day. Stronger grey is more. A tick is a day with no spending. Red starts at <span className="u-rule">₹6,000 a day</span>.</p>
      <Calendar first={first} cells={cells} today={view.meta.as_of.startsWith(ym) ? dateParts(view.meta.as_of).d : null} picked={picked} onPick={setPicked} onRead={(n, tone) => setRead({ n, tone })} />
      <Read text={read?.n ?? null} tone={read?.tone} narrow />
      {!(f.group || f.account || f.unconfirmed) && Math.abs(rentMoved) >= 1 ? <p className="note narrow mt4" data-note="calendar-rent" data-amount={rentMoved}><N>{inr(Math.abs(rentMoved))}</N> of rent paid {rentMoved > 0 ? 'on another date counts in this month, so the days add up to less than the month' : 'this month counts in another, so the days add up to more than the month'}.</p> : null}
      {days.some((d) => d.items.length) ? <div><Link className="tlink" to={drillHref({ ...scopeOf(f), period: ym })} data-see-month>See all of {monthLong(ym)}</Link></div> : null}
      <h3 className="hd mt5">Largest days, with the two biggest purchases</h3>
      {largest.length ? (
        <table className="tbl narrow">
          <tbody>
            {largest.map((d) => {
              const iso = `${ym}-${String(d.day).padStart(2, '0')}`;
              return <tr key={d.day}><td><Link className="drill-day" to={drillHref({ ...scopeOf(f), period: iso })}><b>{dayLabel(iso)}</b></Link><small>{two(d.items)}</small></td><td className="num"><N>{inr(d.value)}</N></td></tr>;
            })}
          </tbody>
        </table>
      ) : <NoneThisMonth />}
    </Fold>
    </>
  );
}

/** A ledger detail in plain words. Group alone when the ledger says no more. */
const DETAIL: Record<string, string> = { EatingOut: 'Eating out', Delivery: 'Food delivery', Marketplaces: 'Online shopping', Local: 'Local travel', Care: 'Health care', Supplies: 'Home supplies', Fees: 'Fees' };
export function categoryLabel(group: string, category: string | null | undefined): string {
  const detail = category?.split(':')[1];
  if (!detail) return group;
  if (detail === 'Other') return `Other ${group.toLowerCase()}`;
  return DETAIL[detail] ?? detail.replace(/([a-z])([A-Z])/g, '$1 $2');
}

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;

/** Spend by merchant, or by kind of spending with who got it one tap away. On real shapes most payees are under 5% of a month, so kinds of spending are what can be read. */
export function buildTreemap(items: Item[], unnamedKeys: Set<string>, by: 'merchant' | 'category' = 'merchant'): { groups: { n: string; items: TmItem[] }[]; list: TmItem[]; unnamed: { total: number; payees: Set<string> } } {
  const byName = new Map<string, { v: number; count: number; group: string; brand: string | null; category: string | null }>();
  const unnamed = { total: 0, payees: new Set<string>() };
  for (const it of items) {
    const v = rupees(it.amount.value);
    const noName = it.name === UNNAMED;
    if (isUnnamed(it, unnamedKeys)) {
      unnamed.total += v;
      unnamed.payees.add(noName ? it.key ?? it.name : it.name);
      continue;
    }
    const key = it.name;
    const cur = byName.get(key) ?? { v: 0, count: 0, group: it.group ?? 'Other', brand: it.brand, category: it.category };
    cur.v += v;
    cur.count += 1;
    byName.set(key, cur);
  }
  const named = [...byName.entries()].filter(([, o]) => o.v > 0); // A refund larger than its payments has nothing to draw.
  const groups = new Map<string, TmItem[]>();
  const put = (group: string, entry: TmItem) => { (groups.get(group) ?? groups.set(group, []).get(group)!).push(entry); };
  if (by === 'category') {
    const kinds = new Map<string, { group: string; category: string | null; payees: [string, number][]; count: number }>();
    for (const [n, o] of named) {
      const key = o.category ?? o.group;
      const cur = kinds.get(key) ?? { group: o.group, category: o.category, payees: [], count: 0 };
      cur.payees.push([n, o.v]);
      cur.count += o.count;
      kinds.set(key, cur);
    }
    // A detail can sit under two groups, such as Fees. Both then say whose, so no two blocks read the same.
    const labels = [...kinds.values()].map((k) => categoryLabel(k.group, k.category));
    for (const [key, k] of kinds) {
      const sorted = k.payees.sort((a, b) => b[1] - a[1]);
      const top = sorted.slice(0, 2).map(([n, v]) => `${n} ${inr(v)}`).join(', ');
      const label = categoryLabel(k.group, k.category);
      const n = labels.filter((l) => l === label).length > 1 ? `${label}, ${k.group.toLowerCase()}` : label;
      put(k.group, { id: `cat:${key}`, n, v: sorted.reduce((t, [, v]) => t + v, 0), sub: `${sorted.length === 1 ? '' : 'Most at '}${top}${sorted.length > 2 ? `, and ${plural(sorted.length - 2, 'more payee')}` : ''}.`, group: k.group, category: k.category ?? k.group, count: k.count, hint: sorted[0][0], byCategory: true });
    }
  } else {
    for (const [n, o] of named) put(o.group, { id: `payee:${n}`, n, v: o.v, sub: `${plural(o.count, 'payment')}, ${o.group}.`, group: o.group, brand: o.brand, category: o.category, count: o.count });
  }
  const list: TmItem[] = named.map(([n, o]) => ({ n, v: o.v, sub: `${plural(o.count, 'payment')}, ${o.group}`, group: o.group, brand: o.brand, category: o.category })).sort((a, b) => b.v - a.v);
  const out = [...groups.entries()].map(([n, gi]) => ({ n, items: gi }));
  if (unnamed.total > 0) out.push({ n: 'Unnamed', items: [{ id: 'unnamed', n: 'No name yet', v: unnamed.total, st: 'unk', sub: `${plural(unnamed.payees.size, 'payee')}, counted until named.`, group: 'Unnamed' }] });
  return { groups: out, list, unnamed };
}

/** A spending group's colour on the map: one hue per family, so the same colour means the same group and nothing else. */
const HUE: Record<string, string> = { Food: 'food', Shopping: 'shop', Housing: 'home' };
export const hueOf = (group: string): string => HUE[group] ?? 'other';
export const HUE_KEY: [string, string][] = [['food', 'Food'], ['shop', 'Shopping'], ['home', 'Housing'], ['other', 'Other']];

/** Which items a block holds: a kind of spending by its category, or a payee by name. The same test buildTreemap used to place them. */
export function blockMatch(b: TmItem, unnamedKeys: Set<string>, everything: boolean): (i: Item) => boolean {
  const members = b.members ?? [b];
  const kept = (i: Item) => !isUnnamed(i, unnamedKeys) && (everything || (i.spend_kind !== 'fixed' && i.spend_kind !== 'one_off'));
  if (b.byCategory) {
    const kinds = new Set(members.map((m) => m.category ?? m.group));
    return (i) => kept(i) && kinds.has(i.category ?? i.group ?? 'Other');
  }
  const names = new Set(members.map((m) => m.n));
  return (i) => kept(i) && names.has(i.name);
}

/** What a block's items came to in each of `months`, oldest first: the faint line inside it. From the days, so a month with none is 0. */
export function blockHistory(days: { day: string; items: Item[] }[], months: string[], match: (i: Item) => boolean): number[] {
  const at = new Map(months.map((m) => [m, 0]));
  for (const d of days) {
    const ym = d.day.slice(0, 7);
    if (!at.has(ym)) continue;
    for (const i of d.items) if (match(i)) at.set(ym, at.get(ym)! + rupees(i.amount.value));
  }
  return months.map((m) => at.get(m)!);
}

/**
 * A block's status tag, only where the data says it: there is a usual for each group, none for a kind of spending or a payee.
 * So a block is tagged only when it is the whole of its group on the map, and that group is above its usual.
 */
export function blockAbove(b: TmItem, groups: { n: string; items: TmItem[] }[], above: Set<string>): boolean {
  if (b.parts || b.st === 'unk' || !above.has(b.group)) return false;
  const own = groups.find((g) => g.n === b.group);
  return !!own && own.items.length === 1 && own.items[0].id === b.id;
}

/** The range chooser's label: the 30 days to the as-of date, a month, or a run of months. */
export function rangeLabel(p: PeriodDef, thirty: boolean, asOf: string): string {
  const y = asOf.slice(0, 4);
  if (thirty) return `To ${dayMonth(asOf)} ${y}`;
  if (p.from === p.to) return `${monthLong(p.from)} ${p.from.slice(0, 4)}`;
  const a = MONTHS[Number(p.from.slice(5)) - 1];
  const b = MONTHS[Number(p.to.slice(5)) - 1];
  return p.from.slice(0, 4) === p.to.slice(0, 4) ? `${a} to ${b} ${p.to.slice(0, 4)}` : `${a} ${p.from.slice(0, 4)} to ${b} ${p.to.slice(0, 4)}`;
}
/** The calendar's word for a period: the month's short name, 3M, FY, or Y for a calendar year. */
const periodMark = (p: PeriodDef): string => (p.from === p.to ? MONTHS[Number(p.from.slice(5)) - 1].toUpperCase() : p.id === 'q' ? '3M' : p.id === 'fy' ? 'FY' : 'Y');
const stepStatus = (step: string | null | undefined): StatStatus | undefined => (!step ? undefined : step[0] === 'r' ? 'above' : step[0] === 'g' ? 'below' : 'usual');
const verdictStatus = (v: 'normal' | 'above' | 'below' | null | undefined): StatStatus | undefined => (v === 'above' ? 'above' : v === 'below' ? 'below' : v === 'normal' ? 'usual' : undefined);

/** What a fixed cost's row says. Quiet unless it changed, is missing, or came twice. */
export function fixedSays(r: FixedCost): string {
  const amount = inr(rupees(r.amount));
  const usual = r.usual == null ? '' : inr(rupees(r.usual));
  const lastPaid = `${dayMonth(r.date)}`;
  switch (r.state) {
    case 'twice': return `Paid twice for ${monthLong(r.month)}: ${amount} in all.${usual ? ` Usually ${usual}.` : ''}`;
    case 'changed': return `${r.usual != null && r.amount > r.usual ? 'Up' : 'Down'} to ${amount} in ${monthLong(r.month)}.${usual ? ` Usually ${usual}.` : ''}`;
    case 'missing': return `Not seen since ${lastPaid}.${usual ? ` Usually ${usual}` : ` Last ${amount}`}, around the ${r.usual_day}${ordinal(r.usual_day)}.`;
    case 'stopped': return `Stopped. Last paid ${lastPaid}.`;
    case 'new': return `First seen ${lastPaid}.`;
    case 'due': return `Paid ${lastPaid}. Next around the ${r.usual_day}${ordinal(r.usual_day)}.`;
    case 'occasional': return `Not monthly. Last paid ${lastPaid}.`;
    default: return `Paid ${lastPaid}.`;
  }
}
const ATTENTION = { changed: 'Changed', twice: 'Paid twice', missing: 'Missing' } as const;
const isAttention = (r: FixedCost): r is FixedCost & { state: keyof typeof ATTENTION } => r.state in ATTENTION;

function fixedTitle(r: FixedCost): string {
  if (r.category === 'Housing:Rent') return r.share ? 'Rent, your share' : 'Rent';
  return r.name === UNNAMED ? 'No name yet' : r.name;
}
const fixedHref = (r: FixedCost) => drillHref({ by: 'fixed', period: '30', open: payeeHash(r.name) });
function FixedRow({ r }: { r: FixedCost }) {
  const rent = r.category === 'Housing:Rent';
  return (
    <li data-state={r.state} data-category={r.category ?? ''}>
      <Link to={fixedHref(r)}>
        <span className="icr"><Ico q={{ name: r.name, group: r.category ?? r.group, brand: r.brand }} /><b>{fixedTitle(r)}</b><small>{rent ? `For ${monthLong(r.month)}. ${r.name}. ` : ''}{fixedSays(r)}</small></span>
        <N>{inr(rupees(r.amount))}</N>
      </Link>
    </li>
  );
}

/** Fixed costs: a sentence and a total. Not a chart: there is nothing to compare until something changes. */
export function FixedCosts({ fixed }: { fixed: SpendAllocation['fixed'] }) {
  const flagged = fixed.rows.filter(isAttention);
  const quiet = fixed.rows.filter((r) => !isAttention(r));
  const monthly = rupees(fixed.monthly);
  const paid = rupees(fixed.paid);
  if (!fixed.rows.length) return null;
  const say = flagged.length ? `${plural(flagged.length, 'cost')} to look at.` : fixed.verdict === 'same' ? 'About the same as usual.' : 'Too early to say what is usual.';
  return (
    <section className="sec fixed" id="fixed" data-verdict={fixed.verdict ?? 'none'}>
      <h2 data-amount={Math.round(monthly)}>
        <Stat value={short(monthly)} period="MO" periodLabel="Each month" tag="fixed costs" testid="fixed" />
        <InfoButton title="Fixed costs" label="More about fixed costs"><p data-fixed-say>{say}{paid > 0 && paid < monthly ? <> <N>{short(paid)}</N> paid so far this month.</> : null}</p><p>Payments that repeat each month, such as rent and bills. The map below leaves them out.</p></InfoButton>
      </h2>
      {flagged.length ? <p>{say}</p> : null}
      {flagged.length ? (
        <ul className="rows" id="fixed-attention">
          {flagged.map((r) => (
            <li key={r.key} data-state={r.state}>
              <Link to={fixedHref(r)}>
                <span className="icr"><Ico q={{ name: r.name, group: r.category ?? r.group, brand: r.brand }} /><b>{fixedTitle(r)}</b><small>{fixedSays(r)}</small></span>
                <span><Chip step="a">{ATTENTION[r.state]}</Chip></span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      {quiet.length ? (
        <details className="aslist">
          <summary>See {flagged.length ? 'the other' : 'all'} {quiet.length}</summary>
          <ul className="rows" id="fixed-list">{quiet.map((r) => <FixedRow key={r.key} r={r} />)}</ul>
        </details>
      ) : null}
    </section>
  );
}

/** Bars drawn: one quarter. Enough points to judge a usual band and still "lately"; 26 buries the trend, under 8 is mostly noise. */
export const TREND_WEEKS = 13;

/** The opening: everyday spending in the last 30 days, against your usual 30 days. A calendar month is empty on the 3rd. SPEC section 3. */
function Rolling({ view, range }: { view: Snapshot; range: ReactNode }) {
  const r = view.spend.rolling!;
  const [read, setRead] = useState<ReactNode>(null);
  const spent = rupees(r.spent.value);
  const alloc = view.spend.allocation;
  const window = alloc ? view.spend.days.filter((d) => d.day >= alloc.window.from && d.day <= alloc.window.to).flatMap((d) => d.items) : [];
  const marked = alloc ? window.filter((i) => i.spend_kind === 'one_off').sort((a, b) => b.amount.value - a.amount.value) : r.one_offs;
  const large = alloc ? rupees(alloc.window.everyday.one_off) : r.one_offs.reduce((t, i) => t + rupees(i.amount.value), 0);
  const without = alloc ? spent - large : rupees(r.without_one_offs.value);
  // Like with like: without one-offs on both sides. A snapshot built before `everyday` existed reads as it did, until the next build.
  const like = r.everyday ?? null;
  const answer = like ? rupees(like.spent) : spent;
  const usual = like ? like.usual : r.usual;
  const verdict = like ? like.verdict : r.verdict;
  const groups = like ? like.groups.map((g) => ({ name: g.name, value: rupees(g.spent), verdict: g.verdict })) : r.groups.map((g) => ({ name: g.name, value: rupees(g.spent.value), verdict: g.verdict }));
  const all = r.trend.filter((t) => t.spent != null);
  const shown = all.slice(-TREND_WEEKS);
  const skipped = all.length - shown.length;
  const bars: TrendBar[] = shown.map((t, i) => {
    const change = t.mover ? rupees(t.mover.change) : 0;
    return {
      label: (shown.length - 1 - i) % 4 === 0 ? dayMonth(t.date) : '',
      value: Math.max(0, rupees(t.spent!)),
      group: t.mover?.group ?? null,
      change,
      read: <>{short(rupees(t.spent!))} in the 30 days to {dayMonth(t.date)}, with its one-offs. {t.mover ? <>Biggest mover: <b>{t.mover.group}</b>, {change > 0 ? 'up' : 'down'} <N>{short(Math.abs(change))}</N> on the week before.</> : i + skipped === 0 ? 'The first bar: nothing before it to compare.' : 'No group changed from the week before.'} <SeeAll to={drillHref({ by: 'everyday', period: `30to${t.date}` })} label={`the 30 days to ${dayMonth(t.date)}`} /></>,
    };
  });
  const top = Math.max(0, ...bars.map((b) => b.value));
  const average = bars.reduce((t, b) => t + b.value, 0) / Math.max(1, bars.length);
  const band = usual ? (short(rupees(usual.median - usual.spread)) === short(rupees(usual.median + usual.spread))
    ? <>usual about <N>{short(rupees(usual.median))}</N></>
    : <>usual <N>{short(rupees(usual.median - usual.spread))}</N>–<N>{short(rupees(usual.median + usual.spread))}</N></>) : null;
  const reading = (
    <>
      <p>{usual ? <>Your usual 30 days{like ? ' without one-offs' : ''}: <N>{short(rupees(usual.median - usual.spread))}</N> to <N>{short(rupees(usual.median + usual.spread))}</N>.</> : 'Not enough history yet to say what is usual.'}</p>
      <p>Everyday spending: no rent, bills or investing{like && large >= 1 ? ', and no large one-offs' : ''}.</p>
      {r.provisional_days ? <p data-note="provisional">{r.provisional_days} of these days are not on a statement yet, so this may rise.</p> : null}
      {r.stale ? <p data-note="stale">Nothing new has come in for over 2 days, so the latest days may read low.</p> : null}
    </>
  );
  return (
    <section className="full" id="rolling" data-verdict={verdict ?? 'none'}>
      {range}
      <h1 className="a" id="rolling-answer" data-amount={Math.round(answer)}>
        <Stat big value={short(answer)} period="30" periodLabel={`Last 30 days${like && large >= 1 ? ', without one-offs' : ''}`} status={verdictStatus(verdict)} testid="30d" />
        <InfoButton title="Reading this figure" label="About this figure">{reading}</InfoButton>
      </h1>
      <p className="sub">{band ?? 'Not enough history yet to say what is usual.'}</p>
      {large > 0 ? <div className="wrap">{like
        ? <p className="note" data-note="one-offs">Plus <N>{short(large)}</N> of large one-offs: {marked.slice(0, 3).map((i) => (i.name === UNNAMED ? 'No name yet' : i.name)).join(', ')}. <N>{short(spent)}</N> with them.</p>
        : <p className="note" data-note="one-offs">Includes <N>{short(large)}</N> of large one-offs: {marked.slice(0, 3).map((i) => (i.name === UNNAMED ? 'No name yet' : i.name)).join(', ')}. <N>{short(without)}</N> without.</p>}</div> : null}
      {bars.length > 1 ? (
        <div className="wrap wrap-first" id="rolling-trend">
          <h2 className="hd"><WithInfo text={`30-day totals, last ${shown.length === TREND_WEEKS ? `${TREND_WEEKS} weeks` : `${shown.length} weeks`}`} title="30-day totals" label="What the bars show"><p>Each bar is the 30 days up to that date, taken once a week.</p><TrendLegend bars={bars} average={`Average ${short(average)}`} /></WithInfo></h2>
          <TrendBars legend={false} bars={bars} label={`Everyday spending in each 30 days, one total a week for the last ${shown.length} weeks, with one-offs. Average ${short(average)}, highest ${short(top)}, latest ${short(bars[bars.length - 1].value)}.`} onRead={setRead} top={short(top)} last={short(bars[bars.length - 1].value)} average={`Average ${short(average)}`} />
          <Read text={read} />
        </div>
      ) : null}
      {groups.length ? (
        <div className="wrap"><ul className="rows" id="rolling-groups">
          {groups.map((g) => <li key={g.name} data-group={g.name} data-amount={g.value} data-verdict={g.verdict ?? undefined}><Link to={drillHref({ by: like ? 'regular' : 'everyday', of: [g.name], period: '30' })}><span className="icr"><Ico q={{ name: g.name, group: g.name }} /><b>{g.name}</b></span><span className="gv">{g.verdict === 'above' ? <Chip step="r2" kind="stat">Above</Chip> : g.verdict === 'below' ? <Chip step="g1" kind="stat">Below</Chip> : null}<N>{short(g.value)}</N></span></Link></li>)}
        </ul></div>
      ) : null}
    </section>
  );
}

/** How the map's figure and the opening's figure meet: they measure different things, and the page should say so before anyone adds them up. */
function AddsUp({ spent, shown, window }: { spent: number; shown: number; window: SpendAllocation['window'] }) {
  const e = window.everyday;
  const fixed = rupees(e.fixed);
  const one = rupees(e.one_off);
  const variable = rupees(e.variable);
  const outside = shown - variable;
  if (fixed < 1 && one < 1 && Math.abs(outside) < 1) return null;
  return (
    <details className="aslist" id="adds-up">
      <summary><span>How this meets the <N>{short(spent)}</N> above</span></summary>
      <table className="tbl"><tbody>
        <tr><td>Variable spending in it</td><td className="num"><N>{inr(variable)}</N></td></tr>
        {one >= 1 ? <tr><td>Large one-offs</td><td className="num"><N>{inr(one)}</N></td></tr> : null}
        {fixed >= 1 ? <tr><td>Regular costs it does not leave out, like help</td><td className="num"><N>{inr(fixed)}</N></td></tr> : null}
        <tr><td><b>Last 30 days, with one-offs</b></td><td className="num"><b><N>{inr(spent)}</N></b></td></tr>
      </tbody></table>
      {outside >= 1 ? <p className="note"><N>{inr(outside)}</N> of the map is bills, which the figure above leaves out.</p> : null}
    </details>
  );
}

const RANGES = [{ id: '30', label: '30 days' }, { id: 'month', label: 'Month' }, { id: 'q', label: '3 months' }, { id: 'year', label: 'Year' }];

export function Spend() {
  const view = useView();
  const trust = useStore().sources?.numbers.spend?.confidence;
  const route = useRoute();
  const { open } = useSheet();
  const list = periods(view);
  const hasRolling = !!view.spend.rolling;
  const [filters, setFiltersState] = useState<Filters>(() => {
    const group = route.params.get('group');
    const account = route.params.get('account');
    const only = route.params.get('only');
    const period = route.params.get('period') as PeriodId | null;
    const known = period && list.some((p) => p.id === period) ? period : null;
    return { period: known ?? 'month', group, account, unconfirmed: only === 'unconfirmed', thirty: hasRolling && !known };
  });
  const setFilters = (next: Filters) => {
    setFiltersState(next);
    const q = new URLSearchParams();
    if (next.period !== 'month' || !next.thirty) q.set('period', next.period);
    if (next.group) q.set('group', next.group);
    if (next.account) q.set('account', next.account);
    if (next.unconfirmed) q.set('only', 'unconfirmed');
    const s = q.toString();
    go(`spend${s ? `?${s}` : ''}`, { replace: true });
  };
  const period = list.find((p) => p.id === filters.period) ?? list[0];
  const [readPace, setReadPace] = useState<ReactNode>(null);
  const [readRng, setReadRng] = useState<{ n: ReactNode; tone: string } | null>(null);
  const [readTm, setReadTm] = useState<{ n: ReactNode; tone: string } | null>(null);
  const [fold, show] = useFolds(route.section);
  const cur = view.spend.month;
  const asOfDay = view.spend.day;
  const dim = daysInMonth(cur);
  const anyFilter = !!(filters.group || filters.account || filters.unconfirmed);
  const isThisMonth = period.id === 'month';
  const thirty = hasRolling && filters.thirty && isThisMonth && !anyFilter; // The running 30 days lead; this month folds under them.
  const groupNow = isThisMonth && filters.group && !filters.account && !filters.unconfirmed ? view.spend.groups.find((g) => g.name === filters.group) : undefined;

  const scoped = useMemo(() => view.spend.days.filter((d) => inPeriod(d, period)), [view, period]);
  const items = useMemo(() => scoped.flatMap((d) => d.items).filter((i) => matches(i, filters)), [scoped, filters]);
  const total = items.reduce((t, i) => t + rupees(i.amount.value), 0);

  const groupsAvailable = useMemo(() => [...new Set(view.spend.days.flatMap((d) => d.items.map((i) => i.group)).filter((g): g is string => !!g))].sort(), [view]);
  const accounts = useMemo(() => [...new Set(view.spend.days.flatMap((d) => d.items.map((i) => i.account)).filter((a): a is string => !!a))].sort(), [view]);

  const nothingAtAll = view.spend.days.every((d) => d.state === 'no_data' || d.items.length === 0) && !view.spend.groups.length && !view.position.cash;
  const curve = filters.account || filters.unconfirmed ? null : view.spend.month_curves?.curves.find((c) => c.group === (filters.group ?? null)) ?? null;
  // A group with nothing yet this month still has its months to compare against: early in a month that is the common case.
  const hasHistory = isThisMonth && !!curve?.past.some((m) => m.total !== 0);
  const noMatches = anyFilter && items.length === 0 && !groupNow && !hasHistory;
  // The month's total and each group's count rent in the month it is for. Rows below are payments by date, so a difference is said, not hidden.
  const exactSpent = isThisMonth && !anyFilter ? rupees(view.spend.spent.value) : groupNow ? rupees(groupNow.spent.value) : total;
  const movedRent = groupNow ? exactSpent - total : 0;
  const allThisMonth = view.spend.groups;
  const usualBand = view.spend.usual;
  const fcst = view.spend.month_end_forecast;
  const stepNow = (usualBand?.step ?? 'n') as Ladder;
  const aboveUsual = stepNow === 'r1' || stepNow === 'r2' || stepNow === 'r3';

  // Pace: the server's running totals (`curve`), so it ends on the heading. An account or unconfirmed filter has no history on the server: this month alone, from the days.
  const paceDays = useMemo(() => daysFor(view, cur, filters), [view, cur, filters]);
  const actual = useMemo(() => {
    if (curve) return runningByDay(curve.now, asOfDay);
    const out: number[] = [];
    paceDays.slice(0, asOfDay).reduce((t, d) => {
      out.push(t + d.value);
      return t + d.value;
    }, 0);
    return out;
  }, [curve, paceDays, asOfDay]);
  const pastLines = useMemo<PaceLine[]>(() => (curve ? curve.past.map((m) => ({ label: `${MONTHS[Number(m.month.slice(5)) - 1]} ${m.month.slice(2, 4)}`, values: runningByDay(m.points, dim, daysInMonth(m.month)), total: rupees(m.total), oneOff: rupees(m.one_off) })) : []), [curve, dim]);
  const medianLine = useMemo(() => (curve?.median ? runningByDay(curve.median, dim) : null), [curve, dim]);
  const forecast = !anyFilter && fcst && asOfDay < dim ? (() => {
    const v = rupees(fcst.value);
    const h = usualBand ? rupees(usualBand.spread) : 0;
    return { lo: v - h, hi: v + h, label: fc(v, h) };
  })() : null;

  // Usual-band rows.
  const rngAll = allThisMonth
    .filter((g) => !filters.group || g.name === filters.group)
    .filter(() => isThisMonth && !filters.account && !filters.unconfirmed)
    .map((g) => {
      const now = rupees(g.spent.value);
      const band2 = g.name === 'Uncategorized' ? null : g.usual;
      return { name: g.name, group: g.name, now, med: band2 ? rupees(band2.median) : null, v: band2 ? rupees(band2.spread) : null, step: (band2?.step ?? 'n') as Ladder };
    })
    .sort((a, b) => b.now - a.now);
  const offScale = view.spend.rolling && view.spend.allocation && !anyFilter ? rngAll.find((g) => g.name === 'Housing') : undefined; // On one shared scale, rent flattens every other row. It stays in the sum, without a bar.
  const rngItems = rngAll.filter((g) => g !== offScale);
  const rngMax = Math.max(1, ...rngItems.map((i) => Math.max(i.now, (i.med ?? 0) + (i.v ?? 0)))) * 1.12;
  const standout = rngItems.find((i) => i.step[0] === 'r');
  const standoutLow = rngItems.find((i) => i.step[0] === 'g');

  // Treemap: variable spending only, so it can show differences. Fixed costs and one-offs have their own places.
  const unnamedKeys = useMemo(() => new Set(view.payees.review.items.flatMap((i) => i.payments.map((p) => p.key))), [view]);
  const allocation = view.spend.allocation;
  const opening = !!(thirty && allocation); // The first screens read the running 30 days. Pick a range or filter and it follows that.
  const mapScope = useMemo(() => (opening ? view.spend.days.filter((d) => d.day >= allocation!.window.from && d.day <= allocation!.window.to).flatMap((d) => d.items) : items), [opening, view, allocation, items]);
  const askedForGroup = !!filters.group; // Asking for one group asks for all of it, fixed or not.
  const variable = useMemo(() => (askedForGroup ? mapScope : mapScope.filter((i) => i.spend_kind !== 'fixed' && i.spend_kind !== 'one_off')), [mapScope, askedForGroup]);
  const oneOffs = useMemo(() => (askedForGroup ? [] : mapScope.filter((i) => i.spend_kind === 'one_off').sort((a, b) => b.amount.value - a.amount.value)), [mapScope, askedForGroup]);
  const leftFixed = askedForGroup || opening ? 0 : mapScope.filter((i) => i.spend_kind === 'fixed').reduce((t, i) => t + rupees(i.amount.value), 0);
  const mapPeriod = opening ? '30' : filters.period; // The block's figure and its page read one period.
  const drillScope = scopeOf(filters);
  const tree = useMemo(() => buildTreemap(variable, unnamedKeys, askedForGroup ? 'merchant' : 'category'), [variable, unnamedKeys, askedForGroup]);
  const named = useMemo(() => tree.groups.filter((g) => g.n !== 'Unnamed'), [tree]); // No name yet is a row under the map, not a block in it.
  const variableTotal = tree.list.reduce((t, i) => t + i.v, 0) + tree.unnamed.total;
  const biggestGroup = useMemo(() => {
    const sums = new Map<string, number>();
    for (const p of tree.list) sums.set(p.group, (sums.get(p.group) ?? 0) + p.v);
    return [...sums.entries()].sort((a, b) => b[1] - a[1])[0];
  }, [tree]);
  const leader = tree.list[0];
  // Each block's last complete months, for its faint line: from the days, which the snapshot keeps for 13 months.
  const historyMonths = useMemo(() => view.spend.months.filter((m) => m.complete).map((m) => m.month).sort().slice(-6), [view]);
  const spark = useMemo(() => (historyMonths.length >= 3 ? (b: TmItem) => blockHistory(view.spend.days, historyMonths, blockMatch(b, unnamedKeys, askedForGroup)) : undefined), [view, historyMonths, unnamedKeys, askedForGroup]);
  // Groups above their usual, over the map's own period: the running 30 days, or this month. Other periods have no usual.
  const aboveGroups = useMemo(() => {
    if (opening) {
      const r = view.spend.rolling!;
      return new Set((r.everyday?.groups ?? r.groups).filter((g) => g.verdict === 'above').map((g) => g.name));
    }
    return isThisMonth && !filters.account && !filters.unconfirmed ? new Set(view.spend.groups.filter((g) => g.name !== 'Uncategorized' && g.usual?.step?.[0] === 'r').map((g) => g.name)) : new Set<string>();
  }, [opening, view, isThisMonth, filters]);

  const tiles = monthTiles(view);
  const queue = view.payees.review.items;
  const queueTotal = queue.reduce((t, q) => t + rupees(q.month_total.value), 0);
  const startMonth = route.params.get('m');
  const clampMonth = (m: string | null): string => {
    if (!m || !/^\d{4}-\d{2}$/.test(m)) return cur;
    return tiles.some((t) => t.ym === m && !t.fut) ? m : cur;
  };

  if (nothingAtAll) {
    return (
      <>
        <PageHeader title="Spend" />
        <StateBar />
        <main>
          <h1 className="a">No spending yet this month.</h1>
          <p className="sub">Payments appear here after your next statement or bank message.</p>
          <CheckAgain />
        </main>
      </>
    );
  }

  // The range chooser: the running 30 days, a month (stepping back one), 3 months, or the year.
  const yearId: PeriodId = list.some((p) => p.id === 'fy') ? 'fy' : 'cal';
  const rangeId = thirty ? '30' : period.id === 'month' || period.id === 'prev' ? 'month' : period.id === 'q' ? 'q' : 'year';
  const pick = (id: string) => {
    if (id === '30') setFilters({ period: 'month', group: null, account: null, unconfirmed: false, thirty: true });
    else setFilters({ ...filters, thirty: false, period: id === 'month' ? 'month' : id === 'q' ? 'q' : yearId });
  };
  const hasPrev = list.some((p) => p.id === 'prev');
  const range = (
    <RangeChooser
      testid="spend"
      label={rangeLabel(period, thirty, view.meta.as_of)}
      options={RANGES.filter((o) => o.id !== '30' || hasRolling)}
      value={rangeId}
      onPick={pick}
      prevLabel="Month before"
      nextLabel="Month after"
      onPrev={rangeId === 'month' && period.id === 'month' && hasPrev ? () => setFilters({ ...filters, thirty: false, period: 'prev' }) : undefined}
      onNext={period.id === 'prev' ? () => setFilters({ ...filters, thirty: false, period: 'month' }) : undefined}
    />
  );

  const paceNote = !curve
    ? view.spend.month_curves ? 'Past months are drawn for all spending or one group, not for one account or for unconfirmed payments.' : 'This month only: this build has no past months to draw.'
    : !pastLines.length ? 'No complete past month to compare with yet.'
    : `Faint: ${pastLines.length === 1 ? 'your last complete month' : `your last ${pastLines.length} complete months`}, with their one-offs. ${curve.median ? 'Dashed: their median by day, with one-offs taken out.' : `${pastLines.length === 1 ? 'One month is' : `${pastLines.length} months are`} too few for a median, so there is none yet.`} Tap a line to name it.`;
  const rngTitle: ReactNode = standout ? <>Up this month: <b className="fold-k">{standout.name}</b> <Chip step="r2" kind="stat">Above</Chip></> : standoutLow ? <>Down this month: <b className="fold-k">{standoutLow.name}</b> <Chip step="g1" kind="stat">Below</Chip></> : 'This month by group';
  const rngBody = (
    <>
      {rngItems.length ? <p>Grey is your usual by this date. Tap a row to read it.</p> : null}
      <Rng items={rngItems} max={rngMax} onRead={(n, tone) => setReadRng({ n, tone })} seeAll={(i) => (i.now ? drillHref({ ...drillScope, by: 'group', of: [i.group ?? i.name], period: filters.period }) : null)} />
      <ToneRead value={readRng} />
      {offScale ? (
        <ul className="rows" id="groups-rest">
          <li data-group={offScale.name} data-amount={offScale.now}><div className="r"><span className="icr"><Ico q={{ name: offScale.name, group: offScale.name }} /><b>{offScale.name}</b><small>Mostly rent. No bar, or the rows above could not be read.</small></span><N>{inr(offScale.now)}</N></div></li>
          <li id="groups-total" data-amount={exactSpent}><div className="r"><span><b>All of it so far</b></span><N><b>{inr(exactSpent)}</b></N></div></li>
        </ul>
      ) : null}
      <details className="aslist mt4">
        <summary>See as list</summary>
        <table className="tbl"><thead><tr><th scope="col">Group</th><th scope="col" className="num">So far</th><th scope="col" className="num">Usual by now</th></tr></thead><tbody>
          {rngAll.map((i) => <tr key={i.name}><td><Link className="drill-day" to={drillHref({ ...drillScope, by: 'group', of: [i.group ?? i.name], period: filters.period })}><b>{i.name}</b></Link></td><td className="num"><N>{inr(i.now)}</N></td><td className="num wrapn">{i.med != null && i.v != null ? <N>{fc(i.med, i.v)}</N> : 'Not enough yet'}</td></tr>)}
        </tbody>{rngAll.length > 1 ? <tfoot><tr><td><b>All of it so far</b></td><td className="num"><N>{inr(exactSpent)}</N></td><td /></tr></tfoot> : null}</table>
      </details>
    </>
  );
  const hasRng = !!(rngItems.length || offScale);
  const rngSection = hasRng ? (thirty
    ? <Fold id="groups-now" title={rngTitle} {...fold('groups-now')}>{rngBody}</Fold>
    : <section className="sec" id="groups-now"><h2>{standout ? <><span className="u-hand u-bad">{standout.name}</span> is what is different this month</> : standoutLow ? <>You are spending <span className="u-hand u-good">less than usual</span> on {standoutLow.name} this month</> : 'This month by group'}</h2>{rngBody}</section>) : null;
  const rentNote = Math.abs(movedRent) >= 1 ? <p className="note" data-note="rent-moved" data-amount={movedRent}><N>{inr(Math.abs(movedRent))}</N> of rent {movedRent > 0 ? 'paid last month counts in this one, so it is in the total and not in the map' : 'paid this month counts in the last, so it is in the map and not in the total'}.</p> : null;
  const unnamedRules = tree.unnamed.total >= variableTotal / 2;
  const unnamedLeads = !askedForGroup && !!biggestGroup && tree.unnamed.total > biggestGroup[1]; // The map's biggest block has no name: the heading must not say otherwise.
  const blockHref = (b: TmItem): string | null => {
    if (b.byCategory) return drillHref({ ...drillScope, by: 'category', of: (b.members ?? [b]).map((m) => m.category ?? m.group), period: mapPeriod });
    return drillHref({ ...drillScope, by: 'group', of: [filters.group ?? b.group], period: mapPeriod, open: b.parts ? null : payeeHash(b.n) });
  };
  const hues = [...new Set(tree.list.map((p) => hueOf(p.group)))];
  const payeesTitle = askedForGroup ? (leader ? `You spent the most at ${leader.n}` : 'Who gets the money') : unnamedRules ? 'Most of it has no name yet' : biggestGroup ? (unnamedLeads ? `Of what has a name, ${biggestGroup[0]} took the most` : `${biggestGroup[0]} took the most`) : 'Only large one-offs in this view';
  const payeesAbout = (
    <>
      <p>
        {askedForGroup ? null : <><N>{short(variableTotal)}</N> of variable spending{opening ? ' in the last 30 days' : ''}. </>}
        {leftFixed > 0 ? <><N>{short(leftFixed)}</N> of fixed costs left out. </> : null}
        {unnamedLeads && !unnamedRules ? <>More, <N>{short(tree.unnamed.total)}</N>, has no name yet. </> : null}
        {variableTotal > 0 ? 'Bigger blocks are more money; a colour is a group. Tap one to see who.' : null}
      </p>
      {opening && view.spend.rolling ? <AddsUp spent={rupees(view.spend.rolling.spent.value)} shown={variableTotal} window={allocation!.window} /> : null}
    </>
  );
  const hlName = askedForGroup ? leader?.n : unnamedRules ? 'no name yet' : biggestGroup?.[0];
  const payeesHeading = hlName && payeesTitle.includes(hlName) ? (() => {
    const at = payeesTitle.indexOf(hlName);
    const rest = payeesTitle.slice(at + hlName.length);
    return <>{payeesTitle.slice(0, at)}<Hl>{hlName}</Hl>{rest.trim() ? <> <WithInfo text={rest.trim()} title="Who gets the money" label="About the map">{payeesAbout}</WithInfo></> : <InfoButton title="Who gets the money" label="About the map">{payeesAbout}</InfoButton>}</>;
  })() : <WithInfo text={payeesTitle} title="Who gets the money" label="About the map">{payeesAbout}</WithInfo>;
  const variableSection = variableTotal > 0 || oneOffs.length ? (
    <section className="sec" id="payees" data-total={Math.round(variableTotal)} data-named={Math.round(variableTotal - tree.unnamed.total)} data-by={askedForGroup ? 'merchant' : 'category'} data-one-off={oneOffs.reduce((t, i) => t + rupees(i.amount.value), 0)} data-left-fixed={leftFixed}>
      <h2>{payeesHeading}</h2>
      {rentNote}
      {tree.list.length ? <Treemap groups={named} onRead={(n, tone) => setReadTm({ n, tone })} onUnnamed={() => go('names?from=spend')} seeAll={blockHref} hue={(b) => hueOf(b.group)} tag={(b) => (blockAbove(b, named, aboveGroups) ? <Chip step="r2" kind="stat">Above</Chip> : null)} spark={spark} /> : null}
      <ToneRead value={readTm} />
      {hues.length ? <div className="gt-key" aria-label="Colours">{HUE_KEY.filter(([k]) => hues.includes(k)).map(([k, label]) => <span key={k}><i data-g={k} aria-hidden="true" />{label}</span>)}</div> : null}
      {tree.unnamed.total > 0 ? (
        <Link className="nn-row" to={queue.length ? 'names?from=spend' : drillHref({ ...drillScope, by: 'unnamed', of: undefined, period: mapPeriod })} data-unnamed data-amount={Math.round(tree.unnamed.total)}>
          <span className="nn-l"><b>No name yet</b><N>{short(tree.unnamed.total)}</N></span>
          <span className="nn-act">{queue.length ? `Name ${queue.length} ${queue.length === 1 ? 'payee' : 'payees'}` : 'See them'} ›</span>
        </Link>
      ) : null}
      {queue.length && tree.unnamed.total && isThisMonth && !anyFilter && !opening && tree.unnamed.total - queueTotal >= 1 ? <p className="note mt4">The other <N>{inr(tree.unnamed.total - queueTotal)}</N> with no name is not in the list to name yet.</p> : null}
      {tree.list.length || tree.unnamed.total ? (
        <details className="aslist">
          <summary>See as list</summary>
          <ul className="rows bar">
            {tree.list.map((p) => <li key={p.n}><Link to={drillHref({ ...drillScope, by: 'group', of: [p.group], period: mapPeriod, open: payeeHash(p.n) })}><span className="icr"><Ico q={{ name: p.n, group: p.category ?? p.group, brand: p.brand }} /><b>{p.n}</b><small>{p.sub}</small></span><N>{inr(p.v)}</N></Link></li>)}
            {tree.unnamed.total > 0 ? <li><Link to="names?from=spend"><span className="icr"><Ico q={{ unnamed: true }} /><b>No name yet</b><small>{tree.unnamed.payees.size} {tree.unnamed.payees.size === 1 ? 'payee' : 'payees'}{opening ? ' in the last 30 days' : ''}, tap to name</small></span><span><N>{inr(tree.unnamed.total)}</N></span></Link></li> : null}
          </ul>
        </details>
      ) : null}
      {oneOffs.length ? (
        <div id="one-offs">
          <h3 className="hd mt5">Large one-offs, kept out of the map</h3>
          <ul className="rows">
            {oneOffs.map((i) => (
              <li key={`${i.key}:${i.date}:${i.amount.value}`} data-reason={i.spend_kind_reason}>
                <Link to={drillHref({ ...drillScope, by: 'oneoff', of: undefined, period: mapPeriod, open: payeeHash(i.name) })}><span className="icr"><Ico q={i.name === UNNAMED ? { unnamed: true } : { name: i.name, group: i.category ?? i.group, brand: i.brand }} /><b>{i.name === UNNAMED ? 'No name yet' : i.name}</b><small>{dayMonth(i.date)}, {categoryLabel(i.group ?? 'Other', i.category)}</small></span><N>{inr(rupees(i.amount.value))}</N></Link>
              </li>
            ))}
          </ul>
          {allocation ? <p className="note">A one-off is a single payment of <N>{short(rupees(allocation.rule.one_off_threshold))}</N> or more that does not repeat, or travel and vehicle costs of <N>₹2,000</N> or more.</p> : null}
        </div>
      ) : null}
    </section>
  ) : <section className="sec" id="payees"><h2>Who gets the money</h2><p>Nothing to show yet: no payments in this view.</p>{rentNote}</section>;

  const header = (
    <>
      <PageHeader title="Spend" to={`reports?from=spend${filters.group ? `&group=${encodeURIComponent(filters.group)}` : ''}${filters.account ? `&account=${encodeURIComponent(filters.account)}` : ''}${filters.period !== 'month' ? `&period=${filters.period}` : ''}${filters.unconfirmed ? '&only=unconfirmed' : ''}`} />
      <StateBar />
    </>
  );
  const chips = (
    <div className="chips" role="group" aria-label="Filters">
      <button className={`chip${anyFilter ? ' on' : ''}`} onClick={() => open(<FilterSheet groups={groupsAvailable} accounts={accounts} value={filters} onDone={(v) => setFilters({ ...filters, ...v, thirty: false })} />, 'Only show')}>
        {filters.unconfirmed ? 'Unconfirmed only' : filters.group ?? filters.account ?? 'All spending'}
      </button>
    </div>
  );

  if (noMatches) {
    return (
      <>
        {header}
        <main>
          {range}
          <h1 className="a">Nothing matches these filters.</h1>
          <p className="sub">{filters.unconfirmed ? 'Everything in this period is on a statement.' : `No payments for ${filters.group ?? filters.account} in this period.`}</p>
          {chips}
          <div className="wrap mt4"><button className="bigbtn alt" onClick={() => setFilters({ ...filters, group: null, account: null, unconfirmed: false })}>Show all spending</button></div>
        </main>
      </>
    );
  }

  const zero = isThisMonth && !anyFilter && exactSpent === 0;
  // Zero rests on the data arriving. When it has stopped, zero is not "nothing spent".
  const doubted = trust === 'estimate' || trust === 'low';
  const sentence = zero ? (doubted ? 'What has come in shows no payments, and it may not be everything.' : 'Nothing spent yet. Your usual appears as the month goes on.') : null;
  const filterTag = filters.unconfirmed ? 'unconfirmed' : filters.group ?? filters.account ?? undefined;
  const monthStat = zero
    ? <>{doubted ? 'No payments seen' : 'Nothing spent'} so far in {monthLong(cur)}</>
    : <Stat value={inr(exactSpent)} period={periodMark(period)} periodLabel={isThisMonth ? `${monthLong(cur)} so far` : period.label} status={isThisMonth && !anyFilter && usualBand ? stepStatus(stepNow) : undefined} tag={filterTag} testid="month" />;
  const monthSub = isThisMonth && !anyFilter ? (
    <p className="sub">
      {sentence ?? (usualBand ? (aboveUsual ? `Above your usual for the ${asOfDay}${ordinal(asOfDay)}.` : stepNow[0] === 'g' ? `Below your usual for the ${asOfDay}${ordinal(asOfDay)}.` : `Normal for the ${asOfDay}${ordinal(asOfDay)}.`) : 'Not enough months yet to say what is usual.')}
      {fcst && asOfDay < dim && !zero ? <> Likely <N>{forecast?.label ?? ''}</N> by month end.</> : null}
    </p>
  ) : period.partial ? <p className="sub">{period.partial}</p> : <p className="sub">{monthLong(period.from)}{period.from !== period.to ? ` to ${monthLong(period.to)}` : ''}, added up from your payments.</p>;
  const monthRest = (
    <>
      {monthSub}
      {isThisMonth && !(view.spend.rolling?.stale && !anyFilter) ? <div className="wrap"><DoubtNote name="spend" /></div> : null}
      {chips}
      {items.length ? <div className="wrap" id="spend-see-all"><Link className="tlink" to={drillHref({ ...drillScope, period: filters.period })}>See all payments</Link></div> : null}
    </>
  );
  const monthBlock = thirty
    ? <Fold id="spend-month" titleId={zero ? undefined : 'spend-answer'} amount={zero ? undefined : Math.round(exactSpent)} title={monthStat} {...fold('spend-month')}>{monthRest}</Fold>
    : (
      <div id="spend-month">
        {zero ? <h1 className="a">{monthStat}</h1> : <h1 className="a" id="spend-answer" data-amount={Math.round(exactSpent)}>{monthStat}</h1>}
        {monthRest}
      </div>
    );
  const paceBody = (
    <>
      <Pace seeAll={(d) => (d <= asOfDay ? drillHref({ ...drillScope, period: cur }) : null)} actual={actual.length ? actual : [0]} past={pastLines} median={medianLine} dim={dim} today={Math.max(1, asOfDay)} monthLabel={MONTHS[Number(cur.split('-')[1]) - 1]} forecast={forecast} label={`Spending so far this month: ${inr(actual[actual.length - 1] ?? 0)}. ${forecast ? `Likely ${forecast.label} by month end.` : ''} A list of the same figures is below.`} onRead={setReadPace} />
      <Read text={readPace} />
      <p className="note" id="pace-note">{paceNote}</p>
      <details className="aslist">
        <summary>See as list</summary>
        {pastLines.length ? <ul className="rows" id="pace-months">
          {pastLines.map((l) => <li key={l.label} data-amount={l.total}><div className="r"><span><b>{l.label}</b><small>{inr(l.values[Math.min(asOfDay, l.values.length) - 1] ?? 0)} by the {asOfDay}{ordinal(asOfDay)}{l.oneOff >= 1 ? `. With ${inr(l.oneOff)} of one-offs` : ''}</small></span><N>{inr(l.total)}</N></div></li>)}
        </ul> : null}
        <table className="tbl"><thead><tr><th>Day</th><th className="num">Spent by then</th></tr></thead><tbody>
          {actual.map((v, i) => (i % 5 === 4 || i === actual.length - 1) ? <tr key={i}><td><b>{i + 1} {MONTHS[Number(cur.split('-')[1]) - 1]}</b></td><td className="num"><N>{inr(v)}</N></td></tr> : null)}
        </tbody></table>
      </details>
    </>
  );
  const against = <>This month against <span className="u-rule">your usual</span></>;
  const paceBlock = !isThisMonth ? null : thirty
    ? <Fold id="pace" title={against} {...fold('pace')}>{paceBody}</Fold>
    : <div className="wrap wrap-first" id="pace"><h2 className="hd">{against}</h2>{paceBody}</div>;
  const months = <MonthSection key={route.raw.includes('m=') ? startMonth ?? 'm' : 'cur'} view={view} f={filters} initial={clampMonth(startMonth)} tiles={tiles} fold={fold} show={show} />;

  return (
    <>
      {header}
      <main className="duo">
        <div className="pri">
        {thirty ? (
          <div>
            <Rolling view={view} range={range} />
            {opening ? <div className="alloc"><FixedCosts fixed={allocation!.fixed} /><div>{variableSection}</div></div> : null}
          </div>
        ) : (
          <>
            <div>{range}{monthBlock}</div>
            <div>{paceBlock}{rngSection}</div>
          </>
        )}
        </div>
        <div className="side">
        {/* The opening's column folds this month away under rows; a month or range puts the map here. On a phone the two follow on. */}
        {thirty ? <div className="folds">{rngSection}{monthBlock}{paceBlock}{opening ? null : variableSection}</div> : <div>{variableSection}</div>}
        <div className="folds">{months}</div>
        </div>
      </main>
    </>
  );
}

const ordinal = (n: number): string => {
  const t = n % 100;
  if (t >= 11 && t <= 13) return 'th';
  return ['th', 'st', 'nd', 'rd', 'th', 'th', 'th', 'th', 'th', 'th'][n % 10];
};

export { ladder, ladderChip, monthTotals, short };
