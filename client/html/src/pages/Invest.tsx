/** Invest: the portfolio card first, then the year with market events, then holdings. Gain is only against what was put in, never advice. */
import { useState, type ReactNode } from 'react';
import { PageHeader, StateBar } from '../App';
import { Chip, Hl, Link, N, Read, Tag, type ChipStep, useWide } from '../ui/kit';
import { InfoButton, Stat, WithInfo } from '../ui/tight';
import { InvestYear, type Pin, type WeekBar } from '../ui/charts';
import { dateParts, dayDiff, dayLabel, dayMonth, inr, rupees, short } from '../lib/format';
import { absentReason, useStore, useView } from '../lib/store';
import { VestsNote } from './shared';
import type { Holding, InvestEvent, InvestMovement, Snapshot } from '../lib/data';

const SAFE = new Set(['epf', 'ppf', 'fd', 'gold']);
const money = (x: { value: number } | null | undefined): number | null => (x ? rupees(x.value) : null);
const usd = (x: { value: number } | null | undefined): string => `$${Math.round((x?.value ?? 0) / 100).toLocaleString('en-IN')}`;

/** Green and red step for a gain: SPEC section 3, Portfolio gain. Always printed with a signed % or a word. */
export function gainStep(pct: number): string {
  if (pct === 0) return 'n';
  if (pct > 0) return pct < 10 ? 'g0' : pct < 25 ? 'g1' : pct < 75 ? 'g2' : 'g3';
  const a = -pct;
  return a < 10 ? 'r0' : a < 25 ? 'r2' : 'r3';
}
const pctOf = (h: Holding): number | null => {
  if (h.gain_pct) return h.gain_pct.value / 100;
  return null;
};
const signed = (pct: number): string => `${pct > 0 ? '+' : pct < 0 ? '−' : ''}${Math.abs(pct).toFixed(Math.abs(pct) < 10 && pct % 1 ? 1 : 0)}%`;

/** A ticker to show beside a name: the instrument id when it reads as one. An ISIN or a long id is not a ticker, so it is left out. */
export function tickerOf(instrument: string | null | undefined): string | null {
  const id = (instrument ?? '').trim().toUpperCase();
  if (!id || /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(id)) return null;
  return /^[A-Z][A-Z0-9.&-]{0,11}$/.test(id) ? id : null;
}

/** Market events worth a pin or a line: made-up samples are left out, so only real data shows. */
export const realEvents = (events: InvestEvent[]): InvestEvent[] => events.filter((e) => e.source !== 'sample');

const FLAGS: Record<'India' | 'US', ReactNode> = {
  India: <><rect width="18" height="4" fill="#FF9933" /><rect y="4" width="18" height="4" fill="#fff" /><rect y="8" width="18" height="4" fill="#138808" /><circle cx="9" cy="6" r="1.5" fill="none" stroke="#000080" strokeWidth=".6" /></>,
  US: <><rect width="18" height="12" fill="#fff" /><g fill="#B22234">{[0, 2, 4, 6, 8, 10].map((y) => <rect key={y} y={y} width="18" height="1" />)}</g><rect width="8" height="6.5" fill="#3C3B6E" /></>,
};
/** A small drawn flag beside a country's name. The name is beside it, so the flag is not read out. */
const Flag = ({ c }: { c: 'India' | 'US' }) => (
  <svg className="flag" viewBox="0 0 18 12" width="18" height="12" aria-hidden="true">{FLAGS[c]}<rect width="18" height="12" fill="none" stroke="rgba(0,0,0,.18)" strokeWidth=".6" /></svg>
);
const Ticker = ({ h }: { h: Holding }) => {
  const t = tickerOf(h.instrument);
  return t ? <span className="tk">{t}</span> : null;
};

/** The one "prices as of" on every screen is `value_status.price_as_of`, the oldest price behind the total. The rate's date is said apart only when it differs. */
export function asOfWords(st: { price_as_of: string | null; fx_as_of: string | null }): string | null {
  const p = st.price_as_of;
  const r = st.fx_as_of;
  if (!p) return r ? `rate from ${dayMonth(r)}` : null;
  if (!r) return `prices from ${dayMonth(p)}`;
  return r === p ? `prices and rate from ${dayMonth(p)}` : `prices from ${dayMonth(p)}, rate from ${dayMonth(r)}`;
}

