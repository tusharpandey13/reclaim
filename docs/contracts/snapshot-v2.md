# snapshot-v2

The frozen Till design's data. Published beside `snapshot-v1` in the same manifest until the app has moved; v1's bytes do not change. Shape: `snapshot-v2.schema.json`. Shared validator table: `snapshot-v2.cases.json`. Money is integer paise, except `plan.events.v1`, where the owner's typed amounts are whole rupees.

Anything real data cannot supply is null, with `{path, code, reason}` in the top-level `absent` list. `[]` in a path means every item of that list. Show the reason, never a zero.

## Likely left: `forecast.likely_left`

**The expected bank balance at the close of `forecast.month_end`, the last day of the as-of month, before any salary expected on or after that day.**

```
likely_left = cash + pay_included - due - usual_spend, rounded half-even to the rules' median step (₹1,000)
```

| Next salary is expected | Counted? | `pay_included` | `next_salary` |
|---|---|---|---|
| After `month_end` | No | null | That salary |
| **On `month_end`** | **No** | null | That salary |
| After today and before `month_end` | Yes | That salary | The one after it |
| Already in cash | It is in `cash` | null | The next one |

- **A salary on the last day is left out on purpose.** The hero answers "how much will be left before money comes in", and the Line draws Salary after Likely left. Counting it would inflate the hero by a whole salary, in the unsafe direction, for the sake of one day.
- **`next_salary.date` is never before `month_end`.** `parts_failures` blocks a build where it is.
- **A salary "already in cash" goes by the last credit, not by the calendar month.** A salary due on the 1st that landed on the 31st is not expected again the next day: the next date is the first usual pay day at least 15 days after the last credit. v1 counts it twice in this case, which is one reason `base` is gone from v2.
- **A late salary** (expected before today, not seen) is dated today, with `late: true`, and follows the same table.
- **No regular salary** (credits in under two thirds of the covered months): nothing is counted, and `next_salary` is null with a reason.
- **Amount:** the median of the last 3 credits. **Pay day:** the median day of those credits, clamped to short months.
- **The ±** is measured on this figure: each past month is predicted from what was known on the same day, then compared with its real month-end balance with any salary the prediction left out also taken out. Smallest ₹1,000 step that holds 8 of each 10 past misses, as in v1. That is the rule, not a promise: walked forward on real data it landed about 6 times in 10, so the app says "still being tested: about 6 times in 10". Under 5 testable months, or under 6 months of history, `state` is `not_enough_history` and there is no number.
- **Plans** never move this figure. `with_plans` is a labelled projection.
- **Rounding.** `spread.variance` is rounded up to ₹1,000 and is what `lo` and every status use. The app prints it rounded up further, by SPEC section 4: one significant figure, or two when the first digit is 1. A printed range uses the printed ±.

v1's `base`, `pay` and `pay_date` are not in v2, so nothing can read the old meaning by accident.

## Likely left before salary: `forecast.before_salary`

The owner's decision of 2026-11-03. **This is the hero.** `forecast.likely_left` and `month_end` above stay as they were, so an app already out there reads what it always read. Every new field is optional in the schema: a snapshot from before them stays valid, and the app falls back to `likely_left`. v1 does not change.

**`figure` is the expected bank balance at the close of `date`, with no salary in it. `date` is the day before the next salary falls due.**

```
figure = cash - due - planned_moves - usual_spend, rounded half-even to the rules' median step (₹1,000)
```

| Next salary | `date` | `basis` | `date_reason` |
|---|---|---|---|
| Expected, not yet landed | The day before it | `salary` | null |
| Landed already this month | The day before the next one, in the next month | `salary` | null |
| Due today, or up to 7 days late | Today | `salary` | null |
| More than 7 days late | The month's last day | `month_end` | `salary_overdue` |
| No regular salary (credits in under two thirds of covered months) | The month's last day | `month_end` | `no_regular_salary` |

