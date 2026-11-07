/** What Today and Spend both read from the days: month totals, tiles, usual at the same day. Pure, from the snapshot alone. */
import type { ReactNode } from 'react';
import { CloseButton, Link, Tag, useSheet } from '../ui/kit';
import { StatusMark } from '../ui/charts';
import { MONTHS, inr, rupees, ymAdd, daysInMonth } from '../lib/format';
import { ladder, LADDER_WORD, medianSpread, type Ladder } from '../lib/status';
import { useStore, useView } from '../lib/store';
import { doubtWord, evidence, type Item, type NumberName, type Snapshot } from '../lib/data';

export type DayRow = Snapshot['spend']['days'][number];

const kk = (v: number): string => (v < 0 ? `−${kk(-v)}` : v >= 100000 ? `${(v / 100000).toFixed(1).replace(/\.0$/, '')} L` : v >= 1000 ? `${Math.round(v / 1000)}k` : String(Math.round(v)));

export interface Tile { ym: string; label: string; text: string; s: string; step: Ladder; aria: string; fut: boolean; soFar?: boolean; now?: boolean; partial?: boolean }

/** Spent by month, from the days. A month before the data has no total: it is unknown, never zero. */
export function monthTotals(view: Snapshot): Map<string, number> {
  const out = new Map<string, number>();
  for (const d of view.spend.days) {
    if (d.state === 'no_data') continue;
    const ym = d.day.slice(0, 7);
    out.set(ym, (out.get(ym) ?? 0) + (d.spend ? rupees(d.spend.value) : 0));
  }
  // Rent counts in the month it is for, as the Spend heading and Reports do. Days stay on the date paid: MonthSection says when the two differ.
  for (const m of view.spend.months) if (m.spent && out.has(m.month)) out.set(m.month, rupees(m.spent.value));
  if (out.has(view.spend.month)) out.set(view.spend.month, rupees(view.spend.spent.value));
  return out;
}

/** The 12 months ending at the as-of month. Tiles carry the state against the owner's usual. */
export function monthTiles(view: Snapshot): Tile[] {
  const cur = view.spend.month;
  const totals = monthTotals(view);
  const complete = view.spend.months.filter((m) => m.complete && m.spent).map((m) => rupees(m.spent!.value));
  const usual = complete.length >= 6 ? medianSpread(complete) : null;
  const med = usual?.median ?? null;
  return Array.from({ length: 12 }, (_, i) => {
    const ym = ymAdd(cur, i - 11);
    const label = MONTHS[Number(ym.split('-')[1]) - 1];
    const known = totals.has(ym);
    if (!known) return { ym, label, text: '', s: 'fut', step: 'n' as Ladder, aria: `${label}: no data`, fut: true, now: ym === cur };
    const v = totals.get(ym)!;
    const isNow = ym === cur;
    const step: Ladder = usual && !isNow ? ladder(v, usual.median, usual.spread, 2000) : 'n';
    const s = step !== 'n' ? step : isNow || med == null || v < med ? 't1' : 't2';
    return { ym, label, text: kk(v), s, step, aria: `${label}: ${inr(v)}${isNow ? ' so far' : ''}, ${LADDER_WORD[step].toLowerCase()}`, fut: false, soFar: isNow, now: isNow };
  });
}

