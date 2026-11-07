/** Plan: one plain statement, the year as a picture, your big expenses, then titled sections. Screens have their own history entries, so Back goes back. */
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { PageHeader, StateBar } from '../App';
import { Chip, CloseButton, Hl, Ico, N, NamedIco, NameChip, Sheet, useSheet, useWide, useWidth, type ChipStep } from '../ui/kit';
import { FanChart, YearChart } from '../ui/plancharts';
import { fc, inr, monthLong, monthLongYear, monthName, short, ymAdd, rangeEnds, usually } from '../lib/format';
import {
  afford, badYearLoss, canInvestMore, cashSplit, family, fixes as findFixes, headline, idx, longRun, lowest, monthsOf, placeSay, RANK, remaining, rivals,
  series, slots, statuses, stockShare, STOCKS, totalHoldings, verdict, withCand, word, type Fix, type Headline, type InvestPace, type PlanRec, type Row, type Settings, type WhatIf, type YearInputs, UNDO_EID } from '../lib/plan';
import { DEEP_SHARE, shortfall, step as stepOf, type Cushions, type Kind, type Step } from '../lib/status';
import { go, useRoute } from '../lib/router';
import { absentReason, useStore, useView, yearInputs } from '../lib/store';
import type { Snapshot } from '../lib/data';
import { rangeLabel } from './shared';
import { FoldRow, InfoButton, Stat, WithInfo } from '../ui/tight';

function KindChip({ kind, amt, step, y }: { kind: Kind; amt: number; step?: Step | 'off'; y: YearInputs }) {
  const s = step ?? stepOf(kind, amt, y.liquid);
  const w = word(kind, amt, s);
  if (s[0] === 'r' || s[0] === 'g') return <Chip step={s as ChipStep} kind={kind}>{w}</Chip>;
  return <span className="sc n1" data-step="n" data-kind={kind}>{w}</span>;
}

function HeadLine({ H, c, liquid }: { H: Headline; c: Cushions; liquid: number | null }) {
  const m = monthLong(H.line.ym);
  if (H.line.kind === 'sell' && !liquid) return <>In {m}, you would be <N>{short(H.line.amount)}</N> short.</>;
  if (H.line.kind === 'sell') return <>In {m}, you would need to sell <N>{short(H.line.amount)}</N> of investments.</>;
  if (H.line.kind === 'dip') return <>In {m}, you fall <N>{short(H.line.amount)}</N> below <span className="u-rule">your {short(c.soft)} soft cushion</span>.</>;
  if (H.line.kind === 'could') return <>{m} balance: <N>{fc(H.line.m, H.line.hw)}</N>. A costly month could take it <N>{short(H.line.amount)}</N> under your {short(c.hard)} hard cushion.</>;
  const ends = rangeEnds(H.line.m, H.line.hw);
  return <Stat value={<N>{short(H.line.m)}</N>} period={monthName(H.line.ym).toUpperCase()} periodLabel={`End of ${m}`} tag={`lowest balance${H.line.hw > 0 ? `, ${usually(ends.low, ends.high)}` : ''}`} testid="lowest" />;
}

/** The marker sits on the amount alone, never on its range. */
function marked(m: number, h: number) {
  const text = fc(m, h);
  const at = text.indexOf(', usually');
  return at < 0 ? <Hl><N>{text}</N></Hl> : <><Hl><N>{text.slice(0, at)}</N></Hl><N>{text.slice(at)}</N></>;
}

/** The chart's key. `warnOnly`: just the months under a cushion, for under the chart; the full key is behind its (i). */
function Caption({ rows, c, y, warnOnly }: { rows: Row[]; c: Cushions; y: YearInputs; warnOnly?: boolean }) {
  const st = statuses(rows, c, y);
  const by = (f: (m: (typeof st)[number]) => boolean) => st.filter(f).map((m) => monthName(m.ym)).join(', ');
  const sell = by((m) => m.kind === 'sell');
  const dip = by((m) => m.kind === 'dip');
  const could = by((m) => m.kind === 'could');
  const gr = by((m) => m.step[0] === 'g');
  const out: ReactNode[] = [];
  if (sell) out.push(<li key="s"><i className={`m warn ${st.some((m) => m.step === 'r3') ? 'cr3' : 'cr2'}`} aria-hidden="true" />{sell}: below your {short(c.hard)} hard cushion</li>);
  if (dip) out.push(<li key="d"><i className="m warn cr1" aria-hidden="true" />{dip}: below your {short(c.soft)} soft cushion</li>);
  if (warnOnly) return out.length ? <ul className="caption">{out}</ul> : null;
  if (could && (sell || dip || st.filter((m) => m.kind === 'could').length > 1)) out.push(<li key="c" data-kind="could">{could}: likely fine, a costly month could take {st.filter((m) => m.kind === 'could').length > 1 ? 'them' : 'it'} under your {short(c.hard)} hard cushion</li>);
  if (gr) out.push(<li key="g"><i className="m okk cg2" aria-hidden="true" />{gr}: far above your usual balance</li>);
  return out.length ? <ul className="caption">{out}</ul> : null;
}

const fmtTyped = (v: number): string => (v ? `₹${v.toLocaleString('en-IN')}` : '');
const digits = (s: string): number => Number(s.replace(/[^\d]/g, '')) || 0;

const StepGlyph = ({ plus }: { plus?: boolean }) => <svg viewBox="0 0 16 16" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d={plus ? 'M3 8h10M8 3v10' : 'M3 8h10'} /></svg>;

/** − and + for small changes, and the value itself opens a typed field with lakh commas. Round steps. */
function Stepper({ label, sub, shown, value, step, min = 0, max = 1e11, onChange, typed = true, suffix }: { label: string; sub?: string; shown: ReactNode; value: number; step: number; min?: number; max?: number; onChange: (v: number) => void; typed?: boolean; suffix?: string }) {
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState('');
  const clamp = (v: number) => Math.max(min, Math.min(max, v));
  const commit = () => {
    setEditing(false);
    const next = clamp(digits(text));
    if (text.trim() && next !== value) onChange(next);
  };
  return (
    <div className="stepper" data-stepper={label}>
      <span>{label}{sub ? <small>{sub}</small> : null}</span>
      <button className="st-b" aria-label={`Less, ${label}`} disabled={value <= min} onClick={() => onChange(clamp(value - step))}><StepGlyph /></button>
      {editing ? (
        <input
          className="n v stepper-input"
          inputMode="numeric"
          autoFocus
          aria-label={label}
          value={text}
          onChange={(e) => setText(typed && !suffix ? fmtTyped(digits(e.target.value)) : e.target.value.replace(/[^\d]/g, ''))}
          onBlur={commit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') commit();
            if (e.key === 'Escape') setEditing(false);
          }}
        />
      ) : typed ? (
        <button className="n v stepper-value" aria-label={`Type ${label}`} onClick={() => { setText(suffix ? String(value) : fmtTyped(value)); setEditing(true); }}>{shown}</button>
      ) : <span className="n v">{shown}</span>}
      <button className="st-b" aria-label={`More, ${label}`} disabled={value >= max} onClick={() => onChange(clamp(value + step))}><StepGlyph plus /></button>
    </div>
  );
}