- `date` is never before as_of. The app's label reads it, not the 30th.
- `due` holds only what falls due up to `date`. `usual_spend` is the median of what everyday spending took between the same day of each past month and that month's own eve of salary, without moves, card payments, one-offs, or income.
- **Moves to investing are not spending.** A flow to or from `Assets:Investments` or `Assets:Invest`, and anything under them, is a move. v2 only: v1's default prefix is unchanged. Transfers are lumpy, so none is predicted, however regular: `planned_moves` is 0 and `planned_items` empty (owner's decision, 2026-11-03). `plan_inputs.year.invest` is what was entered in Plan, or 0, and `invest_source` is `entered` or null.
- **An unplanned transfer does not hide.** Before it happens, `unplanned` says how often they happened over the last 12 covered months, how large typically and at most, and the app prints that beside the figure: any you make comes straight off it. After it happens it is out of `cash`, so the figure holds it, and `moved_so_far` draws it in indigo in the Line. It is not in `figure` or the ±.
- **The range** (since 2026-11-03, method `winsor_10_90_recent_6_v1`). `figure.usual_low` and `usual_high` are what the app prints; it never prints ±. Each of the last 6 tested months' error, with unplanned moves and known one-offs (`spend_kind = one_off`) added back, is pulled in to the 10th and 90th percentile, then the width is the 8th rank in 10, rounded up to ₹1,000. `spread.variance` is that half-width, so `lo = m − h` and every status stay as they were; `spread.n` is the months that set it; `spread.hit_rate_bp` is measured, from `range`: each past month judged by a range made only from months before it, against its real balance. So outliers fall outside by design, and the real hit rate is below 8 in 10. When `h` is over the soft cushion, low to high spans over 2 soft cushions, the app shows "too early to tell" with the figure alone, and `could` is not told: `status.kind` is null unless the figure itself is under a cushion. `usual_spend_past` samples are never negative: only refunds to a spending account come off them, never a flatmate paying back, money lent or money between own accounts (`Assets:Receivable`, `Equity:Transfers`).
- **Earlier width, for the record:** walks forward as above, against how each past figure came out: the real balance the day before that salary really landed, with unplanned moves added back. With no salary timing, the balance on `date` with any salary that landed taken out. So the ± says how far off the figure is if you make no extra move. See `analysis-report` results before trusting it.
- **Status** is on one basis: `lo` and the bar both hold no salary. The bar is `position.before_salary_ends`, the real balance on the day before each past salary, up to 12. Green needs 12 of them and beats 10 of 12.
- `plan_inputs.year.before_salary` holds `first_outgo`, `first_invest`, `first_spread` and `rows` with row 0 as this figure. The app reads these when present. Each later row takes one salary, so each row closes before the next.

## Likely bills

`forecast.likely_bills`, after-salary-v1, additive. What leaves between the next salary and the one after. It does not change Likely left, which stays the balance before salary, and it is the one source for Today's group and Bills' likely card bills.

- **Cards.** The owner pays soon after salary, whenever a bill falls due, so each card's bill due after `before_salary.date` and up to 15 days past `end` counts. `stated` where a statement says it. Otherwise `estimated`: charges since its last statement, plus the median of what the same days left of the last 6 cycles came to, with its range from the same method. A silent card: the median of its last 3 bills.
- **Rent:** the median of what rent took in the last 6 closed pay cycles that had any, as it leaves the bank. **Flatmates' share back:** the same over credits to `Assets:Receivable`, a negative row, only beside a rent row. **Fixed costs:** repeating payments, and `spend_kind` fixed costs paid from the bank, on their usual day. A fixed cost paid by card is in that card's bill and is not listed again.
- **No rupee twice.** Everyday spending is read from bank rows only: a card purchase moves no cash until its bill, so a card bill holds nothing `usual_spend` holds. Anything dated up to `before_salary.date` is in `due` and not here; a rupee has one date.
- `left` is Likely left, plus the salary, less `total`. No everyday spending after salary is in it, and the app says so.
- `cards_within_days` and `rent_within_days`: three in four left within this many days of salary, over the last 6 closed cycles. Null under 5 payments.

## Card bills the bank shows paid

