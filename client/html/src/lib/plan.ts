/** Plan's arithmetic, in whole rupees. Pure, no DOM. Rows follow finance/plan_year.py exactly; the rest is the design's engine.js on real inputs. */
import { fc, inr, monthLong, monthName, short, ymAdd } from './format';
import { DEEP_SHARE, greens, isTooWide, kind as kindOf, shortfall, step as stepOf, type Cushions, type Kind, type Step } from './status';

export interface YearInputs {
  start: string;
  open: number;
  cashToday: number;
  firstSalary: number;
  firstOutgo: number;
  firstInvest?: number;
  firstSpread: number;
  takehome: number;
  outgo: number;
  outgoSpread: number;
  invest: number;
  essentials: number | null;
  bills: { ym: string; name: string; amount: number }[];
  vests: { ym: string; date: string; instrument: string; amount: number; spread: number | null }[];
  sellVests: boolean;
  history: number[];
  liquid: number | null;
  holdings: { india: number; us: number; safe: number | null };
}

export interface PlanRec {
  id: string;
  rev: number;
  title: string;
  amount: number;
  ym: string;
  by: string | null;
  flex: 'any' | 'fixed' | 'earlier';
  spread: number;
  status: 'planned' | 'paid' | 'cancelled';
  undone?: boolean;
  note: string | null;
  paid: number;
  changedElsewhere: boolean;
}

export interface Settings { soft: number; hard: number; invest: number; eq: number }

export interface PlanEvent {
  v: 1;
  eid: string;
  at: string;
  op: 'create' | 'update' | 'status' | 'set' | 'match' | 'unmatch';
  txn?: string;
  amount?: number;
  closes?: boolean;
  id?: string;
  data?: Record<string, unknown>;
  base_rev?: number;
  to?: string;
  set?: Record<string, unknown>;
}

/** Oldest first. Undo is one more event. A stale base_rev still wins, and is noted. Mirrors finance/plan_store.fold. */
/** The eid of an Undo straight after adding a plan. Forecasts read it as cancelled; the app shows no trace, since the owner took it back rather than cancelling it. */
export const UNDO_EID = 'undo-';

export function foldEvents(log: PlanEvent[], base: PlanRec[] = []): { plans: PlanRec[]; set: Record<string, unknown> } {
  const by = new Map<string, PlanRec>(base.map((p) => [p.id, { ...p }]));
  let set: Record<string, unknown> = {};
  const seen = new Set<string>();
  const matched = new Map<string, { id: string; amount: number }>();
  for (const e of log) {
    if (seen.has(e.eid)) continue;
    seen.add(e.eid);
    if (e.op === 'set') {
      set = { ...set, ...e.set };
      continue;
    }
    if (e.op === 'create' && e.id) {
      if (by.has(e.id)) continue;
      const d = e.data ?? {};
      by.set(e.id, { id: e.id, rev: 1, title: String(d.title), amount: Number(d.amount), ym: String(d.ym), by: (d.by as string) ?? null, flex: (d.flex as PlanRec['flex']) ?? 'any', spread: Number(d.spread ?? 1), status: (d.status as PlanRec['status']) ?? 'planned', note: (d.note as string) ?? null, paid: 0, changedElsewhere: false });
      continue;
    }
    const p = e.id ? by.get(e.id) : undefined;
    if (!p) continue;
    if (e.op === 'update') {
      if (e.base_rev != null && e.base_rev !== p.rev) p.changedElsewhere = true;
      Object.assign(p, e.set);
    } else if (e.op === 'status') {
      p.status = e.to as PlanRec['status'];
      p.undone = e.to === 'cancelled' && e.eid.startsWith(UNDO_EID);
    } else if (e.op === 'match') {
      matched.set(e.txn!, { id: p.id, amount: Number(e.amount ?? 0) });
      p.paid += Number(e.amount ?? 0);
      if (e.closes) p.status = 'paid';
    } else if (e.op === 'unmatch') {
      const m = matched.get(e.txn!);
      if (m) p.paid -= m.amount;
      matched.delete(e.txn!);
      if (p.status === 'paid') p.status = 'planned';
    }
    p.rev += 1;
  }
  return { plans: [...by.values()], set };
}

