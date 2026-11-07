/** Sources: what the owner can do first, then how old each source is, what was refused at the door, and which checks did not pass. Status text is shown as text, as the box wrote it. */
import { PageHeader, ReasonBar } from '../App';
import { Chip } from '../ui/kit';
import { ageWords } from '../lib/format';
import { useStore } from '../lib/store';
import { dataLine, needsLook, SOURCE_GROUPS, type Invariants, type SetAsideFile, type SourceGroup, type SourceRow } from '../lib/data';
import { plainReason } from './Today';
import { FoldRow, useInfo } from '../ui/tight';
import type { ReactNode } from 'react';

export type SourceKind = 'message' | 'bank' | 'card' | 'prices' | 'fx' | 'broker' | 'split' | 'corrections' | 'plans' | 'pay' | 'mail' | 'shop' | 'rules' | 'other';
/** Which outline icon a source row gets: from its id where the box gives one, else its group. */
export function sourceKind(row: Pick<SourceRow, 'id' | 'group'>): SourceKind {
  const id = (row.id ?? '').toLowerCase();
  if (id === 'sms') return 'message';
  if (id.startsWith('statement:')) return /:card:/.test(id) || id.includes('liabilities') ? 'card' : 'bank';
  const BY_ID: Record<string, SourceKind> = { prices: 'prices', fx: 'fx', vested: 'broker', zerodha: 'broker', etrade: 'broker', splitwise: 'split', corrections: 'corrections', plan_events: 'plans', phonepe: 'pay', gmail: 'mail', merchant_emails: 'mail', blinkit: 'shop', zepto: 'shop', rules: 'rules' };
  if (BY_ID[id]) return BY_ID[id];
  return ({ messages: 'message', banks: 'bank', cards: 'card', invest: 'broker', settings: 'rules', other: 'other' } as const)[row.group];
}
const KIND_PATHS: Record<SourceKind, ReactNode> = {
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  bank: <><path d="M3 21h18M5 21v-9M9.5 21v-9M14.5 21v-9M19 21v-9" /><path d="M2.5 9 12 3l9.5 6z" /></>,
  card: <><rect width="20" height="14" x="2" y="5" rx="2" /><path d="M2 10h20" /></>,
  prices: <><path d="M3 3v18h18" /><path d="m7 15 4-4 3 3 5-6" /></>,
  fx: <><path d="M7 4 3 8l4 4" /><path d="M3 8h14" /><path d="m17 20 4-4-4-4" /><path d="M21 16H7" /></>,
  broker: <><path d="m22 7-8.5 8.5-5-5L2 17" /><path d="M16 7h6v6" /></>,
  split: <><circle cx="9" cy="7" r="4" /><path d="M2 21v-1a6 6 0 0 1 12 0v1" /><path d="M16 3.1a4 4 0 0 1 0 7.8M22 21v-1a6 6 0 0 0-4-5.6" /></>,
  corrections: <><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z" /></>,
  plans: <><rect width="18" height="18" x="3" y="4" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></>,
  pay: <><rect width="14" height="20" x="5" y="2" rx="2" /><path d="M12 18h.01" /></>,
  mail: <><rect width="20" height="16" x="2" y="4" rx="2" /><path d="m22 7-10 6L2 7" /></>,
  shop: <><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><path d="M3 6h18" /><path d="M16 10a4 4 0 0 1-8 0" /></>,
  rules: <><path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3M1 14h6M9 8h6M17 16h6" /></>,
  other: <><circle cx="12" cy="12" r="9" /><path d="M8 12h8" /></>,
};
const KindIcon = ({ kind }: { kind: SourceKind }) => (
  <span className="ico src-ico" data-kind={kind} aria-hidden="true">
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{KIND_PATHS[kind]}</svg>
  </span>
);

const GROUP_WORD: Record<SourceGroup, string> = { messages: 'Messages', banks: 'Banks', cards: 'Cards', invest: 'Invest', settings: 'Settings', other: 'Other' };
/** Only states that move a figure get a chip. Not connected is honest, not a fault. */
const STATE_WORD: Record<string, string> = { late: 'Late', stale: 'Old', absent: 'Missing', problem: 'Not being read' };

function Row({ row, now }: { row: SourceRow; now: number }) {
  const age = row.lastAtMs != null ? ageWords(row.lastAtMs, now) : null;
  const label = plainReason(row.label);
  const said = row.line ? plainReason(row.line) : null;
  const line = [age ? `${age[0].toUpperCase()}${age.slice(1)}.` : null, said].filter(Boolean).join(' ');
  const word = STATE_WORD[row.state];
  return (
    <li data-source={label} data-state={row.state}>
      <div className="r">
        <span className="icr">
          <KindIcon kind={sourceKind(row)} />
          <b>{label}</b>
          {line ? <small>{line}</small> : null}
          {row.whatToDo ? <small>{plainReason(row.whatToDo)}</small> : null}
        </span>
        {word ? <Chip step="a">{word}</Chip> : <span />}
      </div>
    </li>
  );
}