The owner's rule: a card bill is due only if the bank shows no payment for it, whether or not an acknowledgement has arrived. `facts_v2.clear_paid_bills` sets bank debits against open bills on every build, from all rows known. It is matching only: it makes and changes no amount, the bank row stays the truth, and no ledger posting moves.

A debit counts as a card payment from its own row first: a rule or pairing put it on `Equity:Transfers:CardPayments`, or its narration or name carries card words. A bill rail alone (BBPS and the like) also carries utilities, so it proves nothing. Pairing only ever names the card. A debit classed `Internal`, `Unmatched` or `NeedsReview` is looked at too, with stricter terms.

| Debit | Against | Result |
|---|---|---|
| Any | A card credit of the same amount within 15 days | Already on the card: it is dropped, so a late SMS or statement never counts twice |
| Any | Before the statement date, or over 15 days past the due date | Not this bill. A newer statement supersedes it |
| Any | The exact amount of one bill, or of one card's running balance | **Proof.** That card is named: the bill leaves `due`; the amount shows as `position.owed[].paid_not_posted` |
| Row says card payment (class, wording or bill rail) | Near one card's running balance | That card is named too, marked `paid_inferred`: wording says what it is, the balance says whose |
| Card payment | Part or round, or equal on two cards | Names none: `payment_unmatched`, off the total once, oldest bill first, never below zero |
| Not shown to be one | Near one card's balance | `may_be_paid` on that bill and card. It clears nothing |
| Row says card payment | A little over one card's balance, within 10%, or too big for every other card's stated bill | That card is named, marked `paid_inferred` |
| Row says card payment | Clears one balance once the payments before it are counted | That card is named for all of them, marked `paid_inferred` |
| Not shown to be one | No relation | Nothing |

Running balance is the last statement's due, plus later charges, less later payments on the card and any earlier named debit. Near is within the smaller of ₹500 and 10% of the balance. A near match is inferred, not proven: `position.owed[].paid_inferred` is true and the app says so. `due` is `due_items` less `payment_unmatched`; `owed_total` is each card's `statement + since - paid_not_posted`, less `payment_unmatched`. Both forecast figures use this. An owner's correction to `card_payment` makes a near debit count, with its amount unchanged.

## Card bill status: `bills.cards`

**Added 2026-11-06, additive.** Did this card's bill get paid? One `CardBill` per live card with a statement on or before as_of, under the label `position.owed` uses. It is matching only: no amount moves, and `due` and the forecast are unchanged.

- `due`, `due_date`, `minimum_due`, `statement_date`: the last statement's own figures.
- `payments`: what counts towards that bill, from the day after its statement date to as_of. `via` `card`: the card's own record of a payment, its statement or its message, whichever bank paid it. `bank`: a debit `clear_paid_bills` named for this card, by the table above, its card side not seen yet. `unnamed`: part of a card payment that named no card, set against this bill as in `unmatched_off`, with a null date. `paid` is their sum, and may exceed `due`.
- `status`: `nothing_due` when `due` is 0 or less; `paid` when `paid` reaches `due`; `part_paid` when some is paid; `unknown` when nothing is and the card's statements stopped before last month's bill, as in `silent_cards`, so a payment may sit where the box cannot see; `unpaid` otherwise, whether or not the due date has passed.
- `paid_date`: the day the payments reached `due`, or for `part_paid` the latest dated payment.
- `confidence`: `statement` when a bank statement shows every payment, a card payment counting through the bank debit it paired with; `estimate` when one was matched on nearness or fit (`paid_inferred`) or named no card; `provisional` otherwise, including every `unpaid`, since a statement may yet show a payment.
- `may_be_paid`: as on `position.owed`. It counts nothing.
- `id`: the label as a link, lower case with `-`: the app opens `#/bills/<id>`.

**Billing accounts.** `card_billing_accounts` in the config lists masks one bill covers, first mask first. v2 reads each as the first: statements, credits, charges and the row in `position.owed` carry one label. Unset, each mask stands alone.

## Out of money: `forecast.shortfall`

Additive. Null, with a reason in `absent`, under 3 covered months or with no cash figure.