interface Draft { id?: string; title: string; amount: number; spread: number; flex: PlanRec['flex']; ym?: string; rev?: number }
interface Place { cand: PlanRec; ym: string | null; isEdit: boolean; moveOnly: boolean; others: Record<string, string> }
type Wi = { kind: 'hh'; from: string; delta: number; setup: number } | { kind: 'job'; from: string; take: number; gap: number } | { kind: 'par'; amount: number; draw: number; eq: number } | { kind: 'buy'; amount: number; ym: string };

let planCounter = 0;
const newPlanId = () => `pln_${Date.now().toString(36)}${(planCounter++).toString(36)}`;
let eidN = 0;
const makeEids = (n: number) => Array.from({ length: n }, () => `e-${Date.now().toString(36)}-${(eidN++).toString(36)}`);

const useScreenWidth = () => useWidth<HTMLDivElement>();

function EmptyYear({ view, plans }: { view: Snapshot; plans: PlanRec[] }) {
  const live = plans.filter((p) => p.status === 'planned');
  const reason = absentReason(view, 'plan_inputs.year') ?? 'Plan needs your bank balance and a few months of history before it can show your year.';
  return (
    <>
      <PageHeader title="Plan" />
      <StateBar />
      <main className="planp">
        <section className="sec first">
          <h1 className="a" id="ans">{live.length ? `${live.length} big ${live.length === 1 ? 'expense is' : 'expenses are'} saved.` : 'No big expenses yet.'}</h1>
          <p className="say">{reason}</p>
          {live.length ? <ul className="exp">{live.map((p) => <li key={p.id}><div className="r exp-row"><span className="icr"><Ico q={{ name: p.title }} /><b>{p.title}</b><small>{monthLongYear(p.ym)}</small></span><N>{inr(remaining(p))}</N></div></li>)}</ul> : null}
        </section>
      </main>
    </>
  );
}

export function Plan() {
  const view = useView();
  const { settings: s, plans, savePlanEvents, setFailure, setDraftOpen } = useStore();
  const y = yearInputs(view, s.invest);
  const route = useRoute();
  const screen = route.params.get('screen');
  const [draft, setDraft] = useState<Draft>({ title: '', amount: 0, spread: 1, flex: 'any' });
  const [place, setPlace] = useState<Place | null>(null);
  const [wi, setWi] = useState<Wi | null>(null);
  const [toast, setToast] = useState<{ text: string; undo: () => void } | null>(null);
  const [saving, setSaving] = useState(false);
  const [justSaved, setJustSaved] = useState<string | null>(null);
  const [changed, setChanged] = useState(false);
  const [err, setErr] = useState('');
  const { open } = useSheet();

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 6000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    setDraftOpen(screen === 'add' || screen === 'place');
    return () => setDraftOpen(false);
  }, [screen, setDraftOpen]);

  /** A save that fails stays on screen with a retry, using the same ids. It never says Saved before the box does. */
  const save = (events: Parameters<typeof savePlanEvents>[0], onOk: (changedElsewhere: boolean) => void, eidPrefix = '') => {
    const eids = makeEids(events.length).map((e) => `${eidPrefix}${e}`);
    const attempt = async () => {
      setSaving(true);
      const res = await savePlanEvents(events, eids);
      setSaving(false);
      if (res.ok) {
        setFailure(null);
        onOk(!!res.changedElsewhere);
      } else {
        setFailure({ failure: res.failure ?? 'server', retry: () => void attempt() });
      }
    };
    void attempt();
  };

  const planList = plans;
  const live = planList.filter((p) => p.status === 'planned');
  const c: Cushions = { soft: s.soft, hard: s.hard };
  const openSheet = (id: string) => {
    const p = planList.find((x) => x.id === id);
    if (p) open(<PlanSheet plan={p} rows={y ? series(y, planList, s) : []} y={y!} c={c} onMove={() => startMove(p)} onEdit={() => startEdit(p)} onFlex={() => toggleFlex(p)} onCancel={() => cancel(p)} onRestore={() => restore(p)} />, p.title);
  };
  const startAdd = () => {
    setDraft({ title: '', amount: 0, spread: 1, flex: 'any' });
    setErr('');
    go('plan?screen=add');
  };
  const startMove = (p: PlanRec) => {
    setPlace({ cand: { ...p }, ym: p.ym, isEdit: true, moveOnly: true, others: {} });
    go('plan?screen=place');
  };
  const startEdit = (p: PlanRec) => {
    setDraft({ id: p.id, title: p.title, amount: p.amount, spread: p.spread, flex: p.flex, ym: p.ym, rev: p.rev });
    setErr('');
    go('plan?screen=add');
  };
  const toggleFlex = (p: PlanRec) => {
    const next = p.flex === 'fixed' ? 'any' : 'fixed';
    save([{ op: 'update', id: p.id, base_rev: p.rev, set: { flex: next } }], (ce) => setChanged(ce));
  };
  const cancel = (p: PlanRec) => {
    save([{ op: 'status', id: p.id, to: 'cancelled' }], () => setToast({ text: 'Cancelled.', undo: () => restore(p) }));
  };
  const restore = (p: PlanRec) => {
    setToast(null);
    save([{ op: 'status', id: p.id, to: 'planned' }], () => undefined);
  };
  const setSetting = (patch: Partial<Settings>) => save([{ op: 'set', set: patch }], () => undefined);
  const scr = useMemo(() => ({ add: screen === 'add', place: screen === 'place' && !!place, wi: screen === 'wi' && !!wi }), [screen, place, wi]);

  useEffect(() => {
    document.body.style.overflow = scr.add || scr.place || scr.wi ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [scr.add, scr.place, scr.wi]);

  if (!y) return <EmptyYear view={view} plans={plans} />;

  const goPlace = () => {
    if (!draft.title.trim()) return setErr('Give it a name.');
    if (!draft.amount) return setErr('Enter how much.');
    setErr('');
    const existing = draft.id ? planList.find((p) => p.id === draft.id) : undefined;
    setPlace({ cand: { id: draft.id ?? '__new', rev: draft.rev ?? 0, title: draft.title.trim(), amount: draft.amount, ym: draft.ym ?? y.start, by: null, flex: draft.flex, spread: draft.spread, status: 'planned', note: null, paid: existing?.paid ?? 0, changedElsewhere: false }, ym: draft.id ? draft.ym ?? null : null, isEdit: !!draft.id, moveOnly: false, others: {} });
    go('plan?screen=place');
  };

  const onSavePlace = (P: Place, ym: string) => {
    const c2 = P.cand;
    const events: Parameters<typeof savePlanEvents>[0] = [];
    const undo: Parameters<typeof savePlanEvents>[0] = [];
    for (const [oid, oym] of Object.entries(P.others)) {
      const pv = planList.find((x) => x.id === oid);
      if (!pv) continue;
      events.push({ op: 'update', id: oid, base_rev: pv.rev, set: { ym: oym } });
      undo.push({ op: 'update', id: oid, set: { ym: pv.ym } });
    }
    let id = c2.id;
    if (P.isEdit) {
      const prev = planList.find((x) => x.id === c2.id)!;
      events.push({ op: 'update', id: c2.id, base_rev: prev.rev, set: { ym, title: c2.title, amount: c2.amount, spread: c2.spread } });
      undo.push({ op: 'update', id: c2.id, set: { ym: prev.ym, title: prev.title, amount: prev.amount, spread: prev.spread } });
    } else {
      id = newPlanId();
      events.push({ op: 'create', id, data: { title: c2.title, amount: c2.amount, ym, by: null, flex: 'any', spread: c2.spread, status: 'planned', match_hint: null, note: null } });
      undo.push({ op: 'status', id, to: 'cancelled' });
    }
    save(events, (ce) => {
      setChanged(ce);
      setJustSaved(id);
      setPlace(null);
      go('plan', { replace: true });
      setToast({ text: `Saved. ${c2.title} is in ${monthLong(ym)}.`, undo: () => { setToast(null); save(undo, () => undefined, P.isEdit ? '' : UNDO_EID); } });
    });
  };

  return (
    <div className="planp">
      <MainPage view={view} y={y} s={s} plans={planList} live={live} c={c} justSaved={justSaved} changed={changed} onAdd={startAdd} onOpen={openSheet} onSetting={setSetting} onWi={(k) => {
        setWi(k === 'buy' ? { kind: 'buy', amount: 50000, ym: ymAdd(y.start, 1) } : k === 'hh' ? { kind: 'hh', from: ymAdd(y.start, 2), delta: 10000, setup: 0 } : k === 'job' ? { kind: 'job', from: ymAdd(y.start, 5), take: y.takehome, gap: 1 } : { kind: 'par', amount: 2000000, draw: 10000, eq: 0.4 });
        go('plan?screen=wi');
      }} onRestore={restore} />
      <div className="cta"><button className="bigbtn" onClick={startAdd}>Plan a big expense</button></div>
      {toast ? <div className="toast on" role="status"><span>{toast.text}</span><button onClick={toast.undo}>Undo</button></div> : null}
      {scr.add ? <AddScreen draft={draft} setDraft={setDraft} err={err} onNext={goPlace} /> : null}
      {screen === 'place' && !place ? <AddScreen draft={draft} setDraft={setDraft} err={err} onNext={goPlace} /> : null}
      {scr.place ? <PlaceScreen key={place!.cand.id} P={place!} setP={setPlace} y={y} s={s} plans={planList} saving={saving} onSave={onSavePlace} /> : null}
      {scr.wi ? <WiScreen W={wi!} setW={setWi} y={y} s={s} plans={live} c={c} /> : null}
    </div>
  );
}