export interface WhatIf {
  job?: { from: string; gap: number; takehome: number };
  household?: { from: string; delta: number; setup: number };
}
export interface Row {
  ym: string;
  i: number;
  open: number;
  salary: number;
  outgo: number;
  invest: number;
  bills: { name: string; amount: number }[];
  setup: number;
  vestT: number;
  vests: YearInputs['vests'];
  items: { id: string; title: string; amount: number }[];
  end: number;
  h: number;
}

/** What went to investing a month, from the ledger's put in: `invest.contributions`, the figures Invest reads. The 12 whole months before `start`,
 * over the months that are known: one with a contribution, or one every connected source covers (₹0 there is real). Fewer than 3 known months says nothing.
 * Lumpy months are averaged, never predicted one by one. Rounded to ₹1,000. Moves to investing are planned moves (owner, 2026-11-03), so Plan takes this out each month. */
export interface InvestPace { monthly: number; months: number; total: number }
export function investPace(contribs: { month: string; amount: number }[], covered: string[], start: string): InvestPace | null {
  const from = ymAdd(start, -12);
  const to = ymAdd(start, -1);
  const inWin = (m: string) => m >= from && m <= to;
  const known = new Set([...covered.filter(inWin), ...contribs.filter((c) => inWin(c.month)).map((c) => c.month)]);
  if (known.size < 3) return null;
  const total = contribs.filter((c) => inWin(c.month)).reduce((t, c) => t + c.amount, 0);
  return { monthly: Math.max(0, Math.round(total / known.size / 1000) * 1000), months: known.size, total };
}

export const monthsOf = (start: string): string[] => Array.from({ length: 12 }, (_, i) => ymAdd(start, i));
export const idx = (start: string, ym: string): number => monthsOf(start).indexOf(ym);

export const remaining = (p: PlanRec): number => Math.max(0, p.amount - p.paid);

/** Each planned expense's part in this month. What is past its month rolls into the first row, so a late plan stays counted. */
function planned(plans: PlanRec[], ym: string, i: number, first: string): Row['items'] {
  const out: Row['items'] = [];
  for (const p of plans) {
    if (p.status !== 'planned' || remaining(p) <= 0) continue;
    const parts = p.spread || 1;
    const share = Math.floor(remaining(p) / parts);
    const spare = remaining(p) - share * parts;
    let amount = 0;
    for (let k = 0; k < parts; k++) {
      const when = ymAdd(p.ym, k);
      if (when === ym || (i === 0 && when < first)) amount += share + (k < spare ? 1 : 0);
    }
    if (amount) out.push({ id: p.id, title: p.title, amount });
  }
  return out;
}

export function series(y: YearInputs, plans: PlanRec[], s: Pick<Settings, 'invest'>, w: WhatIf = {}): Row[] {
  const rows: Row[] = [];
  let cash = y.open;
  let variance = y.firstSpread ** 2;
  monthsOf(y.start).forEach((ym, i) => {
    const first = i === 0;
    let salary = first ? y.firstSalary : y.takehome;
    let outgo = first ? y.firstOutgo : y.outgo;
    const invest = first ? y.firstInvest ?? 0 : s.invest;
    const job = w.job;
    if (job && ym >= job.from) {
      const n = idx(y.start, ym) - idx(y.start, job.from);
      salary = n < job.gap ? 0 : job.takehome;
    }
    const hh = w.household;
    if (hh && ym >= hh.from) outgo += hh.delta;
    const setup = hh && ym === hh.from ? hh.setup : 0;
    const bills = y.bills.filter((b) => b.ym === ym).map((b) => ({ name: b.name, amount: b.amount }));
    const vests = y.vests.filter((v) => v.ym === ym && !(job && ym >= job.from));
    const vestT = y.sellVests ? vests.reduce((t, v) => t + v.amount, 0) : 0;
    const items = planned(plans, ym, i, y.start);
    const open = cash;
    cash += salary + vestT - outgo - invest - setup - bills.reduce((t, b) => t + b.amount, 0);
    if (!first) variance += y.outgoSpread ** 2;
    if (y.sellVests) for (const v of vests) variance += (v.spread ?? 0) ** 2;
    cash -= items.reduce((t, x) => t + x.amount, 0);
    rows.push({ ym, i, open, salary, outgo, invest, bills, setup, vestT, vests, items, end: cash, h: Math.ceil(Math.sqrt(variance)) });
  });
  return rows;
}

