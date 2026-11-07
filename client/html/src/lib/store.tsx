/** The app's memory: one snapshot, the box's saved lines, and what is on its way. Nothing here touches disk. */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { builtAt, fetchManifest, fetchSnapshot, fetchStatus, noBuildSince, SnapshotError, staleAfterMs, UnreachableError, type BoxStatus, type HeldBack, type Invariants, type Manifest, type Snapshot, type Sources } from './data';
import { rupees } from './format';
import { foldEvents, investPace, type InvestPace, type PlanEvent, type PlanRec, type Settings, type YearInputs } from './plan';
import { nowIso, post, readLines, WriteError, type CorrectionLine, type RevokeLine, type WriteFailure } from './writes';

export type Phase = 'first' | 'ready' | 'unreachable' | 'server' | 'damaged' | 'version';
export type Refresh = 'idle' | 'updating' | 'unreachable' | 'server' | 'damaged';

const DEFAULT_CUSHIONS = { soft: 25000, hard: 10000 };

/** Saved corrections the snapshot does not include yet. Applied on top so a saved name is not asked again, and amounts never change. */
export function pendingCorrections(lines: Record<string, unknown>[], seq: number): (CorrectionLine | RevokeLine)[] {
  return lines.slice(Math.max(0, seq)) as unknown as (CorrectionLine | RevokeLine)[];
}

export function overlayCorrections(snap: Snapshot, pending: (CorrectionLine | RevokeLine)[]): Snapshot {
  if (!pending.length) return snap;
  const revoked = new Set(pending.flatMap((p) => ('revoke' in p && p.revoke ? [p.revoke] : [])));
  const live = pending.filter((p): p is CorrectionLine => !('revoke' in p && p.revoke) && !revoked.has(p.id));
  if (!live.length) return snap;
  const items = snap.payees.review.items;
  const byKey = new Map(live.map((c) => [c.key, c]));
  const namedKeys = new Map<string, CorrectionLine>();
  for (const item of items) {
    const c = byKey.get(item.key);
    if (c) for (const pay of item.payments) namedKeys.set(pay.key, c);
    if (c && c.scope === 'one') namedKeys.set(item.key, c);
  }
  const days = snap.spend.days.map((d) => {
    if (!d.items.some((i) => i.key && namedKeys.has(i.key))) return d;
    return {
      ...d,
      items: d.items.map((i) => {
        const c = i.key ? namedKeys.get(i.key) : undefined;
        if (!c) return i;
        return { ...i, name: c.merchant ?? i.name, group: c.group ? c.group.split(':')[0] : i.group, category: c.group ?? i.category };
      }),
    };
  });
  const byName = new Map(items.filter((i) => byKey.has(i.key)).map((i) => [i.name, byKey.get(i.key)!]));
  const allocation = snap.spend.allocation && {
    ...snap.spend.allocation,
    fixed: { ...snap.spend.allocation.fixed, rows: snap.spend.allocation.fixed.rows.map((r) => {
      const c = byKey.get(r.key) ?? byName.get(r.name);
      return c?.merchant ? { ...r, name: c.merchant } : r;
    }) },
  };
  return {
    ...snap,
    spend: { ...snap.spend, days, ...(allocation ? { allocation } : {}) },
    payees: { ...snap.payees, review: { ...snap.payees.review, items: items.filter((i) => !byKey.has(i.key)) } },
  };
}

/** Why a field is null, in the contract's fixed words. Show this, never a zero. */
/** The balances green is judged against: before salary, as the hero is, when the snapshot has them. */
export const balanceBar = (snap: Snapshot): number[] => (snap.forecast.before_salary && snap.position.before_salary_ends ? snap.position.before_salary_ends : snap.position.month_ends).map((m) => rupees(m.balance.value));

