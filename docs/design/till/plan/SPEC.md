# Plan page: spec

All figures here and in the mocks are invented. Reasoning is in DEBATE.md. Working name "Till" comes from the design language in `../SPEC.md`.

## 1. The idea in three lines

- Plan opens on the owner's next 12 months against the cushion, with long range lower (confirmed by the owner), not on a 10-year chart. The page's first job is "what can I do with my money this year".
- One function, **room**, answers four questions they asked as separate ones: how much is spare today, when can I afford this, does it dip into the cushion, and how much to hold as cash.
- Placing a big expense shows the answer for all 12 months *before* they choose, so placing is a tap on a list of answers, not a trial by dragging.

## 2. The opening line

The page's first heading is a sentence with figures, built by the first rule that applies. It is never free text.

| Priority | Rule | Line |
|---|---|---|
| 1 | Some month ends below half the cushion, and a plan lands on or before it | **Car in Jun** means selling about ₹1.3 L. Move Laptop to Aug and it clears. |
| 2 | Some month ends below the cushion, and a plan lands on or before it | **Car in Jun** dips ₹56k into your cushion, back by Aug. Move Laptop to Aug and it clears. |
| 3 | Rule 1 or 2 with no plan to blame | Cash ends Nov about ₹67k below half your cushion. |
| 4 | Otherwise | ₹89k ±12k is spare today, ₹1.9 L ±65k by Feb, after your plans. |