function Counted({ view }: { view: Snapshot }) {
  const { invest } = view;
  const total = money(invest.assets?.total);
  const inv = money(invest.invested);
  const gain = money(invest.gain);
  const fx = invest.assets?.fx ? invest.assets.fx.value / 1e6 : null;
  const est = (invest.holdings ?? []).some((h) => h.estimated);
  const when = asOfWords(invest.value_status);
  return (
    <>
      <div className="sum">
        <span>Value now</span><N>{total == null ? 'Not known yet' : inr(total)}</N>
        <span>You put in</span><N>{inv == null ? 'Not known yet' : inr(inv)}</N>
        <span className="tot">Gain</span><N className="tot">{gain == null ? 'Not known yet' : inr(gain, true)}</N>
      </div>
      <p>{fx ? `US holdings are converted at $1 = ₹${Math.round(fx)}${when ? `, using ${when}` : ''}. ` : ''}{est ? 'Estimated holdings carry an Est tag.' : ''}</p>
      <p>A block&apos;s size is its money; a stronger green is a bigger gain. Tap a block for that holding.</p>
      <p className="note">Green or red here only says whether you are above or below what you put in. It is not advice to buy or sell.</p>
    </>
  );
}

function PortfolioMap({ holdings, onFx }: { holdings: Holding[]; onFx: ReactNode }) {
  const india = holdings.filter((h) => (h.country ?? 'India') !== 'US');
  const us = holdings.filter((h) => h.country === 'US');
  const safe = india.filter((h) => h.asset_class && SAFE.has(h.asset_class));
  const liquidIndia = india.filter((h) => !(h.asset_class && SAFE.has(h.asset_class)));
  const sum = (l: Holding[]) => l.reduce((t, h) => t + rupees(h.value.value), 0);
  const gainPct = (l: Holding[]) => {
    const inv = l.reduce((t, h) => t + (h.invested ? rupees(h.invested.value) : 0), 0);
    const val = sum(l);
    return inv > 0 ? ((val - inv) / inv) * 100 : null;
  };
  const totalAll = sum(holdings) || 1;
  const block = (key: string, name: string, value: number, shown: string, pct: number | null, est: boolean, href: string, tk: string | null = null) => {
    const s = pct == null ? 'n' : gainStep(pct);
    return (
      <Link key={key} className="pf-b gt" to={href} data-s={s} style={{ flex: `${Math.max(1, value)} 1 0` }} aria-label={`${name}, ${shown}${pct != null ? `, gain ${signed(pct)}` : ''}. Go to this holding.`}>
        <b>{name}</b>
        {tk ? <span className="tk">{tk}</span> : null}
        <span className="n">{shown}</span>
        <small>{est ? <Tag>Est</Tag> : null}{pct != null ? signed(pct) : ''}</small>
      </Link>
    );
  };
  const indiaBlocks = [
    ...(safe.length ? [block('safe', 'EPF, PPF, FD, gold', sum(safe), short(sum(safe)), gainPct(safe), safe.some((h) => h.estimated), `invest/h-safe`)] : []),
    ...liquidIndia.map((h, i) => block(`i${i}`, h.name, rupees(h.value.value), short(rupees(h.value.value)), pctOf(h), h.estimated, `invest/h-i${i}`, tickerOf(h.instrument))),
  ];
  const usBlocks = us.map((h, i) => block(`u${i}`, h.name, rupees(h.value.value), h.value_usd ? usd(h.value_usd) : short(rupees(h.value.value)), pctOf(h), h.estimated, `invest/h-u${i}`, tickerOf(h.instrument)));
  const ig = gainPct(india);
  const ug = gainPct(us);
  const usSum = us.reduce((t, h) => t + (h.value_usd?.value ?? 0), 0);
  return (
    <div className="pf-map">
      {india.length ? (
        <>
          <div className="pf-g"><span><Flag c="India" /><b>India</b> {Math.round((sum(india) / totalAll) * 100)}%</span><span><N>{inr(sum(india))}</N>{ig != null ? `, ${ig >= 0 ? 'up' : 'down'} ${Math.round(Math.abs(ig))}%` : ''}</span></div>
          <div className="pf-r tall">{indiaBlocks}</div>
        </>
      ) : null}
      {us.length ? (
        <>
          <div className="pf-g"><span><Flag c="US" /><b>US</b> {Math.round((sum(us) / totalAll) * 100)}%</span><span><N>${Math.round(usSum / 100).toLocaleString('en-IN')}</N> = <N>{inr(sum(us))}</N>{ug != null ? `, ${ug >= 0 ? 'up' : 'down'} ${Math.round(Math.abs(ug))}%` : ''}</span></div>
          <div className="pf-r short">{usBlocks}</div>
        </>
      ) : null}
      {onFx}
    </div>
  );
}

