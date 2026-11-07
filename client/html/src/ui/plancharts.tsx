/** Plan's two charts, ported from the frozen plan.js. Text is drawn at real pixels from the tokens, so it scales with the phone's text size. */
import { Icon } from '../icons/react';
import { pickIcon } from './kit';
import { fc, monthName, short } from '../lib/format';
import { A, idx, statuses, type PlanRec, type Projection, type Row, type YearInputs } from '../lib/plan';
import { markToken, type Cushions } from '../lib/status';

export interface YearChartProps {
  rows: Row[];
  y: YearInputs;
  c: Cushions;
  W: number;
  H?: number;
  flags?: Pick<PlanRec, 'title' | 'ym'>[];
  compare?: Row[];
  cmpLabel?: string;
}

const rootPx = (): number => (typeof document === 'undefined' ? 16 : parseFloat(getComputedStyle(document.documentElement).fontSize) || 16);

export function YearChart({ rows, y: inputs, c, W, H: h0 = 230, flags = [], compare, cmpLabel }: YearChartProps) {
  const scale = rootPx() / 16;
  const top = 30 * scale;
  const bot = 26 * scale;
  const H = h0 + (scale - 1) * 56;
  const cash = inputs.cashToday;
  const hi = rows.map((r) => r.end + r.h);
  const lo = rows.map((r) => r.end - r.h);
  const all = [...hi, ...lo, 0, c.soft, cash, ...(compare ? compare.map((r) => r.end) : [])];
  const vmax = Math.max(...all);
  let vmin = Math.min(...all);
  const need = 22 * scale;
  const inner = H - top - bot;
  if ((c.hard - vmin) * inner / (vmax - vmin || 1) < need) vmin = c.hard - (need * (vmax - c.hard)) / (inner - need);
  const y = (v: number) => top + (H - top - bot) * (1 - (v - vmin) / (vmax - vmin || 1));
  const x = (i: number) => 4 + (i * (W - 8)) / 12;
  const pt = (i: number) => (i === 0 ? cash : rows[i - 1].end);
  const st = statuses(rows, c, inputs);
  const bandPath = `M${x(0)} ${y(cash)}${rows.map((_, i) => ` L${x(i + 1)} ${y(hi[i])}`).join('')}${rows.map((_, i) => ` L${x(12 - i)} ${y(lo[11 - i])}`).join('')}Z`;
  const line = Array.from({ length: 13 }, (_, i) => `${i ? 'L' : 'M'} ${x(i)} ${y(pt(i))}`).join(' ');
  const cmpLine = compare ? Array.from({ length: 13 }, (_, i) => `${i ? 'L' : 'M'}${x(i)} ${y(i === 0 ? cash : compare[i - 1].end)}`).join(' ') : '';
  const cw = 7.8 * scale;
  const rowH = 18 * scale;
  const endT = `${monthName(rows[11].ym)} ${fc(rows[11].end, rows[11].h)}`;
  const endW = compare ? 0 : endT.length * cw;
  // Labels sit above the whole band under them, not just above one month's point, so no label ever lies on the line or the band.
  const between = (edge: number[], xx: number) => {
    const f = Math.max(0, Math.min(12, (xx - 4) / ((W - 8) / 12)));
    const a = Math.floor(f);
    const b = Math.min(12, a + 1);
    return edge[a] + (edge[b] - edge[a]) * (f - a);
  };
  const upper = [cash, ...hi];
  const lower = [cash, ...lo];
  const across = (edge: number[], l: number, r: number) => {
    const out: number[] = [];
    for (let q = l; q < r; q += 4) out.push(y(between(edge, q)));
    out.push(y(between(edge, r)));
    return out;
  };
  const above = (l: number, r: number) => Math.min(...across(upper, l, r)) - 8;
  const below = (l: number, r: number) => Math.max(...across(lower, l, r)) + rowH;
  const endY = Math.max(14, above(W - endW, W));
  const placed: { l: number; w: number; y: number }[] = compare ? [] : [{ l: W - endW, w: endW, y: endY }];
  const clear = (l: number, w: number) => {
    const clash = (t: number) => placed.some((q) => l < q.l + q.w && l + w > q.l && Math.abs(t - q.y) < rowH);
    let t = above(l, l + w);
    while (clash(t) && t >= 14 * scale) t -= rowH;
    if (t < 14 * scale) {
      t = below(l, l + w);
      while (clash(t) && t < H - bot) t += rowH;
    }
    return t;
  };
  const flagEls = [...flags].sort((a, b) => idx(inputs.start, a.ym) - idx(inputs.start, b.ym)).map((f, n) => {
    const i = idx(inputs.start, f.ym);
    if (i < 0) return null;
    const cx = x(i + 1);
    const nm = f.title.length > 9 ? f.title.split(' ')[0] : f.title;
    const t = `${nm.slice(0, 16)}, ${monthName(f.ym)}`;
    const name = pickIcon({ name: f.title });
    const hasI = name !== 'circle-dashed';
    const w = t.length * cw + 6 + (hasI ? 20 : 0);
    const l = Math.max(0, Math.min(W - w, cx - w / 2));
    const yy = clear(l, w);
    placed.push({ l, w, y: yy });
    return (
      <g key={`${f.title}-${n}`}>
        <line x1={cx} x2={cx} y1={yy + 4} y2={y(rows[i].end) - 3} stroke="var(--ink2)" strokeWidth="1" />
        {hasI ? <Icon name={name} className="flag-ic" x={l + 2} y={yy - 12} width={15} height={15} /> : null}
        <text className="flag halo" x={hasI ? l + 20 : l + w / 2} y={yy} textAnchor={hasI ? 'start' : 'middle'}>{t}</text>
      </g>
    );
  });
  const tt = `Today ${short(cash)}`;
  const tw = tt.length * cw;
  const ty = clear(x(0), tw);
  const tx2 = x(0);
  const lbl = `Soft cushion ${short(c.soft)}, hard ${short(c.hard)}`;
  const lw = lbl.length * 6.6 * scale;
  const yAt = (xx: number) => {
    const f = Math.max(0, Math.min(12, (xx - 4) / ((W - 8) / 12)));
    const a = Math.floor(f);
    const b = Math.min(12, a + 1);
    return y(pt(a) + (pt(b) - pt(a)) * (f - a));
  };
  if (!compare) placed.push({ l: x(0), w: tw, y: ty });
  const free = (x0: number, x1: number, t: number) => {
    for (const q of placed) if (x0 < q.l + q.w && x1 > q.l && Math.abs(t - q.y) < 16 * scale) return false;
    for (let q = x0; q <= x1; q += 6) {
      const ly = yAt(q);
      if (ly > t - 16 * scale && ly < t + 6) return false;
    }
    return true;
  };
  const yb = y(c.hard) + 16 * scale;
  const ya = y(c.soft) - 5;
  const spots: [number, 'start' | 'end', number, number, number][] = [[0, 'start', yb, 0, lw], [W - 1, 'end', yb, W - lw, W], [W - 1, 'end', ya, W - lw, W], [0, 'start', ya, 0, lw]];
  const sp = spots.find((q) => free(q[3], q[4], q[2])) ?? [0, 'start', 14 * scale, 0, 0];
  /** "Without it" moves clear of a flag it would land on. */
  const cmpY = () => {
    let t = Math.max(14 * scale, Math.min(H - bot - 20, y(compare![11].end) + (compare![11].end > rows[11].end ? -8 : 18)));
    const w = (cmpLabel?.length ?? 0) * cw;
    for (let i = 0; i < 4 && placed.some((q) => W - w < q.l + q.w && W > q.l && Math.abs(t - q.y) < rowH); i++) t = Math.min(H - bot - 4, t + rowH);
    if (placed.some((q) => W - w < q.l + q.w && W > q.l && Math.abs(t - q.y) < rowH)) t = Math.max(14 * scale, Math.min(...placed.map((q) => q.y)) - rowH);
    return t;
  };
  const firstRed = st.findIndex((m) => m.step[0] === 'r');
  const off = firstRed >= 0 ? firstRed % 2 : 0;
  const fadeId = `fade${h0}`;
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      <defs>
        <linearGradient id={fadeId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--r0)" />
          <stop offset=".65" stopColor="var(--r0)" />
          <stop offset="1" stopColor="var(--r0)" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="0" y={y(c.soft)} width={W} height={Math.max(0, H - bot - y(c.soft))} fill={`url(#${fadeId})`} />
      <path d={bandPath} fill="var(--t2)" opacity=".5" />
      <line className="cushion-soft" x1="0" x2={W} y1={y(c.soft)} y2={y(c.soft)} stroke="var(--r2)" strokeWidth="2" strokeDasharray="5 4" />
      <line className="cushion-hard" x1="0" x2={W} y1={y(c.hard)} y2={y(c.hard)} stroke="var(--r3t)" strokeWidth="2" />
      {compare ? <path d={cmpLine} fill="none" stroke="var(--ink3)" strokeWidth="2" strokeDasharray="5 4" /> : null}
      <path className="main-line" d={line} fill="none" stroke="var(--ink)" strokeWidth="3" strokeLinejoin="round" />
      {st.map((m, i) => {
        if (m.step === 'n') return null;
        const cx = x(i + 1);
        const cy = y(rows[i].end);
        const col = `var(--${markToken(m.step)})`;
        return m.step[0] === 'r'
          ? <rect key={m.ym} data-step={m.step} x={cx - 6} y={cy - 6} width="12" height="12" transform={`rotate(45 ${cx} ${cy})`} fill={col} stroke="var(--paper)" strokeWidth="1.5" />
          : <circle key={m.ym} data-step={m.step} cx={cx} cy={cy} r="6" fill={col} stroke="var(--paper)" strokeWidth="1.5" />;
      })}
      <circle className="now-mark" cx={x(0)} cy={y(cash)} r="6" fill="var(--now)" stroke="var(--paper)" strokeWidth="2" />
      {flagEls}
      {compare ? null : <text x={tx2} y={ty} className="fig halo" textAnchor="start">{tt}</text>}
      {compare ? null : <text className="fig halo" x={W - 1} y={endY} textAnchor="end">{endT}</text>}
      <text className="strong halo" x={sp[0]} y={sp[2]} textAnchor={sp[1]}>{lbl}</text>
      {compare && cmpLabel ? <text className="halo" x={W - 1} y={cmpY()} textAnchor="end">{cmpLabel}</text> : null}
      {rows.map((_, i) => <line key={i} className="tick" x1={x(i + 1)} x2={x(i + 1)} y1={H - bot} y2={H - bot + ((i - off) % 2 === 0 ? 5 : 3)} />)}
      {rows.map((r, i) => ((i - off) % 2 === 0 && i >= off ? <text key={r.ym} className={i === firstRed ? 'strong' : ''} x={Math.min(W - 14, x(i + 1))} y={H - 5} textAnchor="middle">{monthName(r.ym)}</text> : null))}
    </svg>
  );
}

