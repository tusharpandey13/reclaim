/** Today: one column of time. "How much will be left, and what is going to take it", then where you stand. */
import { Fragment, useMemo, useState, type ReactNode } from 'react';
import { Brand, StateBar, ThemeButton } from '../App';
import { Chip, CloseButton, Hl, Ico, Link, N, NameChip, Read, Tag, UiIco, useSheet, useWide } from '../ui/kit';
import { Bars, lineCaption, Stops, type Bar, type StopRow } from '../ui/charts';
import { dateParts, dayDiff, dayLabel, dayMonth, fc, heroParts, inr, MONTHS, monthLong, rangeEnds, rupees, runOutWhen, short, shortStamp, timeLabel, usually, usualOf } from '../lib/format';
import { isTooWide, kind as kindOf, ladder, LADDER_WORD, ladderChip, medianSpread, shortfall, step as stepOf, todaySays, greens, type Kind, type Ladder } from '../lib/status';
import { balanceBar, useStore, useView, yearInputs } from '../lib/store';
import { series } from '../lib/plan';
import { monthTiles, MonthTiles, VestsNote, statementShare, investTiles, StillTesting, LIKELY_BILLS_HONEST, rangeLabel, rangeWhy, DoubtNote, DoubtTag, plainReason } from './shared';
import type { Figure, Item, Snapshot } from '../lib/data';
import { CalIcon, FoldRow, InfoButton, Stat, useInfo, type StatStatus } from '../ui/tight';
import { groupScale, rowMin, shortK1, spendingTrend, type RowKind } from '../lib/today';
import '../design/today.css';
import { drillHref, payeeHash } from '../lib/drill';
import { cardRoute } from '../lib/router';
import { GROUP_ICON, groupOf, perDayLine, rollUp, type LineGroup, type Projected } from '../lib/line';

/** Chores run from about the 26th to the 3rd. One constant, since the SPEC says "about". */
const CHORES_FROM = 26;
const CHORES_TO = 3;
export const inChoresWindow = (day: number): boolean => day >= CHORES_FROM || day <= CHORES_TO;
const THIN_MONTHS = 6;

const f = (x: Figure | null | undefined): number | null => (x ? rupees(x.value) : null);
const sp = (x: Figure | null | undefined): number => (x?.spread ? rupees(x.spread.variance) : 0);

export interface HeroState { m: number; h: number; known: boolean; kind: Kind; step: string; earned: 'g1' | 'g2' | null; planned: number; base: number; tooWide: boolean }

/** Likely left, against the owner's cushions, less any plan for this month. Figure.status is never read here. */
export function heroState(view: Snapshot, soft: number, hard: number, planned: number): HeroState | null {
  const fig = view.forecast.likely_left;
  if (!fig || view.forecast.state !== 'ok' || view.forecast.months_of_history < THIN_MONTHS) return null;
  // A salary already late is not money in hand: the hero never counts it as arrived.
  const late = view.forecast.pay_included?.late ? rupees(view.forecast.pay_included.amount.value) : 0;
  const base = rupees(fig.value) - late;
  const m = base - planned;
  const known = !!fig.spread;
  const h = known ? rupees(fig.spread!.variance) : 0;
  const c = { soft, hard };
  const tooWide = isTooWide(h, soft);
  const kind = (known && !tooWide) || m < soft ? kindOf(m, h, c) : 'just';
  const liquid = view.position.liquid ? rupees(view.position.liquid.value) : null;
  const history = balanceBar(view);
  const earned = kind === 'fits' && known && !tooWide ? (greens([m - h], history)[0] as 'g1' | 'g2' | null) : null;
  const step = stepOf(kind, Math.max(0, soft - m), liquid);
  return { m, h, known, kind, step, earned, planned, base, tooWide };
}

/** From low to high is over twice the soft cushion: a range like that says nothing useful, so the figure stands alone. The server's `facts_v2.too_wide` is the same rule. */
export { isTooWide };

const markerOn = (s: HeroState) => s.step === 'n' || s.earned != null;

function WhySheet({ view, s, plans }: { view: Snapshot; s: HeroState; plans: { title: string; amount: number }[] }) {
  const fo = view.forecast;
  const cash = f(fo.cash) ?? f(view.position.cash) ?? 0;
  const dues = fo.due_items.filter((i) => !fo.before_salary || i.kind !== 'sip');
  const moves = fo.before_salary ? fo.due_items.filter((i) => i.kind === 'sip') : [];
  const movesSum = moves.reduce((t, i) => t + rupees(i.amount.value), 0);
  const unmatched = fo.payment_unmatched ? rupees(fo.payment_unmatched.total) : 0;
  const dueSum = dues.reduce((t, i) => t + rupees(i.amount.value), 0);
  const pay = fo.pay_included && !fo.pay_included.late ? rupees(fo.pay_included.amount.value) : 0;
  const usual = f(fo.usual_spend) ?? 0;
  const left = Math.max(0, dayDiff(fo.month_end, view.meta.as_of));
  const usualRange = usualOf(fo.usual_spend);
  return (
    <>
      <h2>How {fc(s.m, 0)} is worked out</h2>
      <div className="sum">
        <span>In bank today</span><N>{inr(cash)}</N>
        {pay ? <><span>Salary before month end</span><N>{inr(pay, true)}</N></> : null}
        <span>Less {dues.length} {dues.length === 1 ? 'payment' : 'payments'}</span><N>{inr(dueSum)}</N>
        {unmatched ? <><span>Payment not yet matched to a card</span><N>{inr(unmatched, true)}</N></> : null}
        {movesSum ? <><span>Going to investing</span><N>{inr(movesSum)}</N></> : null}
        {usual ? <><span>Less everyday, {left} {left === 1 ? 'day' : 'days'}</span><N>{fc(usual, 0)}{usualRange ? `, ${usually(usualRange.low, usualRange.high)}` : ''}</N></> : null}
        {plans.flatMap((p) => [<span key={p.title}><Tag>Plan</Tag>{p.title}</span>, <N key={`${p.title}-v`}>{inr(p.amount)}</N>])}
        <span className="tot">Likely left on {dayMonth(fo.month_end)}</span><N className="tot">{fc(s.m, 0)}</N>
      </div>
      {plans.length ? <p className="note">Without your plans: <N>{fc(s.base, 0)}</N>. This is a projection, and nothing has moved.</p> : null}
      {s.known ? <>
        {s.tooWide ? <p>Too early to tell how this month lands: usually between <N>{fc(rangeEnds(s.m, s.h).low, 0)}</N> and <N>{fc(rangeEnds(s.m, s.h).high, 0)}</N>, which is too wide to lean on yet.</p> : <p>Usually between <N>{fc(rangeEnds(s.m, s.h).low, 0)}</N> and <N>{fc(rangeEnds(s.m, s.h).high, 0)}</N>.</p>}
        <p className="note testing-why"><Tag>{rangeLabel(view)}</Tag>{rangeWhy(view)}</p>
      </> : <p>There is no range for this figure yet.</p>}
      <p className="note">That range comes from how far this forecast, made on this date, missed in your last 6 months, with an outlier pulled in so it does not set the width.</p>
      <NotCounted view={view} />
      <CloseButton />
    </>
  );
}

/**
 * How often and how much, only as far as the history supports. Real transfers are lumpy, so "usually" needs at least three months
 * and a largest month within twice the median; otherwise the largest is the honest figure. Under three covered months it says neither.
 */