The known schedule, up to the eve of the next salary that can still be expected: repeating payments, planned moves and open card bills, in date order, overdue items from today. No usual spending: only what is known. A late salary is not in it, so the walk runs to the eve of the one after. With no regular salary, to the month's last day.

| Field | Meaning |
|---|---|
| `below_zero`, `below_hard` | First date the balance would go under zero and under the hard cushion, with every item leaving. Today if already there |
| `fails`, `first_fail` | `{date, name, label, amount, short}` as a bank would behave: an item the balance covers leaves, and one it cannot fails and leaves the balance as it was. `label` is "Rent" for a payee whose debits post to rent |
| `needed` | The sum of `short`: what gets every item paid |
| `lowest` | The lowest the balance goes, with every item leaving |
| `active` | Something fails, or the balance goes under zero. The app's hero reads this |

`forecast.silent_cards` names live cards whose statements stopped before last month's bill: `{card, last_statement, due_date, unpaid, estimate}`. Their bill is in `due` as a `card_bill_estimate`, the median of the last 3, for up to 6 months. `unpaid` is the last stated bill with no payment seen on the card: the bank may have paid it, so it is told, never added. An unpaid earlier statement stays on the list, dated when it fell due, though a newer one has cut. `bills.upcoming` holds statement bills even when the forecast has too little history.

**Late salary.** `pay_included.late` and `before_salary.if_salary_late` (`{date, figure}`, to the eve of the next salary) say it has not come. `forecast.likely_left` may still carry it, as above; both statuses judge the figure without it, and the app's hero subtracts it.

## Bounced and returned

A credit with a return word, and a same-amount debit on that account up to 30 days before it, or the same payee and amount within 3 days with no word, net to nothing. The debit carries `reversed`, the credit `reversal`, in the ledger. Neither is spending or income, and the forecast reads neither: the payment is still due. A returned debit cannot pay a card. A credit with a return word and no debit found stays `Income:Unclassified`, tagged `refund-no-debit`.

## Money in nothing explains

`Income:Unclassified` with treatment `unmatched`, tagged `unknown-in`, is not income in Reports: it may be a loan, a share or a refund. It is in `reports.months[].unknown_in`, and listed in `reports.unknown_in`. Rows that name themselves stay income: cashback, a reward, or the employer's name on the row. An `unknown` rule stays income: the owner's rule, shown in audit.

## Rent by the month it is for

Reporting only. Cash, the ledger's date and `spend.days` never move. A month is owed one rent. Two rent payments in a month, with the month beside it empty, means the one within 7 days of that edge is that month's. The month must have begun, so a rent for next month stays where it is until then. Only amounts seen 3 times are rent. `spend.months`, `spend.spent`, `spend.groups` and `reports.months` follow it; the audit line carries `for_month`, and `spend.rent_attribution` is what `spent` holds beyond the month's days.

## The running 30 days: `spend.rolling`

Owner's decision, 2026-11-03: a calendar month is empty on the 3rd. Spend opens here. Everything else stays calendar.

- **Everyday spending:** every expense except `Housing:Rent`, `Housing:Utilities` and `Bills`. A 30-day window holds two rents or none as dates shift. Investing is not an expense. `excluded` states what left out, with its rupees.
- **Usual:** a band over windows closing 30 to 394 days before as_of, so none overlaps this one. A window opening before the first data, or touching a hole in `facts_v2.holes`, is not used. Under 150 windows: `usual` and `verdict` are null, with a reason.
- **`verdict`:** `above` or `below` only outside the band and by ₹2,000 or more; else `normal`.
- **`one_offs`:** single lines of ₹10,000 or more that also reach the usual's median, and anything on a one-off account. They stay in `spent`: `without_one_offs` says what it would be.
- **`everyday`** `{spent, one_off, usual, verdict, groups}`, additive, 2026-11-04: the same window and the same usual, both without lines whose `spend_kind` is `one_off`. A big payment in the window can no longer read as "above your usual" against windows that mostly lack one. `spent + one_off` is `rolling.spent`. Spend's opening reads this; `rolling.spent`, `usual` and `verdict` stay as defined.
- **`provisional_days`**, `provisional_from`: days after the oldest live account's last statement. **`stale`:** no record for over 2 days.

