/** Hand-built SVG charts, ported from the frozen mocks' till.js. Data in, no fetching, no third parties. Colours are tokens. */
import { useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { inr, short, usually, rupees, MONTHS } from '../lib/format';
import { Ladder, ladderChip, LADDER_WORD, ladder as ladderOf, markToken, type Step } from '../lib/status';
import { Ico, Link, N, Read, useWidth, type RowIcon } from './kit';

const uid = () => Math.random().toString(36).slice(2, 7);
/** The way from a read figure to the payments behind it. */
const seeAllLink = (to: string | null | undefined, what: string): ReactNode => (to ? <Link className="tlink" to={to} data-see-all aria-label={`See all of ${what}`}>See all</Link> : null);

/* ---------- The Line ---------- */

export interface StopRow {
  key: string;
  t?: 'past' | 'today';
  /** Balance after this row, low and high ends. */
  lo: number;
  hi: number;
  end?: boolean;
  /** Money going to investing: an indigo bite. */
  invest?: boolean;
  /** A step up that is not money arriving: no green block. */
  flat?: boolean;
  className?: string;
  /** The row's least height in px, by its weight in a month. The river is drawn from the measured rows, so it follows. */
  minH?: number;
  children: ReactNode;
}

const medOf = (r: StopRow) => (r.lo + r.hi) / 2;
const floorOf = (rows: StopRow[], start: number) => Math.min(0, start, ...rows.map((r) => r.lo));
/** Narrower than this a bite cannot be seen. The caption says when one is widened. */
const BITE_MIN = 4;
const GAP = 2;

/** The rows a cushion is drawn beside: only while the balance itself is near it, within half of it above or anywhere below. Never a full-height rail for a wide range. */
function nearRows(rows: StopRow[], c: number): number[] {
  const today = rows.findIndex((r) => r.t === 'today');
  const to = rows.findIndex((r) => r.end);
  if (c <= 0 || today < 0 || to < 0) return [];
  return rows.flatMap((r, i) => (i >= today && i <= to && medOf(r) < c * 1.5 ? [i] : []));
}

/** The first row whose median falls through a cushion. Starting under it is not a crossing. */
function crossingRow(rows: StopRow[], c: number): number {
  const today = rows.findIndex((r) => r.t === 'today');
  const to = rows.findIndex((r) => r.end);
  if (c <= 0 || today < 0) return -1;
  return rows.findIndex((r, i) => i > today && i <= to && medOf(r) < c && medOf(rows[i - 1]) >= c);
}

/** The caption under the column: only what this month's column draws, in about two lines. */
export function lineCaption({ rows, start, scale, soft, hard, rw = 84 }: { rows: StopRow[]; start: number; scale: number; soft: number; hard: number; rw?: number }): string {
  const perPx = (scale - floorOf(rows, start)) / rw;
  let prev = start;
  let tiny = false;
  rows.forEach((r) => {
    const d = prev - medOf(r);
    if (d >= 1 && d / perPx < BITE_MIN + GAP && r.t !== 'past') tiny = true;
    prev = medOf(r);
  });
  const hatched = rows.some((r) => r.hi > r.lo);
  const salary = rows.some((r) => r.className === 'in');
  return [
    `The column is your bank balance${hatched ? ', hatched where unsure' : ''}.`,
    `Red is money out, deeper for more${tiny ? ', tiny ones widened' : ''}${salary ? '; green, salary' : ''}.`,
    rows.some((r) => r.invest) ? 'Indigo is investing.' : '',
    nearRows(rows, soft).length ? `Dashed: ${short(soft)} soft cushion.` : '',
    nearRows(rows, hard).length ? `Solid: ${short(hard)} hard cushion.` : '',
  ].filter(Boolean).join(' ');
}

function RiverSvg({ rows, heights, start, scale, soft, hard, earned, rw, total }: { rows: StopRow[]; heights: { y0: number; y1: number }[]; start: number; scale: number; soft: number; hard: number; earned: boolean; rw: number; total: number }) {
  const id = useMemo(uid, []);
  // Below zero is drawn, not clipped: the axis opens to the left of a zero line, only when something goes there.
  const floor = floorOf(rows, start);
  const span = scale - floor;
  const w = (v: number) => Math.max(floor === 0 ? 1.5 : 0, ((Math.min(Math.max(v, floor), scale) - floor) / span) * rw);
  const px = (v: number) => (v / span) * rw;
  const zero = floor === 0 ? 0 : w(0);
  let prev = { lo: start, hi: start };
  const rects: ReactNode[] = [];
  const gradTop = heights[rows.findIndex((r) => r.t === 'today')]?.y0 ?? 0;
  const gradBot = heights[rows.findIndex((r) => r.end)]?.y1 ?? total;
  let brk = prev.lo > scale ? `M${rw - 16} 21l7 -14M${rw - 9} 21l7 -14` : '';
  rows.forEach((r, i) => {
    const { y0, y1 } = heights[i] ?? { y0: 0, y1: 0 };
    const mid = y0 + (y1 - y0) / 2;
    const med = (r.lo + r.hi) / 2;
    const past = r.t === 'past' || r.t === 'today';
    const body = r.t === 'past' ? (earned ? 'g0' : 'past') : med < hard ? 'r3' : med < soft ? 'r1' : earned ? 'g1' : 'col';
    const fill = body === 'past' ? 'var(--col-past)' : body === 'col' ? `url(#col${id})` : `var(--fill-${body},var(--${body}))`;
    const d = (prev.lo + prev.hi) / 2 - med;
    let end = w(r.lo);
    let edge = w(r.hi);
    let extra: ReactNode = null;
    const rect = (x0: number, x1: number, f: string, k: string) => (x1 > x0 ? <rect key={`${r.key}-${k}`} x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={f} /> : null);
    if (d > 0) {
      let x0 = edge + GAP;
      let x1 = Math.max(w(prev.hi), x0 + BITE_MIN);
      if (r.hi >= scale) {
        x1 = rw;
        x0 = Math.max(0, rw - Math.max(BITE_MIN, px(d)));
        end = edge = Math.max(0, x0 - GAP);
      }
      const tone = r.invest ? 'var(--bite-inv)' : r.t === 'past' ? 'var(--bite0)' : d < 5000 ? 'var(--bite1)' : d < 20000 ? 'var(--bite2)' : 'var(--bite3)';
      extra = rect(x0, x1, tone, 'bite');
    } else if (d < 0 && !past && !r.flat) {
      const x1 = w(r.lo);
      const before = (prev.lo + prev.hi) / 2; // The median, not the high end: a wide ± must not swallow the salary.
      const x0 = before >= scale ? Math.max(0, rw - px(-d)) : w(before);
      end = edge = Math.max(0, x0 - GAP);
      extra = rect(x0, x1, 'var(--in)', 'in');
    }
    rects.push(end >= zero ? rect(zero, end, fill, 'body') : rect(end, zero, 'var(--r3)', 'below'));
    if (!past && edge > end) rects.push(<rect key={`${r.key}-hatch`} x={end} y={y0} width={edge - end} height={y1 - y0} fill={fill} mask={`url(#hm${id})`} />);
    rects.push(extra);
    if (r.lo > scale && prev.lo <= scale) brk += `M${rw - 16} ${mid + (y1 - mid) / 2 + 7}l7 -14M${rw - 9} ${mid + (y1 - mid) / 2 + 7}l7 -14`;
    prev = { lo: r.lo, hi: r.hi };
  });
  const softOn = nearRows(rows, soft);
  const hardOn = nearRows(rows, hard);
  /** One thin line, row by row: dark ink where it crosses the blue, the page's own ink where the balance has already fallen left of it. No casing. */
  const cushion = (c: number, at: number[], cls: string, dash?: string) => at.map((i) => (
    <line key={`${cls}-${i}`} className={cls} x1={w(c)} x2={w(c)} y1={heights[i]?.y0 ?? 0} y2={heights[i]?.y1 ?? 0} stroke={w(rows[i].lo) > w(c) ? 'var(--cush-on)' : 'var(--cush-off)'} strokeWidth="1.5" strokeDasharray={dash} />
  ));
  const diamond = (c: number, col: string, k: string) => {
    const at = crossingRow(rows, c);
    if (at < 0) return null;
    const cx = w(c);
    const cy = heights[at]?.y0 ?? 0;
    return <path key={k} className="cross" d={`M${cx} ${cy - 5}l5 5l-5 5l-5 -5Z`} fill={col} />;
  };
  return (
    <svg className="river" width={rw + 2} height={total} aria-hidden="true">
      <defs>
        <linearGradient id={`col${id}`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1={gradTop} y2={gradBot}><stop offset="0" stopColor="var(--col-a)" /><stop offset="1" stopColor="var(--col-b)" /></linearGradient>
        <pattern id={`hp${id}`} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2.4" height="5" fill="#fff" /></pattern>
        <mask id={`hm${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width={rw + 2} height={total}><rect width={rw + 2} height={total} fill={`url(#hp${id})`} /></mask>
      </defs>
      {rects}
      {floor < 0 ? <line className="zero-line" x1={zero} x2={zero} y1={0} y2={total} stroke="var(--ink)" strokeWidth="1" /> : null}
      {brk ? <path d={brk} stroke="var(--paper)" strokeWidth="3" fill="none" /> : null}
      {cushion(soft, softOn, 'cushion-soft', '5 4')}
      {cushion(hard, hardOn, 'cushion-hard')}
      {softOn.length ? diamond(soft, 'var(--cush-on)', 'ds') : null}
      {hardOn.length ? diamond(hard, 'var(--cush-on)', 'dh') : null}
    </svg>
  );
}

/** The ordered list carries all of it; the river is aria-hidden. Row heights are measured, so width stays on one fixed scale. */
export function Stops({ rows, start, scale, soft, hard, earned }: { rows: StopRow[]; start: number; scale: number; soft: number; hard: number; earned: boolean }) {
  const ref = useRef<HTMLOListElement>(null);
  const [geo, setGeo] = useState<{ heights: { y0: number; y1: number }[]; total: number; rw: number }>({ heights: [], total: 0, rw: 84 });
  useLayoutEffect(() => {
    const ol = ref.current;
    if (!ol) return;
    const measure = () => {
      const top = ol.getBoundingClientRect().top;
      const lis = [...ol.children].filter((c) => c.tagName === 'LI');
      const heights = lis.map((li) => {
        const b = li.getBoundingClientRect();
        return { y0: b.top - top, y1: b.bottom - top };
      });
      const rw = parseFloat(getComputedStyle(ol).getPropertyValue('--rw')) || 84;
      setGeo({ heights, total: ol.getBoundingClientRect().height, rw });
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(ol);
    void document.fonts?.ready.then(measure);
    return () => ro.disconnect();
  }, [rows.length]);
  return (
    <ol className="stops" ref={ref} aria-label="Your money through this month">
      {geo.heights.length === rows.length ? <RiverSvg rows={rows} heights={geo.heights} total={geo.total} rw={geo.rw} start={start} scale={scale} soft={soft} hard={hard} earned={earned} /> : null}
      {rows.map((r) => <li key={r.key} className={[r.className, r.t === 'today' ? 'today' : '', r.end ? 'end' : ''].filter(Boolean).join(' ') || undefined} data-rh={r.minH} style={r.minH ? { ['--rh' as string]: `${r.minH}px` } : undefined}>{r.children}</li>)}
    </ol>
  );
}

/* ---------- Strip: dots for earlier months, the large mark for now ---------- */

export function Strip({ values, now, max, step }: { values: number[]; now: number; max: number; step: Ladder }) {
  const W = 320;
  const x = (a: number) => ((6 + (Math.min(a, max) / max) * (W - 12)) / W) * 100;
  const tok = step === 'n' ? 'var(--ink)' : `var(--${step === 'r3' ? 'r3' : markToken(step)})`;
  return (
    <div className="strip-track" aria-hidden="true">
      {values.map((v, i) => <i key={i} className="dot" style={{ left: `${x(v)}%` }} />)}
      <i className={`now${step[0] === 'r' ? ' dia' : ''}`} data-step={step} style={{ left: `${x(now)}%`, background: tok }} />
    </div>
  );
}

/* ---------- Twelve bars ---------- */

export interface Bar { label: string; value: number; hi?: number; step?: Ladder; mark?: string; read: ReactNode; now?: boolean }
export function Bars({ bars, label, onRead }: { bars: Bar[]; label: string; onRead?: (n: ReactNode) => void }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const id = useMemo(uid, []);
  const H0 = 92;
  const bw = W / Math.max(1, bars.length);
  const max = Math.max(1, ...bars.map((a) => a.hi ?? a.value));
  const y = (a: number) => H0 - (a / max) * (H0 - 20);
  const fill = (b: Bar) => (b.step && b.step !== 'n' ? `var(--${b.step === 'r2' ? 'r2f' : b.step === 'g2' ? 'g2f' : b.step})` : 'var(--t3)');
  return (
    <div className="bars" ref={ref}>
      <svg
        className="chart"
        viewBox={`0 0 ${W} ${H0 + 20}`}
        role="img"
        aria-label={label}
        onPointerDown={(e) => {
          if (!onRead) return;
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.max(0, Math.min(bars.length - 1, Math.floor(((e.clientX - r.left) / r.width) * bars.length)));
          onRead(bars[i].read);
        }}
      >
        <defs><pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="5" fill="var(--ink2)" /></pattern></defs>
        {bars.map((b, i) => {
          const x = i * bw + bw * 0.17;
          const w = bw * 0.66;
          return (
            <g key={i}>
              <rect x={x} y={y(b.value)} width={w} height={H0 - y(b.value)} fill={fill(b)} data-step={b.step ?? 'n'} />
              {b.hi != null && b.hi > b.value ? <rect x={x} y={y(b.hi)} width={w} height={y(b.value) - y(b.hi)} fill={`url(#${id})`} /> : null}
              {b.now ? <rect className="now-mark" x={x} y={H0 + 1} width={w} height="3" fill="var(--now)" /> : null}
              <text className={b.now ? 'now-t' : undefined} x={x + w / 2} y={H0 + 17} textAnchor="middle">{b.label}</text>
            </g>
          );
        })}
        {bars.map((b, i) => {
          if (!b.mark) return null;
          // A label clears the bars it spans, so it never sits on a neighbour's fill.
          const span = Math.ceil((b.mark.length * 8) / (bw || 1));
          const end = i > bars.length - 3;
          const from = end ? Math.max(0, i - span) : Math.max(0, i - Math.ceil(span / 2));
          const to = end ? i : Math.min(bars.length - 1, i + Math.ceil(span / 2));
          const top = Math.min(...bars.slice(from, to + 1).map((n) => y(n.hi ?? n.value)));
          return <text key={`m${i}`} className="fig" x={Math.min(i * bw + bw / 2, W - 2)} y={top - 5} textAnchor={end ? 'end' : i < 2 ? 'start' : 'middle'}>{b.mark}</text>;
        })}
      </svg>
    </div>
  );
}

/* ---------- Running 30 days, with what moved each ---------- */

/** A bar takes the colour only when one group moved it this much from the week before. Otherwise it is neutral: 26 weeks of small moves are not news. */
export const moveThreshold = (average: number): number => Math.max(5000, Math.round((average * 0.2) / 1000) * 1000);
const LABEL_CH = 8; // Figures' width per character, a little over, so a label's estimate is never short.

export interface TrendBar { label: string; value: number; group: string | null; change: number; read: ReactNode }
const trendMovers = (bars: TrendBar[]) => {
  const avg = bars.reduce((t, b) => t + b.value, 0) / Math.max(1, bars.length);
  const threshold = moveThreshold(avg);
  const moved = (b: TrendBar) => !!b.group && Math.abs(b.change) >= threshold;
  return { avg, threshold, moved, movers: [...new Set(bars.filter(moved).map((b) => b.group!))].sort() };
};
/** What the 30-day bars show, as its own list: under the chart, or in a sheet behind an (i). */
export function TrendLegend({ bars, average }: { bars: TrendBar[]; average: string }) {
  const { threshold, movers } = trendMovers(bars);
  return (
    <ul className="lgd" aria-label="What the chart shows">
      <li data-key="avg"><i className="k k-avg" aria-hidden="true" /><span>{average}</span></li>
      {movers.length ? <li data-key="moved"><i className="k k-moved" aria-hidden="true" /><span>One group moved <N>{short(threshold)}</N> or more in a week: {movers.join(', ')}</span></li> : null}
      <li data-key="note">One-offs included. Tap a bar.</li>
    </ul>
  );
}
/** `legend={false}` leaves the legend out, for a page that shows TrendLegend elsewhere. */
export function TrendBars({ bars, label, onRead, top, last, average, legend = true }: { bars: TrendBar[]; label: string; onRead: (n: ReactNode) => void; top: string; last: string; average: string; legend?: boolean }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const id = useMemo(uid, []);
  const [picked, setPicked] = useState<number | null>(null);
  const H0 = 150;
  const T = 24;
  const B = H0 - 20;
  const bw = W / Math.max(1, bars.length);
  const max = Math.max(1, ...bars.map((b) => b.value));
  const y = (v: number) => B - (v / max) * (B - T);
  const { avg, moved } = trendMovers(bars);
  const topAt = bars.findIndex((b) => b.value === max);
  const lastAt = bars.length - 1;
  const barX = (i: number) => i * bw + bw * 0.14;
  const barW = bw * 0.72;
  const center = (i: number) => barX(i) + barW / 2;
  // The latest figure sits clear of every bar under it, so it reads against the page and not across a neighbour.
  const lastLeft = W - last.length * LABEL_CH;
  const lastY = Math.min(...bars.map((b, i) => (i === lastAt || barX(i) + barW >= lastLeft ? y(b.value) : Infinity))) - 5;
  const topY = y(max) - 5;
  const topW = top.length * LABEL_CH;
  const topX = Math.max(topW / 2, Math.min(W - topW / 2, center(topAt)));
  const close = topAt !== lastAt && topX + topW / 2 > lastLeft - 6 && Math.abs(topY - lastY) < 16;
  const showTop = topAt !== lastAt && !(close && top === last); // Two equal figures side by side say it once.
  return (
    <div className="bars" ref={ref}>
      <svg
        className="chart trend"
        viewBox={`0 0 ${W} ${H0}`}
        role="img"
        aria-label={label}
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const i = Math.max(0, Math.min(lastAt, Math.floor(((e.clientX - r.left) / r.width) * bars.length)));
          setPicked(i);
          onRead(bars[i].read);
        }}
      >
        <defs>
          <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0" stopColor="var(--mover)" stopOpacity=".06" />
            <stop offset="1" stopColor="var(--mover)" stopOpacity=".95" />
          </linearGradient>
        </defs>
        {bars.map((b, i) => {
          const on = moved(b);
          return (
            <g key={i} data-group={b.group ?? ''} data-moved={on ? 'yes' : 'no'} data-value={Math.round(b.value)}>
              <rect x={barX(i)} y={y(b.value)} width={barW} height={Math.max(0, B - y(b.value))} fill={on ? `url(#${id})` : 'var(--t1)'} />
              <rect className="edge" x={barX(i)} y={y(b.value)} width={barW} height={picked === i ? 3 : 1.5} fill={on ? 'var(--mover)' : 'var(--t3)'} />
              <text x={center(i)} y={H0 - 3} textAnchor="middle">{b.label}</text>
            </g>
          );
        })}
        <line x1={0} x2={W} y1={B} y2={B} stroke="var(--rule)" />
        <line className="avg" x1={0} x2={W} y1={y(avg)} y2={y(avg)} stroke="var(--ink2)" strokeWidth="1.5" strokeDasharray="5 4" />
        {showTop ? <text className="fig top-t" x={close ? lastLeft - 6 : topX} y={topY} textAnchor={close ? 'end' : 'middle'} paintOrder="stroke" stroke="var(--paper)" strokeWidth="3" strokeLinejoin="round">{top}</text> : null}
        <text className="fig last-t" x={W} y={lastY} textAnchor="end" paintOrder="stroke" stroke="var(--paper)" strokeWidth="3" strokeLinejoin="round">{last}</text>
      </svg>
      {legend ? <TrendLegend bars={bars} average={average} /> : null}
    </div>
  );
}

/* ---------- Pace ---------- */

/** [[day, running total], ...] as one value per day for days 1..upTo. A month running past upTo ends on its whole total, so month lengths cannot hide a late payment. */
export function runningByDay(points: number[][], upTo: number, ownDays: number = upTo): number[] {
  const out: number[] = [];
  let at = 0;
  let v = 0;
  const days = Math.min(upTo, ownDays);
  for (let d = 1; d <= days; d++) {
    while (at < points.length && (points[at][0] <= d || (d === days && ownDays > upTo))) v = rupees(points[at++][1]);
    out.push(v);
  }
  return out;
}

/** A step line: nothing moves between payments, and a category paid once a month reads as one step. */
const stepPath = (values: number[], x: (d: number) => number, y: (v: number) => number): string => {
  if (!values.length) return '';
  let d = `M${x(1)} ${y(0)}`;
  values.forEach((v, i) => {
    d += `V${y(v)}`;
    if (i < values.length - 1) d += `H${x(i + 2)}`;
  });
  return d;
};

/** A few round rupee marks under the top of the chart. */
export function axisMarks(top: number): number[] {
  if (top <= 0) return [];
  const raw = top / 4;
  const pow = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((c) => c >= raw) ?? raw;
  const out: number[] = [];
  for (let v = step; v <= top; v += step) out.push(v);
  return out;
}

export interface PaceLine { label: string; values: number[]; total: number; oneOff: number }
export interface PaceProps {
  /** Cumulative spend for days 1..today. */
  actual: number[];
  /** Past months behind it, each with its one-offs, as one value per day. */
  past: PaceLine[];
  /** The median per day, without one-offs, when there are enough months. */
  median: number[] | null;
  dim: number;
  today: number;
  monthLabel: string;
  forecast: { lo: number; hi: number; label: string } | null;
  label: string;
  onRead: (n: ReactNode) => void;
  /** The month's payments, once a day that has happened is read. */
  seeAll?: (day: number) => string | null;
}
export function Pace({ actual, past, median, dim, today, monthLabel, forecast, label, onRead, seeAll }: PaceProps) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const id = useMemo(uid, []);
  const [picked, setPicked] = useState(today);
  const [chosen, setChosen] = useState<PaceLine | null>(null);
  const [hovered, setHovered] = useState<PaceLine | null>(null);
  const H0 = 200;
  const R = W - 4;
  const T = 14;
  const B = H0 - 22;
  const max = Math.max(1, ...actual, ...(median ?? []), ...past.flatMap((l) => l.values), forecast?.hi ?? 0) * 1.08;
  // The axis has its own gutter, so no line, nor today's mark, ever runs through a figure. Every other figure is in the legend, where nothing can collide.
  const marks = axisMarks(max);
  const L = 4 + Math.max(0, ...marks.map((v) => short(v).length)) * 7.5;
  const x = (d: number) => L + ((d - 1) / Math.max(1, dim - 1)) * (R - L);
  const y = (v: number) => B - (v / max) * (B - T);
  const nowV = actual[today - 1] ?? 0;
  const pick = picked <= today ? actual[picked - 1] ?? 0 : forecast ? nowV + ((forecast.lo + forecast.hi) / 2 - nowV) * ((picked - today) / Math.max(1, dim - today)) : nowV;
  const ticks = [1, 10, 20, dim].filter((d, i, a) => a.indexOf(d) === i && d <= dim);
  const dayAt = (px: number) => Math.max(1, Math.min(dim, Math.round(1 + (px - L) / Math.max(1, R - L) * (dim - 1))));
  /** The past line nearest the pointer on that day, if it is close enough to be the one meant. */
  const lineAt = (e: { currentTarget: SVGSVGElement; clientX: number; clientY: number }): { d: number; line: PaceLine | null } => {
    const r = e.currentTarget.getBoundingClientRect();
    const d = dayAt(((e.clientX - r.left) / r.width) * W);
    const py = ((e.clientY - r.top) / r.height) * H0;
    let best: PaceLine | null = null;
    let gap = 14;
    for (const l of past) {
      const v = l.values[Math.min(d, l.values.length) - 1];
      if (v != null && Math.abs(y(v) - py) < gap) {
        gap = Math.abs(y(v) - py);
        best = l;
      }
    }
    return { d, line: best };
  };
  const shown = hovered ?? chosen;
  const medianEnd = median?.[median.length - 1];
  return (
    <div className="pace" ref={ref}>
      <svg
        className="chart"
        viewBox={`0 0 ${W} ${H0}`}
        role="img"
        aria-label={label}
        onPointerMove={(e) => { if (e.pointerType === 'mouse') setHovered(lineAt(e).line); }}
        onPointerLeave={() => setHovered(null)}
        onPointerDown={(e) => {
          const { d, line } = lineAt(e);
          setPicked(d);
          setChosen(line);
          const usual = median ? `, median by then ${short(median[d - 1] ?? medianEnd ?? 0)}` : '';
          const named = line ? <> <b>{line.label}</b>: <N>{inr(line.values[Math.min(d, line.values.length) - 1] ?? 0)}</N> by then, <N>{inr(line.total)}</N> in all{line.oneOff >= 1 ? <>, with <N>{inr(line.oneOff)}</N> of one-offs</> : null}.</> : null;
          if (d <= today) onRead(<>{d} {monthLabel}: <N>{inr(actual[d - 1] ?? 0)}</N> spent{usual}.{named} {seeAllLink(seeAll?.(d), monthLabel)}</>);
          else if (forecast) onRead(<>{d} {monthLabel}, forecast: <N>₹{short((nowV + ((forecast.lo + forecast.hi) / 2 - nowV) * ((d - today) / Math.max(1, dim - today)))).slice(1)}</N>{usual}.{named}</>);
          else onRead(<>{d} {monthLabel} has not happened yet{usual}.{named}</>);
        }}
      >
        <defs><pattern id={id} width="5" height="5" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="2" height="5" fill="var(--t2)" /></pattern></defs>
        {marks.map((v) => <line key={v} x1={L} x2={R} y1={y(v)} y2={y(v)} stroke="var(--rule)" strokeOpacity=".5" />)}
        {forecast && today < dim ? <path d={`M${x(today)} ${y(nowV)}L${x(dim)} ${y(forecast.hi)}L${x(dim)} ${y(forecast.lo)}Z`} fill={`url(#${id})`} /> : null}
        {past.map((l) => <path key={l.label} className="past" data-month={l.label} d={stepPath(l.values, x, y)} fill="none" stroke={l === shown ? 'var(--ink2)' : 'var(--t2)'} strokeWidth={l === shown ? 2 : 1} />)}
        {median ? <path className="median" d={stepPath(median, x, y)} fill="none" stroke="var(--ink2)" strokeWidth="1.5" strokeDasharray="5 4" /> : null}
        <path className="this" d={stepPath(actual, x, y)} fill="none" stroke="var(--ink)" strokeWidth="2.5" />
        <line className="now-mark" x1={x(today)} x2={x(today)} y1={T} y2={B} stroke="var(--now)" strokeWidth="2.5" />
        {marks.map((v) => <text key={v} className="axis-t" x={L - 5} y={y(v) + 4} textAnchor="end">{short(v)}</text>)}
        <circle className="dot" cx={x(Math.min(picked, dim))} cy={y(pick)} r="5" fill="var(--paper)" stroke="var(--ink)" strokeWidth="3" />
        <line x1={L} x2={R} y1={B} y2={B} stroke="var(--rule)" />
        {ticks.map((d) => <text key={d} x={x(d)} y={H0 - 6} textAnchor={d === 1 ? 'start' : d === dim ? 'end' : 'middle'}>{d} {monthLabel}</text>)}
      </svg>
      <ul className="lgd" aria-label="What the lines show">
        <li data-key="now"><i className="k k-now" aria-hidden="true" /><span><N>{inr(nowV)}</N> today</span></li>
        {forecast ? <li data-key="likely"><i className="k k-likely" aria-hidden="true" /><span>Likely <N>{forecast.label}</N></span></li> : null}
        {medianEnd != null ? <li data-key="median"><i className="k k-median" aria-hidden="true" /><span>Median <N>{short(medianEnd)}</N></span></li> : null}
        {past.length ? <li data-key="past"><i className={`k k-past${shown ? ' on' : ''}`} aria-hidden="true" /><span>{shown ? <>{shown.label}: <N>{inr(shown.total)}</N></> : past.length === 1 ? 'Last month' : `Last ${past.length} months`}</span></li> : null}
      </ul>
    </div>
  );
}

/* ---------- Due strip ---------- */

export interface DueMark { day: number; amount: number; step: 'n' | 'r1' | 'r2' | 'r3' | 'g1'; paid: boolean; read: ReactNode; estimated?: boolean }
export function Due({ items, today, dim, monthLabel, label, onRead }: { items: DueMark[]; today: number; dim: number; monthLabel: string; label: string; onRead: (n: ReactNode) => void }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const x = (d: number) => 8 + ((d - 1) / Math.max(1, dim - 1)) * (W - 16);
  const top = Math.max(1, ...items.map((i) => i.amount));
  return (
    <div className="due" ref={ref}>
      <svg className="chart" viewBox={`0 0 ${W} 62`} role="img" aria-label={label}>
        <line x1="8" x2={W - 8} y1="30" y2="30" stroke="var(--rule)" strokeWidth="2" />
        {items.map((i, n) => {
          const c = i.step === 'n' ? 'var(--ink)' : `var(--${markToken(i.step as Step)})`;
          const h = Math.max(5, Math.sqrt(i.amount / top) * 20);
          return (
            <rect
              key={n}
              x={x(i.day) - 4}
              y={30 - h}
              width="8"
              height={2 * h}
              fill={i.paid ? c : 'var(--paper)'}
              stroke={i.paid ? undefined : c}
              strokeWidth={i.paid ? undefined : 2}
              strokeDasharray={i.estimated ? '3 2' : undefined}
              onPointerDown={() => onRead(i.read)}
            />
          );
        })}
        <line className="now-mark" x1={x(today)} x2={x(today)} y1="2" y2="50" stroke="var(--now)" strokeWidth="3" />
        <text x={Math.max(20, Math.min(W - 20, x(today)))} y="60" textAnchor="middle" className="now-t">Today</text>
        {x(today) > 60 ? <text x="8" y="60">1</text> : null}
        {x(today) < W - 80 ? <text x={W - 8} y="60" textAnchor="end">{dim} {monthLabel}</text> : null}
      </svg>
    </div>
  );
}

/** Small 12-month bars inside a bill row. Decorative: the row prints its word and figure. */
export function Micro({ values, step }: { values: number[]; step?: string }) {
  const max = Math.max(1, ...values);
  return (
    <span className="micro">
      <svg width="96" height="26" viewBox="0 0 96 26" aria-hidden="true">
        {values.map((a, i) => <rect key={i} x={i * 8} y={26 - (a / max) * 24} width="6" height={(a / max) * 24} fill={`var(${i === values.length - 1 ? (step ? `--${step}` : '--ink') : '--t2'})`} />)}
      </svg>
    </span>
  );
}

/* ---------- Month tiles and calendar ---------- */

export const StatusMark = ({ step }: { step: string }) => (step[0] === 'r' ? <i className="m crit" aria-hidden="true" /> : step[0] === 'g' ? <i className="m safe" aria-hidden="true" /> : null);

export interface CalCell { day: number; value: number | null; state: 'future' | 'none' | 'spent'; s: string; step: string; label: string; read: ReactNode; tone: string }
export function Calendar({ first, cells, today, onRead, picked, onPick }: { first: number; cells: CalCell[]; today: number | null; onRead: (n: ReactNode, tone: string) => void; picked: number | null; onPick: (d: number) => void }) {
  const active = picked ?? today; // One yellow cap: the day being read, or else today.
  return (
    <div className="cal">
      {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((x, i) => <div key={i} className="wd">{x}</div>)}
      {Array.from({ length: first }, (_, i) => <div key={`b${i}`} />)}
      {cells.map((c) =>
        c.state === 'future' ? (
          <div key={c.day} className={`cell fut${c.day === active ? ' now' : ''}`} aria-current={c.day === today ? 'date' : undefined}><span className="dn">{c.day}</span></div>
        ) : (
          <button
            key={c.day}
            className={`cell${c.day === active ? ' now' : ''}`}
            aria-current={c.day === today ? 'date' : undefined}
            data-s={c.s}
            data-step={c.step}
            data-amount={c.value ?? 0}
            aria-pressed={picked === c.day}
            aria-label={c.label}
            onClick={() => {
              onPick(c.day);
              onRead(c.read, c.tone);
            }}
          >
            <span className="dn">{c.day}</span>
            {c.value ? (c.value >= 1000 ? `${c.value >= 10000 ? Math.round(c.value / 1000) : Number((c.value / 1000).toFixed(1))}k` : String(Math.round(c.value))) : ''}
            <StatusMark step={c.step} />
          </button>
        ),
      )}
    </div>
  );
}

/* ---------- Usual-band rows ---------- */

export interface RngItem { name: string; group: string | null; now: number; med: number | null; v: number | null; step: Ladder }
export function Rng({ items, max, onRead: give, q, seeAll }: { items: RngItem[]; max: number; onRead: (n: ReactNode, tone: string) => void; q?: (i: RngItem) => RowIcon; seeAll?: (i: RngItem) => string | null }) {
  const tapped = useRef<RngItem | null>(null);
  const onRead = (n: ReactNode, tone: string) => { const i = tapped.current; give(<>{n} {i ? seeAllLink(seeAll?.(i), i.name) : null}</>, tone); };
  const p = (a: number) => (Math.min(Math.max(a, 0), max) / max) * 100;
  return (
    <div>
      {items.map((i) => {
        const hasUsual = i.med != null && i.v != null;
        return (
          <button
            key={i.name}
            className="rng"
            data-amount={i.now}
            data-step={i.step}
            onClickCapture={() => { tapped.current = i; }}
            onClick={() => onRead(<><b>{i.name}: {inr(i.now)}</b>{hasUsual ? `. Usual by now ₹${short(i.med!).slice(1)}, ${usually(Math.max(0, i.med! - i.v!), i.med! + i.v!)}. ${LADDER_WORD[i.step]}.` : '. Not enough months to say what is usual.'}</>, i.step[0] === 'r' ? 'crit' : i.step[0] === 'g' ? 'safe' : '')}
          >
            <span className="row">
              <b className="icb"><Ico q={q ? q(i) : { name: i.name, group: i.group ?? i.name }} />{i.name}</b>
              <span className="val">
                {i.step !== 'n' ? <span className={`sc ${i.step}`} data-step={i.step}><i className="m" aria-hidden="true" />{ladderChip(i.step)}</span> : null}
                <N>{inr(i.now)}</N>
              </span>
            </span>
            <span className="track">
              {hasUsual ? <span className="u" style={{ left: `${p(i.med! - i.v!)}%`, width: `${p(i.med! + i.v!) - p(i.med! - i.v!)}%` }} /> : null}
              {hasUsual ? <span className="med" style={{ left: `${p(i.med!)}%` }} /> : null}
              <span className="now" data-s={i.step} style={{ left: `${p(i.now)}%` }} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Group by month matrix ---------- */

export interface MxRow { name: string; group: string; values: number[]; med: number; v: number }
/** "49k", "811" or "0": a value under ₹1,000 must not read as 0k. */
const cellFigure = (v: number): string => short(v).replace('₹', '');
export function Matrix({ months, rows, onRead: give, seeAll }: { months: string[]; rows: MxRow[]; onRead: (n: ReactNode, tone: string) => void; seeAll?: (r: MxRow, i: number) => string | null }) {
  const [picked, setPicked] = useState<string | null>(null);
  const tapped = useRef<{ r: MxRow; i: number } | null>(null);
  const onRead = (n: ReactNode, tone: string) => { const t = tapped.current; give(<>{n} {t ? seeAllLink(seeAll?.(t.r, t.i), `${t.r.name}, ${months[t.i]}`) : null}</>, tone); };
  return (
    <div className="narrow">
      <div className="mx-head">{months.map((m) => <span key={m}>{m}</span>)}</div>
      {rows.map((r) => (
        <div className="mx-row" key={r.name}>
          <b className="icb"><Ico small q={{ name: r.name, group: r.group }} />{r.name}</b>
          <div className="mx-cells">
            {r.values.map((val, i) => {
              const st = ladderOf(val, r.med, r.v, 2000);
              const s = st !== 'n' ? st : val >= r.med ? 't2' : 't1';
              return (
                <button
                  key={months[i]}
                  className={`cell${picked === `${r.name}:${i}` ? ' now' : ''}`}
                  data-s={s}
                  data-step={st}
                  aria-pressed={picked === `${r.name}:${i}`}
                  aria-label={`${r.name}, ${months[i]}, ${inr(val)}`}
                  onClickCapture={() => { tapped.current = { r, i }; }}
                  onClick={() => { setPicked(`${r.name}:${i}`); onRead(<><b>{r.name}, {months[i]}: {inr(val)}</b>. Its usual is ₹{short(r.med).slice(1)}, {usually(Math.max(0, r.med - r.v), r.med + r.v)}. {LADDER_WORD[st]}.</>, st[0] === 'r' ? 'crit' : st[0] === 'g' ? 'safe' : ''); }}
                >
                  {cellFigure(val)}<StatusMark step={st} />
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ---------- Treemap ---------- */

/** `id` is what a block is known by: a label can repeat across groups, an id cannot. `members` lists what a rolled-up block holds. */
export interface TmItem { id?: string; n: string; v: number; st?: string; sub: string; group: string; brand?: string | null; category?: string | null; count?: number; parts?: number; hint?: string; byCategory?: boolean; members?: TmItem[] }
interface Laid<T> { item: T; x: number; y: number; w: number; h: number }
/** Squarified: the mock's layout, with no library. */
export function squarify<T extends { v: number }>(items: T[], x: number, y: number, w: number, h: number): Laid<T>[] {
  const res: Laid<T>[] = [];
  let rest = [...items].sort((a, b) => b.v - a.v);
  let X = x, Y = y, W = w, H = h;
  let left = rest.reduce((s, i) => s + i.v, 0);
  while (rest.length && left > 0) {
    const horiz = W >= H;
    const side = horiz ? H : W;
    const sc = (W * H) / left;
    let row: T[] = [];
    let best = Infinity;
    for (const it of rest) {
      const r = [...row, it];
      const len = (r.reduce((a, b) => a + b.v, 0) * sc) / side;
      const worst = Math.max(...r.map((a) => { const t = (a.v * sc) / len; return Math.max(len / t, t / len); }));
      if (worst > best) break;
      best = worst;
      row = r;
    }
    const total = row.reduce((a, b) => a + b.v, 0);
    const len = (total * sc) / side;
    let o = 0;
    row.forEach((a) => {
      const t = (a.v * sc) / len;
      res.push(horiz ? { item: a, x: X, y: Y + o, w: len, h: t } : { item: a, x: X + o, y: Y, w: t, h: len });
      o += t;
    });
    if (horiz) { X += len; W -= len; } else { Y += len; H -= len; }
    left -= total;
    rest = rest.slice(row.length);
  }
  return res;
}

const figureFor = (v: number): string => (v >= 100000 ? short(v) : v >= 10000 ? `₹${short(v).slice(1)}` : inr(v));
const rootScale = (): number => (typeof document === 'undefined' ? 1 : (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16) / 16);
const MIN_BLOCK = 46;
const MOST_BLOCKS = 16; // More than any phone or column can hold at 46 px and a readable name.
/** Estimated width at the block's type. Capitals set far wider, and real payee names are mostly capitals. */
const nameWidth = (s: string, rem = 16): number => ([...s].reduce((t, c) => t + (c >= 'A' && c <= 'Z' ? 9.6 : 7.4), 0) * rem) / 16;
/** Lines when wrapped at spaces, as the block wraps it. */
function nameLines(name: string, inner: number, rem = 16): number {
  const space = (4 * rem) / 16;
  let lines = 1;
  let used = 0;
  for (const word of name.split(/\s+/)) {
    const w = nameWidth(word, rem);
    if (used && used + space + w > inner) {
      lines += 1;
      used = w;
    } else used += (used ? space : 0) + w;
  }
  return lines;
}
/** Whether a block's name and figure fit, at the real text size. */
function holds(b: Laid<TmItem>): boolean {
  const rem = typeof document === 'undefined' ? 16 : parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const line = (20 * rem) / 16;
  const cw = (7.4 * rem) / 16;
  const inner = b.w - 20;
  if (inner < 8) return false;
  if (b.item.n.split(/\s+/).some((word) => nameWidth(word, rem) > inner)) return false;
  if (figureFor(b.item.v).length * cw * 1.25 > inner) return false;
  return (nameLines(b.item.n, inner, rem) + 1) * line + 18 <= b.h;
}
/** The one block holding whatever does not fit. Its label says what it holds, so it can never read like a second copy of itself. */
function rollup(members: TmItem[]): TmItem {
  const v = members.reduce((t, i) => t + i.v, 0);
  const count = members.reduce((t, i) => t + (i.count ?? 1), 0);
  const group = members[0].group;
  const shared = members.every((i) => i.group === group);
  return members[0].byCategory
    ? { id: 'rollup', n: shared ? `Other ${group.toLowerCase()}` : 'Everything else', parts: members.length, members, byCategory: true, v, sub: 'Smaller kinds of spending together. The list has each payee.', group, count }
    : { id: 'rollup', n: `${members.length} small payees`, parts: members.length, members, v, sub: 'Blocks too small to tap are merged. The list has each one.', group, count };
}
const UNNAMED_STRIP = 64;
/** Unnamed money is one block: a strip across the foot, as tall as its share, and never too short to read. The rest shares what is left. */
export function layoutTreemap(groups: { n: string; items: TmItem[] }[], W: number, H: number): Laid<TmItem>[] {
  const unnamed = groups.flatMap((g) => g.items).find((i) => i.st === 'unk');
  if (!unnamed) return layoutNamed(groups, W, H);
  const rest = groups.map((g) => ({ ...g, items: g.items.filter((i) => i.st !== 'unk') })).filter((g) => g.items.length);
  if (!rest.length) return [{ item: unnamed, x: 0, y: 0, w: W, h: H }];
  const total = groups.reduce((t, g) => t + g.items.reduce((s, i) => s + i.v, 0), 0);
  const strip = Math.round(Math.min(H * 0.6, Math.max(UNNAMED_STRIP * rootScale(), (H * unnamed.v) / total)));
  return [...layoutNamed(rest, W, H - strip), { item: unnamed, x: 0, y: H - strip, w: W, h: strip }];
}
/** Blocks too small to tap go into one rollup, never two, smallest first. Then each is offered its own block back, largest first, so nothing stays swallowed that would fit. The list twin keeps each one. */
function fit(groups: { n: string; items: TmItem[] }[], W: number, H: number): Laid<TmItem>[] {
  const everything = groups.flatMap((g) => g.items);
  const rolled = new Set<TmItem>();
  const lay = (): Laid<TmItem>[] => {
    let out = [...rolled];
    const shown = out.length > 1 ? rollup(out) : null;
    const twin = shown && everything.find((i) => !rolled.has(i) && i.n === shown.n); // A real "Other food" beside the rollup would be the same label twice.
    if (twin) out = [...out, twin];
    const kept = groups.map((g) => ({ ...g, items: g.items.filter((i) => !out.includes(i)) })).filter((g) => g.items.length);
    const block = out.length ? [out.length > 1 ? rollup(out) : out[0]] : [];
    const all = kept.length === 1 ? [{ ...kept[0], items: [...kept[0].items, ...block] }] : block.length ? [...kept, { n: '', items: block }] : kept;
    const top = squarify(all.map((g) => ({ ...g, v: g.items.reduce((s, i) => s + i.v, 0) })), 0, 0, W, H);
    return top.flatMap((t) => squarify(t.item.items, t.x + 1.5, t.y + 1.5, Math.max(1, t.w - 3), Math.max(1, t.h - 3)));
  };
  const failing = (blocks: Laid<TmItem>[]) => blocks.filter((b) => b.item.st !== 'unk' && (b.w < MIN_BLOCK || b.h < MIN_BLOCK || !holds(b))).sort((a, b) => a.w * a.h - b.w * b.h);
  const smallestFirst = [...everything].sort((a, b) => a.v - b.v);
  let blocks = lay();
  for (let bad = failing(blocks); bad.length; bad = failing(blocks)) {
    // A rollup that is itself too small takes the next smallest block with it.
    const next = bad.find((b) => !b.item.parts && !rolled.has(b.item))?.item ?? smallestFirst.find((i) => !rolled.has(i));
    if (!next) break; // All in one block already: small beats a blank chart, and the list has each one.
    rolled.add(next);
    blocks = lay();
  }
  for (const item of [...rolled].sort((a, b) => b.v - a.v).slice(0, MOST_BLOCKS)) {
    rolled.delete(item);
    const without = lay();
    if (failing(without).length) rolled.add(item);
    else blocks = without;
  }
  return blocks;
}
/** Keeping kinds of spending beside their group is worth having only if it costs no blocks. A big group beside small ones usually does, on a phone. */
function layoutNamed(groups: { n: string; items: TmItem[] }[], W: number, H: number): Laid<TmItem>[] {
  const grouped = fit(groups, W, H);
  if (groups.length < 2) return grouped;
  const flat = fit([{ n: '', items: groups.flatMap((g) => g.items) }], W, H);
  return flat.length > grouped.length ? flat : grouped;
}

/** A faint line of past months inside a block, fading in from the left. Decorative: the block's figure and the list carry the numbers. */
function Spark({ values }: { values: number[] }) {
  const id = useMemo(uid, []);
  const max = Math.max(1, ...values);
  const pts = values.map((v, i) => `${((i / Math.max(1, values.length - 1)) * 100).toFixed(1)},${(30 - (v / max) * 26).toFixed(1)}`).join(' ');
  return (
    <svg className="tm-spark" viewBox="0 0 100 32" preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id={id} x1="0" x2="1" y1="0" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0" /><stop offset="1" stopColor="#fff" stopOpacity=".6" /></linearGradient></defs>
      <polyline points={pts} fill="none" stroke={`url(#${id})`} strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
const SPARK_MIN = 110;
const SPARK_MOST = 4;
/**
 * `hue` names a block's colour family (the Tight grid tiles, data-g), `tag` adds a small tag such as a status chip, and `spark` gives past values
 * for a faint line; only the largest few blocks with room draw one.
 */
export function Treemap({ groups, onRead, onUnnamed, height: baseHeight, seeAll, hue, tag, spark }: { groups: { n: string; items: TmItem[] }[]; onRead: (n: ReactNode, tone: string) => void; onUnnamed: () => void; height?: number; seeAll?: (b: TmItem) => string | null; hue?: (b: TmItem) => string | null; tag?: (b: TmItem) => ReactNode; spark?: (b: TmItem) => number[] | null }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const shown = groups.reduce((t, g) => t + g.items.length, 0);
  // Three blocks need no 400 px: a page of one rectangle says nothing the sentence above it did not.
  const height = Math.round((baseHeight ?? Math.min(400, 200 + shown * 40)) * rootScale() ** 2);
  const whole = groups.reduce((t, g) => t + g.items.reduce((s, i) => s + i.v, 0), 0) || 1;
  const blocks = useMemo(() => {
    return layoutTreemap(groups, W, height);
  }, [groups, W, height]);
  const [picked, setPicked] = useState<string | null>(null);
  const sparks = useMemo(() => {
    const out = new Map<Laid<TmItem>, number[]>();
    if (!spark) return out;
    const big = blocks.filter((b) => b.item.st !== 'unk' && b.w >= SPARK_MIN && b.h >= SPARK_MIN).sort((a, b) => b.w * b.h - a.w * a.h).slice(0, SPARK_MOST);
    for (const b of big) {
      const v = spark(b.item);
      if (v && v.length >= 3 && v.some((x) => x > 0)) out.set(b, v);
    }
    return out;
  }, [blocks, spark]);
  return (
    <div className="tm" ref={ref} data-count={blocks.length} style={{ height }}>
      {blocks.map((laid) => {
        const { item: b, x, y, w, h } = laid;
        const cl = b.st === 'unk' ? 'unk' : b.st ?? '';
        const g = cl === 'unk' ? null : hue?.(b) ?? null;
        const extra = cl === 'unk' ? null : tag?.(b) ?? null;
        const line = sparks.get(laid);
        const wide = h >= 86 * rootScale() + (nameLines(b.n, Math.max(1, w - 20), 16 * rootScale()) - 1) * 20 * rootScale() && w >= 74;
        const tone = b.v / whole >= 0.25 ? '3' : b.v / whole >= 0.1 ? '2' : '1';
        const note = b.hint && h >= 104 * rootScale() && nameWidth(b.hint) <= w - 20 ? b.hint : b.byCategory ? null : b.group;
        const hasM = cl[0] === 'r' || cl === 'unk';
        const fits = cl !== 'unk' && w - (cl === 'r1' ? 20 : 16) - (hasM ? 18 : 0) - 24 >= nameWidth(b.n) * 1.05;
        const showIcon = fits && !b.parts;
        const id = b.id ?? `${b.group}:${b.n}`;
        const to = seeAll?.(b);
        return (
          <button
            key={id}
            data-id={id}
            className={g ? `${cl} gt`.trim() : cl}
            data-g={g ?? undefined}
            data-t={tone}
            data-amount={Math.round(b.v)}
            aria-pressed={picked === id}
            style={{ left: x, top: y, width: Math.max(0, w - 1), height: Math.max(0, h - 1) }}
            onClick={() => {
              setPicked(id);
              if (b.st === 'unk') onUnnamed();
              else onRead(<><b>{b.n}: {inr(b.v)}</b>. {b.sub}{to ? <> {seeAllLink(to, b.n)}</> : null}</>, cl[0] === 'r' ? 'crit' : '');
            }}
          >
            <b className={showIcon ? 'icb' : undefined}>{showIcon ? <Ico small q={{ name: b.n, group: b.category ?? b.group, brand: b.brand }} /> : null}{b.n}</b>
            <span className="n">{figureFor(b.v)}</span>
            {wide && cl !== 'unk' && note && note !== b.n ? <small>{note}</small> : null}
            {cl[0] === 'r' ? <i className="m crit" aria-hidden="true" /> : null}
            {cl === 'unk' ? <i className="m q" aria-hidden="true" /> : null}
            {extra ? <span className="tm-tag">{extra}</span> : null}
            {line ? <Spark values={line} /> : null}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Invest year ---------- */

export interface WeekBar { start: string; india: number; us: number }
export interface Pin { i: number; date: string; side: 'India' | 'US'; title: string; aria: string }
const doyOf = (iso: string, year: number) => Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.UTC(year, 0, 1)) / 864e5);
/** `rail`: one axis line under India's bars, with the month letters beneath it. */
export function InvestYear({ year, weeks, today, pins, picked, onPin, onWeek, label, rail }: { year: number; weeks: WeekBar[]; today: string; pins: Pin[]; picked: number | null; onPin: (i: number) => void; onWeek: (w: WeekBar | null) => void; label: string; rail?: boolean }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const PT = 48, UP = 78, DN = 60, AX = 20, PB = 48;
  const H0 = PT + UP + AX + DN + PB;
  const y0 = PT + UP;
  const y1 = y0 + AX;
  const xd = (d: number) => 2 + (d / 364) * (W - 4);
  const max = Math.max(1, ...weeks.map((a) => Math.max(a.india, a.us)));
  const end = doyOf(today, year);
  const xE = xd(Math.min(364, end));
  const nowLeft = xE > W * 0.6;
  const nowL = nowLeft ? xE - 43 : xE + 5;
  const tone = (v: number) => (v >= 40000 ? 'var(--i4)' : v >= 20000 ? 'var(--i3)' : 'var(--i2)');
  const place = (a: { x: number; px: number; p: Pin }[]) => {
    const s = [...a].sort((p, q) => p.x - q.x);
    for (let i = 1; i < s.length; i++) if (s[i].px - s[i - 1].px < 50) s[i].px = s[i - 1].px + 50;
    // Back off the right edge so a pin stays on the page.
    for (let i = s.length - 1; i >= 0; i--) {
      const limit = i === s.length - 1 ? W - 24 : s[i + 1].px - 50;
      if (s[i].px > limit) s[i].px = limit;
    }
    return s;
  };
  const laid = (side: 'India' | 'US') => place(pins.filter((p) => p.side === side).map((p) => ({ p, x: xd(doyOf(p.date, year)), px: Math.max(24, xd(doyOf(p.date, year))) })));
  const IN = laid('India');
  const US = laid('US');
  return (
    <div className="yr" id="yr" ref={ref}>
      <svg
        viewBox={`0 0 ${W} ${H0}`}
        role="img"
        aria-label={label}
        onPointerDown={(e) => {
          const r = e.currentTarget.getBoundingClientRect();
          const X = ((e.clientX - r.left) / r.width) * W;
          const d = Math.max(0, Math.round(((X - 2) / (W - 4)) * 364));
          const hit = weeks.reduce<WeekBar | null>((best, w) => {
            const dist = Math.abs(doyOf(w.start, year) + 3 - d);
            return !best || dist < Math.abs(doyOf(best.start, year) + 3 - d) ? w : best;
          }, null);
          onWeek(hit);
        }}
      >
        <rect x={xE} y={PT} width={Math.max(0, W - xE)} height={UP + AX + DN} fill="var(--band)" opacity=".6" />
        {IN.map((e) => <path key={`l${e.p.i}`} d={`M${e.px} ${PT - 6}L${e.x} ${PT + 6}V${y0}`} fill="none" stroke="var(--ink2)" strokeWidth="1.2" strokeDasharray="3 2" />)}
        {US.map((e) => <path key={`l${e.p.i}`} d={`M${e.px} ${H0 - PB + 6}L${e.x} ${H0 - PB - 6}V${y1}`} fill="none" stroke="var(--ink2)" strokeWidth="1.2" strokeDasharray="3 2" />)}
        {weeks.map((a) => {
          const d0 = doyOf(a.start, year);
          const x0 = xd(Math.max(0, d0));
          const wd = xd(d0 + 7) - xd(d0);
          return (
            <g key={a.start}>
              {a.india > 0 ? <rect x={x0} y={y0 - (a.india / max) * UP} width={wd} height={(a.india / max) * UP} fill={tone(a.india)} /> : null}
              {a.us > 0 ? <rect x={x0} y={y1} width={wd} height={Math.min(DN, (a.us / max) * UP)} fill={tone(a.us)} /> : null}
            </g>
          );
        })}
        {rail ? <line className="yr-rail" x1={0} x2={W} y1={y0 + 0.5} y2={y0 + 0.5} stroke="var(--ink2)" strokeWidth="1" /> : null}
        {MONTHS.map((m, i) => {
          const mx = xd(doyOf(`${year}-${String(i + 1).padStart(2, '0')}-01`, year)) + 1;
          return mx + 10 > nowL && mx < nowL + 40 ? null : <text key={i} x={mx} y={y0 + 14}>{m[0]}</text>; // The word Today takes this month's letter when they would touch.
        })}
        <text x={W - 2} y={PT + 12} textAnchor="end">India</text>
        <text x={W - 2} y={H0 - PB - 4} textAnchor="end">US</text>
        <line className="now-mark" x1={xE} x2={xE} y1={PT} y2={H0 - PB} stroke="var(--now)" strokeWidth="2.5" />
        <text className="now-t" x={nowLeft ? xE - 5 : xE + 5} y={y0 + 14} textAnchor={nowLeft ? 'end' : 'start'}>Today</text>
      </svg>
      {[...IN, ...US].map((e) => (
        <button
          key={e.p.i}
          className="pin"
          aria-pressed={picked === e.p.i}
          aria-label={e.p.aria}
          style={{ left: `${(e.px / W) * 100}%`, ...(e.p.side === 'India' ? { top: 0 } : { bottom: 0 }) }}
          onClick={() => onPin(e.p.i)}
        >
          <span>{e.p.i + 1}</span>
        </button>
      ))}
    </div>
  );
}

export { Read };