The second figure in line 4 is the first later month where room rises by at least max(today's ±, ₹50k). If none does, the clause is dropped. "Move X" appears only if the app found a move that clears it.

## 3. Page structure (never reorders)

| # | Section | Answers | Controls |
|---|---|---|---|
| 1 | Opening line | What can I do now | none |
| 2 | What-if chips and banner | What if household or job changes, or parents' money joins | Household, Job switch, Parents' money |
| 3 | **The year**: 12 rows, one per month | Where each month ends against the cushion | Tap a month for its arithmetic |
| 4 | "Plan a big expense", fixed above the tabs | Add one | Button |
| 5 | Planned list | What is planned, what happened | Tap: move, edit, cancel |
| 6 | Cash split | How much cash vs invest | Cushion months, invest monthly |
| 7 | Mix | INR vs USD, how much in stocks | 3 mixes, each showing its result before choosing |
| 8 | Long run | Where this leads | 4 horizons |
| 9 | A bad year | How big a downside I can survive | 3, 6 or 12 months without pay |
| 10 | What this rests on | Entered vs data vs assumed | none |

Desktop (1000 px and up): sections 1–4 pinned on the left, the rest on the right. Place mode covers only the left column, so the right column stays visible.

### Which decisions get what

| Decision | How often | Reversible? | Gets |
|---|---|---|---|
| When can I afford a big thing | Whenever one comes up | Mostly not, once paid | The opening line, the year, a focused screen |
| Cash vs invest | Monthly | Yes | **Output**, not a slider. Two steppers feed it |
| Stocks vs safe, INR vs USD | Once or twice a year | Yes, at some cost | 3 choices with consequences shown. No slider |
| Job or household change | Rare, high stakes | n/a | One sheet with 2–3 inputs and a live answer |
| Parents' money | Rare | n/a | A labelled scenario, off by default |
| How big a downside | Rare, to reassure | n/a | One fixed stress test, one 3-way choice |

## 4. Placing a big expense

**Add sheet.** What, how much, by when, can it move (only then / earlier is fine / any time), paid (all at once / over 3 / over 6). Only the first two need typing. The button says "See where it fits".

**Place mode.** Focused screen, tabs hidden. One row per month:
- The bar shows month-end cash *with the plan where it currently sits*. Bars are neutral `t3` here; only position against the cushion tick matters. The right column carries the status chip.
- The right column shows *what would happen if it went in that month*: Fits, Tight, Dips ₹X, Sell ₹X, with "Best" on one row and "After Jun" on months past their date. Months past the date still show their answer, so a fit two months late is visible.
- Tap a row to choose. Best is chosen on arrival.
- Foot: what this month does, in a sentence, who else is competing, the effect on the 10-year median, one-tap fixes, and "Save in Jun".

**Best month rule.** Within the allowed window: the earliest month that Fits; failing that, the earliest Tight; failing that, the smallest dip; failing that, the smallest sale. Earliest wins among fits because cash only builds over the year, so "latest" would always win and would mean never buying the thing.

**When plans compete.** Each row is computed with every other plan in place. If a row dips or sells and would not without the others, the foot names them: "Laptop and Trip are taking the same money". Fixes search for (a) the earliest allowed month for this plan that clears, and (b) moving another movable plan. Fixed plans never move. At most 2 fixes. Saving a bad placement is allowed: it is their money, and the opening line then says so.

**Drag.** The selected row has a grip. Sliding it changes the month live. It works under simulated touch (section 11). It is in the prototype to test the question, and it is **not in the first version**: tap already gives the same result, and it hasn't been tried with a real thumb.

## 5. Stored data

Written by the small authenticated endpoint to one append-only JSONL file under `RECLAIM_DATA_DIR`. Proposed contract name `plan.events.v1`. I did not read the repo's `docs/contracts`, so names and location need reconciling with it.

I recommend a file separate from the existing corrections file, with the same conventions. Replaying statement corrections must never be able to touch a plan, and a separate file makes that structural rather than a rule to remember. If the owner prefers one file, add a `kind` field; nothing else changes.

```json
{"v":1,"eid":"e-9f2c","at":"2026-11-02T21:14:00+05:30","op":"create","id":"pln_0005",
 "data":{"title":"Car down payment","amount":444444,"ym":"2027-06","by":"2027-06",
         "flex":"earlier","spread":1,"status":"planned","match_hint":null,"note":null}}
{"v":1,"eid":"e-9f30","at":"…","op":"update","id":"pln_0005","base_rev":1,"set":{"ym":"2027-08"}}
{"v":1,"eid":"e-a112","at":"…","op":"status","id":"pln_0005","to":"cancelled"}
{"v":1,"eid":"e-b220","at":"…","op":"match","id":"pln_0005","txn":"stmt:2027-08:0417",
 "amount":452222,"ym":"2027-08","source":"statement","closes":true}
{"v":1,"eid":"e-b310","at":"…","op":"unmatch","id":"pln_0005","txn":"stmt:2027-08:0417"}
```

| Field | Meaning |
|---|---|
| `eid` | Made by the client. The server ignores repeats, so retries from a phone on a bad train connection are safe |
| `id` | The plan. Never reused |
| `amount` | Whole rupees, INR. USD expenses are later |
| `ym` | Chosen start month |
| `by` | Latest wanted month |
| `flex` | `fixed`, `earlier`, `any` |
| `spread` | Months, equal parts |
| `base_rev` | Revision the edit was made from. A mismatch means "changed elsewhere": last write still wins, and the app notes it. One owner, so nothing more |
| `txn` | Statement transaction id |
| `closes` | Whether this payment finishes the plan |

Current state is a fold over the file (`fold()` in the engine, tested). Nothing is ever rewritten. Undo is one more event. Payload contents are never logged, and the file is covered by the existing backup rule. It holds titles and amounts typed by the owner.

**Offline.** The PWA appends to a local queue and shows the result at once with "Saved on this phone". It becomes "Saved" after the server acknowledges. The prototype stores to the device only.

### States

```
planned ──match(closes)──▶ paid ──unmatch──▶ planned
   │  ▲
cancel restore
   ▼  │
cancelled
```

Derived, not stored:
- **Partly paid:** planned, with a payment on it and some amount remaining.
- **Overdue:** planned, its last month has ended, no match. It stays counted and rolls to the next month so the forecast stays cautious. The Today chores slot asks "Did the Trip happen?": Not yet, keep it / Cancel it.

## 6. Into the forecast, Today and Bills

Plans are one more input to the forecast, as lines with `source:"plan"`. No plan line writes to the ledger. Statement figures, balances and Have/Owe/Own never change because of a plan.

```json
{"ym":"2027-06","lines":[{"label":"Car down payment","amount":-444444,"source":"plan","plan_id":"pln_0005"}]}
```

| Surface | What appears | What doesn't |
|---|---|---|
| Today, Likely left | Only plans due this month. Line row with a `Plan` tag. Tap shows the sum with and without the plan | Have, Owe, Own. Next month's plans |
| Today, chores slot | "Is ₹X on 14 Feb the Laptop?" and overdue questions | |
| Bills | Own group, "Planned, not bills", with `Plan` tags. Yearly view includes them. Hatched tag on the due strip | "To pay" totals. A "mark paid" button: statements close plans |
| Plan | Everything | |

A saved plan shows immediately on the phone, because the client merges unsynced events into the last forecast. The server's daily run picks it up after that. Sketch: `mocks/flow.html`.

**Double-counting traps to handle in the forecast:**
1. *Baseline.* If usual outgoings are averaged from history, past one-offs already inflate them, and a plan would then count twice. Use a median, and exclude transactions matched to plans.
2. *Payment seen before closing.* An SMS or an unconfirmed statement match lowers cash while the plan still subtracts. While a candidate is pending, the plan line is `max(0, remaining − candidate)`.

## 7. Matching a real payment

Only statement transactions can close a plan. SMS may show "Looks paid" with an `SMS` tag and apply trap 2 above.

A candidate is a statement debit within the window from one month before the plan's first month to one month after its last, for between 75% and 125% of the remaining amount, or containing `match_hint` if set. The best one goes to the chores slot. **Nothing closes without one tap.** Any payment can also be attached by hand from the plan's sheet.

| Actual vs plan | What the owner chooses | Result |
|---|---|---|
| Same | Yes, done | Paid |
| Higher | Yes, done | Paid. Row shows "+₹7,778 vs plan". Statement figure is the truth; only the difference alters later months. Black, because it is past and nothing can be done |
| Lower, finished | Yes, done | Paid. The rest returns to room |
| Lower, more to come | Yes, more to come | Partly paid. The remainder stays planned, no double count |
| Wrong match | That wasn't this payment | `unmatch`, back to planned |
| Never happens | Cancel | Cancelled, out of all forecasts, kept in history |

Edits go through `update`. A paid plan's planned amount can still be edited as a record, but that changes no forecast. Later: use "your last 5 plans ran 8% over" to suggest a margin.

## 8. Arithmetic

Implemented in `work/src/engine.js`, tested in `work/test_engine.js` (output in `work/engine-test.txt`).

**The year (deterministic, with explicit variance).** For month t:
`end(t) = end(t−1) + salary + RSU net − usual outgoings − known bills − investing − plans`
Month end means just before the next salary, matching Today's "Likely left". If salary lands at a different point in the month, this must follow it. Otherwise a month looks richer than its low point.

`± (t) = 1.2816 × √(Σ monthly outgoing variance + Σ vest variance up to t)`: half-width of a central 80% interval. RSU variance covers share price, exchange rate and tax rate together. Assuming independence is a simplification.

**Room.** `room(m) = min over t ≥ m of (end(t) − cushion)`. It looks forward, because a later bill can make an early purchase unsafe. It carries the ± of whichever month sets it.

**Cash split.** Cash today = cushion + spoken for + spare, where spare = max(0, room(now)). "How much to hold" is therefore computed. They adjust it only through cushion months and monthly investing.

**Long run (seeded simulation).** 1,000 paths, 10 annual steps, in today's money, seed fixed. The same paths are used for every comparison, so a difference between two choices comes only from that choice and moving a plan never makes the chart jitter. Under a millisecond per run in headless Chromium on a laptop; a phone will be slower.

`pot(y+1) = pot(y) × (1+r) + saved(y) × (1 + r/2)`, rebalanced yearly to the chosen mix. The cushion is held in cash at 0% real.
- `saved(1)` comes from the year's rows, including plans and what-ifs. `saved(y>1) = 12 × (last month's pay − last month's outgoings)`: pay is flat in today's money and no future RSU grants are counted.
- Returns, set by hand and shown on the page:

| Asset | Median above inflation | Yearly swing | Other |
|---|---|---|---|
| India stocks | 5% | 18% | Correlation 0.5 with US, a shared factor |
| US stocks in INR | 5% | 17% | Includes currency |
| Bonds, EPF | 1.5% | 3% | |
| Both stock assets | | | Each path gets a persistent ±2% drift drawn once, for not knowing the long-run return. Each year, a 1-in-12 chance of a 25% crash |

**Data source and fallback.** The source is `plan-assumptions.json`, shipped with the app and changed by hand. **The app's market history may tighten these only toward caution:** `median = min(assumed, observed − 2 points)` and `swing = max(assumed, observed)`. If no history is available, the assumptions stand as they are. The app never falls back to the owner's own returns.

Why not bootstrap their history, as the earlier simulator did? I tested it on the same invented portfolio: resampling a dozen calendar years of a public index gave a ± only **0.62–0.64 times** as wide as this model, at every horizon. That sample was also a strong stretch, so it flatters both ways.

**Median ± rule.** `± = (p90 − p10) / 2`. Outcomes lean upward, so a symmetric ± understates the top and overstates the fall. Checked on the model: median − ± is below the true p10 and median + ± is below the true p90 at all four horizons, and the stated interval holds 80–83% of paths. So it errs cautious on both ends. This is true of the model and says nothing about the real world.

**Formatting.** `₹89k ±12k`, `₹1.4 Cr ±46 L`, the same format as Today, with no `~`. The owner asked for ± in k INR. It stays in k under ₹1 L, and moves to L and Cr above that because "± 4,600k" can't be read in lakh and crore. ± rounds outward. Median is 2 significant figures.

**Limits, stated on the page.** No tax. No salary growth. No future grants. Annual steps hide falls within a year. Assumed returns are a judgement. Independent years may overstate long-run bad outcomes (Kitces, DEBATE.md #6): that is the error I chose, since too-wide costs little and too-narrow encourages risk. Rebalancing has no cost. Beyond about 5 years the band reflects assumptions more than anything about them.

**Bad year.** No simulation. Stocks −35%, pay stops next month for 3/6/12 months, investing stops, flexible plans wait, fixed plans are paid. Cash below zero must be met by selling. Sellable = stocks after the fall + half the safe bucket (some of it, such as EPF, isn't quick to reach). Vests stop too, the same as a job loss.

## 9. Allocation

They set: cushion months, monthly investing, one of three mixes, and US share (20/40/60). Everything else is computed.

No slider walls. Each mix row shows its own result before choosing: `Growth, 80% stocks, bad year −₹16 L, ₹1.4 Cr ±46 L in 5 years`. Choosing changes the fan at once. The current split (from data) is the bar, the chosen split is the tick, and one sentence says where the next month's investing goes.

**Entered vs data.** The assumptions section has three labelled groups: From your data, You set, Assumed. Controls carry "You set this". The cash line carries "your data". The family path carries a "Scenario, hand-entered" label.

## 10. What-ifs

Temporary. In memory, never saved, never visible to Today or Bills. A banner says so. An outlined tick on each row marks the month without the what-if. The opening line and every figure below it follow the what-if, except the family path.

| What-if | Inputs | Live answer in the sheet |
|---|---|---|
| Household | Change a month, one-time set-up, from which month | Spare by the 6-months-on month, worst month, monthly surplus, effect at 5 years |
| Job | Switch month, new take-home, months without pay | Same, plus "Vests lost: May, Aug, about ₹3.6 L". It assumes unvested RSUs stop, which they should check |
| Family path | Their amount, more next year, monthly draw, their mix | Together at 5 years, theirs alone, whether theirs runs out |

**Family path rules.** Off by default. Every figure is typed. It appears in its own box with its own fan in hatching, never on the owner's chart, and "Yours" and "Theirs" are shown side by side. It can't fund a plan and does not change room, the year or the opening line. On the page: "Tax treatment and scheme eligibility differ by person, and this adds the money as one pot, which it would not be. Check with someone qualified before moving any." It uses the same market paths as the owner's, so the two rise and fall together; that is cautious for the "together" figure. The path is the same simulation with a negative flow, not a spend-down model. For a real decision on that money, this page isn't enough.

## 11. Status colours

Same ramps, cushion and ladder as `../SPEC.md` section 3. The cushion is half a month of essentials, ₹25k, and Nov ends at ₹30k ±5k here and on Today. Always with a word or position too. **A figure gets a status only if a threshold has a consequence.**

| Figure | Green | Ink or pale red | Strong or deep red | Words |
|---|---|---|---|---|
| Month-end cash `e`, `±` `h`, cushion `c`: bar and chip | `g1` to `g3`: `e − h` ≥ 1×, 2×, 4× `c` | Range crosses `c`: ink if `e ≥ c`, `r1` if under | `r2`: `e + h < c`. `r3`: `e < c/2` | none / Tight / `r2` Dips ₹X / `r3` Sell ₹X |
| Placing a plan, m | `g1`: all months from m clear | Worst from m is Tight | `r2` or `r3` by worst month | Fits / Tight / Dips ₹X / Sell ₹X |
| Spare today `r` | `r − h ≥ 0` | `r ≥ 0` otherwise | `r < 0` | Position in the sentence; "short" if below zero |
| Monthly surplus in a what-if `s`, investing `i` | `s ≥ i` | `0 < s < i` | `s ≤ 0` | Covers investing / Under what you invest / Below zero |
| Bad year | Cash alone stays ≥ 0 | Needs selling, and enough is left to sell | More needed than can be sold | Safe, on cash / Survivable, by selling / Critical |
| Employer stock share of investments | < 10% | 10–20% | > 20% | Fine / Getting large / Too much in one stock |
| Family money | Lasts 10 years, median | | Median hits zero | Lasts / Runs out |

**Half the cushion is the line where selling begins.** It is a judgement: a short dip is what a cushion is for, and selling investments to protect the last part of it is the bigger step.

**Never coloured:** net worth medians and the fan (a green 10-year figure would be false confidence), the mix, the US share, drift from target, paid vs plan differences. I tried colouring "chance of ending below what you put in" red at 25% or more. The model gives 24–40% up to 5 years in all three mixes and 15–24% at 10 years. So it was red nearly always in the near term, for an ordinary reason: recently saved money has had little time to grow. I removed it.

## 12. Fit with the design language

Plan builds from the live `../mocks/assets/till.css`: same paper, type, tabs, answer headings, ramps, `.sc` chips, spacing scale, median ± format and trust tags. `SMS` marks cash today, `Est` marks holdings that are estimates, `Plan` marks planned lines. No italics and no `~`. Its fan and allocation use indigo and never a status.

One difference: the fan has 4 median dots where the old spec said no centre line. There is still no line, and the owner asked for a median.

## 13. Data needed

| Needed | Used for | Status |
|---|---|---|
| 12 monthly forecast rows with a variance | The year | Today's forecast covers one month as far as I know. **May not exist** |
| Known yearly bills, by month | The year | Bills has yearly; needs a month |
| RSU vest schedule: dates, units, price, tax rate, sell-at-vest or hold | The year | **Probably hand-entered** |
| Outgoing variance by month | ± | From spend history; should exclude matched plans |
| Liquid cash today, separated from investments | Cash split | Likely exists; "liquid" needs a definition |
| Holdings split: India, US, employer, safe | Mix | Exists on Invest, employer split unknown |
| Monthly investing, as a planned figure | The year | **Probably hand-entered** |
| Essentials per month, for the cushion | Cushion | **Needs a definition**; hand-entered first |
| Salary date, exact | Month end | Likely in the data |
| Plan endpoint and file | Storing | **New** |
| Statement debits with ids, in the daily data | Matching | Likely exists; ids must be stable |
| `plan-assumptions.json` | Long run | **New** |

## 14. First version vs later

**First version, in build order.** Each slice is usable on its own.
1. Year rows, opening line, add, place by tap, save, planned list, Today and Bills lines. This is the actual new request.
2. Match prompt, closing, differences, overdue.
3. Cash split with its two steppers. Fan with 4 horizons, 3 mixes, assumptions section.
4. Household and job what-ifs. Bad year. Family path.

**Later, each only when asked for or tested:** the grip drag; 20-dot view (see DEBATE.md #5 on a caution from retirement-investing research); US share control and next-month sentence (show current split only at first); employer stock line; amount uncertainty on a plan; USD-priced plans; plans beyond 12 months (first version: `by` limited to the 12-month window); saved scenarios; "your plans run 8% over".

## 15. Verified and not

Scripts under `work/`. `work/audit.json`, `touch.json`, `edge.json` hold output.

- **Checked by script, 360/390/430, light and dark, 21 states, rerun after the design revision:** no horizontal overflow, text contrast ≥ 4.5:1 for all text including SVG, targets ≥ 44 px, no script errors, no external requests. The only text clipped is the deliberate ellipsis on long names in place mode. An earlier planted fault confirmed the audit catches each kind.
- **Simulated touch through Chromium's touch input:** tap selects. Grip slide changes month and figures. A diagonal "thumb arc" slide works. Swiping elsewhere scrolls without changing selection. Mouse drag works on desktop.
- **Found by that test:** at 360×640, an early version's auto-scroll overshot by a month during a slide. Slowing it fixed that case. There, only 7 of 12 rows show at once. At 277 px wide (a stand-in for large text) only about 5 show, and the foot takes too much height; a real build should collapse the foot.
- **Arithmetic:** tested for moving a plan, closing, partial payment with no double count, unmatch, and only the difference moving later months.
- **Not verified:** real phone or thumb, PWA install, real data, real forecast accuracy, screen reader, Android font scaling, the endpoint (the prototype stores on the device), whether ± would hold in a back-test, and whether assumed returns are reasonable. **Back-test the month-end ± against their own history before it goes in the headline; printed ± should hold about 8 times in 10.**

This is arithmetic for planning, not financial, tax or legal advice.