## Spend's charts: `rolling.trend[].mover`, `spend.month_curves`

Additive, from 2026-11-03. Both optional: a build from before them stays valid.

- **`rolling.trend[].mover`** `{group, change}`: of the everyday groups, the one whose 30-day total changed most, in absolute rupees, from the previous bar drawn. `change` is signed paise. A tie goes to the earlier group in the ledger's order. Null on a bar with no total, on the first bar drawn, and when no group changed.
- **`spend.month_curves`** (`month-curves-v1`): `months` is the complete months of the recent window, `facts_v2.RECENT_MONTHS`, oldest first. `curves` has one row with `group: null` for all spending, then one for each group with anything in those months or this one. Points are `[day, running total in paise]`, only where the total changes.
  - **`now`** ends on `spend.spent`, or that group's `spent`, since rent counts in the month it is for: moved in, it lands on day 1; moved out, on that month's last day.
  - **`past[]`** holds every month of `months`, with its one-offs. `total` includes them; `one_off` says how much of it they are. An empty list means nothing was spent: the month is complete.
  - **`median`** is the median per day of those months with `spend_kind = one_off` taken out, so a big one-off shows on its own month's line and does not lift the median. On a day past a month's end, a shorter month counts at its last value. Under `facts_v2.MIN_MONTHS` months, or the whole window if that is smaller, it is null with a reason, and `median_n` is 0.

## Fixed, variable, one-off: `spend_kind`, `spend.allocation`

Owner's request, 2026-11-03: rent dwarfs everything else, so Spend shows it apart. Additive. Every `spend.days[].items[]`, `spend.rolling.one_offs[]` and `payees.top[]` row carries `spend_kind` (`fixed`, `variable`, `one_off`), `spend_kind_reason` (a code; `spend.allocation.reasons` has the words) and `spend_kind_source` (`rule` or `owner`). A consumer reading a build from before this field treats a row as unclassified. `finance/spend_kind.py` decides, first match wins, per ledger line:

1. **`owner`:** a correction with `spend_kind`. See below.
2. **`fixed`, `housing` or `fixed_account`:** the group is Housing, except `Housing:Supplies`, which is shopping; or the account ends in Rent, Help, Cook, EMI, Loan or Insurance. From the first payment: no history needed.
3. **`fixed`, `recurs`:** the payee is paid in at least 5 of some 6 months around this one, one payment a month as a rule, ₹100 a month or more, and the monthly amount moves over 15% at most once. A month paid twice says nothing about the price. A payment over twice the payee's usual one is not the habit.
4. **`one_off`, `large`:** one payment of at least `rule.one_off_threshold`: the larger of ₹10,000 and 25% of the usual month's variable spending (median of complete months, 3 or more, else the floor alone). **`one_off_account`:** on an account in the config's one-off list, ₹2,000 or more. Neither if the same payee made a payment of at least half this size in 2 or more other months within 5 either side. A refund up to a one-off's size follows it.
5. **`variable`:** the rest. `thin_history` under 6 months of data, `varies` when paid most months at moving amounts, `not_regular` otherwise.

Being classified changes no total, no cash and no other section. `spend.rolling` keeps its own definition ("Everyday spending"), which holds some fixed costs such as help: `window.everyday` splits it, and sums to `rolling.spent`. `rolling.one_offs` stays as defined; `spend_kind` is what the page lists.

`spend.allocation.fixed` is now, not a period. `rows` holds each fixed payee, grouped by the month a payment is for, so rent uses "Rent by the month it is for", and a rent's amount is the ledger's: for a split, the owner's share (`share`).

