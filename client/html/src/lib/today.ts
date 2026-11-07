/** Today's Tight readings: the spending headline, a group's own normalised scale, and the Timeline's row heights. Pure, so the arithmetic is tested by hand. */
import { inr, short } from './format';
import { ladder, medianSpread, type Ladder } from './status';

/** "₹5.3k": one decimal under ₹10k, so a small group's gap is not rounded to nothing; the usual summary above that. */
export function shortK1(v: number, sign = false): string {
  const a = Math.abs(v);
  if (a < 1000) return inr(v, sign);
  if (a >= 9950) return short(v, sign);
  const s = v < 0 ? '−' : sign ? '+' : '';
  return `${s}₹${(a / 1000).toFixed(1)}k`;
}

export interface MonthSpent { month: string; spent: number }
export interface Trend {
  /** The last 3 complete months, oldest first. */
  recent: MonthSpent[];
  /** Their mean. */
  lately: number;
  /** The months before them, up to 9, oldest first. */
  before: MonthSpent[];
  /** The median of `before`. */
  from: number;
  /** `lately` on the ladder against `before`'s median and ±. */
  step: Ladder;
  dir: 'up' | 'down' | 'held';
}

/**
 * "Spending is up: about ₹1.6 L a month lately, from ₹1.2 L". Lately is the mean of the last 3 complete months; from is the median of
 * the up to 9 complete months before them. A median of all 12 hides a rise that started 3 months ago. Needs 3 + 3 months, else null.
 * Up or down only off the usual ladder (more than one ± and at least ₹2,000); otherwise it held.
 */
export function spendingTrend(complete: MonthSpent[]): Trend | null {
  const ms = [...complete].sort((a, b) => a.month.localeCompare(b.month)).slice(-12);
  if (ms.length < 6) return null;
  const recent = ms.slice(-3);
  const before = ms.slice(0, -3).slice(-9);
  const lately = recent.reduce((t, m) => t + m.spent, 0) / 3;
  const u = medianSpread(before.map((m) => m.spent))!;
  const step = ladder(lately, u.median, u.spread);
  const dir = step === 'r2' || step === 'r3' ? 'up' : step === 'g1' || step === 'g2' ? 'down' : 'held';
  return { recent, lately, before, from: u.median, step, dir };
}

/** How far either side of usual a group's scale runs, in its own ±: the band is ±1, so it fills the middle third. */
export const SCALE_SPREADS = 3;
export interface GroupScale {
  /** Where now sits, 0 to 100 percent of the track; 50 is the usual (median). */
  at: number;
  /** now − median, in rupees. */
  gap: number;
  /** gap in the group's own ±. */
  z: number;
  /** Past the end of the scale: the marker sits at the end. */
  off: boolean;
}

/** One group on its own scale: centre is its usual median, the band ±1 of its own spread, the ends ±3. A small group and rent read the same way. */
export function groupScale(now: number, median: number, spread: number): GroupScale {
  const gap = now - median;
  const z = spread > 0 ? gap / spread : gap > 0 ? Infinity : gap < 0 ? -Infinity : 0;
  const lim = SCALE_SPREADS - 0.1; // Keep the marker inside the track.
  const c = Math.max(-lim, Math.min(lim, z));
  return { at: Math.round((50 + (c / SCALE_SPREADS) * 50) * 10) / 10, gap, z, off: Math.abs(z) > lim };
}

/** What a Timeline row is, for its height. */
export type RowKind = 'salary' | 'rent' | 'plan' | 'end' | 'after' | 'everyday' | 'past' | 'today' | 'cards' | 'invest' | 'back' | 'bills' | 'subs' | 'head' | 'other';
/**
 * A row's least height, in px, by its weight in a month: salary and rent tallest, then a plan, likely left and everyday spending, then
 * what already happened, card bills and investing, and small bills and subscriptions shortest. The river is drawn from the rows, so it follows.
 */
export const ROW_MIN: Record<RowKind, number> = { salary: 84, rent: 80, plan: 76, end: 72, after: 72, everyday: 68, past: 60, today: 60, cards: 56, invest: 52, back: 52, other: 48, bills: 46, subs: 44, head: 40 };
export const rowMin = (k: RowKind): number => ROW_MIN[k];