function unplannedHistory(u: { months: number; months_with: number; typical: number; largest: number }): string {
  if (u.months < 3) return '';
  if (u.months_with === 1) return `You made one in your last ${u.months} months, of ${short(rupees(u.largest))}. `;
  const steady = u.months_with >= 3 && u.largest <= u.typical * 2;
  return `You made them in ${u.months_with} of your last ${u.months} months, ${steady ? `usually ${short(rupees(u.typical))}` : `up to ${short(rupees(u.largest))}`}. `;
}

/** What the figure leaves out, said beside it, so an unplanned move can never silently overstate cash. */
function NotCounted({ view }: { view: Snapshot }) {
  const b = view.forecast.before_salary;
  if (!b) return null;
  return (
    <>
      {b.basis === 'month_end' ? <p className="note" data-note="date">Your salary date is not known right now, so this is the month's last day.</p> : <p className="note" data-note="date">This is the day before your next salary, with no salary in it.</p>}
      {b.unplanned.months_with > 0 ? <p className="note" data-note="unplanned">Not counted: extra moves to investing. {unplannedHistory(b.unplanned)}Any you make comes straight off this figure.</p> : null}
    </>
  );
}

function HaveSheet({ view }: { view: Snapshot }) {
  const { position } = view;
  const stmt = position.cash_parts.statement;
  const since = position.cash_parts.since;
  const covers = coverWord(view);
  const account = position.accounts[0]?.name ?? 'Bank';
  return (
    <>
      <h2>Have in bank</h2>
      <div className="sum">
        {stmt ? <><span>{account} statement</span><N>{inr(rupees(stmt.value))}</N></> : null}
        {since ? <><span>Less payments since then</span><N>{inr(Math.abs(rupees(since.value)))}</N></> : null}
        <span className="tot">{since ? 'Best estimate' : 'On your statement'}</span><N className="tot">{position.cash ? inr(rupees(position.cash.value)) : 'Not known yet'}</N>
      </div>
      <DoubtNote name="cash" />
      <p className="note">{covers}.{since ? ' These payments are not on a statement yet, so the figure is provisional and may shift a little.' : ''}</p>
      <CloseButton />
    </>
  );
}

function coverWord(view: Snapshot): string {
  const cash = f(view.position.cash);
  const due = f(view.forecast.due) ?? 0;
  if (cash == null) return 'Not known yet';
  return cash < due || view.forecast.shortfall?.active ? 'Less than bills before salary' : 'Covers bills before salary';
}

function OwnSheet({ view }: { view: Snapshot }) {
  const { close } = useSheet();
  const a = view.invest.assets;
  const fx = a?.fx ? a.fx.value / 1e6 : null;
  return (
    <>
      <h2>Own in assets</h2>
      <div className="sum">
        {a?.inr ? <><span>In India</span><N>{inr(rupees(a.inr.value))}</N></> : null}
        {a?.usd && fx ? <><span>Abroad, ${(a.usd.value / 100).toLocaleString('en-IN', { maximumFractionDigits: 0 })} at ₹{Math.round(fx)}{a.fx ? `, ${dayMonth(a.fx.as_of)}` : ''}</span><N>{inr((a.usd.value / 100) * fx)}</N></> : null}
        <span className="tot">Total</span><N className="tot">{a?.total ? inr(rupees(a.total.value)) : 'Not known yet'}</N>
      </div>
      <DoubtNote name="invest" />
      <p className="note">Markets move and there is nothing to act on here.</p>
      <Link className="close close-gap" to="invest">Open Invest</Link>
      <button className="close quiet" onClick={close}>Close</button>
    </>
  );
}

function OweSheet({ view }: { view: Snapshot }) {
  const { position } = view;
  const { close } = useSheet();
  const total = f(position.owed_total) ?? 0;
  return (
    <>
      <h2>Owe on cards</h2>
      {position.owed.map((c) => {
        const billed = f(c.statement);
        const paid = f(c.paid_not_posted);
        const since = f(c.since);
        return (
          <div className="sum" key={c.card}>
            <span className="tot">{c.label ?? c.card}</span><span className="tot">{!billedUnpaid(c) ? 'Nothing billed to pay' : c.due_date ? `Due ${dayLabel(c.due_date)}` : 'Due date not known'}</span>
            {billed != null ? <><span>Billed on your statement</span><N>{inr(billed)}</N></> : null}
            {since ? <><span>Not billed yet, an estimate</span><N>{inr(since)}</N></> : null}
            {since && c.since_estimate && c.since_estimate.high > c.since_estimate.low ? <><span>Could be, as messages miss {100 - Math.round(c.since_estimate.capture_bp / 100)}% of this card's spends</span><N>up to {inr(rupees(c.since_estimate.high))}</N></> : null}
            {paid ? <><span>{c.paid_inferred ? 'Looks paid from your bank: card wording and a close amount, not proven' : 'Paid from your bank, not on the card yet'}</span><N>{inr(paid)}</N></> : null}
            {c.may_be_paid ? <><span>A bank payment may be for this card</span><N>{inr(rupees(c.may_be_paid))}</N></> : null}
            {c.minimum_due ? <><span>Minimum due</span><N>{inr(rupees(c.minimum_due.value))}</N></> : null}
          </div>
        );
      })}
      {position.owed_split?.not_billed ? <div className="sum" data-note="owed-split"><span>Billed</span><N>{inr(rupees(position.owed_split.billed))}</N><span>Not billed yet, an estimate: charged since the statement, not in Bills</span><N>about {inr(rupees(position.owed_split.not_billed))}</N></div> : null}
      {position.owed_split?.not_billed ? <p className="note" data-note="owed-estimate">This comes from your messages. Fees and cashback may change this slightly.</p> : null}
      {position.payment_unmatched?.total ? <div className="sum"><span>Payment not yet matched to a card</span><N>{inr(rupees(position.payment_unmatched.total))}</N></div> : null}
      <div className="sum"><span className="tot">Total owed</span><N className="tot">{inr(total)}</N></div>
      <DoubtNote name="due" />
      <Link className="close close-gap" to="bills">Open Bills</Link>
      <button className="close quiet" onClick={close}>Close</button>
    </>
  );
}

/** The way through when under a cushion: the two figures, what could cover them, and nothing that moves money. */
function TopUpSheet({ view, s, soft, hard }: { view: Snapshot; s: HeroState; soft: number; hard: number }) {
  const gap = shortfall(s.m, { soft, hard });
  const when = dayMonth(view.forecast.month_end);
  const flat = view.reports.flatmates?.groups[0];
  const owedToMe = flat?.settle.find((x) => x.to === flat.self);
  const liquidHeld = (view.invest.holdings ?? []).filter((h) => h.liquid).reduce((t, h) => t + rupees(h.value.value), 0);
  return (
    <>
      <h2>Top up your cushion</h2>
      {gap.toHard > 0 ? <p>Move at least <N>{short(gap.toHard)}</N> into your bank by {when}. <N>{short(gap.toSoft)}</N> gets you back above your soft cushion.</p> : <p>Move <N>{short(gap.toSoft)}</N> into your bank by {when} to get back above your soft cushion.</p>}
      <h3 className="hd mt4">What could cover it</h3>
      <ul className="rows">
        {owedToMe ? <li><div className="r"><span>Flatmates owe you</span><N>{inr(rupees(owedToMe.amount))}</N></div></li> : null}
        {liquidHeld > 0 ? <li><div className="r"><span>Stocks and funds you could sell</span><N>{short(liquidHeld)}</N></div></li> : null}
        {!owedToMe && liquidHeld <= 0 ? <li><div className="r"><span>Nothing else shows in your data yet.</span></div></li> : null}
      </ul>
      <p className="note">This does not move any money.</p>
      <CloseButton />
    </>
  );
}

function PastSheet({ view }: { view: Snapshot }) {
  const so = view.position.month_so_far!;
  const out = rupees(so.money_out.value);
  const spent = rupees(view.spend.spent.value);
  return (
    <>
      <h2>All money out so far</h2>
      <div className="sum">
        <span>Started the month with</span><N>{so.start ? inr(rupees(so.start.value)) : 'Not known'}</N>
        <span>Money in</span><N>{inr(rupees(so.money_in.value), true)}</N>
        <span className="tot">Money out</span><N className="tot">{inr(out)}</N>
      </div>
      <p className="note">That is everything that left the bank: card bills, rent, investing and spending paid from the bank. Spend shows <N>{inr(spent)}</N> so far, counted when you bought, including on cards.</p>
      <Link className="close close-gap" to="spend">Open Spend</Link>
      <CloseButton />
    </>
  );
}

/** Out of money, said plainly: the one state the frozen hero bends for, by the owner's decision. SPEC section 3. */
function RunOut({ view }: { view: Snapshot }) {
  const short_ = view.forecast.shortfall!;
  const fail = short_.first_fail!;
  const p = heroParts(rupees(fail.short), 0);
  return (
    <section className="lead r3" data-kind="short" data-shortfall={fail.date}>
      <h1 className="l">{runOutWhen(short_.below_zero && short_.below_zero <= view.meta.as_of ? view.meta.as_of : fail.date, view.meta.as_of)}</h1>
      <div className="hero r3" data-step="r3" role="text">
        <span className="n e"><span className="r">₹</span>{p.amount}<span className="v"> short</span></span>
      </div>
      <div className="say-st">
        <span className="sc r3" data-step="r3" data-kind="short"><i className="m" aria-hidden="true" />{fail.label ?? fail.name} would fail{short_.below_zero && short_.below_zero <= view.meta.as_of && fail.date > view.meta.as_of ? ` on ${dayMonth(fail.date)}` : ''}.</span>
      </div>
      {view.forecast.pay_included?.late || view.forecast.before_salary?.salary?.late ? <p className="say-on" data-note="late">Your salary is late, so this does not count it.</p> : null}
      <p className="say-on"><Link to="plan" data-link="fix">See how to cover it</Link></p>
    </section>
  );
}

/** Under the hero, so a large figure never reads as money free to spend: what is above the soft cushion, and what that is a day. */
function PerDayNote({ view, s, soft }: { view: Snapshot; s: HeroState | null; soft: number }) {
  const fo = view.forecast;
  const line = perDayLine({ m: s ? s.m : null, soft, asOf: view.meta.as_of, date: fo.month_end, basis: fo.before_salary?.basis ?? null, early: !!s?.tooWide && s.m >= soft });
  return <p className="say-day" data-note="per-day" data-kind={line.kind}>{line.text}</p>;
}

function Hero({ view, s, plans }: { view: Snapshot; s: HeroState | null; plans: { title: string; amount: number }[] }) {
  const { open } = useSheet();
  const { settings } = useStore();
  const fo = view.forecast;
  const when = `Likely left on ${dayMonth(fo.month_end)}`;
  if (fo.shortfall?.active && fo.shortfall.first_fail) return <RunOut view={view} />;
  const cal = <CalIcon text={String(dateParts(fo.month_end).d)} label={`On ${dayMonth(fo.month_end)}`} big />;
  if (!s) {
    return (
      <section className="lead" data-kind="none">
        <h1 className="l">{when}</h1>
        <p className="say-none">Not enough history yet</p>
        <PerDayNote view={view} s={null} soft={settings.soft} />
      </section>
    );
  }
  const p = heroParts(s.m, s.h);
  const band = s.kind === 'sell';
  const say = todaySays(s.kind, s.m, settings);
  const early = s.tooWide && s.kind === 'just';
  const heroClass = band ? 'r3' : s.step === 'r1' ? 'r1' : s.earned ?? '';
  const figure = <>{p.neg ? '−' : ''}<span className="r">₹</span>{p.amount}</>;
  const chip = s.earned ? <Chip step={s.earned === 'g2' ? 'g2' : 'g1'} kind={s.kind}>Far above your usual balance</Chip>
    : band ? <span className="sc r3" data-step="r3" data-kind={s.kind}><i className="m" aria-hidden="true" />{say.words}<span className="u-rule">{say.yardstick}</span></span>
    : s.step === 'r1' ? <span className="sc r1" data-step="r1" data-kind={s.kind}><i className="m" aria-hidden="true" />{say.words}<span className="u-rule">{say.yardstick}</span></span>
    : early ? <span className="sc plain" data-step="n" data-kind="early"><b className="ink">Too early to tell</b></span>
    : <span className="sc plain" data-step="n" data-kind={s.kind}><b className="ink">{say.words}<span className="u-rule">{say.yardstick}</span></b></span>;
  return (
    <section className={`lead${band ? ' r3' : ''}`} data-kind={s.kind}>
      <h1 className="l">Likely left</h1>
      <button className={`hero ${heroClass}`} data-step={s.step} aria-label={`${fc(s.m, s.tooWide ? 0 : s.h)} likely left on ${dayMonth(fo.month_end)}. Show how this is worked out.`} onClick={() => open(<WhySheet view={view} s={s} plans={plans} />, 'How this is worked out')}>
        <span className="n e">
          {markerOn(s) ? <span className="hl">{figure}</span> : figure}{cal}
          {p.range && !s.tooWide ? <span className="rg">{p.range}</span> : null}
        </span>
      </button>
      <div className="say-st">{chip}</div>
      {early ? null : <PerDayNote view={view} s={s} soft={settings.soft} />}
      <DoubtNote name="likely_left" />
      {fo.pay_included?.late || fo.before_salary?.salary?.late ? <p className="note" data-note="late">Your salary is late, so this does not count it.</p> : null}
      {s.h > 0 && !s.tooWide ? <StillTesting /> : null}
    </section>
  );
}

const billedUnpaid = (c: Snapshot['position']['owed'][number]): boolean => (c.owed_split ? c.owed_split.billed > 0 : (c.statement?.value ?? 0) + Math.min(c.since?.value ?? 0, 0) - (c.paid_not_posted?.value ?? 0) > 0);

function Position({ view }: { view: Snapshot }) {
  const { open } = useSheet();
  const { position, invest, forecast } = view;
  const cash = f(position.cash);
  const owed = f(position.owed_total);
  const due = f(forecast.due) ?? 0;
  const unpaid = position.owed.filter(billedUnpaid); // Only what a statement billed and nothing has paid can be due or overdue: not charges since, nor a bill the bank paid.
  const lowCash = cash != null && (cash < due || !!forecast.shortfall?.active); // The walk knows what fails; the total alone can read as covered above "would fail".
  const oweBad = owed != null && ((cash != null && owed > cash) || unpaid.some((c) => c.due_date && c.due_date < view.meta.as_of));
  const nextDue = unpaid.map((c) => c.due_date).filter((d): d is string => !!d).sort()[0];
  const total = f(invest.assets?.total);
  const unpriced = invest.value_status.unpriced > 0;
  const owedCount = invest.holdings == null || invest.holdings.length === 0;
  return (
    <section className="pos" aria-labelledby="pos-h">
      <h2 className="hd" id="pos-h">Where you stand</h2>
      <button className={lowCash ? 'crit' : ''} onClick={() => open(<HaveSheet view={view} />, 'Have in bank')} data-row="have">
        <span className="bar" />
        <span className="icr"><UiIco name="have" /><NameChip name="Have in bank" chip={lowCash ? <Chip step="r2">Less than bills</Chip> : null} /><small className="chipline"><DoubtTag name="cash" fallback={position.cash_parts.since ? 'provisional' : null} /></small></span>
        <span>{cash == null ? <span className="sc quiet">Not known yet</span> : <N>{inr(cash)}</N>}</span>
      </button>
      {owed == null ? (
        <div className="pos-row" data-row="owe"><span className="bar" /><span className="icr"><UiIco name="owe" /><b>Owe on cards</b><small className="chipline"><DoubtTag name="due" /><span className="sc quiet">No card statement yet</span></small></span><span><span className="sc quiet">Hidden, not zero</span></span></div>
      ) : (
        <button className={oweBad ? 'crit' : ''} data-row="owe" onClick={() => open(<OweSheet view={view} />, 'Owe on cards')}>
          <span className="bar" />
          <span className="icr"><UiIco name="owe" /><NameChip name="Owe on cards" chip={oweBad ? <Chip step="r2">{cash != null && owed > cash ? 'More than cash today' : 'Overdue'}</Chip> : null} /><small className="chipline"><DoubtTag name="due" />{oweBad ? (nextDue ? <span className="sc plain">Due {dayMonth(nextDue)}</span> : null) : <span className="sc plain">{nextDue ? `Due ${dayMonth(nextDue)}. ` : ''}{cash ? `${Math.round((owed / cash) * 100)}% of cash` : ''}</span>}{position.owed_split?.not_billed ? <span className="sc quiet" data-note="not-billed">About {inr(rupees(position.owed_split.not_billed))} not billed yet</span> : null}</small></span>
          <span><N>{inr(owed)}</N></span>
        </button>
      )}
      {owedCount ? null : total == null || unpriced ? (
        <div className="pos-row none" data-row="own"><span className="bar" /><span className="icr"><UiIco name="own" /><b>Own in assets</b><small className="chipline"><span className="sc quiet">{unpriced ? 'Some holdings have no price or rate' : 'Not known yet'}</span></small></span><span /></div>
      ) : (
        <button className="none" onClick={() => open(<OwnSheet view={view} />, 'Own in assets')} data-row="own">
          <span className="bar" />
          <span className="icr"><UiIco name="own" /><b>Own in assets</b><small className="chipline"><DoubtTag name="invest" /></small></span>
          <span><N>{inr(total)}</N></span>
        </button>
      )}
    </section>
  );
}

function Chores({ view, s, soft, hard }: { view: Snapshot; s: HeroState | null; soft: number; hard: number }) {
  const day = dateParts(view.meta.as_of).d;
  if (!inChoresWindow(day)) return null;
  const cash = f(view.position.cash);
  const queue = view.payees.review.items;
  const flat = view.reports.flatmates?.groups[0];
  const settle = flat?.settle.find((x) => x.to === flat.self || x.from === flat.self);
  const { open } = useSheet();
  const under = s ? s.m < hard : false;
  const gap = s ? shortfall(s.m, { soft, hard }) : { toHard: 0, toSoft: 0 };
  const need = under ? gap.toHard : gap.toSoft;
  const rows: ReactNode[] = [];
  if (need > 0) {
    rows.push(
      <button key="top" onClick={() => open(<TopUpSheet view={view} s={s!} soft={soft} hard={hard} />, 'Top up your cushion')}>
        <i className="t" aria-hidden="true" />
        <span><b>Top up your cushion</b><small>Against your {short(under ? hard : soft)} {under ? 'hard' : 'soft'} cushion</small></span>
        <N>{short(need)}</N>
      </button>,
    );
  }
  if (queue.length) {
    const total = queue.reduce((t, q) => t + rupees(q.month_total.value), 0);
    rows.push(
      <Link key="name" to="names?from=today">
        <i className="t" aria-hidden="true" />
        <span><b>Name {queue.length} {queue.length === 1 ? 'payee' : 'payees'}</b><small>{inr(total)} this month has no name</small></span>
        <span />
      </Link>,
    );
  }
  if (settle) {
    rows.push(
      <Link key="flat" to="flatmates">
        <i className="t" aria-hidden="true" />
        <span><b>Send the split</b><small>{settle.to === flat?.self ? `${settle.from} owes you` : `You owe ${settle.to}`}</small></span>
        <N>{inr(rupees(settle.amount))}</N>
      </Link>,
    );
  }
  if (cash == null && !rows.length) return null;
  if (!rows.length) return null;
  return (
    <section className="chores" aria-label="Still to do">
      <h2>Before the month turns</h2>
      {rows}
    </section>
  );
}

/** A row's figure, with its range under it: the range is too long to sit beside a name at 360 px. */
function Ranged({ amount, range, plain }: { amount: number; range: { low: number; high: number } | null; plain?: boolean }) {
  return <span className="ranged"><N>{range || plain ? short(amount) : inr(amount)}</N>{range ? <small>{usually(range.low, range.high)}</small> : null}</span>;
}

function dueRow(i: Item, asOf: string): { sub: ReactNode; to: string } {
  const due = i.due_date ?? i.date;
  const late = dayDiff(asOf, due);
  const to = i.kind === 'sip' ? 'invest' : i.kind === 'card_bill' || i.kind === 'card_bill_estimate' ? cardRoute(i.account) : 'bills';
  if (late > 0) return { sub: <span className="chipline"><Chip step={late >= 7 ? 'r3' : 'r2'}>{late} {late === 1 ? 'day' : 'days'} late</Chip></span>, to };
  const left = -late;
  const p = dateParts(due);
  return { sub: left > 0 && left <= 3 ? `${p.wd} ${p.d}, in ${left} ${left === 1 ? 'day' : 'days'}` : dayLabel(due), to };
}

const fold = (x: string): string => x.toLowerCase().replace(/[^a-z0-9]/g, '');

/** Where a likely bill that is not a card bill opens: a share back opens Flatmates, rent and other fixed costs open their own payments. */
export function likelyBillHref(view: Snapshot, item: { kind: string; name: string }): string | null {
  if (item.kind === 'flatmates_back') return view.reports.flatmates ? 'flatmates' : null;
  const rows = view.spend.allocation?.fixed.rows ?? [];
  const row = item.kind === 'rent'
    ? rows.filter((r) => r.category === 'Housing:Rent').sort((a, b) => b.date.localeCompare(a.date))[0]
    : rows.find((r) => fold(r.name) === fold(item.name));
  return drillHref({ by: 'fixed', period: 'all', open: row ? payeeHash(row.name) : null });
}

function Line({ view, s, soft, hard, plans }: { view: Snapshot; s: HeroState | null; soft: number; hard: number; plans: { id: string; title: string; amount: number; date: string; paid: boolean }[] }) {
  const { open } = useSheet();
  const fo = view.forecast;
  const asOf = view.meta.as_of;
  const cash = f(view.position.cash);
  if (cash == null) return null; // No fake start: the Line needs a real balance.
  const p = dateParts(asOf);
  const rows: StopRow[] = [];
  const sofar = view.position.month_so_far;
  const start = sofar?.start ? rupees(sofar.start.value) : cash;
  const moved = fo.before_salary ? rupees(fo.before_salary.moved_so_far.total) : 0;
  if (sofar?.start && p.d > 1) {
    const drop = start - cash - moved;
    if (moved > 0) rows.push({ key: 'moved', t: 'past', invest: true, minH: rowMin('past'), lo: start - moved, hi: start - moved, children: <span className="r-inv"><span><b>To investing, 1 to {p.d - 1} {MONTHS[p.m]}</b></span><span><N>{inr(-moved, true)}</N></span></span> });
    rows.push({
      key: 'past',
      t: 'past',
      minH: rowMin('past'),
      lo: cash,
      hi: cash,
      children: <button onClick={() => open(<PastSheet view={view} />, 'All money out so far')}><span><b>{moved > 0 ? 'Other money out' : 'All money out'}, 1 to {p.d - 1} {MONTHS[p.m]}</b></span><span><N>{inr(-drop, true)}</N></span></button>,
    });
  }
  const under = s && s.kind === 'sell' ? 'Under hard cushion' : s && s.kind === 'dip' ? 'Under soft cushion' : null;
  rows.push({ key: 'today', t: 'today', minH: rowMin('today'), lo: cash, hi: cash, children: <><span><b>Today</b>{under ? <small><span className="word">{under}</span></small> : null}</span><span><N>{inr(cash)}</N></span></> });

  type Out = { key: string; date: string; amount: number; h: number; range?: { low: number; high: number } | null; name: string; sub: ReactNode; to: string; invest: boolean; icon: Parameters<typeof Ico>[0]['q']; w: RowKind; plan?: boolean; salary?: boolean; flat?: boolean };
  const lateChip = (late: number) => (late > 0 ? <span className="chipline"><Chip step={late >= 7 ? 'r3' : 'r2'}>{late} {late === 1 ? 'day' : 'days'} late</Chip></span> : null);
  const weightOf = (g: LineGroup): RowKind => (g === 'rent' ? 'rent' : g === 'cards' ? 'cards' : g === 'invest' ? 'invest' : g === 'subs' ? 'subs' : 'bills');
  const outs: Out[] = [];
  const projected: Projected<Item>[] = [];
  fo.due_items.forEach((i, n) => {
    const range = usualOf(i.amount);
    const h = range ? (range.high - range.low) / 2 : 0;
    if (i.key == null) { projected.push({ item: i, group: groupOf(i.kind, i.category), date: i.date, amount: rupees(i.amount.value), h, range }); return; }
    const d = dueRow(i, asOf); // A payment that happened stays its own row. Only lateness is said; the rest is on Bills.
    outs.push({ key: `d${n}`, date: i.date, amount: rupees(i.amount.value), h, range, name: i.name, sub: lateChip(dayDiff(asOf, i.due_date ?? i.date)), to: d.to, invest: i.kind === 'sip', icon: { name: i.name, group: i.category ?? i.group, brand: i.brand }, w: weightOf(groupOf(i.kind, i.category)) });
  });
  // Projections are coarse on Today: one row per kind, its total, and a tap to where each one is listed.
  rollUp(projected).forEach((g) => {
    const one = g.items.length === 1 ? g.items[0] : null;
    const late = Math.max(0, ...g.items.map((i) => dayDiff(asOf, i.due_date ?? i.date)));
    const to = one ? dueRow(one, asOf).to : g.group === 'invest' ? 'invest' : 'bills';
    outs.push({ key: `g-${g.group}`, date: g.date, amount: g.amount, h: g.h, range: g.range, name: g.label, sub: lateChip(late), to, invest: g.group === 'invest', icon: GROUP_ICON[g.group], w: weightOf(g.group) });
  });
  // A plan is the one row that keeps its words: it is the owner's own, and nothing has moved for it.
  plans.forEach((pl) => outs.push({ key: pl.id, date: pl.date, amount: pl.amount, h: 0, name: pl.title, sub: <><Tag>Plan</Tag>One-off you planned for {monthLong(asOf.slice(0, 7))}. {pl.paid ? 'Part paid.' : 'Not paid yet.'}</>, to: 'plan', invest: false, icon: { name: pl.title }, w: 'plan', plan: true }));
  if (fo.pay_included && !fo.pay_included.late) outs.push({ key: 'payin', date: fo.pay_included.date, amount: -rupees(fo.pay_included.amount.value), h: 0, name: 'Salary', sub: dayLabel(fo.pay_included.date), to: '', invest: false, icon: { name: 'Salary' }, w: 'salary', salary: true });
  const unmatched = fo.payment_unmatched ? rupees(fo.payment_unmatched.total) : 0;
  if (unmatched > 0) outs.push({ key: 'unmatched', date: asOf, amount: -unmatched, h: 0, name: 'Payment not yet matched to a card', sub: null, to: 'bills', invest: false, icon: { name: 'Card' }, w: 'other', flat: true });
  outs.sort((a, b) => a.date.localeCompare(b.date));
  const usual = f(fo.usual_spend);
  const usualRange = usualOf(fo.usual_spend);
  if (usual && usual > 0) outs.push({ key: 'everyday', date: fo.month_end, amount: usual, h: usualRange ? (usualRange.high - usualRange.low) / 2 : sp(fo.usual_spend), range: usualRange, name: 'Everyday spending', sub: null, to: 'spend', invest: false, icon: { name: 'Everyday spending' }, w: 'everyday' });

  const endM = s ? s.m : outs.reduce((t, o) => t - o.amount, cash);
  const endH = s ? s.h : 0;
  const totalVar = outs.reduce((t, o) => t + o.h * o.h, 0) || 1;
  let running = cash;
  let v = 0;
  const drawn = outs.reduce((t, o) => t + o.amount, 0);
  const rounding = outs.length ? (cash - drawn - endM) / Math.max(1, outs.length) : 0;
  outs.forEach((o) => {
    running -= o.amount - rounding;
    v += o.h * o.h;
    const hw = endH * Math.sqrt(v / totalVar);
    const inner = (
      <>
        <span className="icr"><Ico q={o.icon} /><b>{o.name}</b>{o.sub ? <small>{o.sub}</small> : null}</span>
        <span>{o.salary || o.flat ? <N>{inr(-o.amount, true)}</N> : <Ranged amount={o.amount} range={o.range ?? null} />}</span>
      </>
    );
    rows.push({ key: o.key, minH: rowMin(o.w), lo: running - hw, hi: running + hw, invest: o.invest, flat: o.flat, className: o.salary ? 'in' : undefined, children: o.to ? <Link to={o.to}>{inner}</Link> : inner });
  });
  const fill = s?.kind === 'sell';
  const warn = s?.step === 'r1';
  const showHl = s ? markerOn(s) : false;
  rows.push({
    key: 'end',
    end: true,
    minH: rowMin('end'),
    lo: endM - endH,
    hi: endM + endH,
    className: fill ? 'fill' : warn ? 'warn' : undefined,
    children: (
      <>
        <span><b>Likely left</b><small><DoubtTag name="likely_left" />{dayLabel(fo.month_end)}</small>{s && s.h > 0 && !s.tooWide ? <StillTesting /> : null}</span>
        {s ? <span className="n ranged">{showHl ? <span className="hl">{fc(s.m, 0)}</span> : fc(s.m, 0)}{s.h > 0 ? <small>{s.tooWide ? 'too early to tell' : heroParts(s.m, s.h).range}</small> : null}</span> : <span className="sc quiet">Not enough history yet</span>}
      </>
    ),
  });
  const ns = fo.next_salary;
  if (ns) {
    const amt = rupees(ns.amount.value);
    rows.push({ key: 'salary', minH: rowMin('salary'), lo: endM - endH + amt, hi: endM + endH + amt, className: 'in', children: <><span className="icr"><Ico q={{ name: 'Salary' }} /><b>Salary</b><small>{ns.late ? `${dayLabel(ns.date)}, expected` : dayLabel(ns.date)}</small></span><span><N>{inr(amt, true)}</N></span></> });
  }
  const lb = fo.likely_bills;
  if (ns && lb && lb.items.length) {
    const amt = rupees(ns.amount.value);
    let bal = endM + amt;
    let v2 = endH * endH;
    rows.push({ key: 'lb-head', minH: rowMin('head'), lo: bal - endH, hi: bal + endH, className: 'group', children: <span className="grp"><b>Likely bills next month, after salary</b></span> });
    type LB = (typeof lb.items)[number];
    const fixedRows = view.spend.allocation?.fixed.rows ?? [];
    const categoryOf = (item: LB) => fixedRows.find((r) => fold(r.name) === fold(item.name))?.category ?? null;
    const draw = (key: string, value: number, size: number, back: boolean, inner: ReactNode, to: string | null, w: RowKind) => {
      bal -= value;
      v2 += size * size;
      const hw = Math.sqrt(v2);
      rows.push({ key, minH: rowMin(w), lo: bal - hw, hi: bal + hw, flat: back, children: to ? <Link to={to}>{inner}</Link> : inner });
    };
    const projectedLb: Projected<LB>[] = [];
    const backs: LB[] = [];
    lb.items.forEach((item) => {
      if (item.kind === 'flatmates_back') { backs.push(item); return; }
      const range = usualOf(item.amount);
      projectedLb.push({ item, group: groupOf(item.kind, categoryOf(item)), date: item.date, amount: rupees(item.amount.value), h: range ? (range.high - range.low) / 2 : 0, range });
    });
    const drawBacks = () => backs.splice(0).forEach((item, k) => {
      const value = rupees(item.amount.value);
      const range = usualOf(item.amount);
      const inner = <><span className="icr"><Ico q={{ name: item.name, group: 'Housing', brand: item.brand }} /><b>{item.name}</b></span><span><span className="ranged"><N>{inr(-value, true)}</N>{range ? <small>{usually(-range.high, -range.low)}</small> : null}</span></span></>;
      draw(`lb-back${k}`, value, range ? (range.high - range.low) / 2 : 0, true, inner, likelyBillHref(view, item), 'back');
    });
    rollUp(projectedLb).forEach((g) => {
      const one = g.items.length === 1 ? g.items[0] : null;
      const to = one ? (one.kind.startsWith('card') ? cardRoute(one.card) : likelyBillHref(view, one))
        : g.group === 'cards' ? 'bills' : g.group === 'rent' ? likelyBillHref(view, g.items[0]) : drillHref({ by: 'fixed', period: 'all', open: null });
      const inner = <><span className="icr"><Ico q={GROUP_ICON[g.group]} /><b>{g.label}</b></span><span><Ranged amount={g.amount} range={g.range} /></span></>;
      draw(`lb-${g.group}`, g.amount, g.h, false, inner, to, weightOf(g.group));
      if (g.group === 'rent') drawBacks(); // A share back sits beside the rent it comes back for.
    });
    drawBacks();
    const after = rupees(lb.left.value);
    const afterRange = usualOf(lb.left);
    rows.push({ key: 'lb-end', minH: rowMin('after'), lo: afterRange?.low ?? after, hi: afterRange?.high ?? after, className: 'after-end', children: <><span><b>Likely left after salary and bills</b><small><Tag>Estimate</Tag>Before other spending after salary</small></span><span className="n ranged">{fc(after, 0)}{afterRange ? <small>{usually(afterRange.low, afterRange.high)}</small> : null}</span></> });
  }
  const outgo = view.plan_inputs.year.outgo ? rupees(view.plan_inputs.year.outgo) : Math.max(cash, soft * 3);
  const scale = Math.max(outgo * 1.125, soft * 2.5);
  const earned = !!s?.earned;
  const withBills = !!(lb && ns && lb.items.length);
  const rule = lb?.cards_within_days != null ? `You usually pay card bills within ${lb.cards_within_days} ${lb.cards_within_days === 1 ? 'day' : 'days'} of salary.` : 'After your salary.';
  // The notes that sat under the column, behind its (i): what green means, what the figure leaves out, how to read the column.
  const notes = (
    <>
      <p className="note">{lineCaption({ rows, start, scale, soft, hard })}</p>
      {earned ? <p className="note">Green because even the low end beats 10 of your last 12 balances before salary.</p> : null}
      <NotCounted view={view} />
      {withBills ? <p className="note" data-note="likely-bills">Likely bills next month run to {dayMonth(lb!.end)}. {rule} {LIKELY_BILLS_HONEST}</p> : null}
    </>
  );
  return (
    <section className="tl" aria-labelledby="tl-h">
      <h2 className="wrap" id="tl-h">Timeline<InfoButton title="Reading the Timeline" label="How to read the Timeline">{notes}</InfoButton></h2>
      <Stops rows={rows} start={start} scale={scale} soft={soft} hard={hard} earned={earned} />
    </section>
  );
}

/** "Housing, Shopping and Travel". */
const andList = (xs: string[]): string => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} and ${xs[xs.length - 1]}`);

/**
 * Each group against its own usual, on its own scale: the centre is the group's median by this day, the band one of its own ± either side.
 * Only groups off their usual are drawn; the rest are one line.
 */
function Variability({ view }: { view: Snapshot }) {
  const groups = view.spend.groups.filter((g) => g.name !== 'Uncategorized');
  if (!groups.length) return null;
  const day = view.spend.day;
  const items = groups.map((g) => {
    const band = g.usual;
    return { name: g.name, now: rupees(g.spent.value), step: (band?.step ?? 'n') as Ladder, med: band ? rupees(band.median) : null, spread: band ? rupees(band.spread) : null, n: band?.n ?? 0 };
  }).sort((a, b) => b.now - a.now);
  const off = items.filter((i) => i.step !== 'n' && i.med != null && i.spread != null);
  const usual = items.filter((i) => !off.includes(i) && i.med != null).map((i) => i.name);
  const unknown = items.filter((i) => !off.includes(i) && i.med == null).map((i) => i.name);
  const top = off.find((i) => i.step[0] === 'r');
  const low = off.find((i) => i.step[0] === 'g');
  const months = Math.max(0, ...items.map((i) => i.n));
  const how = (
    <>
      <p>Each group's spending so far is compared with the same first {day} {day === 1 ? 'day' : 'days'} in {months ? `your earlier ${months} months` : 'earlier months'}.</p>
      <p>The line in the middle is your usual (the median). The shaded band is one usual spread either side. Each group is on its own scale, so a small group and rent read the same way.</p>
      <p><span className="k">Above</span> means more than one spread over usual and at least ₹2,000 more; <span className="k">Below</span> the same under. Groups inside their band are listed as within usual and not drawn.</p>
    </>
  );
  const info = <InfoButton title={top ? 'How “running high” is decided' : 'How usual is decided'}>{how}</InfoButton>;
  return (
    <section className="sec vz" data-vz>
      <h2>
        {top ? <>{top.name} is <span className="nw"><span className="u-hand u-bad">running high</span>{info}</span></>
          : low ? <>{low.name} is <span className="nw"><span className="u-hand u-good">running low</span>{info}</span></>
          : <>Everything is near your <span className="nw">usual{info}</span></>}
      </h2>
      <DoubtNote name="spend" unlessSameAs="likely_left" />
      {off.map((i) => {
        const sc = groupScale(i.now, i.med!, i.spread!);
        return (
          <Link key={i.name} to={`spend?group=${encodeURIComponent(i.name)}`} className="strip" aria-label={`${i.name}, ${inr(i.now)}, ${LADDER_WORD[i.step]}`} data-at={sc.at}>
            <span className="row">
              <b className="icb"><Ico q={{ name: i.name, group: i.name }} />{i.name}</b>
              <span className="val">{i.step !== 'n' ? <Chip step={i.step}>{ladderChip(i.step)}</Chip> : null} <N>{inr(i.now)}</N></span>
            </span>
            <span className="vz-track" aria-hidden="true"><i className="vz-band" /><i className="vz-mid" /><i className="vz-now" data-step={i.step} style={{ left: `${sc.at}%` }} /></span>
            <span className="vz-ends" aria-hidden="true"><span>Less than usual</span><span>Usual</span><span>More</span></span>
            <small className="vz-say"><Stat value={shortK1(sc.gap, true)} period={String(day)} periodLabel={`First ${day} ${day === 1 ? 'day' : 'days'}`} tag={`${sc.gap >= 0 ? 'over' : 'under'} a usual ${shortK1(i.med!)}`} /></small>
          </Link>
        );
      })}
      {usual.length || unknown.length ? (
        <p className="vz-rest" data-rest>
          {usual.length ? <>{andList(usual)}: {off.length ? 'within usual' : 'all within usual'}.</> : null}
          {usual.length && unknown.length ? ' ' : null}
          {unknown.length ? <>{andList(unknown)}: no usual yet.</> : null}
        </p>
      ) : null}
    </section>
  );
}

const TREND_STATUS: Record<'up' | 'down' | 'held', StatStatus> = { up: 'above', down: 'below', held: 'usual' };

/** Spending lately against before: one folded row, its working behind an (i), the month bars when opened. */
function Trend({ view }: { view: Snapshot }) {
  const [openB, setOpen] = useState(false);
  const [read, setRead] = useState<ReactNode>(null);
  const done = view.spend.months.filter((m) => m.complete && m.spent);
  const history = done.map((m) => rupees(m.spent!.value));
  const t = spendingTrend(done.map((m) => ({ month: m.month, spent: rupees(m.spent!.value) })));
  const usual = medianSpread(history);
  const fcst = f(view.spend.month_end_forecast);
  const spent = rupees(view.spend.spent.value);
  const enough = history.length >= THIN_MONTHS && usual;
  const last = view.spend.months.filter((m) => m.spent && m.month !== view.spend.month).slice(-11);
  const steps = last.map((m) => (enough ? ladder(rupees(m.spent!.value), usual!.median, usual!.spread, 2000) : 'n'));
  const markSlots = new Set<number>();
  last.map((m, i) => ({ i, v: rupees(m.spent!.value), st: steps[i] })).filter((o) => o.st !== 'n').sort((a, b) => b.v - a.v).forEach((o) => {
    if (o.i < last.length - 4 && [...markSlots].every((k) => Math.abs(k - o.i) >= 3)) markSlots.add(o.i);
  });
  const bars: Bar[] = last.map((m, i) => {
    const v = rupees(m.spent!.value);
    const st = steps[i];
    return { label: MONTHS[Number(m.month.split('-')[1]) - 1][0], value: v, step: st, mark: markSlots.has(i) ? short(v) : undefined, read: <><b>{monthLong(m.month)}: {inr(v)}</b>{st !== 'n' ? `. ${LADDER_WORD[st]}.` : '.'} <Link className="tlink" to={drillHref({ by: 'all', period: m.month })} data-see-all aria-label={`See all of ${monthLong(m.month)}`}>See all</Link></> };
  });
  const cur = view.spend.month;
  bars.push({ label: MONTHS[Number(cur.split('-')[1]) - 1][0], value: spent, now: true, hi: fcst ?? undefined, mark: fcst ? fc(fcst, usual?.spread ?? 0, true) : undefined, read: <><b>{monthLong(cur)} so far: {inr(spent)}</b>{fcst ? `. Likely ${fc(fcst, usual?.spread ?? 0, true)} by month end.` : '.'} <Link className="tlink" to={drillHref({ by: 'all', period: cur })} data-see-all aria-label={`See all of ${monthLong(cur)}`}>See all</Link></> });
  const named = (want: Ladder[], word: string) => last.filter((_, i) => want.includes(steps[i])).map((m) => monthLong(m.month)).join(' and ') + word;
  const hi = last.some((_, i) => steps[i] === 'r2' || steps[i] === 'r3');
  const top = last.some((_, i) => steps[i] === 'r1');
  const lo = last.some((_, i) => steps[i][0] === 'g');
  const sentence = [hi ? named(['r2', 'r3'], ' ran above your usual') : '', top ? named(['r1'], ' near the top') : '', lo ? named(['g1', 'g2'], ' below') : ''].filter(Boolean).join(', ');
  const headline = t ? (t.dir === 'up' ? `Spending is up: about ${short(t.lately)} a month lately, from ${short(t.from)}` : t.dir === 'down' ? `Spending is down: about ${short(t.lately)} a month lately, from ${short(t.from)}` : `Spending has held: about ${short(t.lately)} a month lately, against ${short(t.from)} before`) : null;
  const working = t ? (
    <>
      <p className="k" data-headline>{headline}.</p>
      <dl>
        {t.recent.map((m) => <Fragment key={m.month}><dt>{monthLong(m.month)}</dt><dd>{inr(m.spent)}</dd></Fragment>)}
        <dt className="k">Last 3 months, average</dt><dd className="k">{inr(t.lately)}</dd>
        <dt>The {t.before.length} months before, median</dt><dd>{inr(t.from)}</dd>
      </dl>
      <p>Each month is what Spend counts for it. {t.dir === 'held' ? 'Lately is within one usual spread of before, so it has held.' : `Lately is more than one usual spread ${t.dir === 'up' ? 'above' : 'below'} before, and at least ₹2,000 ${t.dir === 'up' ? 'more' : 'less'}.`}</p>
      <p>A median of every month would hide a change that started in the last three, so lately and before are kept apart.</p>
    </>
  ) : null;
  const title = t
    ? <Stat value={short(t.lately)} period="3M" periodLabel="A month, last 3 months" status={TREND_STATUS[t.dir]} tag={`a month, from ${short(t.from)}`} testid="trend" />
    : 'Spending, month by month';
  return (
    <>
      <div className="fold" data-fold="trend" data-open={openB || undefined}>
        <FoldRow title={title} heading={false} testid="trend" onClick={() => setOpen((o) => !o)} />
        {working ? <span className="fold-i"><InfoButton title="How this is worked out" label="How the spending figure is worked out">{working}</InfoButton></span> : null}
      </div>
      {openB ? (
        <section className="sec" data-trend aria-label={headline ?? 'Spending, month by month'}>
          {sentence ? <p>{sentence}.</p> : <p>Each bar is one month. The last is this month so far.</p>}
          <Bars bars={bars} label={`Monthly spending for the last ${bars.length} months. Tap a month to read it.`} onRead={setRead} />
          <Read text={read} />
        </section>
      ) : null}
    </>
  );
}

/** The year's tiles, folded to a row; its notes behind an (i). */
function Year({ view }: { view: Snapshot }) {
  const [openY, setOpen] = useState(false);
  const putNone = view.invest.put_in_source?.state === 'none' && !view.invest.contributions.length;
  const reading = (
    <>
      <p>Tap a month to see its days.</p>
      <p>Grey and blue get stronger with more money. Red and green appear only when a month leaves your usual. A ring marks this month so far.</p>
      {!putNone && view.invest.put_in_source ? <p data-note="put-in-basis">{view.invest.put_in_source.basis}</p> : null}
      {putNone ? null : <VestsNote view={view} />}
    </>
  );
  return (
    <>
      <div className="fold" data-fold="year" data-open={openY || undefined}>
        <FoldRow title="Your year, month by month" heading={false} testid="year" onClick={() => setOpen((o) => !o)} />
        <span className="fold-i"><InfoButton title="Reading the year" label="How to read the year">{reading}</InfoButton></span>
      </div>
      {openY ? (
        <section className="sec" id="year" aria-label="Your year, month by month">
          <div className="lbl">Spent</div>
          <MonthTiles tiles={monthTiles(view)} toMonth={(ym) => `spend/month?m=${ym}`} />
          <div className="lbl">Put in</div>
          {putNone
            ? <p className="note" data-note="put-in-none">Not known yet: no bank statement reaches back far enough to see what you put in. Add a bank statement, or connect your holdings on <Link to="sources">Sources</Link>.</p>
            : <MonthTiles tiles={investTiles(view)} toMonth={() => 'invest/year'} />}
        </section>
      ) : null}
    </>
  );
}

/** Gate reasons are fixed text. The owner decided the word SMS does not show. */
export { plainReason };

/** "How sure these figures are": one row, its sheet opening on the date and when the numbers were built. */
function TrustRow({ view, updated }: { view: Snapshot; updated: string }) {
  const show = useInfo();
  return <FoldRow title="How sure these figures are" heading={false} testid="trust" onClick={() => show('How sure these figures are', <><p className="k" data-updated>{updated}</p><TrustNote view={view} /></>)} />;
}

function TrustNote({ view }: { view: Snapshot }) {
  const pct = statementShare(view);
  const month = monthLong(view.spend.month);
  const warn = view.health.gates.filter((g) => !g.ok && g.level === 'warn' && g.reason);
  const invest = view.invest.value_status;
  return (
    <div className="trust" data-trust>
      {pct == null ? (
        <p className="note">Nothing has been spent yet this month, so there is nothing to confirm. A range under a figure: {rangeLabel(view)}.</p>
      ) : (
        <>
          <p className="note"><Hl>{pct}%</Hl> of {month} is on a bank statement.{pct < 100 ? ' The rest may change.' : ''} A range under a figure: {rangeLabel(view)}.</p>
          {pct < 100 ? <Link className="tlink" to="spend?only=unconfirmed">See what is not confirmed</Link> : <p className="note">Nothing is waiting to be confirmed.</p>}
        </>
      )}
      {view.health.out_of_scope.length ? <p className="note">Accounts you no longer use stay listed and are not counted as gaps: {view.health.out_of_scope.join(', ')}.</p> : null}
      {invest.state === 'stale' && invest.price_as_of ? <p className="note">Stock prices are from {dayMonth(invest.price_as_of)}.</p> : null}
      {warn.length ? (
        <details className="aslist">
          <summary>{warn.length === 1 ? 'One thing to know about this data' : `${warn.length} things to know about this data`}</summary>
          <ul className="rows bar" data-warnings={warn.length}>
            {warn.map((g) => <li key={g.id}><div className="r"><span>{plainReason(g.reason ?? '')}</span></div></li>)}
          </ul>
        </details>
      ) : null}
    </div>
  );
}

export function Today() {
  const wide = useWide();
  const { settings, builtMs, stale, plans } = useStore();
  const view = useView();
  const { soft, hard } = settings;
  const asOf = view.meta.as_of;
  const month = asOf.slice(0, 7);
  const y = yearInputs(view, settings.invest);
  const thisMonth = useMemo(() => {
    const paid = (id: string) => (plans.find((p) => p.id === id)?.paid ?? 0) > 0;
    if (!y) return plans.filter((p) => p.status === 'planned' && p.ym === month).map((p) => ({ id: p.id, title: p.title, amount: p.amount - p.paid, date: view.forecast.month_end, paid: p.paid > 0 }));
    const row = series(y, plans, settings)[0];
    return row.items.map((it) => ({ id: it.id, title: it.title, amount: it.amount, date: view.forecast.month_end, paid: paid(it.id) }));
  }, [y?.start, plans, settings, month]);
  const planned = thisMonth.reduce((t, p) => t + p.amount, 0);
  const s = heroState(view, soft, hard, planned);
  const nothing = !view.position.cash && !view.forecast.likely_left && view.spend.days.every((d) => d.state === 'no_data' || !d.items.length) && !view.position.owed_total;
  const updated = builtMs != null ? `${dayLabel(asOf)}, updated ${stale ? shortStamp(builtMs) : timeLabel(builtMs)}` : `${dayLabel(asOf)} figures`;
  const header = (
    <header className="top land">
      <div className="d"><Brand /></div>
      <span className="top-acts"><ThemeButton /><Link className="btn-q" to="reports">Reports</Link></span>
    </header>
  );
  if (nothing) {
    return (
      <>
        {header}
        <StateBar />
        <main>
          <h1 className="a">Nothing has come in yet.</h1>
          <p className="sub">This page fills in after your first statement or bank message arrives.</p>
          <CheckAgain />
        </main>
      </>
    );
  }
  return (
    <>
      {header}
      <StateBar />
      <main className="home duo">
        <div className="col1">
          <Hero view={view} s={s} plans={thisMonth} />
          <Position view={view} />
          {wide ? null : <Chores view={view} s={s} soft={soft} hard={hard} />}
          <Line view={view} s={s} soft={soft} hard={hard} plans={thisMonth} />
        </div>
        <div className="side">
        {wide ? <Chores view={view} s={s} soft={soft} hard={hard} /> : null}
        <div className="col2">
          <Variability view={view} />
          <Trend view={view} />
        </div>
        <div className="col3">
          <Year view={view} />
          <TrustRow view={view} updated={updated} />
        </div>
        </div>
      </main>
    </>
  );
}

export function CheckAgain() {
  const { reload } = useStore();
  return <div className="wrap mt4"><button className="bigbtn" onClick={reload}>Check again</button></div>;
}

