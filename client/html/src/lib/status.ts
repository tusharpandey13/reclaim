/** The one status rule, SPEC section 3. A port of STATUS in the design's shared.js. Pure. */

export type Kind = 'sell' | 'dip' | 'could' | 'just' | 'fits';
export type Step = 'r1' | 'r2' | 'r3' | 'g1' | 'g2' | 'n';
export interface Cushions { soft: number; hard: number }

/** How much selling counts as a lot, as a share of liquid money. A judgement: move it here and nowhere else. */
export const DEEP_SHARE = 0.05;

/** m median, h half-width, first match wins. h = 0 when the range is not known means the low end is not tested. */
export function kind(m: number, h: number, c: Cushions): Kind {
  const lo = m - h;
  if (m < c.hard) return 'sell';
  if (m < c.soft) return 'dip';
  if (lo < c.hard) return 'could';
  if (lo < c.soft) return 'just';
  return 'fits';
}

/** Depth by amount. Pale when the middle dips, medium when you must sell, deep when over the stated share of liquid money.
 * Could is ink: only the low end of the range is under, so it is a possibility, said in words, never red (owner, 2026-11-06, FROZEN.md). */
export function step(k: Kind, x: number, liquid: number | null): Step {
  if (k === 'sell') return liquid && x > DEEP_SHARE * liquid ? 'r3' : 'r2';
  return k === 'dip' ? 'r1' : 'n';
}

/** Green must be earned. Scores are low ends. g1 beats 10 of the last 12 balances before salary and is in the top 3 shown; g2 is the top one at twice last year's best. */
export function greens(scores: (number | null)[], history: number[] | null | undefined): (Step | null)[] {
  const out: (Step | null)[] = scores.map(() => null);
  if (!history || history.length < 12) return out;
  const sorted = [...history].sort((a, b) => b - a);
  const bar = sorted[2]; // Above the third highest beats 10 of 12.
  const top = sorted[0];
  scores
    .map((v, i) => ({ v, i }))
    .filter((o): o is { v: number; i: number } => o.v != null && o.v > bar)
    .sort((a, b) => b.v - a.v)
    .slice(0, 3)
    .forEach((o, k) => { out[o.i] = k === 0 && o.v >= 2 * top ? 'g2' : 'g1'; });
  return out;
}

/** Text and thin marks never use a pale step. */
export const markToken = (s: Step): string => (s === 'r1' ? 'r2' : s === 'r3' ? 'r3t' : s === 'g1' ? 'g2' : s === 'n' ? 'ink' : s);

/** The usual ladder: how many ± from the median, with a rupee floor. */
export type Ladder = 'r3' | 'r2' | 'r1' | 'n' | 'g1' | 'g2';
export function ladder(now: number, med: number, v: number, floor = 2000): Ladder {
  const d = now - med;
  if (Math.abs(d) < floor || v <= 0) return 'n';
  const z = d / v;
  if (z > 2) return 'r3';
  if (z > 1) return 'r2';
  if (z > 0.75) return 'r1';
  if (z < -2) return 'g2';
  if (z < -1) return 'g1';
  return 'n';
}
export const LADDER_WORD: Record<Ladder, string> = { r3: 'Far above usual', r2: 'Above usual', r1: 'Near top of usual', n: 'Usual', g1: 'Below usual', g2: 'Well below usual' };
export const ladderChip = (s: Ladder): string => LADDER_WORD[s].replace(' usual', '').replace(' of', '');

/** How far under each cushion a figure is. Today, Bills and Plan all read these two numbers, so one month cannot show two shortfalls. */
export function shortfall(m: number, c: Cushions): { toHard: number; toSoft: number } {
  return { toHard: Math.max(0, c.hard - m), toSoft: Math.max(0, c.soft - m) };
}

/** Today's sentence for one forecast. Words carry the state, so colour is never alone. */
export function todaySays(k: Kind, m: number, c: Cushions): { words: string; yardstick: string | null } {
  const softW = `₹${Math.round(c.soft / 1000)}k soft cushion`;
  const hardW = `₹${Math.round(c.hard / 1000)}k hard cushion`;
  const gap = shortfall(m, c);
  if (k === 'sell') return { words: `About ₹${Math.round(gap.toHard / 1000)}k under your `, yardstick: hardW };
  if (k === 'dip') return { words: `About ₹${Math.round(gap.toSoft / 1000)}k under your `, yardstick: softW };
  if (k === 'could') return { words: 'Could fall under your ', yardstick: 'hard cushion' };
  if (k === 'just') return { words: 'Near your ', yardstick: softW };
  return { words: 'Above your ', yardstick: 'soft cushion' };
}

/** Median and half-range from the last few values: the same "middle 8 in 10" the SPEC uses, on 12 or fewer samples. */
export function medianSpread(values: number[]): { median: number; spread: number } | null {
  if (values.length === 0) return null;
  const s = [...values].sort((a, b) => a - b);
  const mid = s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2;
  const cut = s.length >= 5 ? s.slice(1, -1) : s;
  return { median: mid, spread: (cut[cut.length - 1] - cut[0]) / 2 };
}

/** Hero's rule, and Plan's for the same month: a range over 2 soft cushions wide is too early to tell. */
export const isTooWide = (h: number, soft: number): boolean => h > soft;