/** Money put in, by month: indigo says size only, never a state. Vests never count. */
export function investTiles(view: Snapshot): Tile[] {
  const cur = view.spend.month;
  const by = new Map(view.invest.contributions.map((c) => [c.month, rupees(c.amount.value)]));
  const covered = new Set(view.invest.put_in_source?.covered_months ?? []);
  const partial = new Set(view.invest.put_in_source?.partial_months ?? []);
  return Array.from({ length: 12 }, (_, i) => {
    const ym = ymAdd(cur, i - 11);
    const label = MONTHS[Number(ym.split('-')[1]) - 1];
    const part = partial.has(ym) || (view.invest.contributions.find((c) => c.month === ym)?.partial ?? false);
    const v = by.get(ym) ?? (covered.has(ym) ? 0 : undefined); // ₹0 only where every connected source covers the month.
    if (v == null && part) return { ym, label, text: '', s: 'i0', step: 'n' as Ladder, aria: `${label}: partial, not every source covers this month`, fut: false, now: ym === cur, partial: true };
    if (v == null) return { ym, label, text: '', s: 'fut', step: 'n' as Ladder, aria: `${label}: nothing recorded`, fut: true, now: ym === cur };
    const s = v < 50000 ? 'i1' : v < 70000 ? 'i2' : v < 100000 ? 'i3' : 'i4';
    return { ym, label, text: kk(v), s, step: 'n' as Ladder, aria: `${label}: ${inr(v)} put in${ym === cur ? ' so far' : ''}${part ? ', partial, not every source covers this month' : ''}`, fut: false, soFar: ym === cur, now: ym === cur, partial: part };
  });
}

/** Shares received: their value, kept apart from money put in because no cash moved. */
export function VestsNote({ view }: { view: Snapshot }) {
  const first = ymAdd(view.spend.month, -11);
  const items = (view.invest.vests?.items ?? []).filter((v) => v.date.slice(0, 7) >= first);
  if (!items.length) return null;
  return <p className="note" data-note="vests-apart">Also received as shares, not cash: {inr(items.reduce((t, v) => t + rupees(v.value.value), 0))} over the last 12 months, at their value each day.</p>;
}

export function MonthTiles({ tiles, toMonth, picked, onPick }: { tiles: Tile[]; toMonth?: (ym: string) => string; picked?: string; onPick?: (ym: string) => void }) {
  return (
    <div className="tiles">
      {tiles.map((t) => {
        const inner: ReactNode = <><small>{t.label}{t.soFar ? <i className="sofar" aria-hidden="true" title="so far" /> : null}</small>{t.text}{t.partial ? <i className="part">partial</i> : null}<StatusMark step={t.step} /></>;
        const active = onPick ? picked === t.ym : t.now; // One yellow cap: the month being read, or else this month.
        const cls = `cell${active ? ' now' : ''}`;
        const current = t.now ? ('date' as const) : undefined;
        if (t.fut) return <div key={t.ym} className={`${cls} fut`} aria-current={current}><small>{t.label}</small></div>;
        if (onPick) return <button key={t.ym} className={cls} aria-current={current} data-s={t.s} data-step={t.step} data-month={t.ym} aria-pressed={picked === t.ym} aria-label={t.aria} onClick={() => onPick(t.ym)}>{inner}</button>;
        return <Link key={t.ym} className={cls} aria-current={current} data-s={t.s} data-step={t.step} to={toMonth ? toMonth(t.ym) : ''} aria-label={t.aria}>{inner}</Link>;
      })}
    </div>
  );
}

/** Share of this month's rupees on a statement, from the items. Null when nothing has been spent, so never NaN. */
export function statementShare(view: Snapshot): number | null {
  let all = 0;
  let proven = 0;
  for (const d of view.spend.days) {
    if (!d.day.startsWith(view.spend.month)) continue;
    for (const it of d.items) {
      const v = rupees(it.amount.value);
      all += v;
      if (it.amount.confidence === 'statement') proven += v;
    }
  }
  if (all <= 0) return null;
  const pct = (proven / all) * 100;
  return Number.isInteger(Math.round(pct * 10) / 10) ? Math.round(pct) : Math.round(pct * 10) / 10;
}

