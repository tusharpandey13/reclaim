/** Number and date rules, SPEC section 4. Figures arrive in paise; everything here works in whole rupees or paise as named. */

const MINUS = '−';
const grouped = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

/** paise -> rupees. */
export const rupees = (paise: number): number => paise / 100;

/** A fact: exact, lakh-grouped, no paise. ₹1,11,111. Minus is U+2212. */
export function inr(v: number, sign = false): string {
  const r = Math.round(Math.abs(v));
  const s = v < 0 && r !== 0 ? MINUS : sign && r !== 0 ? '+' : '';
  return `${s}₹${grouped.format(r)}`;
}

const trim = (t: string) => t.replace(/\.0+$/, '');

/** A summary: ₹24 L, ₹1.7 Cr, ₹30k. "k" only under a lakh. */
export function short(v: number, sign = false): string {
  const a = Math.abs(v);
  const s = v < 0 && Math.round(a) !== 0 ? MINUS : sign && Math.round(a) !== 0 ? '+' : '';
  if (a >= 99.5e5) return `${s}₹${a >= 1e8 ? grouped.format(Math.round(a / 1e7)) : trim((a / 1e7).toFixed(1))} Cr`;
  if (a >= 99500) return `${s}₹${a >= 995000 ? String(Math.round(a / 1e5)) : trim((a / 1e5).toFixed(1))} L`;
  if (a >= 1000) return `${s}₹${Math.round(a / 1000)}k`;
  return `${s}₹${Math.round(a)}`;
}

/** ± rounded up to one significant figure, or two when the first digit is 1: 4.3k -> 5k, 280 -> 300, 28k -> 30k, 1.1 L stays 1.1 L, not 2 L. */
export function roundUp1(h: number): number {
  if (h <= 0) return 0;
  const p = 10 ** Math.floor(Math.log10(h));
  const step = h / p < 2 - 1e-9 ? p / 10 : p;
  return Math.round(Math.ceil(h / step - 1e-9) * step);
}

/** The two ends of a forecast, as printed, so the sentence and the figure cannot disagree. `spending` never goes below zero; a balance may, which means overdrawn. */
export function rangeEnds(m: number, h: number, spending = false): { low: number; high: number } {
  const med = roundMedian(m, h);
  const low = med - Math.round(h);
  return { low: spending ? Math.max(0, low) : low, high: med + Math.round(h) };
}

/** usually ₹4k–₹54k. Past zero it says "to", since a dash beside a minus reads as neither. */
export function usually(low: number, high: number): string {
  const end = (v: number) => {
    const near = Math.round(v / 100) * 100;
    return Math.abs(near) < 10000 && near % 1000 ? inr(near) : short(v);
  };
  return `usually ${end(low)}${low < 0 ? ' to ' : '–'}${end(high)}`;
}

/** A figure's own range when the snapshot gives one, else from its spread. Null with neither. */
export function usualOf(fig: { value: number; usual_low?: number; usual_high?: number; spread?: { variance: number } } | null | undefined): { low: number; high: number } | null {
  if (!fig) return null;
  if (fig.usual_low != null && fig.usual_high != null) return fig.usual_high > fig.usual_low ? { low: fig.usual_low / 100, high: fig.usual_high / 100 } : null;
  if (!fig.spread || fig.spread.variance <= 0) return null;
  return { low: Math.max(0, fig.value - fig.spread.variance) / 100, high: (fig.value + fig.spread.variance) / 100 };
}

/** The ± as printed: 5k, 300, 1 L, 2 Cr. */
export function pm(h: number): string {
  const r = roundUp1(h);
  if (r >= 1e7) return `${trim((r / 1e7).toFixed(1))} Cr`;
  if (r >= 1e5) return `${trim((r / 1e5).toFixed(1))} L`;
  if (r >= 1000) return `${trim((r / 1000).toFixed(1))}k`;
  return String(r);
}

/** Median to the nearest ₹1,000 when ± is ₹1,000 or more, otherwise the nearest ₹100. */
export function roundMedian(m: number, h: number): number {
  const step = roundUp1(h) >= 1000 ? 1000 : 100;
  return Math.round(m / step) * step;
}

