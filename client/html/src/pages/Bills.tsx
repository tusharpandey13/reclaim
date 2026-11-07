/** Bills: what is still to pay, against the same cushions as Today, then price changes, paid and yearly. */
import { useState, type ReactNode } from 'react';
import { PageHeader, StateBar } from '../App';
import { Chip, CloseButton, Hl, Ico, Link, N, NameChip, Read, Tag, useSheet, type ChipStep } from '../ui/kit';
import { Due, Micro, type DueMark } from '../ui/charts';
import { dateParts, dayDiff, dayLabel, dayMonth, daysInMonth, fc, inr, MONTHS, monthLong, monthName, rupees, short, usually, usualOf } from '../lib/format';
import { cardRoute, useRoute } from '../lib/router';
import { absentReason, useStore, useView } from '../lib/store';
import { CheckAgain, heroState } from './Today';
import { DoubtNote, LIKELY_BILLS_HONEST } from './shared';
import { isWide, type CardBill, type Item, type Snapshot } from '../lib/data';
import { FoldRow, RangeChooser, Stat, useInfo, WithInfo } from '../ui/tight';
import { hasEarlier, spanBilled, spanCal, spanLabel, spanMonths, type BillSpan } from '../lib/billrange';

const spreadOf = (i: Item): number => (i.amount.spread ? rupees(i.amount.spread.variance) : 0);
const amountOf = (i: Item): string => {
  const range = usualOf(i.amount);
  return range ? `${short(rupees(i.amount.value))}, ${usually(range.low, range.high)}` : inr(rupees(i.amount.value));
};

/** chip: a word or two, beside the name. sub: anything longer, under it. */
interface Row { item: Item; chip: ReactNode; sub: string | null; step: string; running: number }

export function billRows(view: Snapshot, items: Item[], soft: number, hard: number, cash: number | null, m: number | null, h: number): Row[] {
  const asOf = view.meta.as_of;
  let running = cash ?? 0;
  const usual = view.forecast.usual_spend ? rupees(view.forecast.usual_spend.value) : 0;
  const scale = cash != null ? 1 : 0;
  return items.map((item) => {
    const amt = rupees(item.amount.value);
    running -= amt;
    const due = item.due_date ?? item.date;
    const p = dateParts(due);
    const late = dayDiff(asOf, due);
    const left = -late;
    const projected = scale ? running - usual * ((items.indexOf(item) + 1) / Math.max(1, items.length)) : null;
    let step = 'n';
    let label: string;
    const notes: string[] = [];
    if (late > 0) {
      step = late >= 7 ? 'r3' : 'r2';
      label = `${late} ${late === 1 ? 'day' : 'days'} late`;
      notes.push('Clears when it is on a statement');
    } else if (m != null && m < soft) {
      step = m < hard ? 'r3' : 'r1';
      label = `${p.wd} ${p.d}`;
      notes.push(`You will be near ${fc(m, h)} after this`);
    } else if (left === 0) {
      step = 'r1';
      label = 'Today';
    } else if (left > 0 && left <= 3) {
      step = 'r1';
      label = `${p.wd} ${p.d}, in ${left} ${left === 1 ? 'day' : 'days'}`;
    } else if (projected != null && projected < soft) {
      label = `${p.wd} ${p.d}, near soft cushion`;
    } else {
      label = `${p.wd} ${p.d}, covered`;
    }
    if (item.may_be_paid) notes.push('May already be paid');
    const sub = notes.length ? notes.join('. ') : null;
    // An ordinary date is a plain sub-line, so it has no chip to place.
    const chip = step === 'n' ? null : <Chip step={step as ChipStep}>{label}</Chip>;
    const plain = step === 'n' ? [label, ...notes].join('. ') : sub;
    return { item, chip, sub: plain, step, running };
  });
}