/** For each group, what it had reached by this day of the month, in up to 6 earlier months. Months that started before the data count for nothing. */
export function groupsAtDay(view: Snapshot): Record<string, number[]> {
  const cur = view.spend.month;
  const day = view.spend.day;
  const first = view.spend.first_day;
  const out: Record<string, number[]> = {};
  for (let i = 1; i <= 6; i++) {
    const ym = ymAdd(cur, -i);
    if (first && `${ym}-01` < first.slice(0, 7) + '-01') continue;
    const sums: Record<string, number> = {};
    const lastDay = Math.min(day, daysInMonth(ym));
    let seen = false;
    for (const d of view.spend.days) {
      if (!d.day.startsWith(ym) || Number(d.day.slice(8)) > lastDay) continue;
      if (d.state !== 'no_data') seen = true;
      for (const it of d.items) {
        const g = it.group ?? 'Uncategorized';
        sums[g] = (sums[g] ?? 0) + rupees(it.amount.value);
      }
    }
    if (!seen) continue;
    for (const g of view.spend.groups) (out[g.name] ??= []).push(sums[g.name] ?? 0);
  }
  return out;
}

export const allItems = (days: DayRow[]): Item[] => days.flatMap((d) => d.items);

/** Replay of 5 closed cycles (a back-test): the projection ran about a fifth under what really left the bank. Said wherever it is shown. */
export const LIKELY_BILLS_HONEST = 'These are estimates. On past months they came in about a fifth under what really left your bank, so expect to pay more.';

/** The label under a range. It is worded from what the build measured: "most" only once most past months really did land inside. */
export function rangeLabel(view: Snapshot): string {
  const r = view.forecast.before_salary?.range;
  if (!r || r.tested < 5) return 'still being tested: too few months to say yet';
  return r.held * 2 > r.tested ? "most months land here; a big one-off won't" : `still being tested: ${r.held} of ${r.tested} past months landed here`;
}

export function rangeWhy(view: Snapshot): string {
  const r = view.forecast.before_salary?.range;
  const base = "It's an estimate from your last 6 months. Big one-offs and moves to investing are counted apart, so a month with one can land outside. They are not hidden: they show on Spend.";
  return r && r.tested ? `${base} In a look back, ${r.held} of ${r.tested} past months landed in the range made from the months before them.` : base;
}

export function StillTesting() {
  const { open } = useSheet();
  const view = useView();
  return (
    <button type="button" className="testing" onClick={(e) => { e.stopPropagation(); open(<><h2>How sure this range is</h2><p>{rangeWhy(view)}</p><CloseButton /></>, 'How sure this range is'); }}>{rangeLabel(view)}</button>
  );
}

/** What a figure leans on is late, gone or unreadable, and the figure shows it (doubtWord). Null when it is firm, mostly proven, or the box has not said. */
function useDoubt(name: NumberName): { word: string; line: string | null } | null {
  const { sources, settings } = useStore();
  const view = useView();
  const trust = sources?.numbers[name];
  const word = trust ? doubtWord(trust.confidence, evidence(view, name, settings.soft)) : null;
  return word ? { word, line: trust!.line } : null;
}

/** The mark on a figure inside a row, whose sheet carries the line. */
export function DoubtTag({ name, fallback }: { name: NumberName; fallback?: string | null }) {
  const doubt = useDoubt(name);
  const word = doubt?.word ?? fallback;
  return word ? <span data-doubt={name}><Tag>{word}</Tag></span> : null;
}

/** The mark and its reason, as plain text, just under a figure or in its sheet. */
export function DoubtNote({ name, unlessSameAs }: { name: NumberName; unlessSameAs?: NumberName }) {
  const doubt = useDoubt(name);
  const other = useDoubt(unlessSameAs ?? name);
  if (!doubt) return null;
  const said = unlessSameAs && other?.line === doubt.line; // One sentence once on a page: the mark stays, the reason is above.
  // An estimate is the usual case, so its reason waits one tap away. Low confidence says why at once.
  if (said || !doubt.line || doubt.word !== 'Estimate') return <p className="note doubt" data-doubt={name}><Tag>{doubt.word}</Tag>{said ? null : plainReason(doubt.line ?? '')}</p>;
  return <details className="note doubt why" data-doubt={name}><summary><Tag>{doubt.word}</Tag>Why</summary>{plainReason(doubt.line)}</details>;
}

export const plainReason = (reason: string): string => reason.replace(/\bBank SMS\b/g, 'Bank messages').replace(/\b(?:bank )?SMS\b/g, 'bank messages');