/** The hero is the before-salary figure. Every page reads `forecast` through this; a snapshot from before it keeps its own fields. */
export function withBeforeSalary(snap: Snapshot): Snapshot {
  const b = snap.forecast.before_salary;
  if (!b) return snap;
  const moves = b.planned_moves?.value ?? 0;
  const due = b.due ? { ...b.due, value: b.due.value + moves } : b.due;
  return { ...snap, forecast: { ...snap.forecast, likely_left: b.figure, status: b.status, month_end: b.date, pay_included: null, next_salary: b.salary, due, due_items: [...b.due_items, ...b.planned_items], usual_spend: b.usual_spend, usual_spend_past: b.usual_spend_past, payment_unmatched: b.payment_unmatched } };
}

export const absentReason = (snap: Snapshot, path: string): string | null => snap.absent.find((a) => a.path === path)?.reason ?? null;

export function yearInputs(snap: Snapshot, invest: number): YearInputs | null {
  const y = snap.plan_inputs.year;
  const first = y.before_salary; // Row 0 is the hero. A snapshot from before it has none.
  if (y.open == null || y.takehome == null || y.outgo == null || y.first_spread == null || y.outgo_spread == null) return null;
  const cash = snap.position.cash ? rupees(snap.position.cash.value) : rupees(y.open);
  return {
    start: y.start,
    open: rupees(y.open),
    cashToday: cash,
    firstSalary: first ? 0 : rupees(y.first_salary ?? 0),
    firstOutgo: rupees(first ? first.first_outgo : y.first_outgo ?? 0),
    firstInvest: first ? rupees(first.first_invest) : 0,
    firstSpread: rupees(first ? first.first_spread : y.first_spread),
    takehome: rupees(y.takehome),
    outgo: rupees(y.outgo),
    outgoSpread: rupees(y.outgo_spread),
    invest,
    essentials: y.essentials == null ? null : rupees(y.essentials),
    bills: y.bills.map((b) => ({ ym: b.ym, name: b.name, amount: rupees(b.amount) })),
    vests: y.vests.map((v) => ({ ym: v.ym, date: v.date, instrument: v.instrument, amount: rupees(v.amount), spread: v.spread == null ? null : rupees(v.spread) })),
    sellVests: y.sell_vests,
    history: balanceBar(snap),
    liquid: snap.position.liquid ? rupees(snap.position.liquid.value) : null,
    holdings: { india: rupees(snap.invest.buckets.india ?? 0), us: rupees(snap.invest.buckets.us ?? 0), safe: snap.invest.buckets.safe == null ? null : rupees(snap.invest.buckets.safe) },
  };
}

export function snapshotPlans(snap: Snapshot): PlanRec[] {
  return snap.plan_inputs.expenses.map((e) => ({
    id: e.id,
    rev: e.rev,
    title: e.title,
    amount: rupees(e.amount.value),
    ym: e.ym,
    by: e.by,
    flex: e.flex,
    spread: e.spread,
    status: e.status,
    note: e.note,
    paid: e.paid.reduce((t, p) => t + rupees(p.amount), 0),
    changedElsewhere: e.changed_elsewhere,
  }));
}

export interface SaveResult { ok: boolean; failure?: WriteFailure; changedElsewhere?: boolean }
/** A failed save, held in memory only, with its retry. It stays on screen wherever the owner goes. */
export interface SaveFailure { failure: WriteFailure; retry: () => void }

interface Store {
  phase: Phase;
  refresh: Refresh;
  snap: Snapshot | null;
  /** The snapshot with saved corrections on top. Use this one on screen. */
  view: Snapshot | null;
  now: number;
  builtMs: number | null;
  stale: boolean;
  held: HeldBack | null;
  /** When the last build ran, if that is too long ago. */
  noBuildMs: number | null;
  sources: Sources | null;
  invariants: Invariants | null;
  reload: () => void;
  plans: PlanRec[];
  settings: Settings;
  /** What the ledger's put in says goes to investing a month; null with too little known. */
  investPace: InvestPace | null;
  /** True once a monthly investing figure was entered: then it, not the ledger's, is used. */
  investEntered: boolean;
  /** False when the box's saved lines could not be read. Pages say so when it matters. */
  boxRead: boolean;
  savePlanEvents: (events: Omit<PlanEvent, 'v' | 'eid' | 'at'>[], eids?: string[]) => Promise<SaveResult>;
  saveCorrection: (line: Omit<CorrectionLine, 'at'> | Omit<RevokeLine, 'at'>) => Promise<SaveResult>;
  savedCorrections: number;
  failure: SaveFailure | null;
  setFailure: (f: SaveFailure | null) => void;
  /** A draft is open: the app will not reload itself for an update. */
  setDraftOpen: (open: boolean) => void;
  draftOpen: () => boolean;
}