/** Events by date, at most 3 per market and 6 on the chart: index moves come first when more are given. */
export function choosePins(events: InvestEvent[], year: string): { pins: Pin[]; rest: InvestEvent[] } {
  const past = events.filter((e) => e.kind === 'past' && e.date.startsWith(year)).sort((a, b) => a.date.localeCompare(b.date));
  const count: Record<string, number> = { India: 0, US: 0 };
  const pins: Pin[] = [];
  const rest: InvestEvent[] = [];
  for (const e of past) {
    if (count[e.market] < 3 && pins.length < 6) {
      count[e.market] += 1;
      pins.push({ i: pins.length, date: e.date, side: e.market, title: e.label, aria: e.label });
    } else rest.push(e);
  }
  return { pins, rest };
}

/** What bank transfers say went in, where holdings or weekly detail are missing: never reads as "you invested nothing". */
function BankPutIn({ view }: { view: Snapshot }) {
  const { contributions, put_in_source: source } = view.invest;
  const cur = view.spend.month;
  const first = `${Number(cur.slice(0, 4)) - 1}${cur.slice(4)}`;
  const year = contributions.filter((c) => c.month > first).reduce((t, c) => t + rupees(c.amount.value), 0);
  if (!source || source.state === 'none') return <p className="note" data-note="put-in-none">What you put in is not known yet: no bank statement reaches back far enough. Add a bank statement, or connect your holdings on Sources.</p>;
  return <><p className="note" data-note="put-in-bank">About <N>{inr(year)}</N> went in over the last 12 months. {source.basis} Weeks and markets appear once holdings are connected.</p><VestsNote view={view} /></>;
}

function HoldingRow({ h, id }: { h: Holding; id: string }) {
  const pct = pctOf(h);
  const us = h.country === 'US' && h.value_usd;
  const value = rupees(h.value.value);
  const inv = h.invested ? rupees(h.invested.value) : null;
  const annual = h.annual_return_bp != null ? `About ${(h.annual_return_bp / 100).toFixed(0)}% a year` : h.return_since && h.return_since.bp != null ? `${signed(h.return_since.bp / 100)} since ${dayMonth(h.return_since.since)}` : null;
  const sub = [us ? inr(value) : null, inv == null ? 'Put in not known' : null, annual].filter(Boolean).join(' · ');
  const title = `${h.name}: ${us ? `${usd(h.value_usd)}, ${inr(value)}` : inr(value)}${inv != null ? `, put in ${inr(inv)}` : ''}`;
  const step = pct == null ? '' : pct > 0 ? 'up' : pct < 0 ? 'down' : '';
  return (
    <li id={id} title={title}>
      <div className="r">
        <span className="hn"><span><b>{h.name}</b><Ticker h={h} /></span>{sub ? <small>{sub}</small> : null}</span>
        <span className="hv">
          {h.estimated ? <Tag>Est</Tag> : null}
          <N>{us ? usd(h.value_usd) : inr(value)}</N>
          {pct != null ? <small className={step}>{signed(pct)}</small> : null}
        </span>
      </div>
    </li>
  );
}