| `state` | Means | Attention |
|---|---|---|
| `steady`, `due` | Paid this month; or not yet, and not late | No |
| `new` | Seen in one month only | No |
| `changed` | The latest month's largest payment is beyond the range of earlier months' largest (up to 6) by over ₹50 and 5% | Yes, once: it is inside the range next time |
| `twice` | The month's two largest payments are within 15% of each other, this month or last | Yes |
| `missing` | A whole month empty, or over 7 days past its usual day. Only where the data reaches that far and no statement hole covers it; else `due` | Yes |
| `stopped` | Two or more whole months empty. Dropped after 6 | No |
| `occasional` | Fixed by account but not monthly, such as a yearly premium. No month expects it. Dropped after 12 | No |

`monthly` sums what each monthly row adds this month: paid so far, or else its latest amount (its usual, after a double) while it is still to come; nothing if missing or stopped, and only what is paid this month for a `new` row. `verdict` is `changed` if any row asks for attention, `same` if not and there is a usual to compare with, else null.

**Owner corrections.** A corrections line `{id, at, key, scope, spend_kind}` overrides this for one payment (`scope: one`, a transaction key) or a merchant (`scope: similar`, its alias key, `rows[].key`). It carries nothing else, reaches no ledger line and moves no money. `write_api` already accepts it, through the build's own parser. The app has no control for it yet.

**Names.** `name` on these rows, and `payees.review.items[].name`, are for reading: `merchants.display_name` drops rail words in front, a name said twice, and capitals. A name the owner or their table chose stays as written. `raw` and the alias key are untouched, and v1 is unchanged.

## Card balance since a statement

`position.owed[].since_estimate` is `{capture_bp, rows, low, high}`: the share of this card's debit rows in the last 12 months with an SMS, and what `since` could be if that share held. `position.owed_range` totals it. It states an estimate and posts nothing.

## Status

`forecast.status`, `with_plans.status` and each Plan row carry the one rule from SPEC section 3, worked out on the server by `status_v2.py`. The app's Plan engine applies the same rule to what-ifs. `Figure.status` is `none` on these figures.

With `m` the median, `h` the ±, `lo = m − h`, first match wins: `sell` m < hard; `dip` m < soft; `could` lo < hard; `just` lo < soft; `fits`. With `h` unknown, `kind` is null once m is at or above soft: the rule does not treat unknown as zero.

`step` is depth: `r1` for dip and could, `r2` for sell, `r3` for selling over 5% of `position.liquid`, which is null, so never `r3`, with no holdings known, `n` otherwise, or `g1`/`g2` when earned. The filled critical band goes on every `sell`, whatever the depth. Green needs 12 past balances, and `lo` must beat 10 of them: above the third highest, and in the top 3 being compared. `greens` holds the rule. `forecast.status` keeps `position.month_ends` as its bar; `before_salary.status` uses `before_salary_ends`.

Cushions come from `plan_inputs.cushions`: the owner's values from plan storage, else `cushions.soft_paise` and `hard_paise` in `status-rules-v1.json` (₹25k and ₹10k).

## Usual

`spend.usual` and each group's `usual`: median and ± over the last 12 complete months at the same day of the month. The width is one named input, `facts_v2.widen_to_hits`: widen around the median to hold 8 of each 10 past months, a rule and not a promise. The back-test replaces that function; every band's `method` says which made it. Under 6 months the band is null: no number, no colour. `step` is the ladder from SPEC section 3. `spread` is unrounded; the app rounds for show.

## No spend or no data

Each `spend.days[]` has a `state`. `no_data` days are before `first_day` or after `data_through`, have `spend: null`, and must never read as no spending. `data_through` is the newest of the last record, statement and ledger line, up to as_of, so a silent phone does not paint days green. A hole between statements inside the range is not detected here; the `statement_missing` gate blocks those. `months[].complete` means wholly inside the data and before the as-of month, for up to 12 months, with no statement hole on any in-scope account, a silent mask on a billing account being that account.

## Icons

Every spend row and merchant has `category` and `brand`, set on the server. **The app must not match brands on names.**

- `category` is `Top` or `Top:Detail` from the ledger account, the keys of `groups` in the design's icon map. Null where no ledger account says, as on a card bill with no expense line.
- `brand` is a slug from `brands.py`, the keys of `brands` in the map and the names of its glyphs, or null. Whole cleaned name only. A suggested or unnamed merchant is null: a guess earns no logo. The owner's optional `--brands` JSON maps `merchant_id` to a slug; it stays on the box.
- Rows with no category, such as plans, can still use the map's `keywords` on their words. That chooses a category icon, never a brand.

