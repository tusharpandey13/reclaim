# Plan page, second attempt: spec

All figures are invented. Reasoning is in `DEBATE.md`, the acceptance test in `COLD-READ.md`. This replaces the page structure in `../plan/SPEC.md` and keeps its storage. Section 10 lists every change.

## 1. The idea

The page says the one thing worth knowing, shows your bank balance as a picture with your big expenses on it, and lists those expenses. Everything else sits below under titles that say what it is.

Picking a month for a purchase is a calendar of 12 tiles, each already showing the answer.

## 2. Page structure (never reorders)

| # | Title on screen | Answers | Controls |
|---|---|---|---|
| 1 | No title: the opening sentence | What's the situation | Change link, when an expense doesn't fit |
| 2 | Money in your bank, next 12 months | The year as a picture | Chart or "See each month" opens the month list |
| 3 | Your big expenses | What's planned | Tap: move, change, cancel |
| 4 | Should I invest my cash? | Cash vs invest | Invest each month |
| 5 | What if something changes? | Household, job, parents | 3 rows, each a try-out screen |
| 6 | Where will I be in 5 years? | Long range and stocks | 3 stock choices |
| 7 | What this is based on | Sources, cushion levels | Soft cushion, hard cushion |

"Plan a big expense" is fixed above the tabs on phones, and sits under the chart on desktop.

Desktop, 1000 px up: two columns, as `../SPEC.md` section 2 assigns them. Pick-a-month shows tiles and chart side by side.

**Headings.** Every section has a plain title, and the answer follows. Tokens, type and shape come from `../mocks/assets/tokens.css` and `till.css`, inlined at build. Plan holds no copies.

## 3. Opening sentence

First rule that applies. Computed, never free text.

| Priority | When | Heading | Line below |
|---|---|---|---|
| 1 | A month's median is under the soft cushion, and an expense lands on or before it | Car does not fit in June. | In June, you would need to sell ₹88k of investments. *or* In June, you fall ₹20k below your ₹25k soft cushion. |
| 2 | Same, no expense to blame, or inside a what-if | Money runs short in April. | Same |
| 3 | A month "Could dip" | March could get tight. | March balance: ₹53k ±45k. |
| 4 | Otherwise, with expenses | Your 3 big expenses fit. | Lowest bank balance: ₹30k ±5k, end of November. |
| 5 | Otherwise, none | No big expenses planned yet. | Same |

Rule 1 names the latest expense on or before the first bad month. The line reports the worst month from there on. If that month needs selling, the heading and line sit on the filled `r3` band.

## 4. Status

**The rule lives in `../SPEC.md` section 3, "One rule for cash against the cushions", and in code in `../mocks/assets/shared.js`. Today and Plan use the same one.** That includes the kinds (sell, dip, could, just, fits), green must be earned, and red by amount (pale for dip or could, medium for must sell, deep for selling over 5% of liquid money). This file records only what is specific to Plan.

**Plain words.** Sentences say "your ₹25k soft cushion" and "your ₹10k hard cushion". The chart says "Soft cushion ₹25k, hard ₹10k". This replaces "cushion" and "minimum", which were one more thing to learn beside Today's words.

**What is compared.**
- Chart, month list: each month's own `m`, `h`.
- Tiles and expense rows: the worst month from the chosen month onward, with this expense in place, and all other expenses. Green in tiles uses the lowest `lo` from that month on as its score.

**Why the second green test exists:** on invented data the history bar alone gave 4 greens, because a forecast has nothing sweeping cash out, so later months always look high. No `g3` on this page.

### Test on invented data

`work/test_engine.js`, output in `work/engine-test.txt`.

| Situation | Ink | Pale red | Medium | Deep | Green |
|---|---|---|---|---|---|
| **Opening state** | **8** | **1** (Mar) | 0 | 0 | **3** (Aug, Sep, deep Oct) |
| No expenses | 9 | 0 | 0 | 0 | 3 |
| Car in August | 9 | 1 | 0 | 0 | 2 |
| Car in June (conflict) | 8 | 1 | 2 | 0 | 1 |
| Household +₹22k, ₹50k set-up | 5 | 0 | 7 | 0 | 0 |

