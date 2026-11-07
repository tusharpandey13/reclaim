/** The payments behind a figure: one page per kind, group, day or month, with its own URL. Reached from any tapped amount, and always says which period it is. */
import { useEffect, useMemo, useState } from 'react';
import { PageHeader, StateBar } from '../App';
import { Chip, Hl, Ico, Link, N, NameChip, Tag } from '../ui/kit';
import { dayLabel, dayMonth, inr, monthLong, rupees } from '../lib/format';
import { go, useRoute } from '../lib/router';
import { useView } from '../lib/store';
import { drillHref, drillItems, parseDrill, payeeRows, rentMoved, type DrillQuery, type PayeeRow } from '../lib/drill';
import { categoryLabel, periods } from './Spend';
import type { Item, Snapshot } from '../lib/data';
import '../design/drill.css';

const PAYEES_AT_ONCE = 50;
const PAYMENTS_AT_ONCE = 30;

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? '' : 's'}`;
const shiftDay = (iso: string, by: number): string => new Date(Date.parse(`${iso}T00:00:00Z`) + by * 864e5).toISOString().slice(0, 10);
const clock = (t: string): string => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};
const yearOf = (iso: string, asOf: string) => (iso.slice(0, 4) === asOf.slice(0, 4) ? '' : ` ${iso.slice(0, 4)}`);

export interface DrillRange { from: string; to: string; words: string; span: string | null; byMonth?: boolean }
/** The same period the owner came from: the last 30 days, a Spend period, or one day or month. Null when the link names no period this app knows. */
export function rangeFor(view: Snapshot, period: string): DrillRange | null {
  const asOf = view.meta.as_of;
  const span = (from: string, to: string) => `${dayMonth(from)} to ${dayMonth(to)}`;
  if (period === '30') {
    const w = view.spend.allocation?.window;
    const from = w?.from ?? shiftDay(asOf, -29);
    const to = w?.to ?? asOf;
    return { from, to, words: 'in the last 30 days', span: span(from, to) };
  }
  const closing = /^30to(\d{4}-\d{2}-\d{2})$/.exec(period);
  if (closing) return { from: shiftDay(closing[1], -29), to: closing[1], words: `in the 30 days to ${dayMonth(closing[1])}`, span: span(shiftDay(closing[1], -29), closing[1]) };
  if (/^\d{4}-\d{2}-\d{2}$/.test(period)) return { from: period, to: period, words: `on ${dayLabel(period)}${yearOf(period, asOf)}`, span: null };
  if (/^\d{4}-\d{2}$/.test(period)) return { from: `${period}-01`, to: `${period}-31`, words: `${period === view.spend.month ? 'so far ' : ''}in ${monthLong(period)}${yearOf(`${period}-01`, asOf)}`, span: null, byMonth: true };
  if (period === 'all') return { from: '0000-00-00', to: '9999-99-99', words: 'in everything held here', span: view.spend.days.length ? span(view.spend.days[0].day, asOf) : null };
  const named = periods(view).find((p) => p.id === period);
  if (!named) return null;
  const words = period === 'month' ? `so far in ${monthLong(named.from)}` : period === 'prev' ? `in ${monthLong(named.from)}` : `in ${named.label.toLowerCase().replace(/^last/, 'the last')}`;
  return { from: `${named.from}-01`, to: `${named.to}-31`, words, span: named.from === named.to ? null : `${monthLong(named.from)} to ${monthLong(named.to)}`, byMonth: true };
}

/** What the page is about, in the words the block or row used. */
export function drillTitle(q: DrillQuery): string {
  const of = q.of ?? [];
  switch (q.by) {
    case 'all': return 'all spending';
    case 'group': return of.join(', ');
    case 'everyday': return of.length ? `${of.join(', ')}, everyday` : 'everyday spending';
    case 'regular': return of.length ? `${of.join(', ')}, everyday without one-offs` : 'everyday spending without one-offs';
    case 'unnamed': return 'payments with no name yet';
    case 'oneoff': return 'large one-offs';
    case 'fixed': return 'fixed costs';
    case 'category': {
      if (of.length > 1) {
        const groups = new Set(of.map((c) => c.split(':')[0]));
        return groups.size === 1 ? `Other ${[...groups][0].toLowerCase()}` : 'everything else';
      }
      const [group] = of[0].split(':');
      return categoryLabel(group, of[0].includes(':') ? of[0] : null);
    }
  }
}

/** Where Back goes when there is nothing behind this page, as on a deep link. */
function spendFor(q: DrillQuery): string {
  const p = new URLSearchParams();
  if (['prev', 'q', 'fy', 'cal'].includes(q.period)) p.set('period', q.period);
  if (q.by === 'group' && q.of?.length === 1) p.set('group', q.of[0]);
  if (q.account) p.set('account', q.account);
  if (q.only) p.set('only', q.only);
  const s = p.toString();
  if (/^\d{4}-\d{2}/.test(q.period)) return `spend/month?m=${q.period.slice(0, 7)}`;
  return `spend${s ? `?${s}` : ''}`;
}

function Back({ to }: { to: string }) {
  return (
    <div className="scrtop">
      <button className="back" onClick={() => { if (typeof history.state?.k === 'number' && history.state.k !== 0) history.back(); else go(to, { replace: true }); }}><i />Back</button>
    </div>
  );
}

function Payment({ it, asOf }: { it: Item; asOf: string }) {
  const refund = it.amount.value < 0;
  const onStatement = it.amount.confidence === 'statement';
  return (
    <li data-payment data-source={onStatement ? 'statement' : 'pending'}>
      <span>
        <NameChip beside name={<>{dayLabel(it.date)}{yearOf(it.date, asOf)}{it.time ? `, ${clock(it.time)}` : ''}</>} chip={refund ? <Chip step="plain" kind="refund">Refund</Chip> : null} />
        <small>{onStatement ? 'On a statement' : <Tag>Not on a statement yet</Tag>}</small>
        {it.purchased?.length ? <small className="bought" data-bought>{it.purchased.join(', ')}</small> : null}
      </span>
      <N>{inr(rupees(it.amount.value))}</N>
    </li>
  );
}

function Payee({ row, startOpen, asOf }: { row: PayeeRow; startOpen: boolean; asOf: string }) {
  const [open, setOpen] = useState(startOpen);
  const [shown, setShown] = useState(PAYMENTS_AT_ONCE);
  const count = row.items.length;
  const says = [plural(count, 'payment'), row.refunds ? plural(row.refunds, 'refund') : '', row.pending ? `${row.pending} not on a statement yet` : ''].filter(Boolean).join(', ');
  const first = row.first;
  return (
    <li data-payee={row.hash} id={startOpen ? 'opened' : undefined}>
      <button aria-expanded={open} onClick={() => setOpen(!open)}>
        <span className="icr">
          <Ico q={row.name === 'No name yet' ? { unnamed: true } : { name: row.name, group: first.category ?? first.group ?? undefined, brand: first.brand }} />
          <NameChip beside name={row.name} chip={row.total < 0 ? <Chip step="plain" kind="refund">Refund</Chip> : null} />
          <small>{says}</small>
        </span>
        <span className="drill-amt"><N>{inr(rupees(row.total))}</N><i className="caret" aria-hidden="true" /></span>
      </button>
      {open ? (
        <>
          <ol className="pays">{row.items.slice(0, shown).map((it, i) => <Payment key={`${it.key ?? 'x'}:${it.date}:${i}`} it={it} asOf={asOf} />)}</ol>
          {count > shown ? <button className="tlink more" onClick={() => setShown(shown + PAYMENTS_AT_ONCE)}>Show {Math.min(PAYMENTS_AT_ONCE, count - shown)} more of {count}</button> : null}
        </>
      ) : null}
    </li>
  );
}

function Empty({ q, range }: { q: DrillQuery | null; range: DrillRange | null }) {
  const to = q ? spendFor(q) : 'spend';
  return (
    <>
      <PageHeader title="Spend" />
      <StateBar />
      <main id="drill" data-state="empty" data-by={q?.by}>
        <Back to={to} />
        {q && range
          ? <><h1 className="a">No payments seen for {drillTitle(q)} {range.words}.</h1><p className="sub">{range.span ? `${range.span}. ` : ''}A payment appears here once a statement or bank message shows it.</p></>
          : <><h1 className="a">This link does not point at any spending.</h1><p className="sub">It may be from an older version of the page.</p></>}
        <div className="wrap mt4"><Link className="tlink" to="spend">Go to Spend</Link></div>
      </main>
    </>
  );
}

function Drill({ q, range }: { q: DrillQuery; range: DrillRange }) {
  const view = useView();
  const items = useMemo(() => drillItems(view, q, range), [view, q, range]);
  const rows = useMemo(() => payeeRows(view, items), [view, items]);
  const [shown, setShown] = useState(PAYEES_AT_ONCE);
  const opened = q.open ? rows.findIndex((r) => r.hash === q.open) : -1;
  const list = opened >= shown ? [rows[opened], ...rows.slice(0, shown)] : rows.slice(0, shown);
  useEffect(() => {
    if (opened < 0) return;
    const frame = requestAnimationFrame(() => document.getElementById('opened')?.scrollIntoView({ block: 'center' }));
    return () => cancelAnimationFrame(frame);
  }, [opened]);
  if (!items.length && !(q.open && q.by === 'fixed')) return <Empty q={q} range={range} />;
  const total = rupees(items.reduce((t, i) => t + i.amount.value, 0));
  const pending = rupees(items.filter((i) => i.amount.confidence !== 'statement').reduce((t, i) => t + i.amount.value, 0));
  const refunds = rupees(items.filter((i) => i.amount.value < 0).reduce((t, i) => t + i.amount.value, 0));
  const netBack = rupees(rows.filter((r) => r.total < 0).reduce((t, r) => t + r.total, 0));
  const missing = q.open && opened < 0;
  const moved = rentMoved(view, q, range);
  const queue = q.by === 'unnamed' ? view.payees.review.items.length : 0;
  return (
    <>
      <PageHeader title="Spend" />
      <StateBar />
      <main id="drill" className="duo" data-by={q.by}>
        <div className="pri">
          <Back to={spendFor(q)} />
          <h1 className="a" id="drill-answer" data-amount={Math.round(total)}><Hl><N>{inr(total)}</N></Hl> on {drillTitle(q)} {range.words}</h1>
          <p className="sub">{plural(items.length, 'payment')}, {plural(rows.length, 'payee')}.{range.span ? ` ${range.span}.` : ''}</p>
          {missing ? <p className="note wrap" data-note="not-in-period">The one you tapped has no payments in this period. <Link className="tlink" to={drillHref({ ...q, period: 'all' })}>See everything held here</Link></p> : null}
          {moved.into ? <p className="note wrap" data-note="rent-in" data-amount={rupees(moved.into)}><N>{inr(rupees(moved.into))}</N> of rent paid outside these dates counts here, in the month it is for.</p> : null}
          {moved.away ? <p className="note wrap" data-note="rent-away" data-amount={rupees(moved.away)}><N>{inr(rupees(moved.away))}</N> of rent paid in these dates counts in the month it is for, so it is not here.</p> : null}
          {netBack < 0 && q.by === 'category' ? <p className="note wrap" data-note="net-refund"><N>{inr(-netBack)}</N> came back from payees who got less than that, so this reads lower than the block on the map.</p> : null}
          <ul className="rows drill-list" id="drill-payees">
            {list.map((r) => <Payee key={r.hash} row={r} startOpen={r.hash === q.open} asOf={view.meta.as_of} />)}
          </ul>
          {rows.length > shown ? <div className="wrap"><button className="tlink more" onClick={() => setShown(shown + PAYEES_AT_ONCE)}>Show {Math.min(PAYEES_AT_ONCE, rows.length - shown)} more of {rows.length} payees</button></div> : null}
        </div>
        <div className="side">
          <section className="sec" id="drill-sure">
            <h2>How sure this is</h2>
            <table className="tbl"><tbody>
              <tr><td>On a statement</td><td className="num"><N>{inr(total - pending)}</N></td></tr>
              <tr><td>Not on a statement yet</td><td className="num"><N>{inr(pending)}</N></td></tr>
              {refunds < 0 ? <tr><td>Refunds, already taken off</td><td className="num"><N>{inr(refunds)}</N></td></tr> : null}
            </tbody></table>
            {pending !== 0 ? <p className="note">What is not on a statement yet may change when the statement comes.</p> : null}
            {queue ? <Link to="names?from=spend" className="names-link mt4"><span><Chip step="a">Name {plural(queue, 'payee')}</Chip></span></Link> : null}
          </section>
        </div>
      </main>
    </>
  );
}

export function Spending() {
  const view = useView();
  const route = useRoute();
  const q = useMemo(() => parseDrill(route.params), [route.raw]);
  const range = useMemo(() => (q ? rangeFor(view, q.period) : null), [view, q]);
  if (!q || !range) return <Empty q={q} range={range} />;
  return <Drill key={route.raw} q={q} range={range} />;
}