`merchant_id` remains an identity for merging, not for icons.

## Freshness and blocked

The manifest carries `generated_at`, an ISO instant supplied by the caller through `--generated-at`, since nothing in the build reads a clock. It is not in the snapshot, so rebuilds stay byte-identical and the hash and generation do not move with the time. **The box's unit must start passing this flag.** Until then it is null: read that as age unknown, show the as-of date and no time, and no stale strip.

| State | Defined as | App shows |
|---|---|---|
| Fresh | `now − manifest.generated_at ≤ meta.stale_after_hours` (24) | "updated 6:10 am" |
| Stale | Over that | The amber strip, with the numbers |
| Blocked | `status.json` `state` is `blocked` or `failed`, and the manifest verifies and matches `status.last_good.generation` | The last good numbers, its date, and `status.reason` as one line |
| Warned | `health.state` is `warn` | Numbers as usual; `health.gates` in "How sure these figures are" |

`status.json` is `status-v1.schema.json`. It is advisory: a missing or malformed one hides nothing. Blocked and stale can both be true: one strip, reason first. `health.accepted_gaps` and `status.gate_detail.accepted_gaps` list statement gaps the owner accepted.

A block keeps both v1 and v2, because they share one manifest. A v2 that fails validation or `parts_failures` blocks the whole build through the existing `schema` and `sum_of_parts` gates. v1's own gate list does not change.

## Plan

`plan_inputs.expenses` and `plan_inputs.settings` read back the fold of `plan-events-v1.md`, after the next build. `plan_inputs.year` holds the inputs in the shape of the design engine's `DATA`, and 12 `rows` worked out by `plan_year.py`. Row 0 is Likely left, unrounded, less plans. Each later row takes one salary, so a salary left out of Likely left arrives in row 1. On the engine's own inputs the rows give its medians, kinds and steps.

Vests are shown, but counted as cash only when the owner sets `sell_vests`: "vests are never cash" holds until they say otherwise. Their spread is null from real data.

**Not in the snapshot:** the write endpoints and a read of unbuilt saves. A saved plan appears after a rebuild. A second device seeing it at once needs a GET for the fold, which is not built.

## Reports

`reports.months` runs from April of the last financial year, for cash flow and profit and loss. `reports.periods` says which financial and calendar years are whole; never show a partial one's sum as whole. `reports.audit.lines` has one row per ledger line of income, spending and investing, and sums to `months` by kind; transfers between own accounts are not lines here. `reports.flatmates` is from Splitwise exports: an estimate, kept by hand. `reports.tax` is null: no source holds sales, gains by tax year or tax paid.

## Holdings

`asset_class` comes from the instrument id, the only thing an export states; unknown is null, and is neither liquid nor safe. EPF, PPF, FD and gold have no input, so `invest.buckets.safe` is null. `estimated` is what decides the `Est` tag. `return_since` is the price change since `gain_since.since`, always shown with that date: market gain counts from when reliable data starts. `annual_return_bp` and `invest.targets` have no source. The portfolio card's "put in" is `invested`, since value − invested = gain.

## The 21 gaps

