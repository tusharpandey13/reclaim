/** Reports: prepared outputs, each with Preview and Download or Share. Nothing is sent unless you share it. */
import { useMemo, useState, type ReactNode } from 'react';
import { DataAge, StateBar } from '../App';
import { Chip, CloseButton, Hl, Ico, Link, N, UiIco, useSheet } from '../ui/kit';
import { dayLabel, dayMonth, inr, monthLong, rupees, ymAdd } from '../lib/format';
import { canShareFiles, csv, download, pdf, shareOrDownload } from '../lib/files';
import { useRoute } from '../lib/router';
import { absentReason, useView } from '../lib/store';
import { fyStartOf } from './Spend';
import type { Snapshot } from '../lib/data';
import { WithInfo } from '../ui/tight';

export interface Period { id: string; label: string; from: string; to: string; partial: boolean }
export function reportPeriods(view: Snapshot): Period[] {
  const cur = view.spend.month;
  const prev = ymAdd(cur, -1);
  const fy = fyStartOf(view.meta.as_of);
  const fyEnd = ymAdd(fy, 11);
  const fyLabel = `FY ${fy.slice(0, 4)}–${fyEnd.slice(2, 4)}`;
  const known = view.reports.periods.find((p) => p.kind === 'fy' && p.from === fy);
  const lastFy = ymAdd(fy, -12);
  const lastKnown = view.reports.periods.find((p) => p.kind === 'fy' && p.from === lastFy);
  const hasLast = view.reports.months.some((m) => m.month >= lastFy && m.month < fy && (m.income || m.spent));
  return [
    { id: 'cur', label: monthLong(cur), from: cur, to: cur, partial: true },
    { id: 'prev', label: monthLong(prev), from: prev, to: prev, partial: false },
    { id: 'fy', label: fyLabel, from: fy, to: cur, partial: !(known?.complete ?? false) },
    ...(hasLast ? [{ id: 'fyprev', label: `FY ${lastFy.slice(0, 4)}–${fy.slice(2, 4)}`, from: lastFy, to: ymAdd(fy, -1), partial: !(lastKnown?.complete ?? false) }] : []),
  ];
}

const inRange = (ym: string, p: Period) => ym >= p.from && ym <= p.to;
const sumMonths = (view: Snapshot, p: Period) => {
  const rows = view.reports.months.filter((m) => inRange(m.month, p));
  const t = (k: 'income' | 'spent' | 'invested' | 'cash_in' | 'cash_out') => rows.reduce((a, m) => a + rupees(m[k]), 0);
  return { income: t('income'), spent: t('spent'), invested: t('invested'), cashIn: t('cash_in'), cashOut: t('cash_out'), any: rows.some((m) => m.income || m.spent || m.cash_in || m.cash_out) };
};
const netChip = (net: number, income: number): ReactNode => {
  if (income <= 0) return null;
  const pct = (net / income) * 100;
  if (net < 0) return <Chip step="r2">Spent more than came in</Chip>;
  const words = `Kept ${Math.round(pct)}% of income`;
  if (pct >= 25) return <Chip step="g2">{words}</Chip>;
  if (pct >= 10) return <Chip step="g1">{words}</Chip>;
  return <span className="sc quiet">{words}</span>;
};
const stem = (name: string, p: Period) => `${name}, ${p.label}`;

function auditLines(view: Snapshot, p: Period, group: string | null, account: string | null, unconfirmed: boolean) {
  // Audit lines name a ledger account; the bank or card paid from is on the matching Spend item.
  const paidFrom = account ? new Map(view.spend.days.flatMap((d) => d.items).map((i) => [i.key, i.account])) : null;
  return view.reports.audit.lines.filter((l) => inRange(l.date.slice(0, 7), p) && (!group || l.account.split(':')[1] === group) && (!paidFrom || paidFrom.get(l.key) === account) && (!unconfirmed || l.confidence !== 'statement'));
}
function proven(lines: { amount: number; confidence: string }[]): number | null {
  const all = lines.reduce((t, l) => t + Math.abs(l.amount), 0);
  if (!all) return null;
  return Math.round((lines.filter((l) => l.confidence === 'statement').reduce((t, l) => t + Math.abs(l.amount), 0) / all) * 100);
}

function SimplePreview({ title, rows, note }: { title: string; rows: [string, string][]; note?: string }) {
  return (
    <>
      <h2>{title}</h2>
      <div className="sum">{rows.map(([a, b], i) => <span key={a} className="sum-row"><span className={i === rows.length - 1 ? 'tot' : ''}>{a}</span><N className={i === rows.length - 1 ? 'tot' : ''}>{b}</N></span>)}</div>
      {note ? <p className="note">{note}</p> : null}
      <CloseButton />
    </>
  );
}