export const RANK: Record<Kind, number> = { fits: 0, just: 1, could: 2, dip: 3, sell: 4 };

export interface MonthStatus { kind: Kind; step: Step; x: number; ym: string; i: number; early: boolean }
/** This month is the month Today's hero talks about, so it follows the hero's rule: a range too wide to say anything, on a figure at or above the soft cushion, is too early to tell. */
const tooEarly = (r: Row, i: number, c: Cushions): boolean => i === 0 && isTooWide(r.h, c.soft) && r.end >= c.soft;
const rowKind = (r: Row, i: number, c: Cushions): Kind => (tooEarly(r, i, c) ? 'just' : kindOf(r.end, r.h, c));

export function statuses(rows: Row[], c: Cushions, y: Pick<YearInputs, 'history' | 'liquid'>): MonthStatus[] {
  const g = greens(rows.map((r, i) => (rowKind(r, i, c) === 'fits' ? r.end - r.h : null)), y.history);
  return rows.map((r, i) => {
    const kind = rowKind(r, i, c);
    const x = shortfall(r.end, c).toSoft;
    return { kind, step: kind === 'fits' ? g[i] ?? 'n' : stepOf(kind, x, y.liquid), x, ym: r.ym, i, early: tooEarly(r, i, c) };
  });
}

export interface Verdict { kind: Kind; at: Row; low: Row; short: number }
/** Worst month from index `from` on. */
export function verdict(rows: Row[], from: number, c: Cushions): Verdict {
  let k: Kind = 'fits';
  let w: Row | null = null;
  let low = rows[from];
  for (let i = from; i < rows.length; i++) {
    const r = rows[i];
    const s = rowKind(r, i, c);
    if (r.end - r.h < low.end - low.h) low = r;
    if (RANK[s] > RANK[k] || (RANK[s] === RANK[k] && RANK[s] > 0 && (!w || r.end < w.end))) {
      k = s;
      w = r;
    }
  }
  w = w ?? low;
  return { kind: k, at: w, low, short: shortfall(w.end, c).toSoft };
}

export const lowest = (rows: Row[]): Row => rows.reduce((a, b) => (b.end < a.end ? b : a));

export const withCand = (plans: PlanRec[], c: PlanRec, ym: string): PlanRec[] => [...plans.filter((p) => p.id !== c.id), { ...c, ym, status: 'planned' }];

export interface Slot { ym: string; i: number; v: Verdict; ok: boolean; step: Step | 'off' }
export function slots(y: YearInputs, plans: PlanRec[], cand: PlanRec, s: Settings, w?: WhatIf): { slots: Slot[]; best: Slot } {
  const c = { soft: s.soft, hard: s.hard };
  const out: Slot[] = monthsOf(y.start).map((ym, i) => ({ ym, i, v: verdict(series(y, withCand(plans, cand, ym), s, w), i, c), ok: i + (cand.spread || 1) <= 12, step: 'n' }));
  const g = greens(out.map((o) => (o.ok && o.v.kind === 'fits' ? o.v.low.end - o.v.low.h : null)), y.history);
  out.forEach((o, i) => {
    o.step = !o.ok ? 'off' : o.v.kind === 'fits' ? g[i] ?? 'n' : stepOf(o.v.kind, o.v.short, y.liquid);
  });
  const win = out.filter((o) => o.ok);
  const best = win.find((o) => o.v.kind === 'fits') ?? win.find((o) => o.v.kind === 'just') ?? win.find((o) => o.v.kind === 'could') ?? [...win].sort((a, b) => a.v.short - b.v.short)[0];
  return { slots: out, best };
}

/** "Can I afford this in that month?": the real plan plus one more expense, held in memory only, never saved. Read from that month on, as placing a big expense reads it. */
export interface Afford { v: Verdict; at: Row; without: Row; rows: Row[]; base: Row[] }
export const AFFORD_ID = '__afford';
export function afford(y: YearInputs, plans: PlanRec[], s: Settings, amount: number, ym: string): Afford {
  const cand: PlanRec = { id: AFFORD_ID, rev: 0, title: 'This', amount, ym, by: null, flex: 'any', spread: 1, status: 'planned', note: null, paid: 0, changedElsewhere: false };
  const i = Math.max(0, idx(y.start, ym));
  const rows = series(y, withCand(plans, cand, ym), s);
  const base = series(y, plans, s);
  return { v: verdict(rows, i, { soft: s.soft, hard: s.hard }), at: rows[i], without: base[i], rows, base };
}