| Gap | Where it went |
|---|---|
| G01 | `plan_inputs.cushions` |
| G02 | `forecast.likely_left`, `pay_included`, `next_salary` |
| G03 | `forecast.status`, on the server |
| G04 | `position.month_ends` |
| G05 | `Holding.asset_class`, `liquid`, `estimated`; `position.liquid`. EPF, PPF, FD, gold: **null, no input** |
| G06 | `spend.usual`, `GroupLine.usual`; `days` is 13 months |
| G07 | `HeatDay.state`, `spend.first_day`, `data_through`, `MonthLine.complete` |
| G08 | `spend.month_end_forecast` |
| G09 | `Figure.spread` on due items and `usual_spend`, when measured |
| G10 | `Item.kind`, `due_date` |
| G11 | `position.month_so_far` |
| G12 | `bills.paid`, `RecurringLine.history`, `price_change_bp`; `bills.yearly` from Plan entries. Detecting yearly bills: **null, not built** |
| G13 | `Item.account`, `account_kind`, `category`. Friendly labels stay the owner's call |
| G14 | `ReviewItem.payments`, `suggestions`, `month_total`, `review.month_total`. The engine still makes one suggestion |
| G15 | `reports.flatmates`. Which lines are on a statement: **null, not matched** |
| G16 | `reports.months`, `periods`, `audit`. Tax: **null, no source** |
| G17 | `Holding.return_since`. Yearly return, targets: **null, no source** |
| G18 | `plan_inputs.year`. Long-range assumptions (`surplus`, `returns`): **null, no file** |
| G19 | `plan-events-v1.md`, `plan_inputs.expenses`. Write endpoints: **not built, not snapshot data** |
| G20 | `manifest.generated_at`, `meta.stale_after_hours` |
| G21 | `status-v1.schema.json`, the table above |

## What was bought: `purchased`

**Added 2026-11-03, additive.** `spend.days[].items[].purchased`, a non-empty list of strings: what a receipt or order lists for this payment. Metadata only: it changes no amount, and is absent when nothing holds it, so there is no `absent` entry and no empty list. `snapshot_v2.build(purchased=)` takes a transaction key to its list. No input supplies it yet: receipts and orders will. The app draws it under the payment on Spending, and nothing where it is absent.

## Fixtures

`python3 finance/fake/fixtures.py --out app/e2e/fixtures` writes one directory per data state in `e2e-fixtures.md`, with a true manifest. All invented, generated, git-ignored. `FX-V2` from that list is now `FX-V3`, since v2 is no longer the unknown version. `FX-INVALID` and `FX-VALID` are `snapshot-v2.cases.json` applied to `FX-GOLDEN`. Each `PLAN-*` also holds its `plans.jsonl`.

**Added 2026-11-03, additive.** `bills.upcoming[].unmatched_off`: paise of a payment that named no card, set against this bill, oldest first; `amount` is net of it and a bill reduced to nothing leaves the list. `forecast.due_items` keeps whole bills beside `payment_unmatched`, as before.

**Added 2026-11-03, additive.** `position.owed_split` and `position.owed[].owed_split`, each `{billed, not_billed}` in paise: `not_billed` is what was charged since the statement and is still owed, and `billed` the rest, negative when overpaid. They add up to `owed_total` and to the row. Bills and the Line count billed; Owe counts both. `position.owed[].label`: a fuller card name than `card`, when messages print more digits than the statement does. A card payment with no digits goes to the bank's only card on statements; a debit saying card payment, exactly a card's balance with no open bill, is named on that card as `paid_not_posted`.

**Added 2026-11-03, additive.** `invest.put_in_source` `{state, basis, covered_months}`. In v2, `invest.contributions` and `put_in` come from the ledger on both investing prefixes, netting money back, with no holdings input. A month in `covered_months` with no contribution was ₹0; one outside it is not known. `not_billed` in `owed_split` rests on SMS, so it is an estimate: fees and cashback never reach SMS, and the app says so.

**Added 2026-11-03, additive.** `payees.review.items[].distinct_names`: how many different names the group's rows carry. Over 1, the app refuses one correction for all of them. A bare UPI suffix or a mask never makes a key.

**Added 2026-11-03, additive.** Put in beyond the bank. `invest.put_in_source.state` may read `connected_sources`, with `sources[]` `{id, label, from, to}` and `partial_months`. `invest.contributions[]` then carries `parts[]` `{source, label, estimate, amount}` and `partial`. `covered_months` then holds only months every connected source covers: only those read ₹0. A month in `partial_months` says partial, with or without a figure. Vests stay in `invest.vests`, never here. With no funding or coverage input, all of this is absent and v2 behaves as before. An ELSS or tax-saving fund has `liquid` false: it locks for 3 years. `gain_since.cash` and `weekly` include money from outside the bank, except a wire between two platforms both held.