function ReportFail({ words, onRetry }: { words: string; onRetry: () => void }) {
  return <div className="savefail" role="alert"><span><i className="m q" aria-hidden="true" />{words}</span><button onClick={onRetry}>Try again</button></div>;
}

export function Reports() {
  const view = useView();
  const route = useRoute();
  const { open } = useSheet();
  const list = reportPeriods(view);
  const initial = route.params.get('period');
  const [pid, setPid] = useState(initial === 'prev' || initial === 'fy' ? initial : 'cur');
  const shareable = canShareFiles();
  const [fail, setFail] = useState<{ words: string; retry: () => void } | null>(null);
  const p = list.find((x) => x.id === pid) ?? list[0];
  const group = route.params.get('group');
  const from = route.params.get('from');
  const closeTo = from === 'spend' ? 'spend' : from === 'plan' ? 'plan' : 'today';
  const account = route.params.get('account');
  const unconfirmed = route.params.get('only') === 'unconfirmed';
  const lines = useMemo(() => auditLines(view, p, group, account, unconfirmed), [view, p, group, account, unconfirmed]);
  const auditName = ['Audit', group, account].filter(Boolean).join(', ');
  const totals = sumMonths(view, p);
  const cashNet = totals.cashIn - totals.cashOut;
  const profit = totals.income - totals.spent;
  const proof = proven(lines);
  const target = Math.round(view.reports.audit.target_bp / 100);
  const flat = view.reports.flatmates?.groups[0] ?? null;
  const settle = flat?.settle.find((x) => x.to === flat.self || x.from === flat.self);
  const taxReason = absentReason(view, 'reports.tax') ?? 'No source holds sales, gains by tax year or tax paid.';
  const hasData = totals.any || lines.length > 0;
  const partialNote = p.partial ? 'Part of this period has not happened or is not in your data, so this is not the whole of it.' : undefined;

  const guard = (fn: () => void | Promise<unknown>) => {
    const run = async () => {
      try {
        setFail(null);
        await fn();
      } catch {
        setFail({ words: 'Could not make that file. Nothing was saved or sent.', retry: run });
      }
    };
    void run();
  };
  const cashRows: [string, string][] = [['Money in', inr(totals.cashIn)], ['Money out', inr(totals.cashOut)], ['Net', inr(cashNet, true)]];
  const unknownIn = view.reports.months.filter((m) => m.month >= p.from && m.month <= p.to).reduce((t, m) => t + rupees(m.unknown_in ?? 0), 0);
  const pnlRows: [string, string][] = [['Income', inr(totals.income)], ['Spending', inr(totals.spent)], ['Kept', inr(profit, true)]];
  const dlCash = () => guard(() => download(`${stem('Cash flow', p)}.pdf`, pdf([[`# Cash flow, ${p.label}`, ...cashRows.map(([a, b]) => `${a}: ${b}`), partialNote ?? ''], ['# By month', ...view.reports.months.filter((m) => inRange(m.month, p)).map((m) => `${m.month}: in ${inr(rupees(m.cash_in))}, out ${inr(rupees(m.cash_out))}`)]]), 'application/pdf'));
  const dlPnl = () => guard(() => download(`${stem('Profit and loss', p)}.pdf`, pdf([[`# Profit and loss, ${p.label}`, ...pnlRows.map(([a, b]) => `${a}: ${b}`), partialNote ?? ''], ['# By month', ...view.reports.months.filter((m) => inRange(m.month, p)).map((m) => `${m.month}: income ${inr(rupees(m.income))}, spent ${inr(rupees(m.spent))}, net ${inr(rupees(m.net), true)}`)]]), 'application/pdf'));
  const dlAudit = () => guard(() => download(`${stem(auditName, p)}.csv`, csv([['date', 'kind', 'name', 'account', 'amount_inr', 'source', 'confidence'], ...lines.map((l) => [l.date, l.kind, l.name ?? '', l.account, (l.amount / 100).toFixed(2), l.source, l.confidence])]), 'text/csv;charset=utf-8'));

  /** `info`: the long part of the sub-line, behind an (i) beside the name. */
  const row = (ui: Parameters<typeof UiIco>[0]['name'], name: string, sub: ReactNode, fig: ReactNode, actions: ReactNode, key: string, info?: ReactNode) => (
    <li key={key} data-report={key}>
      <div className="rr"><span className="icr"><UiIco name={ui} />{info != null ? <b><WithInfo text={name} title={name} label={`About ${name}`}><p>{info}</p></WithInfo></b> : <b>{name}</b>}{sub != null ? <small>{sub}</small> : null}</span>{fig}</div>
      <div className="rb">{actions}</div>
    </li>
  );
  const preview = (onClick: () => void, disabled = false) => <button className="ra" aria-disabled={disabled} disabled={disabled} onClick={onClick}><UiIco name="preview" />Preview</button>;
  const go = (label: string, kind: 'download' | 'share', onClick: () => void, disabled = false) => <button className="ra go" aria-disabled={disabled} disabled={disabled} onClick={onClick}><UiIco name={kind} />{label}</button>;
  return (
    <>
      <header className="top"><div className="d">Reports</div><Link className="btn-q" to={closeTo}>Close</Link></header>
      <StateBar />
      <main className="duo">
        <div className="pri">
        <h1 className="a"><WithInfo text="Reports ready to download" title="Preview and download" label="How reports leave your phone"><p>Preview shows a report on screen. Download saves the file to your phone. <span className="k">Nothing is sent unless you share it.</span></p></WithInfo></h1>
        {group || account || unconfirmed ? <p className="sub">Audit shows {[group, account, unconfirmed ? 'unconfirmed lines' : null].filter(Boolean).join(', ')} only, from your Spend filter.</p> : null}
        <div className="chips wrapped" role="group" aria-label="Period">
          {list.map((o) => <button key={o.id} className="chip flat" aria-pressed={pid === o.id} onClick={() => setPid(o.id)}>{o.label}</button>)}
        </div>
        {fail ? <div className="wrap"><ReportFail words={fail.words} onRetry={fail.retry} /></div> : null}
        <ul className="rlist">
          {flat ? row('report_flatmates', 'Flatmates', settle ? (settle.to === flat.self ? `${settle.from} owes you.` : `You owe ${settle.to}.`) : 'All settled.', settle ? <N>{inr(rupees(settle.amount))}</N> : null, <><Link className="ra" to="flatmates"><UiIco name="preview" />Preview</Link><Link className="ra go" to="flatmates?share=1"><UiIco name={shareable ? 'share' : 'download'} />{shareable ? 'Share PDF' : 'Download PDF'}</Link></>, 'flatmates', 'Latest shared costs, not the period above. PDF, 1 page.')
            : row('report_flatmates', 'Flatmates', 'No shared costs have come in yet.', null, <>{preview(() => undefined, true)}{go(shareable ? 'Share PDF' : 'Download PDF', shareable ? 'share' : 'download', () => undefined, true)}</>, 'flatmates')}
          {row('report_cashflow', 'Cash flow', <>{hasData ? netChip(cashNet, totals.cashIn) : null} Money in and out of your bank, {p.label}. PDF, 2 pages</>, hasData ? <N>{inr(cashNet, true)}</N> : <span className="sc quiet">No data yet</span>, <>{preview(() => open(<SimplePreview title={stem('Cash flow', p)} rows={cashRows} note={partialNote} />, 'Cash flow'), !hasData)}{go('Download PDF', 'download', dlCash, !hasData)}</>, 'cashflow')}
          {row('report_pnl', 'Profit and loss', <>{hasData ? netChip(profit, totals.income) : null} Income minus spending, {p.label}. PDF, 2 pages</>, hasData ? <N>{inr(profit, true)}</N> : <span className="sc quiet">No data yet</span>, <>{preview(() => open(<SimplePreview title={stem('Profit and loss', p)} rows={pnlRows} note={partialNote} />, 'Profit and loss'), !hasData)}{go('Download PDF', 'download', dlPnl, !hasData)}</>, 'pnl')}
          {unknownIn > 0 ? <li data-report="unknown-in"><p className="note">Not counted as income: <N>{inr(unknownIn)}</N> of money in, {p.label}, that nothing explains yet. It could be a share, a loan or a refund.</p></li> : null}
        </ul>
        </div>
        <div className="side">
        <ul className="rlist">
          {row('report_audit', 'Audit', null, proof == null ? <span className="sc quiet">No data yet</span> : <N>{proof}% on a statement</N>, <>{preview(() => open(<AuditPreview lines={lines} title={stem(auditName, p)} />, 'Audit'), !lines.length)}{go('Download CSV', 'download', dlAudit, !lines.length)}</>, 'audit', <>{p.label}, every line. Spreadsheet. Target is {target}% on a statement; a new statement raises it.</>)}
          {row('report_tax', 'Tax year summary', null, <span className="sc quiet">Not available</span>, <>{preview(() => undefined, true)}{go('Download PDF', 'download', () => undefined, true)}</>, 'tax', taxReason)}
        </ul>
        <section className="sec"><h2><WithInfo text="Make your own report" title="Make your own report"><p>Open a filtered view in Spend and tap Reports there. Your filter comes with you.</p></WithInfo></h2></section>
        </div>
      </main>
    </>
  );
}