export function FanChart({ L, W, H: h0 = 220, vmax: fixed, noGrowth }: { L: Projection; W: number; H?: number; vmax?: number; noGrowth?: boolean }) {
  const scale = rootPx() / 16;
  const top = 26 * scale;
  const bot = 26 * scale;
  const H = h0 + (scale - 1) * 52;
  const Y = A.years;
  const vmax = fixed ?? Math.max(1, ...L.q.map((q) => q.p90));
  const y = (v: number) => top + (H - top - bot) * (1 - v / vmax);
  const x = (t: number) => 4 + (t * (W - 8)) / Y;
  const up = L.q.map((q, t) => `${t ? 'L' : 'M'}${x(t)} ${y(q.p90)}`).join(' ');
  const dn = [...L.q].reverse().map((q, i) => `L${x(Y - i)} ${y(q.p10)}`).join(' ');
  const mid = L.q.map((q, t) => `${t ? 'L' : 'M'}${x(t)} ${y(q.p50)}`).join(' ');
  const flat = L.paid.map((v, t) => `${t ? 'L' : 'M'}${x(t)} ${y(v)}`).join(' ');
  // The middle label clears the whole band under it. The band rises to the right, so its own point is not enough. If the top end's label is there, it goes under the band.
  const cw = 7.8 * scale;
  const midT = fc(L.med(5), L.h(5));
  const endT = fc(L.med(Y), L.h(Y));
  const endY = Math.max(16, y(L.q[Y].p90) - 8);
  const midX = Math.max((midT.length * cw) / 2, x(5));
  const edgeAt = (key: 'p90' | 'p10', xx: number) => {
    const f = Math.max(0, Math.min(Y, ((xx - 4) * Y) / (W - 8)));
    const a = Math.floor(f);
    const b = Math.min(Y, a + 1);
    return L.q[a][key] + (L.q[b][key] - L.q[a][key]) * (f - a);
  };
  const midL = midX - (midT.length * cw) / 2;
  const midR = midX + (midT.length * cw) / 2;
  const midAbove = y(Math.max(edgeAt('p90', midL), edgeAt('p90', midR), L.q[5].p90)) - 8;
  const endL = W - 1 - endT.length * cw;
  const midY = midAbove >= 14 * scale && !(midR > endL && Math.abs(midAbove - endY) < 18 * scale) ? midAbove : Math.min(H - bot - 24 * scale, y(Math.min(edgeAt('p10', midL), edgeAt('p10', midR), L.q[5].p10)) + 18 * scale);
  return (
    <svg className="chart" viewBox={`0 0 ${W} ${H}`} width={W} height={H} aria-hidden="true">
      <path d={`${up} ${dn}Z`} fill="var(--i1)" opacity=".9" />
      <line x1="0" x2={W} y1={y(0)} y2={y(0)} stroke="var(--rule)" />
      {noGrowth ? <path d={flat} fill="none" stroke="var(--ink2)" strokeWidth="1.5" strokeDasharray="4 4" /> : null}
      {noGrowth ? <text x={x(Y)} y={H - bot - 6} textAnchor="end">Dashed: if markets gave nothing</text> : null}
      <path d={mid} fill="none" stroke="var(--inv)" strokeWidth="3" />
      {[5, Y].map((t) => <circle key={t} cx={x(t)} cy={y(L.q[t].p50)} r="5" fill="var(--inv)" stroke="var(--paper)" strokeWidth="1.5" />)}
      <text className="fig" x={midX} y={midY} textAnchor="middle">{midT}</text>
      <text className="fig" x={W - 1} y={endY} textAnchor="end">{endT}</text>
      <circle className="now-mark" cx={x(0)} cy={y(L.q[0].p50)} r="6" fill="var(--now)" stroke="var(--paper)" strokeWidth="2" />
      <text className="now-t" x={x(0)} y={H - 7}>Today</text>
      <text x={x(5)} y={H - 7} textAnchor="middle">5 years</text>
      <text x={W} y={H - 7} textAnchor="end">10 years</text>
    </svg>
  );
}