/** Where the monthly investing figure comes from, in words. Plan takes it out of the bank each month after this one, as a planned move. */
function InvestSaid({ s, entered, pace, rows }: { s: Settings; entered: boolean; pace: InvestPace | null; rows: Row[] }) {
  const next = rows[1] ? monthLong(rows[1].ym) : null;
  const out = next ? ` Plan takes it out of your bank each month from ${next}.` : '';
  if (entered) return <>You set <N>{inr(s.invest)}</N> a month for investing.{out}</>;
  if (pace) return <>Over the last {pace.months} months you put about <N>{inr(s.invest)}</N> a month into investing.{out}</>;
  return <>How much you invest each month is not known yet, so Plan counts <N>{inr(s.invest)}</N>.</>;
}

/** The first month from which a higher figure keeps every later month above the soft cushion. */
function RaiseSaid({ more, s, rows }: { more: { from: string | null; extra: number }; s: Settings; rows: Row[] }) {
  if (!(more.extra > 0 && more.from)) return <>Investing more would take your bank balance too low.</>;
  const to = <N>{inr(s.invest + more.extra)}</N>;
  if (more.from === rows[0].ym) return <>You could raise it to {to} a month now.</>;
  return <>You could raise it to {to} a month starting in {monthLongYear(more.from)}. Before that, more would take your balance below your soft cushion.</>;
}

const FOLDS = ['cash', 'whatif', 'long', 'based'] as const;
type FoldId = (typeof FOLDS)[number];