function SetAside({ files }: { files: SetAsideFile[] }) {
  return (
    <section className="sec" id="set-aside">
      <h2>Files set aside</h2>
      {files.length ? (
        <ul className="rows bar">
          {files.map((f, i) => (
            <li key={`${f.file}-${i}`} data-file={f.file}>
              <div className="r">
                <span>
                  <b>{f.file}</b>
                  <small>{f.partial ? 'Read only in part.' : 'Not read.'}{f.reason ? ` ${plainReason(f.reason)}` : ''}</small>
                  {f.whatToDo ? <small>{plainReason(f.whatToDo)}</small> : null}
                </span>
                <span />
              </div>
            </li>
          ))}
        </ul>
      ) : <p className="note">No file was refused in the last build.</p>}
    </section>
  );
}

/** What the checks found, in the Checks sheet. None of them holds a figure back, so the page keeps them folded. */
function Checks({ checks }: { checks: Invariants }) {
  const { failing, total, ran } = checks;
  return (
    <div id="checks">
      {!ran ? <p className="note">The checks could not run in the last build. Your numbers are not affected.</p> : null}
      {ran && !failing.length ? <p className="note">All {total} checks passed in the last build.</p> : null}
      {failing.length ? (
        <>
          <p className="note">Some checks found things to know about. None of them holds your numbers back.</p>
          <details className="aslist" open>
          <summary>{failing.length === 1 ? 'See what one check found' : `See what ${failing.length} checks found`}</summary>
          <ul className="rows bar" data-failing={failing.length}>
            {failing.map((c, i) => (
              <li key={i}>
                <div className="r">
                  <span>
                    <b>{c.reason ? plainReason(c.reason) : 'One check did not pass.'}</b>
                    {c.count > 0 ? <small>{c.count} found</small> : null}
                  </span>
                  <span />
                </div>
              </li>
            ))}
          </ul>
          </details>
        </>
      ) : null}
    </div>
  );
}

/** What the owner can do, first: each source that needs a look, with its one step. */
function ToDo({ rows }: { rows: SourceRow[] }) {
  if (!rows.length) return null;
  return (
    <section className="sec" id="to-do">
      <h2>What you can do</h2>
      <ul className="rows bar">
        {rows.map((r, i) => (
          <li key={`${r.label}-${i}`} data-todo={plainReason(r.label)}>
            <div className="r">
              <span><b>{plainReason(r.whatToDo!)}</b><small>{plainReason(r.label)}{r.line ? `. ${plainReason(r.line)}` : ''}</small></span>
              <Chip step="a">{STATE_WORD[r.state]}</Chip>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Groups that hold what a figure leans on day to day stay open; the rest fold to a row, unless one of their rows needs a look. */
const FOLDS: readonly SourceGroup[] = ['invest', 'settings', 'other'];

export function Sources() {
  const { sources, invariants, now } = useStore();
  const show = useInfo();
  const need = sources ? sources.rows.filter((r) => STATE_WORD[r.state]).length : 0;
  return (
    <>
      <PageHeader title="Sources" action="Today" to="today" />
      <ReasonBar />
      <main>
        {sources ? (
          <>
            <h1 className="a">{need === 0 ? 'Everything connected is coming in.' : need === 1 ? 'One source needs a look.' : `${need} sources need a look.`}</h1>
            <ToDo rows={needsLook(sources)} />
            <p className="sub">{dataLine(sources, now)}.</p>
            {SOURCE_GROUPS.map((group) => {
              const rows = sources.rows.filter((r) => r.group === group);
              if (!rows.length) return null;
              // Stable, so connected rows keep the box's order, and not-connected ones go last.
              const ordered = [...rows.filter((r) => r.connected), ...rows.filter((r) => !r.connected)];
              const list = <ul className="rows bar" data-group={group}>{ordered.map((r, i) => <Row key={`${r.label}-${i}`} row={r} now={now} />)}</ul>;
              if (FOLDS.includes(group) && !rows.some((r) => STATE_WORD[r.state])) return <FoldRow key={group} title={GROUP_WORD[group]} heading={false} testid={`group-${group}`} onClick={() => show(GROUP_WORD[group], list)} />;
              return (
                <section className="sec" key={group} data-group={group}>
                  <h2>{GROUP_WORD[group]}</h2>
                  {list}
                </section>
              );
            })}
            {sources.setAside.length ? <SetAside files={sources.setAside} /> : <FoldRow title="Files set aside" heading={false} testid="set-aside" onClick={() => show('Files set aside', <p className="note">No file was refused in the last build.</p>)} />}
          </>
        ) : (
          <>
            <h1 className="a">Nothing to show yet.</h1>
            <p className="sub">Your box has not said how old each source is. It will after its next build.</p>
          </>
        )}
        {invariants ? <FoldRow title="Checks on your data" heading={false} testid="checks" onClick={() => show('Checks on your data', <Checks checks={invariants} />)} /> : null}
      </main>
    </>
  );
}