export type Fix = { kind: 'self'; ym: string } | { kind: 'other'; id: string; title: string; ym: string };
export function fixes(y: YearInputs, plans: PlanRec[], cand: PlanRec, ym: string, s: Settings): Fix[] {
  const c = { soft: s.soft, hard: s.hard };
  const ok = (pl: PlanRec[]) => RANK[verdict(series(y, pl, s), 0, c).kind] <= RANK.could;
  const cur = withCand(plans, cand, ym);
  if (ok(cur)) return [];
  const months = monthsOf(y.start);
  const out: Fix[] = [];
  for (const m of months) {
    if (m === ym || idx(y.start, m) + (cand.spread || 1) > 12) continue;
    if (ok(withCand(plans, cand, m))) {
      out.push({ kind: 'self', ym: m });
      break;
    }
  }
  for (const p of plans) {
    if (p.id === cand.id || p.status !== 'planned' || p.flex === 'fixed') continue;
    for (const m of months) {
      if (m === p.ym || idx(y.start, m) + (p.spread || 1) > 12) continue;
      if (ok(cur.map((x) => (x.id === p.id ? { ...x, ym: m } : x)))) {
        out.push({ kind: 'other', id: p.id, title: p.title, ym: m });
        break;
      }
    }
  }
  return out.slice(0, 2);
}

export function rivals(y: YearInputs, plans: PlanRec[], cand: PlanRec, ym: string, s: Settings): PlanRec[] {
  const c = { soft: s.soft, hard: s.hard };
  const v = verdict(series(y, withCand(plans, cand, ym), s), idx(y.start, ym), c);
  if (RANK[v.kind] < RANK.dip) return [];
  const alone = verdict(series(y, withCand(plans.filter((p) => p.status !== 'planned'), cand, ym), s), idx(y.start, ym), c);
  if (RANK[alone.kind] >= RANK[v.kind]) return [];
  return plans.filter((p) => p.id !== cand.id && p.status === 'planned' && idx(y.start, p.ym) <= v.at.i);
}

/* ---- opening sentence: first rule that applies, computed, never free text ---- */
export interface Headline { h: string; line: { kind: 'sell' | 'dip' | 'could' | 'lowest'; ym: string; amount: number; m: number; hw: number }; tone: 'crit' | 'warn' | 'ok'; blame: PlanRec | null }
export function headline(rows: Row[], plans: PlanRec[], c: Cushions, y: YearInputs, noBlame = false): Headline {
  const st = statuses(rows, c, y);
  const bad = st.find((x) => x.kind === 'sell' || x.kind === 'dip');
  const could = st.find((x) => x.kind === 'could');
  const live = plans.filter((p) => p.status === 'planned');
  if (bad) {
    const worst = rows.filter((_, i) => i >= bad.i).reduce((a, b) => (b.end < a.end ? b : a), rows[bad.i]);
    const blame = noBlame ? null : [...live].reverse().filter((p) => idx(y.start, p.ym) <= bad.i).sort((a, b) => idx(y.start, b.ym) - idx(y.start, a.ym))[0] ?? null;
    const shortBy = shortfall(worst.end, c).toSoft;
    const crit = worst.end < c.hard;
    const h = blame ? `${blame.title} does not fit in ${monthLong(blame.ym)}.` : `Money runs short in ${monthLong(rows[bad.i].ym)}.`;
    return { h, line: { kind: crit ? 'sell' : 'dip', ym: worst.ym, amount: shortBy, m: worst.end, hw: worst.h }, tone: crit ? 'crit' : 'warn', blame };
  }
  if (could) {
    const r = rows[could.i];
    return { h: `${monthLong(r.ym)} could dip, but likely won't.`, line: { kind: 'could', ym: r.ym, amount: couldBy(r.end, r.h, c), m: r.end, hw: r.h }, tone: 'ok', blame: null };
  }
  const low = lowest(rows);
  const n = live.length;
  return { h: n ? `Your ${n === 1 ? 'big expense fits' : `${n} big expenses fit`}.` : 'No big expenses planned yet.', line: { kind: 'lowest', ym: low.ym, amount: 0, m: low.end, hw: low.h }, tone: 'ok', blame: null };
}