/** A forecast: ₹30k, usually ₹25k–₹35k, on every screen. With no spread it prints the median alone. */
export function fc(m: number, h: number | null | undefined, spending = false): string {
  const hh = h ?? 0;
  const med = roundMedian(m, hh);
  const body = Math.abs(med) < 1000 || (hh > 0 && roundUp1(hh) < 1000) ? inr(med) : short(med);
  if (hh <= 0) return body;
  const ends = rangeEnds(m, hh, spending);
  return `${body}, ${usually(ends.low, ends.high)}`;
}

/** Hero parts: the ₹, the number, the range kept apart so the marker can sit on the amount alone. */
export function heroParts(m: number, h: number | null | undefined): { neg: boolean; amount: string; range: string | null } {
  const med = roundMedian(m, h ?? 0);
  const text = short(Math.abs(med)).replace('₹', '');
  const ends = rangeEnds(m, h ?? 0);
  return { neg: med < 0, amount: text, range: h && h > 0 ? usually(ends.low, ends.high) : null };
}

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

/** IsoDate parts, with no time zone in play: a date in the data is a date, whatever the phone's zone. */
export function dateParts(iso: string): { y: number; m: number; d: number; wd: string; dow: number } {
  const [y, m, d] = iso.split('-').map(Number);
  const dow = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return { y, m: m - 1, d, wd: WEEKDAYS[dow], dow };
}

/** Mon 16 Nov */
export function dayLabel(iso: string): string {
  const p = dateParts(iso);
  return `${p.wd} ${p.d} ${MONTHS[p.m]}`;
}

/** 30 Nov */
export const dayMonth = (iso: string): string => {
  const p = dateParts(iso);
  return `${p.d} ${MONTHS[p.m]}`;
};

export const daysInMonth = (ym: string): number => {
  const [y, m] = ym.split('-').map(Number);
  return new Date(Date.UTC(y, m, 0)).getUTCDate();
};

export const monthName = (ym: string): string => MONTHS[Number(ym.split('-')[1]) - 1];
export const monthLong = (ym: string): string => MONTHS_LONG[Number(ym.split('-')[1]) - 1];
export const monthLongYear = (ym: string): string => `${monthLong(ym)} ${ym.slice(0, 4)}`;

export function ymAdd(ym: string, n: number): string {
  const [y0, m0] = ym.split('-').map(Number);
  const total = y0 * 12 + (m0 - 1) + n;
  return `${Math.floor(total / 12)}-${String((total % 12 + 12) % 12 + 1).padStart(2, '0')}`;
}

export function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${a}T00:00:00Z`) - Date.parse(`${b}T00:00:00Z`)) / 864e5);
}

const IST = 'Asia/Kolkata';
/** 6:10 am, in India whatever the phone's zone. */
export function timeLabel(ms: number): string {
  return new Intl.DateTimeFormat('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: IST }).format(ms).toLowerCase().replace(/\s+/g, ' ');
}
/** Sat 14 Nov, 6:10 am */
export function stampLabel(ms: number): string {
  const iso = new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(ms);
  return `${dayLabel(iso)}, ${timeLabel(ms)}`;
}
/** Sat 6:10 am */
export function shortStamp(ms: number): string {
  const iso = new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(ms);
  return `${dateParts(iso).wd} ${timeLabel(ms)}`;
}
/** "2 hours ago", from the app's clock. Null when the moment is ahead of the clock, so the caller can show its date instead of a wrong age. */
export function ageWords(ms: number, now: number): string | null {
  const diff = now - ms;
  if (diff < -300e3) return null;
  const count = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  if (diff < 60e3) return 'just now';
  if (diff < 3600e3) return count(Math.floor(diff / 60e3), 'minute');
  if (diff < 864e5) return count(Math.floor(diff / 3600e3), 'hour');
  return count(Math.floor(diff / 864e5), 'day');
}
/** Today's date in India. */
export const istDate = (ms: number): string => new Intl.DateTimeFormat('en-CA', { timeZone: IST }).format(ms);

const ordinalOf = (d: number): string => (d % 100 >= 11 && d % 100 <= 13 ? 'th' : d % 10 === 1 ? 'st' : d % 10 === 2 ? 'nd' : d % 10 === 3 ? 'rd' : 'th');
/** "You run out on the 24th." Another month says which; today says today. */
export function runOutWhen(date: string, asOf: string): string {
  if (date <= asOf) return 'You are out of money today.';
  const { d, m } = dateParts(date);
  return date.slice(0, 7) === asOf.slice(0, 7) ? `You run out on the ${d}${ordinalOf(d)}.` : `You run out on ${d} ${MONTHS[m]}.`;
}