function Year({ view, year }: { view: Snapshot; year: string }) {
  const inv = view.invest;
  const asOf = view.meta.as_of;
  const weeks: WeekBar[] = inv.weekly.filter((w) => w.week.startsWith(year)).map((w) => ({ start: w.week, india: Math.max(0, rupees(w.india.value)), us: Math.max(0, rupees(w.us.value)) }));
  const putIn = weeks.reduce((t, w) => t + w.india + w.us, 0);
  const events = realEvents(inv.events);
  const { pins, rest } = choosePins(events, year);
  const [picked, setPicked] = useState<number | null>(pins.length ? 0 : null);
  const [read, setRead] = useState<ReactNode>(null);
  const moves = inv.movements as InvestMovement[];
  const afterEvent = (date: string): number => moves.filter((m) => {
    const d = dayDiff(m.date, date);
    return d >= 0 && d <= 14;
  }).reduce((t, m) => t + rupees(m.amount.value), 0);
  const upcoming = events.filter((e) => e.kind === 'upcoming').slice(0, 3);
  const heldNames = new Set((inv.holdings ?? []).map((h) => h.instrument).filter(Boolean));
  const pinned = picked != null ? pins[picked] : null;
  const largest = [...weeks].sort((a, b) => b.india + b.us - (a.india + a.us)).slice(0, 3);
  const nowDay = asOf;
  return (
    <section className="sec sec-tight" id="year">
      {weeks.length ? (
        <h2 className="yr-h"><Stat value={<N>{short(putIn)}</N>} period="Y" periodLabel={`In ${year}`} tag="put in" testid="put-in" /> <InfoButton title={`Put in during ${year}`} label="About this chart"><p>You put in <N>{inr(putIn)}</N> in {year}.</p><p>India above the line, US below. Stronger weeks put in more.{pins.length ? ' Tap a number for a market event.' : ''}</p></InfoButton></h2>
      ) : <h2>Your year</h2>}
      {weeks.length ? (
        <InvestYear
          year={Number(year)}
          weeks={weeks}
          today={nowDay}
          pins={pins}
          picked={picked}
          onPin={setPicked}
          rail
          onWeek={(w) => setRead(w ? <>Week of {dayMonth(w.start)}: India <N>{inr(w.india)}</N>, US <N>{inr(w.us)}</N>.</> : null)}
          label={`Money put in each week of ${year}, India above the line, US below${pins.length ? `, with ${pins.length} market events` : ''}. A list is available below.`}
        />
      ) : <BankPutIn view={view} />}
      {weeks.length && inv.put_in_source?.state === 'connected_sources' ? <><p className="note" data-note="put-in-basis">{inv.put_in_source.basis}</p><VestsNote view={view} /></> : null}
      {pinned ? (
        <div className="evt" id="evt" aria-live="polite">
          <small>{dayLabel(pinned.date)}, {pinned.side}</small>
          <b>{pinned.title}</b>
          <p>You put in <N>{afterEvent(pinned.date) ? inr(afterEvent(pinned.date)) : 'nothing'}</N> in the two weeks from that day.</p>
        </div>
      ) : null}
      <Read text={read} />
      {upcoming.length ? (
        <div className="up-box" aria-labelledby="up-h">
          <div className="up-t"><h3 id="up-h">Coming up, rough dates</h3></div>
          <ul>
            {upcoming.map((e) => (
              <li key={`${e.date}-${e.label}`}>
                <span className="w">About {dayMonth(e.date)}</span>
                <span><b>{e.label}</b><small>{e.market}{e.instrument ? (heldNames.has(e.instrument) ? '. You hold this' : '. You do not hold this') : ''}</small></span>
              </li>
            ))}
          </ul>
          <p className="note">Rough dates. Check before acting.</p>
        </div>
      ) : null}
      {pins.length + rest.length + largest.length ? (
        <details className="aslist mt4">
          <summary>See past events and weeks as list</summary>
          {pins.length + rest.length ? (
            <table className="tbl"><thead><tr><th scope="col">Event</th><th scope="col">Market</th></tr></thead><tbody>
              {[...pins.map((p) => ({ date: p.date, label: p.title, market: p.side })), ...rest.map((e) => ({ date: e.date, label: e.label, market: e.market }))].sort((a, b) => a.date.localeCompare(b.date)).map((e) => (
                <tr key={`${e.date}-${e.label}`}><td><b>{dayLabel(e.date)}</b><small>{e.label}</small></td><td>{e.market}</td></tr>
              ))}
            </tbody></table>
          ) : null}
          {largest.length ? (
            <table className="tbl tbl-after"><thead><tr><th scope="col">Largest weeks</th><th scope="col" className="num">Put in</th></tr></thead><tbody>
              {largest.map((w) => <tr key={w.start}><td><b>Week of {dayLabel(w.start)}</b><small>India {inr(w.india)}, US {inr(w.us)}</small></td><td className="num n">{inr(w.india + w.us)}</td></tr>)}
            </tbody></table>
          ) : null}
        </details>
      ) : null}
    </section>
  );
}