function BillSheet({ item, chip, sub }: { item: Item; chip: ReactNode; sub: string | null }) {
  const fig = item.amount;
  const basis = (fig.basis ?? '').replace(/\bSMS\b/g, 'your messages');
  const conf = fig.confidence === 'statement' ? 'On a statement' : fig.confidence === 'estimate' ? 'An estimate from your history' : fig.confidence === 'entered' ? 'You entered this' : 'Not on a statement yet';
  const card = item.kind === 'card_bill' || item.kind === 'card_bill_estimate';
  return (
    <>
      <h2>{item.name}</h2>
      <div className="sum">
        <span>Amount</span><N>{amountOf(item)}</N>
        <span>Due</span><span>{item.due_date ? dayLabel(item.due_date) : card ? 'Not known' : dayLabel(item.date)}</span>
        <span>How sure</span><span>{conf}</span>
      </div>
      <p className="mt4">{chip} {sub}</p>
      <p className="note mt4">{basis}</p>
      {item.may_be_paid ? <p className="note mt4" data-note="may-be">A bank payment of {inr(rupees(item.may_be_paid))} may be for this bill. It is close to this card's balance, not proven, so the bill stays here until a statement says.</p> : null}
      {item.kind === 'card_bill_estimate' ? <p className="note mt4" data-note="estimate">This is an estimate from the card's last bills: no statement states it.</p> : null}
      <p className="note mt4">A bill clears when your bank shows its payment. Your statements are the source of truth, and they replace this when they arrive.</p>
      <CloseButton />
    </>
  );
}

const pctOf = (bp: number): number => Math.round(Math.abs(bp) / 100);

const cardName = (c: CardBill): string => c.label ?? c.card;
const HOW_SURE: Record<CardBill['confidence'], string> = {
  statement: 'Your bank statement shows it',
  provisional: 'From your messages, until a statement shows it',
  estimate: 'Matched by amount, not proven',
};
const VIA: Record<CardBill['payments'][number]['via'], string> = {
  card: 'The card shows this payment',
  bank: 'Your bank shows it paid to this card',
  unnamed: 'A card payment that named no card, set against this bill',
};

/** A card's answer: paid or not, with the date. chip: a word or two. sub: the bill it is about. */
export function cardAnswer(c: CardBill, asOf: string): { chip: ReactNode; sub: string; step: string; says: string } {
  const name = cardName(c);
  const due = rupees(c.due);
  const left = Math.max(0, due - rupees(c.paid));
  const late = c.due_date ? dayDiff(asOf, c.due_date) : 0;
  const bill = c.due_date ? `${inr(due)} due ${dayMonth(c.due_date)}` : `${inr(due)} on the ${dayMonth(c.statement_date)} statement`;
  const lateChip = (word: string) => <Chip step={late >= 7 ? 'r3' : 'r2'}>{word}</Chip>;
  switch (c.status) {
    case 'paid':
      return { chip: <Chip step="g1">Paid {c.paid_date ? dayMonth(c.paid_date) : ''}</Chip>, sub: c.confidence === 'statement' ? bill : `${bill}. ${HOW_SURE[c.confidence]}`, step: 'g1',
        says: `${name} was paid${c.paid_date ? ` on ${dayLabel(c.paid_date)}` : ''}` };
    case 'part_paid':
      return { chip: late > 0 ? lateChip('Part paid, late') : <Chip step="r1">Part paid</Chip>, sub: `${inr(rupees(c.paid))} paid${c.paid_date ? ` by ${dayMonth(c.paid_date)}` : ''}, ${inr(left)} left. ${bill}`,
        step: late > 0 ? (late >= 7 ? 'r3' : 'r2') : 'r1', says: `${name} is part paid: ${inr(left)} left` };
    case 'unpaid':
      return late > 0
        ? { chip: lateChip(`Not paid, ${late} ${late === 1 ? 'day' : 'days'} late`), sub: bill, step: late >= 7 ? 'r3' : 'r2', says: `${name} is not paid, and it is late` }
        : { chip: <Chip step="plain">Not paid yet</Chip>, sub: bill, step: 'n', says: `${name} is not paid yet` };
    case 'unknown':
      return { chip: <Chip step="a">Cannot tell</Chip>, sub: `No statement since ${dayMonth(c.statement_date)}. Its last bill was ${inr(due)}`, step: 'a', says: `We cannot tell if ${name} was paid` };
    default:
      return { chip: null, sub: `Nothing due on the ${dayMonth(c.statement_date)} statement`, step: 'n', says: `${name} has nothing due` };
  }
}

function CardSheet({ c, asOf }: { c: CardBill; asOf: string }) {
  const a = cardAnswer(c, asOf);
  return (
    <>
      <h2>{cardName(c)}</h2>
      <p>{a.chip} {a.sub}</p>
      <div className="sum mt4">
        <span>Statement</span><span>{dayLabel(c.statement_date)}</span>
        <span>Due</span><N>{inr(rupees(c.due))}</N>
        {c.due_date ? <><span>Due by</span><span>{dayLabel(c.due_date)}</span></> : null}
        {c.minimum_due != null ? <><span>Minimum</span><N>{inr(rupees(c.minimum_due))}</N></> : null}
        <span>Paid since</span><N>{inr(rupees(c.paid))}</N>
        <span>How sure</span><span>{c.status === 'paid' || c.status === 'part_paid' ? HOW_SURE[c.confidence] : 'No payment for it shows yet'}</span>
      </div>
      {c.payments.length ? (
        <ul className="rows mt4" data-note="payments">
          {c.payments.map((p, n) => <li key={n}><div className="r"><span><b>{p.date ? dayLabel(p.date) : 'Not dated'}</b><small>{VIA[p.via]}</small></span><N>{inr(rupees(p.amount))}</N></div></li>)}
        </ul>
      ) : null}
      {c.may_be_paid ? <p className="note mt4" data-note="may-be">A bank payment of {inr(rupees(c.may_be_paid))} may be for this bill. It is close to this card's balance, not proven, so it does not count here.</p> : null}
      <p className="note mt4">A bill counts as paid when the card or your bank shows the payment. Your statements are the source of truth, and they replace this when they arrive.</p>
      <CloseButton />
    </>
  );
}

function CardRows({ cards, asOf, focus }: { cards: CardBill[]; asOf: string; focus: string | null }) {
  const { open } = useSheet();
  return (
    <ul className="rows bar" id="card-bills-list">
      {cards.map((c) => {
        const a = cardAnswer(c, asOf);
        return (
          <li key={c.id} data-card={c.id} data-status={c.status} data-focus={focus === c.id ? 'true' : undefined}>
            <button onClick={() => open(<CardSheet c={c} asOf={asOf} />, cardName(c))} data-step={a.step}>
              <span className="icr"><Ico q={{ name: cardName(c), group: 'Bills', brand: c.brand }} /><NameChip name={cardName(c)} chip={a.chip} /><small>{a.sub}</small></span>
              <span><N>{inr(rupees(c.due))}</N></span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

export function Bills() {
  const view = useView();
  const route = useRoute();
  const { open } = useSheet();
  const { settings, plans } = useStore();
  const [read, setRead] = useState<ReactNode>(null);
  const [span, setSpan] = useState<BillSpan>('month');
  const [stepBack, setStepBack] = useState(0);
  const show = useInfo();
  const { soft, hard } = settings;
  const { upcoming, paid: allPaid, recurring, yearly } = view.bills;
  const cards = view.bills.cards ?? [];
  // A card bill's bank row names a payment rail, not the card: the card's own row says it, under Card bills.
  const paid = cards.length ? allPaid.filter((p) => p.kind !== 'card_bill') : allPaid;
  const cardPaidCount = allPaid.length - paid.length;
  const asOf = view.meta.as_of;
  const ym = asOf.slice(0, 7);
  const planLines = plans.filter((p) => p.status === 'planned' && p.ym === ym);
  const planned = planLines.reduce((t, p) => t + (p.amount - p.paid), 0);
  const s = heroState(view, soft, hard, planned);
  const none = !upcoming.length && !allPaid.length && !recurring.length && !cards.length;

  const header = (
    <>
      <PageHeader title="Bills" />
      <StateBar />
    </>
  );
  if (none) {
    return (
      <>
        {header}
        <main>
          <h1 className="a">No bills found yet.</h1>
          <p className="sub">A bill appears here once it has shown up in your statements.</p>
          <CheckAgain />
        </main>
      </>
    );
  }
  const total = upcoming.reduce((t, i) => t + rupees(i.amount.value), 0);
  const totalVar = upcoming.reduce((t, i) => t + spreadOf(i) ** 2, 0);
  const totalH = Math.sqrt(totalVar);
  const totalWords = totalH > 0 ? fc(total, totalH, true) : inr(total);
  const likely = view.forecast.likely_bills;
  const likelyCards = (likely?.items ?? []).filter((i) => i.kind === 'card_bill' || i.kind === 'card_bill_estimate');
  const cardsTotal = rupees(likely?.card_total ?? 0);
  const cash = view.position.cash ? rupees(view.position.cash.value) : null;
  const under = s?.kind === 'sell' ? 'hard' : s?.kind === 'dip' ? 'soft' : null;
  const all = route.params.get('all') === '1';
  const rows = billRows(view, upcoming, soft, hard, cash, s ? s.m : null, s ? s.h : 0);
  const worstLate = rows.find((r) => dayDiff(asOf, r.item.due_date ?? r.item.date) > 0);
  const lateCount = rows.filter((r) => dayDiff(asOf, r.item.due_date ?? r.item.date) > 0).length;
  const lateDays = worstLate ? dayDiff(asOf, worstLate.item.due_date ?? worstLate.item.date) : 0;
  const someRed = rows.some((r) => r.step === 'r3') || !!under;
  const month = monthLong(view.spend.month);

  const focusId = route.section;
  const focused = focusId ? cards.find((c) => c.id === focusId) ?? null : null;
  const focusAnswer = focused ? cardAnswer(focused, asOf) : null;
  const focusBlock = focusId ? (focused && focusAnswer ? (
    <section className="sec" id={focused.id} data-note="card-focus">
      <h2>{focusAnswer.says}</h2>
      <p>{focusAnswer.chip} {focusAnswer.sub}</p>
      <Link className="tlink" to="bills">All bills</Link>
    </section>
  ) : <p className="note" data-note="card-missing">This link does not point at a card with a statement. Every card is under Card bills.</p>) : null;
  const cardSection = cards.length ? (
    <section className="sec" id="card-bills">
      <h2><WithInfo text="Card bills" title="Card bills"><p>Each card&apos;s last statement, and whether its payment shows. Tap one for its payments.</p></WithInfo></h2>
      <CardRows cards={cards} asOf={asOf} focus={focused?.id ?? null} />
    </section>
  ) : null;
  const known = new Set(cards.map((c) => c.card));

  const silent = view.forecast.silent_cards ?? [];
  const answer = (
    <>
      {silent.map((c) => <p className="note" key={c.card} data-note="silent-card">No statement for {c.card} since {dayLabel(c.last_statement)}. The figure carries an estimate of {inr(rupees(c.estimate))}.{c.unpaid > 0 ? ` Its last bill, ${inr(rupees(c.unpaid))} due ${dayLabel(c.due_date)}, may be unpaid. We cannot tell until a statement comes.` : ''}</p>)}
      <h1 className="a" id="bills-answer" data-amount={Math.round(total)}>{upcoming.length ? <Stat value={<N>{totalWords}</N>} period={MONTHS[dateParts(asOf).m].toUpperCase()} periodLabel={month} tag="still to pay" testid="bills-left" /> : <>Nothing left to pay in {month}</>}</h1>
      {likelyCards.length ? <p className="sub" data-note="likely-cards">About <N>{short(cardsTotal)}</N> in card bills after your salary, not counted above.</p> : null}
      <p className="sub">
        {under ? <Chip step={under === 'hard' ? 'r3' : 'r1'} kind={s?.kind}>You end the month under your {short(under === 'hard' ? hard : soft)} {under} cushion</Chip>
          : lateCount ? <Chip step={lateDays >= 7 ? 'r3' : 'r2'}>{lateCount === 1 ? `One is ${lateDays} ${lateDays === 1 ? 'day' : 'days'} late` : `${lateCount} are late`}</Chip>
          : upcoming.length ? <span className="sc quiet">All covered by your bank balance</span> : null}
      </p>
      <div className="wrap"><DoubtNote name="due" /></div>
    </>
  );
  const unmatchedNote = view.forecast.payment_unmatched?.total ? <p className="note" data-note="unmatched">Payment not yet matched to a card: <N>{inr(rupees(view.forecast.payment_unmatched.total))}</N>. It is already out of your bank, so it comes off what is due once.</p> : null;
  const listRows = (
    <ul className="rows bar">
      {rows.map((r, n) => (
        <li key={`${r.item.name}-${n}`} data-amount={rupees(r.item.amount.value)}>
          <button onClick={() => open(<BillSheet item={r.item} chip={r.chip} sub={r.sub} />, r.item.name)} data-step={r.step}>
            <span className="icr"><Ico q={{ name: r.item.name, group: r.item.category ?? r.item.group, brand: r.item.brand }} /><NameChip name={r.item.name} chip={r.chip} />{r.sub ? <small>{r.sub}</small> : null}</span>
            <span><N>{amountOf(r.item)}</N></span>
          </button>
        </li>
      ))}
    </ul>
  );
  const likelySection = likelyCards.length ? (
          <section className="sec" id="likely-cards">
            <h2>Likely card bills</h2>
            <p>After your salary on {dayMonth(likely!.start)}, kept apart from the bills above{likely!.cards_within_days != null ? `. You usually pay within ${likely!.cards_within_days} ${likely!.cards_within_days === 1 ? 'day' : 'days'} of salary` : ''}. {LIKELY_BILLS_HONEST}</p>
            <ul className="rows bar">
              {likelyCards.map((i) => {
                const range = usualOf(i.amount);
                const inner = <><span className="icr"><Ico q={{ name: i.name, group: 'Bills', brand: i.brand }} /><b>{i.name}</b><small>{i.basis === 'stated' ? <>On your statement, due {dayMonth(i.date)}</> : <>{range && isWide((range.high - range.low) / 2, soft) ? <Tag>Estimate</Tag> : null}Due about {dayMonth(i.date)}{i.charges_so_far != null ? `. ${inr(rupees(i.charges_so_far))} charged so far` : ''}</>}</small></span><span className="ranged"><N>{short(rupees(i.amount.value))}</N>{range ? <small>{usually(range.low, range.high)}</small> : null}</span></>;
                return (
                  <li key={i.name}>{i.card && known.has(i.card) ? <Link className="r" to={cardRoute(i.card)} data-basis={i.basis}>{inner}</Link> : <div className="r" data-basis={i.basis}>{inner}</div>}</li>
                );
              })}
            </ul>
          </section>
        ) : null;
  const planGroup = planLines.length ? (
    <section className="sec">
      <h2><WithInfo text="Planned, not bills" title="Planned, not bills"><p>Big expenses you planned for this month. Not counted in the amount above.</p></WithInfo></h2>
      <ul className="rows bar">
        {planLines.map((p) => (
          <li key={p.id}><Link to="plan"><span className="icr"><Ico q={{ name: p.title }} /><b>{p.title}</b><small><Tag>Plan</Tag>{monthLong(p.ym)}</small></span><span><N>{inr(p.amount - p.paid)}</N></span></Link></li>
        ))}
      </ul>
    </section>
  ) : null;

  // The range chooser: this month is the full page; earlier months, 3 months and a year read the regular bills' history, the one record that reaches back.
  const months = spanMonths(ym, span, stepBack);
  const chooser = (
    <RangeChooser testid="bills" label={spanLabel(months)} value={span}
      options={[{ id: 'month', label: 'Month' }, { id: 'quarter', label: '3 months' }, { id: 'year', label: 'Year' }]}
      onPick={(id) => { setSpan(id as BillSpan); setStepBack(0); }}
      onPrev={hasEarlier(recurring, ym, span, stepBack) ? () => setStepBack(stepBack - 1) : undefined}
      onNext={stepBack < 0 ? () => setStepBack(stepBack + 1) : undefined} />
  );
  if (span !== 'month' || stepBack !== 0) {
    const billed = spanBilled(recurring, months);
    const label = spanLabel(months);
    return (
      <>
        {header}
        <main>
          {chooser}
          <h1 className="a" id="bills-answer" data-span={span} data-amount={Math.round(rupees(billed.total))}>
            {billed.rows.length ? <Stat value={<N>{inr(rupees(billed.total))}</N>} period={spanCal(months, span)} periodLabel={label} tag="in regular bills" testid="bills-span" /> : <>No regular bills in {label}</>}
          </h1>
          <p className="sub">From each regular bill&apos;s history. One-off bills and card bills are not in it.</p>
          {billed.rows.length ? (
            <section className="sec" data-note="span-bills">
              <h2>Regular bills</h2>
              <ul className="rows bar">
                {billed.rows.map((r) => {
                  const line = recurring.find((l) => l.name === r.name);
                  return <li key={r.name} data-amount={rupees(r.amount)}><div className="r"><span className="icr"><Ico q={{ name: r.name, group: line?.category ?? line?.group, brand: line?.brand }} /><b>{r.name}</b>{span !== 'month' ? <small>{r.count} {r.count === 1 ? 'bill' : 'bills'}</small> : null}</span><N>{inr(rupees(r.amount))}</N></div></li>;
                })}
              </ul>
            </section>
          ) : null}
        </main>
      </>
    );
  }

  if (under && !all) {
    return (
      <>
        {header}
        <main>
          {focusBlock}
          {chooser}
          {answer}
          {cardSection}
          <section className="sec">
            <h2>Still to pay</h2>
            {unmatchedNote}{upcoming.length ? listRows : <p>Nothing left this month.</p>}
          </section>
          {likelySection}
        {planGroup}
          <section className="sec">
            <h2>All of {month}&apos;s bills</h2>
            <p>Everything already paid is on the main Bills page.</p>
            <Link className="tlink" to="bills?all=1">See all bills</Link>
          </section>
        </main>
      </>
    );
  }

  const dim = daysInMonth(ym);
  const today = dateParts(asOf).d;
  const marks: DueMark[] = [
    ...paid.filter((p) => p.date.startsWith(ym)).map((p) => ({ day: dateParts(p.date).d, amount: rupees(p.amount.value), step: 'n' as const, paid: true, read: <><b>{p.name}: {inr(rupees(p.amount.value))}</b>. Paid {dayMonth(p.date)}.</> })),
    ...cards.filter((c) => (c.status === 'paid' || c.status === 'part_paid') && c.paid_date?.startsWith(ym)).map((c) => ({ day: dateParts(c.paid_date!).d, amount: rupees(Math.min(c.paid, c.due)), step: 'n' as const, paid: true, read: <><b>{cardName(c)}: {inr(rupees(c.paid))}</b>. Paid {dayMonth(c.paid_date!)}.</> })),
    ...likelyCards.filter((i) => i.date.startsWith(ym)).map((i) => ({ day: dateParts(i.date).d, amount: rupees(i.amount.value), step: 'n' as const, paid: false, estimated: true, read: <><b>{i.name}: {short(rupees(i.amount.value))}</b>. After your salary, {i.basis === 'stated' ? 'on your statement' : 'an estimate'}. Due {dayMonth(i.date)}.</> })),
    ...rows.filter((r) => (r.item.due_date ?? r.item.date).startsWith(ym)).map((r) => ({ day: dateParts(r.item.due_date ?? r.item.date).d, amount: rupees(r.item.amount.value), step: (r.step === 'r1' || r.step === 'r2' || r.step === 'r3' ? r.step : 'n') as DueMark['step'], paid: false, read: <><b>{r.item.name}: {amountOf(r.item)}</b>. {r.step === 'n' ? 'To pay' : 'Needs attention'} by {dayMonth(r.item.due_date ?? r.item.date)}.</> })),
  ];
  const changes = recurring.filter((r) => r.history.length >= 2);
  const up = changes.filter((r) => (r.price_change_bp ?? 0) > 2000);
  const heading: ReactNode = up.length === 1 ? (
    <>{up[0].name} has <span className="u-hand u-bad">gone up {pctOf(up[0].price_change_bp!)}%</span> this year</>
  ) : up.length > 1 ? (
    <>{up.length} bills have <span className="u-hand u-bad">gone up</span> this year</>
  ) : 'What your regular bills cost';
  const headingText = up.length === 1 ? `${up[0].name} has gone up ${pctOf(up[0].price_change_bp!)}% this year` : up.length > 1 ? `${up.length} bills have gone up this year` : 'What your regular bills cost';
  const yearlyList = yearly ?? [];
  const changesBody = (
    <div data-note="changes">
      <p>The last 12 bills. The last bar is the latest.</p>
      <ul className="rows">
        {changes.map((r) => {
          const bp = r.price_change_bp;
          const step = bp == null ? '' : bp > 2000 ? 'r2' : bp < -2000 ? 'g1' : '';
          return (
            <li key={r.name}>
              <div className="r tri">
                <span className="icr"><Ico q={{ name: r.name, group: r.category ?? r.group, brand: r.brand }} /><NameChip name={r.name} chip={step ? <Chip step={step as ChipStep}>{bp! > 0 ? 'Up' : 'Down'} {pctOf(bp!)}%</Chip> : null} /></span>
                <Micro values={r.history.map((h) => rupees(h.amount))} step={step || undefined} />
                <N>{inr(rupees(r.amount.value))}</N>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
  const paidBody = (
    <div data-note="paid">
      {paid.length ? (
        <>
          <ul className="rows bar">
            {paid.map((p) => <li key={p.key}><div className="r"><span className="icr"><Ico q={{ name: p.name, group: p.category, brand: p.brand }} /><NameChip beside name={p.name} chip={<Chip step="g1">{dayMonth(p.date)}</Chip>} /></span><N>{inr(rupees(p.amount.value))}</N></div></li>)}
          </ul>
          <p className="note mt4">Total <N>{inr(paid.reduce((t, p) => t + rupees(p.amount.value), 0))}</N>{cardPaidCount ? ', card bills apart' : ''}.</p>
        </>
      ) : <p>{cardPaidCount ? 'Nothing but card bills.' : 'Nothing paid yet this month.'}</p>}
      {cardPaidCount ? <p className="note mt4" data-note="card-payments-apart">{cardPaidCount === 1 ? 'One card bill payment is' : `${cardPaidCount} card bill payments are`} under Card bills, by card.</p> : null}
    </div>
  );
  const yearlyBody = yearly == null ? (
    <p className="note" data-note="yearly">{absentReason(view, 'bills.yearly') ?? 'Yearly bills are not detected yet. Ones you enter in Plan appear here.'}</p>
  ) : (
    <ul className="rows bar" data-note="yearly">
      {yearlyList.map((y) => {
        const sp = y.amount.spread ? rupees(y.amount.spread.variance) : 0;
        return <li key={`${y.name}-${y.ym}`}><div className="r"><span className="icr"><Ico q={{ name: y.name }} /><b>{y.name}</b><small>{monthName(y.ym)} {y.ym.slice(0, 4)}</small></span><N>{sp ? fc(rupees(y.amount.value), sp) : inr(rupees(y.amount.value))}</N></div></li>;
      })}
    </ul>
  );
  const yearlyTitle = yearly != null && yearlyList.length && !someRed ? <><Hl>Yearly bills</Hl> coming later</> : 'Yearly bills coming later';
  return (
    <>
      {header}
      <main>
        {focusBlock}
        {chooser}
        {answer}
        {cardSection}
        <div className="wrap mt4 bills-due">
          <h2 className="hd"><WithInfo text={`Due dates in ${month}`} title="Reading the strip" label="How to read the strip"><p>Filled is paid, hollow is still to pay{likelyCards.some((i) => i.date.startsWith(ym)) ? ', dashed is a likely card bill after your salary' : ''}. Taller is more.{likelyCards.some((i) => !i.date.startsWith(ym)) ? ' Likely card bills due next month are left off this strip.' : ''}</p></WithInfo></h2>
          <Due items={marks} today={today} dim={dim} monthLabel={MONTHS[dateParts(asOf).m]} label={`Bills across ${month}: ${marks.filter((m) => m.paid).length} paid, ${upcoming.length} still to come.`} onRead={setRead} />
          <Read text={read} />
        </div>
        <section className="sec">
          <h2>Still to pay</h2>
          {unmatchedNote}{upcoming.length ? listRows : <p>Nothing left this month.</p>}
        </section>
        {likelySection}
        {planGroup}
        {changes.length ? <FoldRow title={heading} heading={false} testid="changes" onClick={() => show(headingText, changesBody)} /> : null}
        <FoldRow title="Paid this month" heading={false} testid="paid" onClick={() => show('Paid this month', paidBody)} />
        {yearly == null || yearlyList.length ? <FoldRow title={yearlyTitle} heading={false} testid="yearly" onClick={() => show('Yearly bills coming later', yearlyBody)} /> : null}
      </main>
    </>
  );
}