function AuditPreview({ lines, title }: { lines: Snapshot['reports']['audit']['lines']; title: string }) {
  const shown = lines.slice(0, 40);
  return (
    <>
      <h2>{title}</h2>
      <p className="note">{lines.length} lines. The first {shown.length} are shown here, and the file has all of them.</p>
      <table className="tbl"><thead><tr><th scope="col">Line</th><th scope="col" className="num">Amount</th></tr></thead><tbody>
        {shown.map((l) => <tr key={l.key}><td><b>{l.name ?? 'No name yet'}</b><small>{dayMonth(l.date)}, {l.kind}, {l.confidence === 'statement' ? 'on a statement' : 'not on a statement yet'}</small></td><td className="num"><N>{inr(rupees(l.amount))}</N></td></tr>)}
      </tbody></table>
      <CloseButton />
    </>
  );
}

export function Flatmates() {
  const view = useView();
  const [fail, setFail] = useState<{ words: string; retry: () => void } | null>(null);
  const flat = view.reports.flatmates?.groups[0] ?? null;
  const reason = absentReason(view, 'reports.flatmates.groups[].lines[].on_statement');
  if (!flat) {
    return (
      <>
        <header className="top"><div className="d">Flatmates</div><Link className="btn-q" to="reports">Back</Link></header>
        <DataAge />
        <main><h1 className="a">No shared costs have come in yet.</h1><p className="sub">This fills in from your next Splitwise export.</p></main>
      </>
    );
  }
  const name = (n: string) => (n === flat.self ? 'Me' : n);
  const each = flat.members.length ? rupees(flat.total) / flat.members.length : 0;
  const title = `${flat.name}${flat.as_of ? `, to ${dayLabel(flat.as_of)}` : ''}`;
  const lines = [
    `# ${title}`,
    `Shared costs for ${flat.members.map((m) => name(m.name)).join(', ')}. Personal spending is not included.`,
    ...flat.lines.map((l) => `${l.title}, paid by ${l.paid_by.map(name).join(', ')}: ${inr(rupees(l.cost))}`),
    `Total, ${inr(each)} each: ${inr(rupees(flat.total))}`,
    '# To settle',
    ...(flat.settle.length ? flat.settle.map((s) => `${name(s.from)} pays ${name(s.to)}: ${inr(rupees(s.amount))}`) : ['Everyone is even.']),
    'From a Splitwise export, kept by hand. An estimate.',
  ];
  const share = () => {
    const run = async () => {
      try {
        setFail(null);
        await shareOrDownload(`Flatmates, ${monthLong(view.spend.month)}.pdf`, pdf([lines]), 'application/pdf');
      } catch {
        setFail({ words: 'Could not share that file. Nothing was sent.', retry: run });
      }
    };
    void run();
  };
  return (
    <>
      <header className="top"><div className="d">Flatmates</div><Link className="btn-q" to="reports">Back</Link></header>
      <DataAge />
      <main>
        <div className="sheet">
          <h2>{title}</h2>
          <p>Shared costs for {flat.members.map((m) => name(m.name)).join(', ')}. Personal spending is not included.</p>
          <table className="tbl">
            <thead><tr><th scope="col">Shared cost</th><th scope="col">Paid by</th><th scope="col" className="num">Amount</th></tr></thead>
            <tbody>{flat.lines.map((l, i) => <tr key={`${l.title}-${i}`}><td><span className="icb"><Ico q={{ name: l.title }} />{l.title}</span></td><td>{l.paid_by.map(name).join(', ')}</td><td className="num"><N>{inr(rupees(l.cost))}</N></td></tr>)}</tbody>
            <tfoot><tr><td colSpan={2}>Total, {inr(each)} each</td><td className="num"><N className="tot">{inr(rupees(flat.total))}</N></td></tr></tfoot>
          </table>
          <h2>To settle</h2>
          <table className="tbl"><tbody>
            {flat.settle.length ? flat.settle.map((s, i) => <tr key={i}><td>{name(s.from)} {s.from === flat.self ? 'pay' : 'pays'} {name(s.to)}</td><td className="num"><Hl><N className="tot">{inr(rupees(s.amount))}</N></Hl></td></tr>) : <tr><td>Everyone is even</td><td className="num"><N>₹0</N></td></tr>}
          </tbody></table>
          <p className="note foot-note">From a Splitwise export, kept by hand, so this is an estimate.{reason ? ` ${reason}` : ''}</p>
        </div>
        {fail ? <div className="wrap"><ReportFail words={fail.words} onRetry={fail.retry} /></div> : null}
        <div className="acts"><button className="act" onClick={share}>{canShareFiles() ? 'Share as PDF' : 'Download PDF'}</button><Link className="act alt" to="reports">Back to reports</Link></div>
        <div className="wrap"><p className="note">Sharing sends only what you see above. No account numbers or other payments.</p></div>
      </main>
    </>
  );
}