export function Invest() {
  const wide = useWide();
  const view = useView();
  const { invest } = view;
  const notConnected = useStore().sources?.numbers.invest?.confidence === 'unknown';
  const holdings = invest.holdings ?? [];
  const header = (
    <>
      <PageHeader title="Invest" />
      <StateBar />
    </>
  );
  if (!holdings.length) {
    return (
      <>
        {header}
        <main>
          <h1 className="a">{notConnected ? 'Not connected yet.' : 'No investments found yet.'}</h1>
          <p className="sub">{notConnected ? 'Nothing brings your holdings to the box yet, so this is not a zero.' : 'Holdings appear here after your first statement from a fund or broker.'}</p>
          <div className="wrap"><BankPutIn view={view} /></div>
          {notConnected ? <div className="wrap mt4"><Link className="bigbtn" to="sources">See your sources</Link></div> : null}
        </main>
      </>
    );
  }
  const total = money(invest.assets?.total);
  const inv = money(invest.invested);
  const gain = money(invest.gain);
  const pct = invest.gain_pct ? invest.gain_pct.value / 100 : null;
  const status = invest.value_status;
  const fx = invest.assets?.fx ? invest.assets.fx.value / 1e6 : null;
  const year = view.meta.as_of.slice(0, 4);
  const step = pct == null ? null : gainStep(pct);
  const chip = pct == null ? null : pct === 0 ? <span className="sc plain">No change</span> : <Chip step={(step === 'g0' ? 'g1' : step === 'r0' ? 'r1' : step) as ChipStep}>{pct > 0 ? 'Up' : 'Down'} {Math.abs(pct).toFixed(1)}%</Chip>;
  const when = asOfWords(status);
  const fxWords = [fx ? `$1 = ₹${Math.round(fx)}` : null, when].filter(Boolean).join(', ');
  const fxLine = (
    <p className="pf-fx">
      {fxWords ? <WithInfo text={`${fxWords[0].toUpperCase()}${fxWords.slice(1)}.`} title="How this is counted" label="How it's counted"><Counted view={view} /></WithInfo>
        : <InfoButton title="How this is counted" label="How it's counted"><Counted view={view} /></InfoButton>}
    </p>
  );
  const india = holdings.filter((h) => (h.country ?? 'India') !== 'US');
  const us = holdings.filter((h) => h.country === 'US');
  const safe = india.filter((h) => h.asset_class && SAFE.has(h.asset_class));
  const liquidIndia = india.filter((h) => !(h.asset_class && SAFE.has(h.asset_class)));
  const safeReason = absentReason(view, 'invest.buckets.safe');
  const targetsReason = absentReason(view, 'invest.targets');
  const yearReason = absentReason(view, 'invest.holdings[].annual_return_bp');
  const holdingsSection = (
          <section className="sec" id="holdings">
            <h2><WithInfo text="Holdings" title="Holdings"><p>Gains are in rupees, so they include the exchange rate.</p>{yearReason ? <p data-note="year-reason">{yearReason}</p> : null}</WithInfo></h2>
            {india.length ? (
              <>
                <h3 className="hd">India</h3>
                <ul className="rows hold">
                  {liquidIndia.map((h, i) => <HoldingRow key={h.name} h={h} id={`h-i${i}`} />)}
                  {safe.map((h, i) => <HoldingRow key={h.name} h={h} id={i === 0 ? 'h-safe' : `h-safe${i}`} />)}
                </ul>
              </>
            ) : null}
            {us.length ? (
              <>
                <h3 className="hd">US</h3>
                <ul className="rows hold">{us.map((h, i) => <HoldingRow key={h.name} h={h} id={`h-u${i}`} />)}</ul>
              </>
            ) : null}
            {safeReason ? (
              <>
                <h3 className="hd mt4">EPF, PPF, FDs, gold</h3>
                <p className="note">{safeReason}</p>
              </>
            ) : null}
          </section>
  );
  return (
    <>
      {header}
      <main className="duo">
        <div className="pri">
        <section className="pf" aria-labelledby="pf-h">
          <div className="pf-top">
            <h1 id="pf-h">Your portfolio</h1>
            {total == null ? (
              <p className="pf-in"><span className="sc quiet">{status.unpriced ? `${status.unpriced} ${status.unpriced === 1 ? 'holding has' : 'holdings have'} no price or rate, so there is no total yet.` : 'Not known yet.'}</span></p>
            ) : (
              <div className="pf-val n" id="pf-value" data-amount={Math.round(total)}><Hl>{inr(total)}</Hl></div>
            )}
            {gain != null ? <div className="pf-gain">{chip}<N>{inr(gain, true)}</N></div> : null}
            {inv != null ? <div className="pf-in">You put in <N>{inr(inv)}</N></div> : null}
            {total != null && status.unpriced ? <p className="pf-in"><span className="sc quiet">{status.unpriced} left out: no price or rate.</span></p> : null}
          </div>
          <PortfolioMap holdings={holdings} onFx={fxLine} />
        </section>
        {wide ? holdingsSection : null}
        </div>
        <div className="side">
          <Year view={view} year={year} />
          {wide ? null : holdingsSection}
          <section className="sec" id="targets">
            <h2>Targets</h2>
            <p className="note">{targetsReason ?? 'No target allocation is stored yet.'}</p>
          </section>
        </div>
      </main>
    </>
  );
}

export { dateParts };