/* ---- cash vs invest ---- */
export function cashSplit(rows: Row[], cash: number, soft: number): { total: number; keep: number; free: number; costs: number } {
  const minLo = Math.min(...rows.map((r) => r.end - r.h));
  const free = Math.max(0, Math.min(cash - soft, minLo - soft));
  const keep = Math.max(0, Math.min(soft, cash));
  return { total: cash, keep, free, costs: Math.max(0, cash - keep - free) };
}
export function canInvestMore(rows: Row[], soft: number): { from: string | null; extra: number } {
  let last = -1;
  rows.forEach((r, i) => {
    if (r.end - r.h < soft) last = i;
  });
  const m = last + 1;
  if (m >= rows.length) return { from: null, extra: 0 };
  let e = Infinity;
  for (let t = m; t < rows.length; t++) e = Math.min(e, (rows[t].end - rows[t].h - soft) / (t - m + 1));
  return { from: rows[m].ym, extra: Math.max(0, Math.floor(e / 1000) * 1000) };
}

/* ---- long run: seeded annual simulation, today's rupees. Cash earns nothing, only investing grows. ---- */
export const A = { muI: Math.log(1.05), volI: 0.18, muU: Math.log(1.05), volU: 0.17, rho: 0.5, muS: Math.log(1.015), volS: 0.03, driftSd: 0.02, crashP: 1 / 12, crash: -0.25, paths: 1000, years: 10, seed: 42, badYear: -0.35 };
let RET: { I: Float64Array; U: Float64Array; S: Float64Array } | null = null;
function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function returns() {
  if (RET) return RET;
  const R = rng(A.seed);
  const g = () => Math.sqrt(-2 * Math.log(1 - R())) * Math.cos(2 * Math.PI * R());
  const n = A.paths * A.years;
  const I = new Float64Array(n);
  const U = new Float64Array(n);
  const S = new Float64Array(n);
  for (let p = 0; p < A.paths; p++) {
    const d = A.driftSd * g();
    for (let y = 0; y < A.years; y++) {
      const z = g();
      const cr = R() < A.crashP ? A.crash : 0;
      const q = p * A.years + y;
      I[q] = Math.exp(A.muI + d + cr + A.volI * (Math.sqrt(A.rho) * z + Math.sqrt(1 - A.rho) * g())) - 1;
      U[q] = Math.exp(A.muU + d + cr + A.volU * (Math.sqrt(A.rho) * z + Math.sqrt(1 - A.rho) * g())) - 1;
      S[q] = Math.exp(A.muS + A.volS * g()) - 1;
    }
  }
  return (RET = { I, U, S });
}
const pctl = (s: Float64Array, q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
export interface Projection { q: { p10: number; p50: number; p90: number }[]; paid: number[]; med: (y: number) => number; h: (y: number) => number }
export function project(start: number, flows: number[], w: { i: number; u: number; s: number }, held?: number[]): Projection {
  const { I, U, S } = returns();
  const Y = A.years;
  const P = A.paths;
  const hold = held ?? Array<number>(Y + 1).fill(0);
  const vals = Array.from({ length: Y + 1 }, () => new Float64Array(P));
  for (let p = 0; p < P; p++) {
    let v = start;
    vals[0][p] = v + hold[0];
    for (let y = 0; y < Y; y++) {
      const q = p * Y + y;
      const r = w.i * I[q] + w.u * U[q] + w.s * S[q];
      v = Math.max(0, v * (1 + r) + flows[y] * (1 + r / 2));
      vals[y + 1][p] = v + hold[y + 1];
    }
  }
  const paid = [start + hold[0]];
  let f = start;
  for (let y = 0; y < Y; y++) {
    f += flows[y];
    paid.push(f + hold[y + 1]);
  }
  const q = vals.map((a) => {
    const s = Float64Array.from(a).sort();
    return { p10: pctl(s, 0.1), p50: pctl(s, 0.5), p90: pctl(s, 0.9) };
  });
  return { q, paid, med: (t) => q[t].p50, h: (t) => (q[t].p90 - q[t].p10) / 2 };
}
export const STOCKS = [40, 60, 80];
export const weights = (eq: number, us: number) => ({ i: eq * (1 - us), u: eq * us, s: 1 - eq });
export const totalHoldings = (y: YearInputs): number => y.holdings.india + y.holdings.us + (y.holdings.safe ?? 0);
export const stockShare = (y: YearInputs): number => {
  const t = totalHoldings(y);
  return t ? (y.holdings.india + y.holdings.us) / t : 0;
};
const usShare = (y: YearInputs): number => {
  const st = y.holdings.india + y.holdings.us;
  return st ? y.holdings.us / st : 0;
};
export function longRun(y: YearInputs, plans: PlanRec[], s: Settings, w: WhatIf | undefined, eqPct: number): Projection {
  const rows = series(y, plans, s, w);
  const last = rows[11];
  const inv1 = rows.reduce((t, r) => t + r.invest, 0);
  const later = s.invest * 12;
  const surplus = 12 * (last.salary - last.outgo - s.invest);
  const held = [y.cashToday, last.end];
  for (let t = 2; t <= A.years; t++) held.push(held[t - 1] + surplus);
  return project(totalHoldings(y), [inv1, ...Array<number>(A.years - 1).fill(later)], weights(eqPct / 100, usShare(y)), held.map((x) => Math.max(0, x)));
}
export function family(p: { amount: number; draw: number; eq: number }): { t: Projection; empty: number | null } {
  const flows = Array.from({ length: A.years }, () => -p.draw * 12);
  const t = project(p.amount, flows, weights(p.eq, 0.2));
  let empty: number | null = null;
  for (let v = 1; v <= A.years; v++) {
    if (t.q[v].p50 <= 0) {
      empty = v;
      break;
    }
  }
  return { t, empty };
}
export const badYearLoss = (y: YearInputs, eqPct: number): number => totalHoldings(y) * (eqPct / 100) * -A.badYear;

/** Could: the middle is above the soft cushion, so more likely than not it holds. How far the low end of the range goes under the hard cushion, the "how far" Plan says in words. */
export const couldBy = (m: number, h: number, c: Cushions): number => Math.max(0, c.hard - (m - h));

export const word = (kind: Kind, amt: number, step?: Step | 'off'): string => (kind === 'fits' ? (step && step[0] === 'g' ? 'Fits easily' : 'Fits') : kind === 'just' ? 'Just fits' : kind === 'could' ? 'Could dip' : kind === 'dip' ? `Dips ${short(amt)}` : `Sell ${short(amt)}`);

/** What the save foot says about a chosen month. */
export function placeSay(v: Verdict, ym: string, step: Step | 'off', c: Cushions, liquid: number | null): { text: string; fig?: string; tail?: string } {
  const M = monthLong(ym);
  const W = monthLong(v.at.ym);
  if (v.kind === 'fits') return { text: `${M} works. Your lowest balance after that is `, fig: fc(v.low.end, v.low.h), tail: '.' };
  if (v.kind === 'just') return { text: `${M} just fits. You could go a little under your ${short(c.soft)} soft cushion.` };
  if (v.kind === 'could') return { text: `${M} likely works. A costly month could take ${W === M ? 'it' : W} `, fig: short(couldBy(v.at.end, v.at.h, c)), tail: ` under your ${short(c.hard)} hard cushion.` };
  if (v.kind === 'dip') return { text: `In ${W}, you fall `, fig: short(v.short), tail: ` below your ${short(c.soft)} soft cushion.` };
  const lead = v.at.end < 0 ? `In ${W}, you run out of cash.` : `In ${W}, you drop below your ${short(c.hard)} hard cushion.`;
  if (!liquid) return { text: `${lead} You would be `, fig: short(v.short), tail: ' short.' };
  return { text: `${lead} You would need to sell `, fig: short(v.short), tail: step === 'r3' && liquid ? `, over ${Math.round(DEEP_SHARE * 100)}% of your ${short(liquid)} in cash, stocks and funds.` : ' of investments.' };
}

export { inr, monthName };