Car tiles, ₹2,22,222: deep from Nov to May (₹2.2 L down to ₹1.3 L), medium in Jun (₹88k) and Jul (₹44k), then Fits, Fits, Fits easily. Across 32 invented situations (384 months): ink 59%, green 19%, pale 10%, medium 11%, deep 2%. The red share comes from situations built to be stressed, so it says nothing about a real year.

### No legend

Each state has a word or a sentence, so colour is never alone. On the chart: diamonds for warnings with the month bold on the axis, discs for earned green, and a caption line under the chart saying the months: "Aug, Sep, Oct: far above your usual balance." Marks use the strong form of the step. One sentence says what the band is. The opening sentence covers a single "could" month, so the caption doesn't repeat it.

### The chart floor

No black line. Soft cushion: dashed `r2`, 2 px. Hard cushion: solid `r3t`, 2 px. Same as Today, by the owner's decision. They differ without colour. The pink zone fades over its last 35%, so its edge does not read as a floor. Month ticks at 5 and 3 px. Band `t2` at 50%, no outline. Flags use the first word, never `…`. The open question from `COLD-READ.md`, whether the line reads as zero, has not been re-tested with a reader.

**Icons.** Rule in `../SPEC.md` section 8. Expense rows and chart flags use `iconFor({name: title})`. A flag with no category match has no glyph.

## 5. Planning an expense

1. Tap **Plan a big expense**.
2. Type what and how much. The amount shows ₹ and lakh commas as you type. "How will you pay?" defaults to all at once (others: over 3, over 6). Tap **See which months work**.
3. **When can you buy it?** In this order: title, the chart at 160 px, 12 tiles at 4 × 3, ways to fix, a foot pinned to the bottom. The chart sits above the tiles, so the consequence is in view while you choose. The earliest month that Fits is chosen on arrival. Tap any other, and the line moves there over 220 ms. A dashed "Without it" line stays still. Only this expense's flag shows, with no end label and no Today label. The foot says what the month means.
4. Tap **Save: Car in August**. Back on the page, with Undo for 6 seconds.

**Best month.** Earliest Fits; failing that, earliest Just fits; then earliest Could dip; failing all, the smallest shortfall. Same reasoning as before: cash builds, so "latest" would always win.

**When it conflicts.** Choosing a month that Dips or Sells shows "Ways to fix this". It names who shares the money ("Laptop and Trip are using the same money"), then offers up to 2 fixes: buy this later, or move another expense. Tapping "Move Laptop to August" is tentative and only saved with the expense. Expenses marked "This date cannot move" are never offered. Saving a bad month is allowed; the button says **Save anyway** and becomes secondary, and the opening sentence then says so, on a filled band if it is critical.

## 6. Cash or invest

Formula: **Today's cash = cushion + costs + free**.
- `free = max(0, min(cash − soft, lowest lo over 12 months − soft))`.
- costs = the remainder. Label: "Costs before your next salary". On rare months it also includes later needs; the label may need a rule.

**From when, how much more.** `from` = first month after the last month with `lo < soft`. `extra = min over t ≥ from of (lo(t) − soft) / (t − from + 1)`, rounded down to ₹1,000. Tested: applying it leaves every later month's low end clear. Plain: "From April, you could invest ₹17k more each month."

The invest stepper is the only input here, and is stored.

## 7. What-ifs

A separate screen titled with the question, with "This is only a try-out. Nothing is saved." The main page always shows the real plan. Never visible to Today or Bills.

| Screen | Inputs | Answer |
|---|---|---|
| Household | Change per month, starting when, one-time cost | Opening-sentence rules, left each month, 5-year difference, chart with today's line dashed |
| Jobs | Take-home, starting when, months with no pay | Same, plus RSUs lost, "Check this against your offer" |
| Parents | Their money, what they use each month, their stocks | Yours, theirs and together at 5 years; lasts or runs out; two fans on one scale |

Parents' path rules stand from `../plan/SPEC.md`: typed figures, its own fans, can't pay for expenses, "Check with someone qualified". The "together" ± adds both ends of the same market paths, which is cautious.

## 8. Long range

Reused from `../plan/SPEC.md` section 8: seeded, 1,000 paths, annual, same assumptions, median ± is (p90 − p10) / 2. One change: **cash no longer earns market returns**. Before, all surplus went into the market, so the invest setting barely mattered. Now only invested money grows, and surplus stays in cash at 0%. Answers such as "adds about ₹96k by year 5" are what that setting really does on this data. Year 1 cash is the forecast's October balance. Later years add `12 × (pay − costs − invest)`. Still no tax, pay rises or new grants.

