/** Name payees: unknown money, largest first. One tap applies to all payments from that ID. A failed save stays on screen with a retry. */
import { useEffect, useMemo, useRef, useState } from 'react';
import { DataAge } from '../App';
import { Ico, Link, N, Sheet, uuid } from '../ui/kit';
import { dayLabel, inr, rupees, timeLabel } from '../lib/format';
import { go, useRoute } from '../lib/router';
import { useStore, useView } from '../lib/store';
import { FAILURE_WORDS, type WriteFailure } from '../lib/writes';
import type { ReviewItem, Suggestion } from '../lib/data';

const GROUPS = ['Food', 'Food:Groceries', 'Food:EatingOut', 'Housing', 'Shopping', 'Travel', 'Health', 'Bills', 'Personal'];
const NOT_SPENDING = 'internal_transfer';

/** A memory cue, computed: when these payments tend to fall. Never free text. */
function cue(item: ReviewItem): string {
  const pays = item.payments;
  if (!pays.length) return `${item.count} ${item.count === 1 ? 'payment' : 'payments'}, latest ${dayLabel(item.latest)}`;
  if (pays.length === 1) {
    const p = pays[0];
    return `One payment on ${dayLabel(p.date)}${p.time ? `, ${clock(p.time)}` : ''}`;
  }
  const oldest = pays[pays.length - 1];
  return `${item.count} payments since ${dayLabel(oldest.date)}`;
}
const clock = (t: string): string => {
  const [h, m] = t.split(':').map(Number);
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${h < 12 ? 'am' : 'pm'}`;
};

/** The engine's guess in two words, "Likely: A person" or "Likely: ZED MART Housing". Null when the snapshot carries none: nothing is invented. */
export function likelyOf(item: ReviewItem): { who: string; what: string | null } | null {
  const s = item.suggestions[0] ?? item.suggestion;
  if (!s) return null;
  const person = s.treatment === 'person';
  const who = s.name ?? s.commodity ?? (person ? 'A person' : null);
  const what = s.group ? s.group.split(':')[0] : null;
  if (!who) return what ? { who: what, what: null } : null;
  return { who, what: person && !s.name ? null : what };
}

const allOf = (it: ReviewItem): string => (it.count === 1 ? 'The payment' : `All ${it.count} payments`);
interface Done { id: string; words: string }

export function Names() {
  const view = useView();
  const route = useRoute();
  const { saveCorrection } = useStore();
  const [skipped, setSkipped] = useState<string[]>([]);
  const [done, setDone] = useState<Done | null>(null);
  const [failed, setFailed] = useState<{ failure: WriteFailure; retry: () => void } | null>(null);
  const [busy, setBusy] = useState(false);
  const [typing, setTyping] = useState(false);
  const [namedTotal, setNamedTotal] = useState(0);
  const from = route.params.get('from');
  const back = from === 'today' ? 'today' : 'spend';
  const queue = useMemo(() => [...view.payees.review.items].sort((a, b) => b.month_total.value - a.month_total.value || b.total.value - a.total.value || b.latest.localeCompare(a.latest)), [view]);
  const remaining = queue.filter((q) => !skipped.includes(q.key));
  const item = remaining[0] ?? null;
  const monthTotal = rupees(view.payees.review.month_total.value);
  const left = queue.reduce((t, q) => t + rupees(q.month_total.value), 0);
  const base = Math.max(monthTotal, left + namedTotal);
  const named = Math.max(0, base - left);
  const spent = rupees(view.spend.spent.value);
  const under5 = spent > 0 && left / spent < 0.05;
  const pct = base > 0 ? Math.round((named / base) * 100) : 100;
  const liveRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (done) liveRef.current?.focus?.();
  }, [done]);

  const apply = async (it: ReviewItem, line: { merchant?: string; group?: string; treatment?: string }, words: string, id: string) => {
    setBusy(true);
    setFailed(null);
    const res = await saveCorrection({ id, key: it.key, scope: it.scope, ...line });
    setBusy(false);
    if (!res.ok) {
      setFailed({ failure: res.failure ?? 'server', retry: () => void apply(it, line, words, id) });
      return false;
    }
    setNamedTotal((t) => t + rupees(it.month_total.value));
    setDone({ id, words });
    return true;
  };

  const undo = async () => {
    if (!done) return;
    const id = uuid();
    const res = await saveCorrection({ id, revoke: done.id });
    if (!res.ok) {
      setFailed({ failure: res.failure ?? 'server', retry: () => void undo() });
      return;
    }
    setDone(null);
    setNamedTotal(0);
  };

  const choose = (it: ReviewItem, s: Suggestion) => {
    const words = s.treatment === 'person' ? `Named ${s.name}, a person. ${allOf(it)} stay as they are.` : `Named ${s.name}. ${allOf(it)} moved to ${(s.group ?? '').split(':')[0]}.`;
    const line: { merchant?: string; group?: string; treatment?: string } = {};
    if (s.name) line.merchant = s.name;
    if (s.group && s.treatment === 'expense') line.group = s.group;
    if (s.treatment && s.treatment !== 'expense') line.treatment = s.treatment;
    if (s.treatment === 'expense' && s.group) line.treatment = 'expense';
    void apply(it, line, words, uuid());
  };

  const top = (
    <>
      <header className="top">
        <h1 className="d">Name payees</h1>
        <Link className="btn-q" to={back}>Done for now</Link>
      </header>
      <DataAge />
    </>
  );

  if (!queue.length && !done) {
    return (
      <>
        {top}
        <main>
          <h1 className="a">Every payee has a name.</h1>
          <p className="sub">New ones appear here after your next statement or bank message.</p>
          <div className="wrap mt4"><Link className="bigbtn" to={back}>{back === 'today' ? 'Back to Today' : 'Back to Spend'}</Link></div>
        </main>
      </>
    );
  }

  const mixed = !!item && (item.distinct_names ?? 0) > 1;
  const likely = item ? likelyOf(item) : null;
  const suggestions = item ? (item.suggestions.length ? item.suggestions : item.suggestion ? [item.suggestion] : []).slice(0, 2) : [];

  return (
    <>
      {top}
      <main>
        <section className="queue">
          <div className="note" data-note="count">{remaining.length} to name, largest first.</div>
          <div className="prog" role="img" aria-label={`${pct} percent of unknown money named: ${inr(named)} of ${inr(base)}. ${under5 ? 'Under 5% of the month has no name now.' : 'Goes green when under 5% of the month has no name.'}`}><i className={under5 ? 'prog-done' : ''} style={{ width: `${pct}%` }} /></div>
          {done ? (
            <div className="done" role="status">
              <span ref={liveRef as React.RefObject<HTMLSpanElement>} tabIndex={-1}>{done.words.split(/(Named [^.]+\.)/).map((part, i) => (i === 1 ? <b key={i}>{part}</b> : part))}</span>
              <button onClick={() => void undo()}>Undo</button>
            </div>
          ) : null}
          {failed ? (
            <div className="savefail" role="alert">
              <span><i className="m q" aria-hidden="true" />{FAILURE_WORDS[failed.failure]}</span>
              <button onClick={failed.retry}>Try again</button>
            </div>
          ) : null}
          {busy ? <p className="saving">Saving to your box.</p> : null}
          {item ? (
            <>
              <p className="raw"><Ico q={{ unnamed: true }} />{item.raw ?? item.name}</p>
              <div className="paid n">{inr(rupees(item.total.value))}</div>
              <p className="lede"><span className="hl">{cue(item)}</span></p>
              {likely && !mixed ? <p className="likely" data-note="likely">Likely: <b>{likely.who}</b>{likely.what ? <> {likely.what}</> : null}</p> : null}
              {item.payments.length ? (
                <ul className="pay">
                  {item.payments.slice(0, 4).map((p) => <li key={p.key}><span>{dayLabel(p.date)}{p.time ? `, ${clock(p.time)}` : ''}</span><N>{inr(rupees(p.amount))}</N></li>)}
                </ul>
              ) : null}
            </>
          ) : (
            <>
              <h1 className="a">That is all of them.</h1>
              <p className="sub">Your names reach every page after the next update. Until then they show here and on Spend.</p>
              <div className="mt4"><Link className="bigbtn" to={back}>{back === 'today' ? 'Back to Today' : 'Back to Spend'}</Link></div>
            </>
          )}
        </section>
        <div className="choice-room" />
      </main>
      {item ? (
        <div className="choices">
          <div className="note" data-note="applies">{suggestions.length && !mixed ? 'Best guess below. ' : ''}{mixed ? `These ${item.count} payments, ${inr(rupees(item.total.value))}, carry ${item.distinct_names} different names, so one choice would rename different people. Name them one at a time on Spend.` : item.scope === 'similar' && item.count > 1 ? `Your choice applies to all ${item.count} payments from this ID, ${inr(rupees(item.total.value))}.` : 'Your choice applies to this payment.'}</div>
          {suggestions.map((s, i) => (
            <button key={`${s.name}-${i}`} className="choice" disabled={busy || mixed} onClick={() => choose(item, s)}>
              <span className="icr"><Ico q={{ name: s.name, group: s.group, confidence: 'suggested' }} /><b>{s.name ?? s.commodity}</b><small>{(s.group ?? '').split(':')[0]}{s.group ? ', ' : ''}{s.reason}</small></span>
            </button>
          ))}
          <button className="choice" disabled={busy || mixed} onClick={() => setTyping(true)}><span><b>Something else</b><small>Type a name or a thing, like milk or auto</small></span></button>
          <div className="two">
            <button className="ghost" disabled={busy} onClick={() => { setDone(null); setFailed(null); setSkipped((s) => [...s, item.key]); }}>Skip this one</button>
            <button className="ghost" disabled={busy || mixed} onClick={() => void apply(item, { treatment: NOT_SPENDING }, `Marked as not spending. ${allOf(item)} stay as they are.`, uuid())}>Not spending</button>
          </div>
        </div>
      ) : null}
      {item ? (
        <Sheet open={typing} onClose={() => setTyping(false)} label="What is this?">
          <TypeName onCancel={() => setTyping(false)} onSave={(name, group) => {
            setTyping(false);
            void apply(item, { merchant: name, group, treatment: 'expense' }, `Named ${name}. ${allOf(item)} moved to ${group.split(':')[0]}.`, uuid());
          }} />
        </Sheet>
      ) : null}
    </>
  );
}

function TypeName({ onSave, onCancel }: { onSave: (name: string, group: string) => void; onCancel: () => void }) {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [err, setErr] = useState('');
  return (
    <>
      <h2>What is this?</h2>
      <label className="label-block"><input className="field-plain" aria-label="Name" value={name} maxLength={40} autoComplete="off" onChange={(e) => setName(e.target.value)} /></label>
      <p className="note mt4">Which group?</p>
      <div className="chips wrapped" role="group" aria-label="Group">
        {GROUPS.map((g) => <button key={g} className="chip flat" aria-pressed={group === g} onClick={() => setGroup(g)}>{(g.split(':')[1] ?? g).replace(/([a-z])([A-Z])/g, '$1 $2')}</button>)}
      </div>
      {err ? <p className="note" role="alert">{err}</p> : null}
      <button className="close" onClick={() => {
        const clean = name.trim();
        if (!clean) return setErr('Give it a name.');
        if (!group) return setErr('Pick a group.');
        onSave(clean, group);
      }}>Save name</button>
      <button className="close quiet" onClick={onCancel}>Cancel</button>
    </>
  );
}

export { timeLabel, go };
