/** Bills' range chooser: which months a range covers, and what the regular bills' history says was billed in them. Pure, so it is tested. */
import { MONTHS, monthLongYear, ymAdd } from './format';

export type BillSpan = 'month' | 'quarter' | 'year';
export const SPAN_MONTHS: Record<BillSpan, number> = { month: 1, quarter: 3, year: 12 };

/** What history says: `month` and `amount` in paise, as `RecurringLine.history`. */
export interface HistLine { name: string; history: { month: string; amount: number }[] }

/** The months a span covers, oldest first, ending `step` spans before `ym` (step 0 ends at ym, -1 one span earlier). */
export function spanMonths(ym: string, span: BillSpan, step: number): string[] {
  const n = SPAN_MONTHS[span];
  const end = ymAdd(ym, step * n);
  return Array.from({ length: n }, (_, i) => ymAdd(end, i - n + 1));
}

/** "November 2026", "Sep–Nov 2026", "Dec 2025–Nov 2026". */
export function spanLabel(months: string[]): string {
  const a = months[0];
  const b = months[months.length - 1];
  if (a === b) return monthLongYear(a);
  const mon = (ym: string) => MONTHS[Number(ym.slice(5)) - 1];
  return a.slice(0, 4) === b.slice(0, 4) ? `${mon(a)}–${mon(b)} ${b.slice(0, 4)}` : `${mon(a)} ${a.slice(0, 4)}–${mon(b)} ${b.slice(0, 4)}`;
}

/** The calendar's text for a span: the month ("NOV"), "3M" or "Y". */
export const spanCal = (months: string[], span: BillSpan): string => (span === 'month' ? MONTHS[Number(months[0].slice(5)) - 1].toUpperCase() : span === 'quarter' ? '3M' : 'Y');

/** Each regular bill's total over the months, largest first, with the total. Lines with nothing in them are left out. Paise. */
export function spanBilled(lines: HistLine[], months: string[]): { rows: { name: string; amount: number; count: number }[]; total: number } {
  const want = new Set(months);
  const rows = lines.map((l) => {
    const hit = l.history.filter((h) => want.has(h.month));
    return { name: l.name, amount: hit.reduce((t, h) => t + h.amount, 0), count: hit.length };
  }).filter((r) => r.count > 0).sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name));
  return { rows, total: rows.reduce((t, r) => t + r.amount, 0) };
}

/** Whether a span one step earlier still has history: the earliest month any line holds is inside or before it. */
export function hasEarlier(lines: HistLine[], ym: string, span: BillSpan, step: number): boolean {
  const first = lines.flatMap((l) => l.history.map((h) => h.month)).sort()[0];
  if (!first) return false;
  const prev = spanMonths(ym, span, step - 1);
  return prev[prev.length - 1] >= first;
}