Three stock choices (40, 60, 80%), each showing 5-year result and a bad-year loss of 35% on that share. A dashed "if markets gave nothing" line shows how much is just saving. "More stocks mostly widens the range" appears only if the median moves less than the ± does.

Simulator limits I carried forward as requirements: seeded paths; no short-history bootstrap; annual steps hide falls within a year, as the page states; text computed, so it can't go stale.

## 9. Stored data

`plan.events.v1`, as designed in `../plan/SPEC.md` section 5, is kept: append-only JSONL, `eid` for safe retries, current state as a fold, undo as one more event. Payloads are never logged. Names need reconciling with `docs/contracts`, which I did not read.

```json
{"v":1,"eid":"e-9f2c","at":"2026-11-02T21:14:00+05:30","op":"create","id":"pln_0003",
 "data":{"title":"Car down payment","amount":222222,"ym":"2027-08","by":null,
         "flex":"any","spread":1,"status":"planned","match_hint":null,"note":null}}
{"v":1,"eid":"e-9f30","at":"…","op":"update","id":"pln_0001","base_rev":1,"set":{"ym":"2027-08"}}
{"v":1,"eid":"e-a002","at":"…","op":"set","set":{"soft":25000,"hard":10000,"invest":66666,"eq":0.8}}
```

**Into forecasts.** Unchanged: plans are forecast lines with `source:"plan"`, and they never write to the ledger. Today shows only this month's plans. Bills shows them in their own group. Only statements close a plan. Both double-counting traps in `../plan/SPEC.md` section 6 still apply.

**New data needed:** last 12 month-end balances, for green. Everything else as `../plan/SPEC.md` section 13.

## 10. What changed from `../plan/SPEC.md`

| Topic | Before | Now |
|---|---|---|
| Opening | Spare-based sentence | Exception-first, 5 rules |
| Concepts on first screen | Spare, room, cushion tick, hatching, Tight, 3 greens, chips | Soft and hard cushion (with figures), ±, one band |
| Year | 12 rows | One chart, month list one tap away |
| What-ifs | Chips, banner, whole-page mode | Separate try-out screen |
| Status | Ladder; green on clearing | The shared rule in `../SPEC.md`: two cushions, green earned, red by amount |
| Sell ₹X | To half the cushion | To the cushion: `soft − m` |
| Placing | 12 rows | 12 tiles |
| Add form | Five fields, including by when and can it move | Three. `by` is null. `flex` defaults to `any`; "cannot move" is on the expense |
| Sections | 10 | 6, plus the opening sentence |
| Bad year | Section with 3 durations | One figure per stock choice |
| Allocation | Mix names, US share | Plain percentages. US share not a control; shown in a bar |
| Long run | All surplus in market | Cash at 0%, only investing grows |
| Storage | Plan events | Same, plus `op:"set"` for settings |
| Drag, dots, horizons | In prototype | Gone |

Kept: event model, fold, match flow, double-count traps, forecast arithmetic, simulation, parents' money kept separate.

## 11. Prototype and checks

`mocks/plan.html` is self-contained: fonts, CSS and JS inlined, no network. Arithmetic is in `work/src/engine.js` on invented data, and choices change every number. Events persist in this browser's localStorage. `?reset=1` clears them.

Checked by `../work/freeze-final/audit.py` under touch emulation at 360, 390, 430, light and dark, plus desktop, per state. Summary in `../FROZEN.md`:
- No overflow, contrast at or above 4.5:1 for HTML and SVG text, targets at or above 48 px, nine type sizes plus the wordmark, no pale text, no script errors, no external requests. Planted faults confirm the audit catches overflow, contrast, targets, stray sizes and pale text.
- SVG data marks are decorative; contrast covers text only. Chart label overlap is checked by script for text against text. Text crossing a line is reviewed by eye: the flag can cross the dashed line, with a halo.
- Saved plans survive a reload. Moving, cancelling, partial and over-plan payments are tested in `work/test_engine.js`.

**Not verified:** a real phone or thumb, an actual user, real data, whether ± holds in a back-test, Android font scaling, screen readers, PWA install, the endpoint, and lower screens beyond my own reading. Back-test month-end ± against their history before it goes in the top sentence.

This is arithmetic for planning, not financial, tax or legal advice.