const Ctx = createContext<Store | null>(null);
export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error('store missing');
  return s;
}
export const useView = (): Snapshot => {
  const { view } = useStore();
  if (!view) throw new Error('no data');
  return withBeforeSalary(view);
};

let eidCounter = 0;
const newEid = () => `e-${Date.now().toString(36)}-${(eidCounter++).toString(36)}`;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [phase, setPhase] = useState<Phase>('first');
  const [refresh, setRefresh] = useState<Refresh>('idle');
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [manifest, setManifest] = useState<Manifest | null>(null);
  const [status, setStatus] = useState<BoxStatus | null>(null);
  const [failure, setFailure] = useState<SaveFailure | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [events, setEvents] = useState<PlanEvent[] | null>(null);
  const [corrections, setCorrections] = useState<Record<string, unknown>[] | null>(null);
  const [localCorrections, setLocalCorrections] = useState<Record<string, unknown>[]>([]);
  const generation = useRef<string | undefined>(undefined);
  const haveSnap = useRef(false);
  const running = useRef(false);
  const draft = useRef(false);

  const load = useCallback(async () => {
    if (running.current) return;
    running.current = true;
    const slow = setTimeout(() => setRefresh('updating'), haveSnap.current ? 300 : 0);
    setNow(Date.now());
    // Read whatever else happens: a first build that was blocked has a status and no manifest.
    const statusRead = fetchStatus();
    try {
      const manifest = await fetchManifest();
      if (manifest.generation === undefined || manifest.generation !== generation.current || !haveSnap.current) {
        const next = await fetchSnapshot(manifest);
        generation.current = manifest.generation;
        haveSnap.current = true;
        setSnap(next);
        setLocalCorrections([]);
        setManifest(manifest);
      }
      const [st, planLines, corrLines] = await Promise.all([statusRead, readLines('plan-events'), readLines('corrections')]);
      setStatus(st);
      setEvents(planLines.ok ? (planLines.lines as unknown as PlanEvent[]) : null);
      setCorrections(corrLines.ok ? corrLines.lines : null);
      if (corrLines.ok) setLocalCorrections([]);
      setPhase('ready');
      setRefresh('idle');
    } catch (error) {
      const cause = error instanceof UnreachableError ? 'unreachable' : error instanceof SnapshotError ? (error.kind === 'version' ? 'version' : 'damaged') : 'server';
      // A failed load keeps the last word from the box, unless the box has a newer one.
      const st = await statusRead;
      if (st) setStatus(st);
      if (haveSnap.current) {
        setRefresh(cause === 'version' ? 'server' : cause);
      } else {
        setPhase(cause);
        setRefresh('idle');
      }
    } finally {
      clearTimeout(slow);
      running.current = false;
    }
  }, []);

  useEffect(() => {
    void load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') void load();
    };
    document.addEventListener('visibilitychange', onVisible);
    const tick = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(tick);
    };
  }, [load]);

  const view = useMemo(() => {
    if (!snap) return null;
    const fromBox = pendingCorrections(corrections ?? [], snap.payees.corrections_seq);
    const known = new Set(fromBox.map((c) => c.id));
    return overlayCorrections(snap, [...fromBox, ...(localCorrections as unknown as typeof fromBox).filter((c) => !known.has(c.id))]);
  }, [snap, corrections, localCorrections]);

  const folded = useMemo(() => {
    if (!snap) return { plans: [] as PlanRec[], set: {} as Record<string, unknown> };
    if (!events) return { plans: snapshotPlans(snap), set: {} };
    const known = snapshotPlans(snap);
    const paid = new Map(known.map((p) => [p.id, p.paid]));
    // The box's lines are the freshest word on saved plans; the plans file is not in them.
    const fromFile = new Set(snap.plan_inputs.expenses.filter((e) => e.source === 'plans_file').map((e) => e.id));
    const out = foldEvents(events, known.filter((p) => fromFile.has(p.id)));
    out.plans.forEach((p) => {
      p.paid = p.paid || (paid.get(p.id) ?? 0);
    });
    return out;
  }, [snap, events]);

  /** How much goes to investing a month: what was entered, else what the ledger's put in shows. Never a silent 0 when the ledger knows better. */
  const investPaceNow = useMemo(() => (snap ? investPace(snap.invest.contributions.map((c) => ({ month: c.month, amount: rupees(c.amount.value) })), snap.invest.put_in_source?.covered_months ?? [], snap.plan_inputs.year.start) : null), [snap]);
  const investEntered = 'invest' in folded.set || (!!snap && (snap.plan_inputs.year.invest_source === 'entered' || snap.plan_inputs.year.invest !== 0));
  const settings = useMemo<Settings>(() => {
    const c = snap?.plan_inputs.cushions;
    const base: Settings = {
      soft: c ? rupees(c.soft) : DEFAULT_CUSHIONS.soft,
      hard: c ? rupees(c.hard) : DEFAULT_CUSHIONS.hard,
      invest: snap ? (investEntered ? rupees(snap.plan_inputs.year.invest) : investPaceNow?.monthly ?? 0) : 0,
      eq: snap?.plan_inputs.settings.eq ?? 80,
    };
    const s = folded.set;
    return { soft: (s.soft as number) ?? base.soft, hard: (s.hard as number) ?? base.hard, invest: (s.invest as number) ?? base.invest, eq: (s.eq as number) ?? base.eq };
  }, [snap, folded, investEntered, investPaceNow]);

  const savePlanEvents = useCallback<Store['savePlanEvents']>(async (list, eids) => {
    const stamped: PlanEvent[] = list.map((e, i) => ({ v: 1, eid: eids?.[i] ?? newEid(), at: nowIso(), ...e }) as PlanEvent);
    let changed = false;
    for (const e of stamped) {
      try {
        const res = await post('plan-events', e);
        changed = changed || res.changedElsewhere;
        setEvents((prev) => {
          const base = prev ?? [];
          return base.some((x) => x.eid === e.eid) ? base : [...base, e];
        });
      } catch (error) {
        const failure = error instanceof WriteError ? error.failure : 'server';
        return { ok: false, failure };
      }
    }
    return { ok: true, changedElsewhere: changed };
  }, []);

  const saveCorrection = useCallback<Store['saveCorrection']>(async (line) => {
    const full = { at: nowIso(), ...line };
    try {
      await post('corrections', full);
      setLocalCorrections((prev) => (prev.some((x) => x.id === full.id) ? prev : [...prev, full]));
      return { ok: true };
    } catch (error) {
      return { ok: false, failure: error instanceof WriteError ? error.failure : 'server' };
    }
  }, []);

  const builtMs = snap ? builtAt(manifest) : null;
  const value: Store = {
    phase,
    refresh,
    snap,
    view,
    now,
    builtMs,
    stale: !!snap && builtMs != null && now - builtMs > staleAfterMs(snap),
    held: status?.held ?? null,
    noBuildMs: snap ? noBuildSince(status?.attemptMs ?? null, builtMs, now) : null,
    sources: status?.sources ?? null,
    invariants: status?.invariants ?? null,
    reload: () => void load(),
    plans: folded.plans,
    settings,
    investPace: investPaceNow,
    investEntered,
    boxRead: events != null,
    savePlanEvents,
    saveCorrection,
    savedCorrections: localCorrections.length,
    failure,
    setFailure,
    setDraftOpen: (open) => {
      draft.current = open;
    },
    draftOpen: () => draft.current,
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