function MainPage({ view, y, s, plans, live, c, justSaved, changed, onAdd, onOpen, onSetting, onWi, onRestore }: { view: Snapshot; y: YearInputs; s: Settings; plans: PlanRec[]; live: PlanRec[]; c: Cushions; justSaved: string | null; changed: boolean; onAdd: () => void; onOpen: (id: string) => void; onSetting: (p: Partial<Settings>) => void; onWi: (k: 'hh' | 'job' | 'par' | 'buy') => void; onRestore: (p: PlanRec) => void }) {
  const { open } = useSheet();
  const { investPace: pace, investEntered } = useStore();
  const rows = series(y, live, s);
  const H = headline(rows, live, c, y);
  const crit = H.tone === 'crit';
  const ct = cashSplit(rows, y.cashToday, s.soft);
  const more = canInvestMore(rows, s.soft);
  const L = longRun(y, live, s, undefined, s.eq);
  const Lm = more.extra > 0 ? longRun(y, live, { ...s, invest: s.invest + more.extra }, undefined, s.eq) : null;
  const [refYear, wYear] = useWidth<HTMLDivElement>();
  const wide = useWide();
  const [refLong, wLong] = useWidth<HTMLDivElement>(340, wide);
  const low40 = longRun(y, live, s, undefined, 40);
  const hi80 = longRun(y, live, s, undefined, 80);
  const widens = Math.abs(hi80.h(5) - low40.h(5)) > Math.abs(hi80.med(5) - low40.med(5));
  const expRows = [...live].sort((a, b) => idx(y.start, a.ym) - idx(y.start, b.ym));
  const paid = plans.filter((p) => p.status === 'paid');
  const cancelled = plans.filter((p) => p.status === 'cancelled' && !p.undone);
  const h = y.holdings;
  const safeReason = absentReason(view, 'invest.buckets.safe');
  const returnsReason = absentReason(view, 'plan_inputs.returns');
  const vestReason = absentReason(view, 'plan_inputs.year.vests_in_cash');
  const route = useRoute();
  // Tight: sections past the first screen fold to a row; a tap unfolds one in place. Phone keeps the cash answer open, desktop the 5 years.
  const [unfolded, setUnfolded] = useState<Set<FoldId>>(() => new Set(FOLDS.includes(route.section as FoldId) ? [route.section as FoldId] : []));
  const isOpen = (f: FoldId) => unfolded.has(f) || (wide ? f === 'long' : f === 'cash');
  const unfold = (f: FoldId) => setUnfolded((u) => new Set(u).add(f));
  const fold = (f: FoldId, title: string, body: ReactNode) => (isOpen(f) ? body : <FoldRow key={f} title={title} heading={false} onClick={() => unfold(f)} testid={f} />);
  const chartKey = (
    <>
      <Caption rows={rows} c={c} y={y} />
      <p className="range-note">Grey band: the likely range. {rangeLabel(view).replace(/^./, (c) => c.toUpperCase())}.</p>
    </>
  );
  const cashWhy = (
    <>
      <p>Today you have <N>{short(ct.total)}</N> in the bank.</p>
      <p data-invest={investEntered ? 'entered' : pace ? 'ledger' : 'unknown'}><InvestSaid s={s} entered={investEntered} pace={pace} rows={rows} /> <RaiseSaid more={more} s={s} rows={rows} /></p>
      {Lm ? <p>That adds about <N>{short(Lm.med(5) - L.med(5))}</N> by year 5.</p> : null}
    </>
  );
  const longSection = (
          <section className="sec" id="long">
            <h2>Where will I be in 5 years?</h2>
            <p className="say big">{marked(L.med(5), L.h(5))} in 5 years.</p>
            <div ref={refLong}>
              <button className="chartbtn" aria-label="Projection chart. Open what it is based on." onClick={() => { unfold('based'); setTimeout(() => document.getElementById('based')?.scrollIntoView(), 0); }}>
                <FanChart L={L} W={wLong} noGrowth />
              </button>
            </div>
            <h3><WithInfo text="How much of my money should be in stocks?" title="Money in stocks" label="About the stock share"><p>{h.safe == null ? `Of what is counted, ${Math.round(stockShare(y) * 100)}% is in stocks today.` : `You have ${Math.round(stockShare(y) * 100)}% in stocks today.`} The forecast uses the one you pick.</p><p>All your money, in today&apos;s rupees.{safeReason ? ` ${safeReason}` : ''}</p></WithInfo></h3>
            <ul className="pick" id="stocks">
              {STOCKS.map((eq) => {
                const X = longRun(y, live, s, undefined, eq);
                return <li key={eq}><button aria-pressed={s.eq === eq} onClick={() => onSetting({ eq })}><i className="rd" /><span><b>{eq}% in stocks</b><small><N>{fc(X.med(5), X.h(5))}</N> in 5 years</small><small>A bad market year: −{short(badYearLoss(y, eq))}</small></span></button></li>;
              })}
            </ul>
            <p className="mt4">{widens ? 'More stocks mostly widens the range. The middle barely moves.' : 'More stocks raises the middle as well as the range.'}</p>
            <h3>Your investments today</h3>
            <div className="split" role="img" aria-label={`India ${short(h.india)}, US ${short(h.us)}`}>
              <i className="fill-i4" style={{ flex: h.india }} />
              <i className="fill-i2" style={{ flex: h.us }} />
              {h.safe ? <i className="fill-t2" style={{ flex: h.safe }} /> : null}
            </div>
            <div className="lab"><u className="fill-i4" /><span>India stocks</span><N>{short(h.india)}</N></div>
            <div className="lab"><u className="fill-i2" /><span>US stocks</span><N>{short(h.us)}</N></div>
            {h.safe != null ? <div className="lab"><u className="fill-t2" /><span>EPF, PPF, FDs, gold</span><N>{short(h.safe)}</N></div> : <div className="lab"><u className="fill-t2" /><span>EPF, PPF, FDs, gold</span><span className="sc quiet">Not known</span></div>}
          </section>
  );
  return (
    <>
      <PageHeader title="Plan" to="reports?from=plan" />
      <StateBar />
      <main className="duo">
        <div className="pri">
          <section className="sec first" id="year">
            <div className={crit ? 'band-crit' : ''} data-kind={crit ? 'sell' : undefined}>
              <h1 className="a" id="ans">{H.h}</h1>
              <p className="say" id="anssub"><HeadLine H={H} c={c} liquid={y.liquid} /></p>
            </div>
            {changed ? <p className="note" role="status">This expense was changed elsewhere too. The latest change stands, and your history keeps both.</p> : null}
            {H.blame ? <button className="tlink" onClick={() => onOpen(H.blame!.id)}>Change {H.blame.title}</button> : null}
            <h2 className="chart-t"><WithInfo text="Money in your bank, next 12 months" title="Money in your bank" label="About this chart">{chartKey}</WithInfo></h2>
            <div ref={refYear}>
              <button className="chartbtn" aria-label={`${H.h} Bank balance chart, next 12 months. Open each month.`} onClick={() => open(<MonthsSheet rows={rows} c={c} y={y} />, 'Each month')}>
                <YearChart rows={rows} y={y} c={c} W={wYear} flags={live} />
              </button>
            </div>
            <Caption rows={rows} c={c} y={y} warnOnly />
            <button className="tlink" onClick={() => open(<MonthsSheet rows={rows} c={c} y={y} />, 'Each month')}>See each month</button>
            <div className="wide-only close-gap"><button className="bigbtn" onClick={onAdd}>Plan a big expense</button></div>
          </section>
          <section className="sec" id="expenses">
            <h2>Your big expenses</h2>
            {expRows.length ? (
              <ul className="exp">
                {expRows.map((p) => {
                  const v = verdict(rows, Math.max(0, idx(y.start, p.ym)), c);
                  return (
                    <li key={p.id} className={justSaved === p.id ? 'justsaved' : undefined}>
                      <button onClick={() => onOpen(p.id)}>
                        <span className="icr"><Ico q={{ name: p.title }} /><NameChip name={p.title} chip={<KindChip kind={v.kind} amt={v.short} y={y} />} /><small>{p.spread > 1 ? `${monthLongYear(p.ym)}, over ${p.spread} months` : monthLongYear(p.ym)}</small></span>
                        <span className="rt"><N>{inr(remaining(p))}</N></span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : <p>No big expenses yet.</p>}
            {paid.length ? (
              <>
                <h3>Already paid</h3>
                <ul className="exp">{paid.map((p) => <li key={p.id}><button onClick={() => onOpen(p.id)}><span className="icr"><Ico q={{ name: p.title }} /><b>{p.title}</b><small>Paid{p.paid !== p.amount ? `, ${short(Math.abs(p.paid - p.amount))} ${p.paid > p.amount ? 'more' : 'less'} than planned` : ''}</small></span><span className="rt"><N>{inr(p.paid)}</N></span></button></li>)}</ul>
              </>
            ) : null}
            {cancelled.length ? (
              <button className="tlink close-gap" onClick={() => open(<CancelledSheet list={cancelled} onRestore={onRestore} />, 'Cancelled')}>{cancelled.length} cancelled. Kept in your history.</button>
            ) : null}
          </section>
          {wide ? fold('long', 'Where will I be in 5 years?', longSection) : null}
        </div>
        <div className="side">
          {fold('cash', 'Should I invest my cash?', (
          <section className="sec" id="cash" key="cash">
            <h2>Should I invest my cash?</h2>
            <p className="say big">{ct.free > 0 ? <><b>Yes.</b> <span className="stat" data-stat="invest"><span className="stat-v"><N>{short(ct.free)}</N></span><span className="st-tag">to invest now</span></span></> : 'Not yet. All of it is needed.'}<InfoButton title="Should I invest my cash?" label="Why this amount">{cashWhy}</InfoButton></p>
            <div className="split" role="img" aria-label={`Costs ${short(ct.costs)}, cushion ${short(ct.keep)}, free ${short(ct.free)}`}>
              <i className="fill-t3" style={{ flex: ct.costs }} />
              <i className="fill-ink" style={{ flex: ct.keep }} />
              {ct.free ? <i className="fill-inv" style={{ flex: ct.free }} /> : null}
            </div>
            <div className="lab"><u className="fill-t3" /><span>Costs before your next salary</span><N>{short(ct.costs)}</N></div>
            <div className="lab"><u className="fill-ink" /><span>Your soft cushion</span><N>{short(ct.keep)}</N></div>
            <div className="lab"><u className="fill-inv" /><span>Free to invest</span><N>{short(ct.free)}</N></div>
            <Stepper label="You invest each month" shown={inr(s.invest)} value={s.invest} step={5000} onChange={(v) => onSetting({ invest: v })} />
          </section>
          ))}
          {fold('whatif', 'What if something changes?', (
          <section className="sec" id="whatif" key="whatif">
            <h2>What if something changes?</h2>
            <p className="muted">Try it out. Nothing is saved.</p>
            <ul className="q">
              <li><button onClick={() => onWi('hh')}><span className="icr"><NamedIco name="users" /><b>My household costs change</b></span><i className="chev" /></button></li>
              <li><button onClick={() => onWi('job')}><span className="icr"><NamedIco name="briefcase-business" /><b>I switch jobs</b></span><i className="chev" /></button></li>
              <li><button onClick={() => onWi('buy')}><span className="icr"><NamedIco name="banknote" /><b>Can I afford something in a month?</b><small>Not saved, not added to your plan</small></span><i className="chev" /></button></li>
              <li><button onClick={() => onWi('par')}><span className="icr"><NamedIco name="users" /><b>I add my parents&apos; money</b><small>Kept separate from yours</small></span><i className="chev" /></button></li>
            </ul>
          </section>
          ))}
          {wide ? null : fold('long', 'Where will I be in 5 years?', longSection)}
          {fold('based', 'What this is based on', (
          <section className="sec based" id="based" key="based">
            <h2>What this is based on</h2>
            <p>These are estimates, not promises.</p>
            <Stepper label="Your soft cushion" sub="Below this is a warning" shown={short(s.soft)} value={s.soft} step={5000} min={s.hard} onChange={(v) => onSetting({ soft: v })} />
            <Stepper label="Your hard cushion" sub="Below this is critical" shown={short(s.hard)} value={s.hard} step={5000} max={s.soft} onChange={(v) => onSetting({ hard: v })} />
            <dl>
              <dt>From your data</dt><dd>Bank balance, salary, usual costs, yearly bills{!investEntered && pace ? ', and what you put into investing over the last 12 months' : ''}. Today is {view.meta.as_of}.</dd>
              <dt>You entered</dt><dd>Big expenses, cushions{investEntered ? ', how much you invest' : ''}.</dd>
              <dt>Assumed</dt><dd>Stocks grow 5% a year above inflation, with big swings. Safe money grows 1.5%. Cash grows 0%.{returnsReason ? ` ${returnsReason} These are the design's own figures.` : ''}</dd>
              <dt>Left out</dt><dd>Tax, pay rises, new RSU grants, falls within a year.{safeReason ? ` ${safeReason}` : ''}{vestReason ? ` ${vestReason}` : ''}</dd>
              <dt>What the range means</dt><dd>An estimate: {rangeLabel(view)}.</dd>
              <dt>Far above your usual balance</dt><dd>Even the low end beats 10 of your last 12 month-ends. At most 3 months show this.</dd>
              <dt>When a month turns red</dt><dd>Pale: you dip below your soft cushion. A month that only could dip stays black, with the words saying how far. Medium: you must sell investments. Deep: you must sell over {Math.round(DEEP_SHARE * 100)}% of your {y.liquid ? `${short(y.liquid)} ` : ''}liquid money, which is cash, stocks and funds.</dd>
            </dl>
            <p className="note close-gap">Saved to your box, one line for each change. Nothing about your plans stays on this phone.</p>
            <p className="note close-gap">Beyond about 5 years, the range reflects these assumptions more than your money. Not financial advice.</p>
          </section>
          ))}
        </div>
      </main>
    </>
  );
}

function MonthsSheet({ rows, c, y }: { rows: Row[]; c: Cushions; y: YearInputs }) {
  const st = statuses(rows, c, y);
  return (
    <>
      <h2>Each month</h2>
      <p className="muted">Your bank balance at the end of each month.</p>
      {rows.map((r, i) => {
        const m = st[i];
        const bits: ReactNode[] = [];
        if (r.salary) bits.push(`Salary +${short(r.salary)}`);
        if (r.vestT) bits.push(`RSU +${short(r.vestT)}`);
        else if (r.vests.length) bits.push(`RSU ${short(r.vests.reduce((t, v) => t + v.amount, 0))} not counted as cash`);
        bits.push(`Costs −${short(r.outgo)}`);
        if (r.invest) bits.push(`Investing −${short(r.invest)}`);
        r.bills.forEach((b) => bits.push(`${b.name} −${short(b.amount)}`));
        r.items.forEach((b) => bits.push(`${b.title} −${short(b.amount)}`));
        return (
          <div className="mrow" key={r.ym}>
            <div className="tp"><span className="nm"><b>{monthLongYear(r.ym)}</b> <span className="chipl">{m.early ? <span className="sc n1" data-step="n" data-kind="early">Too early to tell</span> : <KindChip kind={m.kind} amt={m.x} step={m.step} y={y} />}</span></span><N>{fc(r.end, m.early ? 0 : r.h)}</N></div>
            <small>{bits.join(', ')}</small>
          </div>
        );
      })}
      <CloseButton />
    </>
  );
}

function PlanSheet({ plan: p, rows, y, c, onMove, onEdit, onFlex, onCancel, onRestore }: { plan: PlanRec; rows: Row[]; y: YearInputs; c: Cushions; onMove: () => void; onEdit: () => void; onFlex: () => void; onCancel: () => void; onRestore: () => void }) {
  const { close } = useSheet();
  if (p.status === 'cancelled') {
    return (
      <>
        <h2>{p.title}</h2>
        <p>Cancelled. {inr(p.amount)} in {monthLongYear(p.ym)}.</p>
        <button className="sheetrow" onClick={() => { close(); onRestore(); }}>Restore this expense</button>
        <CloseButton />
      </>
    );
  }
  if (p.status === 'paid') {
    return (
      <>
        <h2>{p.title}</h2>
        <p>Paid {inr(p.paid)}. Planned {inr(p.amount)}.</p>
        <p className="muted">Only your statement can mark this paid.</p>
        <CloseButton />
      </>
    );
  }
  const v = verdict(rows, Math.max(0, idx(y.start, p.ym)), c);
  return (
    <>
      <h2>{p.title}</h2>
      <p>{inr(remaining(p))} in {monthLongYear(p.ym)}.</p>
      <p className="sheet-chip"><KindChip kind={v.kind} amt={v.short} y={y} /></p>
      <button className="sheetrow" onClick={() => { close(); onMove(); }}>Move to another month</button>
      <button className="sheetrow" onClick={() => { close(); onEdit(); }}>Change the name or amount</button>
      <button className="sheetrow" aria-pressed={p.flex === 'fixed'} onClick={() => { close(); onFlex(); }}>Can this date move? {p.flex === 'fixed' ? 'No. Tap to allow this to move' : 'Yes. Tap if this date cannot move'}</button>
      <button className="sheetrow" onClick={() => { close(); onCancel(); }}>Cancel this expense</button>
      <CloseButton />
    </>
  );
}

function CancelledSheet({ list, onRestore }: { list: PlanRec[]; onRestore: (p: PlanRec) => void }) {
  const { close } = useSheet();
  return (
    <>
      <h2>Cancelled</h2>
      <p className="muted">Kept in your history. Restore puts one back in your plan.</p>
      {list.map((p) => <button key={p.id} className="sheetrow" onClick={() => { close(); onRestore(p); }}>Restore {p.title}, {inr(p.amount)}</button>)}
      <CloseButton />
    </>
  );
}

function Back({ label = 'Back' }: { label?: string }) {
  return <div className="scrtop"><button className="back" onClick={() => history.back()}><i />{label}</button></div>;
}

function AddScreen({ draft, setDraft, err, onNext }: { draft: Draft; setDraft: (d: Draft) => void; err: string; onNext: () => void }) {
  return (
    <div id="screen" className="on">
      <div className="scr">
        <Back />
        <h1>{draft.id ? 'Change this expense' : 'Plan a big expense'}</h1>
        <p className="muted add-lede">Next, you pick a month.</p>
        <label className="field"><span>What is it?</span><input id="d-title" autoComplete="off" maxLength={120} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} /></label>
        <label className="field"><span>How much?</span><input id="d-amt" className="amt" inputMode="numeric" placeholder="₹" value={fmtTyped(draft.amount)} onChange={(e) => setDraft({ ...draft, amount: digits(e.target.value) })} /></label>
        <div className="field">
          <span>How will you pay?</span>
          <div className="seg" id="d-spread">
            {[[1, 'All at once'], [3, 'Over 3 months'], [6, 'Over 6 months']].map(([k, t]) => <button key={k} aria-pressed={draft.spread === k} onClick={() => setDraft({ ...draft, spread: k as number })}>{t}</button>)}
          </div>
        </div>
        <button className="bigbtn" id="d-go" onClick={onNext}>See which months work</button>
        <p id="d-err" className="muted err" role="alert">{err}</p>
      </div>
    </div>
  );
}

function PlaceScreen({ P, setP, y, s, plans, saving, onSave }: { P: Place; setP: (p: Place) => void; y: YearInputs; s: Settings; plans: PlanRec[]; saving: boolean; onSave: (P: Place, ym: string) => void }) {
  const c: Cushions = { soft: s.soft, hard: s.hard };
  const cand = P.cand;
  const base = plans.filter((p) => p.status === 'planned' && p.id !== cand.id).map((p) => (P.others[p.id] ? { ...p, ym: P.others[p.id] } : p));
  const sl = slots(y, base, cand, s);
  const ym = P.ym && monthsOf(y.start).includes(P.ym) ? P.ym : sl.best.ym;
  const cur = sl.slots[idx(y.start, ym)];
  const v = cur.v;
  const after = series(y, withCand(base, cand, ym), s);
  const without = series(y, base, s);
  const say = placeSay(v, ym, cur.step, c, y.liquid);
  const fx: Fix[] = RANK[v.kind] >= RANK.dip ? findFixes(y, base, cand, ym, s) : [];
  const riv = RANK[v.kind] >= RANK.dip ? rivals(y, base, cand, ym, s) : [];
  const lab = riv.length === 1 ? `${riv[0].title} in ${monthLong(riv[0].ym)} is using the same money.` : riv.length > 1 ? `${riv.map((r) => r.title).join(' and ')} are using the same money.` : '';
  const good = RANK[v.kind] < RANK.dip;
  const [ref, w] = useScreenWidth();
  const tiny = typeof innerHeight === 'number' && innerHeight < 720;
  // A phone: the list of fixes starts under the fold, so the best fix sits above Save anyway. Wider screens have room for the list.
  const footFix = typeof innerHeight === 'number' && innerHeight < 900 && w < 700;
  const fixButton = (f: Fix) => (f.kind === 'self'
    ? <button key="self" onClick={() => setP({ ...P, ym: f.ym })}>Buy {cand.title} in {monthLong(f.ym)} instead</button>
    : <button key={f.id} onClick={() => setP({ ...P, others: { ...P.others, [f.id]: f.ym } })}>Move {f.title} to {monthLong(f.ym)}. Then {cand.title} works in {monthLong(ym)}.</button>);
  return (
    <div id="screen" className="on">
      <div className="scr wide">
        <Back />
        <h1>When can you buy it?</h1>
        <p className="muted">{cand.title}, {inr(cand.amount)}{cand.spread > 1 ? `, over ${cand.spread} months` : ''}. Pick a month.</p>
        <div className="cols2">
          <div className="pv">
            <h2>Bank balance if you buy in {monthLong(ym)}</h2>
            <div className="chartbox" id="pchart" ref={ref}><YearChart rows={after} y={y} c={c} W={w} H={tiny ? 110 : 160} compare={without} cmpLabel="Without it" flags={[{ title: cand.title, ym }]} /></div>
          </div>
          <div>
            <div className="months" id="months">
              {sl.slots.map((o) => {
                const t = o.ok ? word(o.v.kind, o.v.short, o.step) : 'Too late';
                const parts = t.match(/^(Dips|Sell) (.*)$/);
                const mark = o.step === 'off' || o.step === 'n' ? null : <i className={`m ${o.step[0] === 'r' ? 'warn' : 'okk'}`} aria-hidden="true" />;
                return (
                  <button key={o.ym} className="tile" data-ym={o.ym} data-s={o.step} data-kind={o.v.kind} aria-pressed={o.ym === ym} disabled={!o.ok} onClick={() => setP({ ...P, ym: o.ym })}>
                    <b>{monthName(o.ym)}</b>{mark}
                    <small>{parts ? <>{parts[1]}<br /><span className="n">{parts[2]}</span></> : t}</small>
                  </button>
                );
              })}
            </div>
            {fx.length > 1 || (fx.length && !footFix) ? (
              <div className="fixes" id="fixes">
                <h2>Ways to fix this</h2>
                {lab ? <p>{lab}</p> : null}
                {(footFix ? fx.slice(1) : fx).map(fixButton)}
              </div>
            ) : null}
          </div>
        </div>
        <div className="foot">
          <p id="pl-msg">{say.text}{say.fig ? <N>{say.fig}</N> : null}{say.tail ?? ''}</p>
          {footFix && fx.length ? <div className="fixes foot-fix">{fixButton(fx[0])}</div> : null}
          <button className={`bigbtn${good ? '' : ' alt'}`} id="pl-save" disabled={saving} onClick={() => onSave({ ...P }, ym)}>{saving ? 'Saving to your box' : `${good ? 'Save' : 'Save anyway'}: ${cand.title} in ${monthLong(ym)}`}</button>
        </div>
      </div>
    </div>
  );
}

function WiScreen({ W, setW, y, s, plans, c }: { W: Wi; setW: (w: Wi) => void; y: YearInputs; s: Settings; plans: PlanRec[]; c: Cushions }) {
  const [ref, w] = useScreenWidth();
  const months = monthsOf(y.start);
  if (W.kind === 'buy') return <AffordScreen W={W} setW={setW} y={y} s={s} plans={plans} c={c} />;
  if (W.kind === 'par') {
    const mine = longRun(y, plans, s, undefined, s.eq);
    const F = family({ amount: W.amount, draw: W.draw, eq: W.eq });
    const T = F.t;
    const t = 5;
    const toM = mine.q[t].p50 + T.q[t].p50;
    const toH = (mine.q[t].p90 + T.q[t].p90 - (mine.q[t].p10 + T.q[t].p10)) / 2;
    const vmax = Math.max(...mine.q.map((q) => q.p90), ...T.q.map((q) => q.p90), 1);
    return (
      <div id="screen" className="on">
        <div className="scr wide" ref={ref}>
          <Back />
          <h1>What if I add my parents&apos; money?</h1>
          <div className="tryout">This is only a try-out. Nothing is saved.</div>
          <p className="say">You type these figures in. None come from your data.</p>
          <div className="cols2">
            <div>
              <Stepper label="Their money" shown={short(W.amount)} value={W.amount} step={100000} onChange={(v) => setW({ ...W, amount: v })} />
              <Stepper label="They use each month" shown={short(W.draw)} value={W.draw} step={5000} onChange={(v) => setW({ ...W, draw: v })} />
              <Stepper label="Theirs in stocks" shown={`${Math.round(W.eq * 100)}%`} value={Math.round(W.eq * 100)} step={20} min={20} max={80} typed={false} onChange={(v) => setW({ ...W, eq: v / 100 })} />
              <p className="say close-gap">Their money cannot pay for your big expenses.</p>
              <p className="muted">Tax rules differ by person. Check with someone qualified before moving any.</p>
            </div>
            <div>
              <h2>In 5 years</h2>
              <div className="lab two-col"><span>Yours</span><N>{fc(mine.med(t), mine.h(t))}</N></div>
              <div className="lab two-col"><span>Theirs</span><N>{fc(T.med(t), T.h(t))}</N></div>
              <div className="lab two-col total"><span>Together</span><N>{fc(toM, toH)}</N></div>
              {F.empty ? <p className="say close-gap"><Chip step="r3">Runs out</Chip> Their money runs out in about {F.empty} years.</p> : <p className="say close-gap"><span className="sc n1">Lasts</span> Their money lasts the full 10 years.</p>}
              <h2>Your money</h2>
              <FanChart L={mine} W={Math.min(w, 600)} H={170} vmax={vmax} />
              <h2>Their money, same scale</h2>
              <FanChart L={T} W={Math.min(w, 600)} H={170} vmax={vmax} />
            </div>
          </div>
          <div className="foot"><button className="bigbtn" onClick={() => history.back()}>Done</button></div>
        </div>
      </div>
    );
  }
  const scenario: WhatIf = W.kind === 'hh' ? { household: { from: W.from, delta: W.delta, setup: W.setup } } : { job: { from: W.from, gap: W.gap, takehome: W.take } };
  const rows = series(y, plans, s, scenario);
  const base = series(y, plans, s);
  const H = headline(rows, plans, c, y, true);
  const La = longRun(y, plans, s, undefined, s.eq);
  const Lb = longRun(y, plans, s, scenario, s.eq);
  const d5 = Lb.med(5) - La.med(5);
  const dSave = W.kind === 'hh' ? -W.delta : W.take - y.takehome;
  const lost = W.kind === 'job' ? y.vests.filter((v) => v.ym >= W.from) : [];
  const fromIdx = months.indexOf(W.from);
  const step = (d: number) => months[Math.max(1, Math.min(11, fromIdx + d))];
  return (
    <div id="screen" className="on">
      <div className="scr wide" ref={ref}>
        <Back />
        <h1>{W.kind === 'hh' ? 'What if my household costs change?' : 'What if I switch jobs?'}</h1>
        <div className="tryout">This is only a try-out. Nothing is saved.</div>
        <div className="cols2">
          <div>
            {W.kind === 'hh' ? (
              <>
                <Stepper label="Change in cost, each month" shown={short(W.delta, true)} value={W.delta} step={5000} onChange={(v) => setW({ ...W, delta: v })} />
                <MonthStepper value={W.from} onStep={(d) => setW({ ...W, from: step(d) })} />
                <Stepper label="One-time cost" sub="Deposit, moving" shown={short(W.setup)} value={W.setup} step={25000} onChange={(v) => setW({ ...W, setup: v })} />
              </>
            ) : (
              <>
                <Stepper label="New salary, take-home" shown={short(W.take)} value={W.take} step={5000} onChange={(v) => setW({ ...W, take: v })} />
                <MonthStepper value={W.from} onStep={(d) => setW({ ...W, from: step(d) })} />
                <Stepper label="Months with no pay" shown={String(W.gap)} value={W.gap} step={1} max={6} typed={false} onChange={(v) => setW({ ...W, gap: v })} />
              </>
            )}
          </div>
          <div>
            <h2>What happens</h2>
            <div className={H.tone === 'crit' ? 'band-crit' : ''}><p className="say big" id="wi-h">{H.h}</p><p className="say" id="wi-s"><HeadLine H={H} c={c} liquid={y.liquid} /></p></div>
            {dSave ? <p className="say">You would have <N>{short(Math.abs(dSave))}</N> {dSave < 0 ? 'less' : 'more'} left each month.</p> : null}
            {lost.length ? <><p className="say">You would lose RSUs in {lost.map((v) => monthName(v.ym)).join(' and ')}: <N>{short(lost.reduce((t, v) => t + v.amount, 0))}</N>.</p><p className="muted">Check this against your offer.</p></> : W.kind === 'job' ? <p className="muted">Check this against your offer.</p> : null}
            <p className="say">In 5 years: <N>{short(Math.abs(d5))}</N> {d5 < 0 ? 'less' : 'more'}.</p>
            <h2>Your bank balance with this change</h2>
            <YearChart rows={rows} y={y} c={c} W={Math.min(w, 600)} H={200} compare={base} cmpLabel="Without this" />
            <Caption rows={rows} c={c} y={y} />
          </div>
        </div>
        <div className="foot"><button className="bigbtn" onClick={() => history.back()}>Done</button></div>
      </div>
    </div>
  );
}

/** The answer is the same verdict Pick a month gives, on the real plan plus this one amount. Held in memory: nothing is sent or kept. */
function AffordScreen({ W, setW, y, s, plans, c }: { W: Extract<Wi, { kind: 'buy' }>; setW: (w: Wi) => void; y: YearInputs; s: Settings; plans: PlanRec[]; c: Cushions }) {
  const [ref, w] = useScreenWidth();
  const months = monthsOf(y.start);
  const A = afford(y, plans, s, W.amount, W.ym);
  const step = stepOf(A.v.kind, A.v.short, y.liquid);
  const say = placeSay(A.v, W.ym, step, c, y.liquid);
  const answer = A.v.kind === 'fits' || A.v.kind === 'just' ? 'Yes, you can afford it.' : A.v.kind === 'could' ? 'Probably. Only a costly month would make it tight.' : A.v.kind === 'dip' ? 'Not without going under your soft cushion.' : 'Not without selling investments.';
  const M = monthLong(W.ym);
  const i = months.indexOf(W.ym);
  return (
    <div id="screen" className="on">
      <div className="scr wide" ref={ref}>
        <Back />
        <h1>Can I afford something in a month?</h1>
        <div className="tryout">This is only a try-out. Nothing is saved.</div>
        <div className="cols2">
          <div>
            <Stepper label="How much" shown={inr(W.amount)} value={W.amount} step={10000} onChange={(v) => setW({ ...W, amount: v })} />
            <MonthStepper label="In" value={W.ym} onStep={(d) => setW({ ...W, ym: months[Math.max(0, Math.min(11, i + d))] })} />
            <p className="muted">It is not added to your big expenses. To keep it, plan it as a big expense.</p>
          </div>
          <div aria-live="polite">
            <h2>The answer</h2>
            <div className={A.v.kind === 'sell' ? 'band-crit' : ''}><p className="say big" id="af-h"><KindChip kind={A.v.kind} amt={A.v.short} step={step} y={y} /> {answer}</p><p className="say" id="af-s">{say.text}{say.fig ? <N>{say.fig}</N> : null}{say.tail ?? ''}</p></div>
            <div className="lab two-col"><span>End of {M}, with it</span><N>{fc(A.at.end, A.at.h)}</N></div>
            <div className="lab two-col"><span>End of {M}, without it</span><N>{fc(A.without.end, A.without.h)}</N></div>
            <div className="lab two-col"><span>Lowest after, end of {monthLong(A.v.low.ym)}</span><N>{fc(A.v.low.end, A.v.low.h)}</N></div>
            <p className="muted">Your soft cushion is <N>{short(c.soft)}</N> and your hard cushion <N>{short(c.hard)}</N>.</p>
            <h2>Your bank balance with it</h2>
            <YearChart rows={A.rows} y={y} c={c} W={Math.min(w, 600)} H={200} compare={A.base} cmpLabel="Without it" />
            <Caption rows={A.rows} c={c} y={y} />
          </div>
        </div>
        <div className="foot"><button className="bigbtn" onClick={() => history.back()}>Done</button></div>
      </div>
    </div>
  );
}

function MonthStepper({ value, onStep, label = 'Starting in' }: { value: string; onStep: (d: number) => void; label?: string }) {
  return (
    <div className="stepper">
      <span>{label}</span>
      <button className="st-b" aria-label="Earlier" onClick={() => onStep(-1)}><StepGlyph /></button>
      <span className="n v">{monthName(value)} {value.slice(2, 4)}</span>
      <button className="st-b" aria-label="Later" onClick={() => onStep(1)}><StepGlyph plus /></button>
    </div>
  );
}

export { lowest, totalHoldings, Sheet, shortfall };
