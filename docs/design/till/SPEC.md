# Reclaim: design spec

**Frozen 3 November 2026; see `FROZEN.md`.** An engineer can build from this file plus `plan2/SPEC.md`. Reasoning is in DEBATE.md, the design review in `review/REVIEW.md`. All figures in the mocks are invented. The app is named Reclaim. "Till" survives only as the name of the design language and its files. The Plan tab now opens `plan2/`; `plan/` is kept as history.

**Files that hold the design:** `mocks/assets/tokens.css` (every value, the one source), `mocks/assets/shared.js` (the status rule and data states), `mocks/assets/till.css` (components), `mocks/assets/till.js` (mock charts), `icons/` (icon files, map and React export; section 8), `plan2/work/src/` (Plan; `plan2/work/build.py` inlines the shared files, so Plan cannot drift).

## 1. The idea

Home is one column of time. It answers "how much will be left, and what is going to take it", then lists where you stand. Everything else is a plain-named tab.

Why this could only be this app:
- The headline is a median and ± that visibly tightens as the month passes.
- Red, ink and green are measured against the owner's own two cushions and own usual spending, in steps that say how far, not a generic budget.
- Column width shows money draining, on one fixed scale, and it changes state as it crosses the cushion.
- Unconfirmed money is stated in a sentence, once: "83% of November is on a bank statement", with "See what is not confirmed" one tap away.
- Lakh-grouped figures are the main visual element, not an afterthought.

## 2. Structure

| Where | Answers | Reached by |
|---|---|---|
| **Today** | Jobs 1, 2. Then trends, variability, heatmaps | Tab |
| **Spend** | Job 3. Pace chart, usual-band rows, treemap, group by month matrix, month calendar, filters. Lists one tap away | Tab |
| **Spending** | The payments behind any amount: payees by money, each opening to its payments, with date, time, whether on a statement, refunds and items when held | "See all" from a tapped block, cell, day, bar or row. Own URL, Back returns |
| **Name payees** | Last-mile fixes | From Spend, Today chores, any "Needs a name" row |
| **Bills** | Job 2. Due strip, to pay, price changes, paid, yearly | Tab |
| **Invest** | Portfolio card first (value, put in, gain, India vs US, each holding). Then the year with past events and a small upcoming strip, holdings, targets | Tab |
| **Plan** | Job 5. Opens on 12 months against the cushion. Long range lower. Household what-if, parents' path, assumptions. Spec in `plan2/SPEC.md` | Tab |
| **Reports** | Job 4. Prepared outputs, each row with Preview and Download or Share buttons naming the format | Text link, top right of every page, carrying that page's filters |

Tabs are words only. Android guidance caps them at five. Reports is the sixth destination and goes in the corner. Desktop (1000 px and up) moves the tabs to a left rail.

### Desktop: two columns, each with a job

**Owner's decision, 3 November: three columns were too tight and the split had no logic, but columns stay. "Ideally there should be a primary info and secondary info col, or an action and an info col."** One rule for every page, at 1000 px and up:

- **Two columns, never three.** Left is primary and wider: the page's answer and main content. Right is secondary, or actions. Up to 1320 px of page (`--page`), split 1.25 to 1, and the right column never goes under 344 px, so a 7-column calendar holds 48 px.
- **Each column reads top to bottom on its own.** Nothing is pinned or placed by height. The phone keeps its order, one column, unchanged.
- **Every page's split is stated here**, and a section goes where its job says, not where it fits:

| Page | Left: primary | Right: secondary or actions |
|---|---|---|
| Today | Likely left, Where you stand, What is coming | Before the month turns, spending checks, trend, year grids, How sure |
| Spend | The answer and filters, pace, each group | Where it went and looking back: who gets the money, month by day, largest days, group by month |
| Plan | The statement, 12-month chart, Plan a big expense, big expenses, 5-year view | What you can change or check: invest stepper, what-ifs, what this is based on |
| Invest | Portfolio, holdings | The year and events, targets |
| Reports | The answer, period, money reports: Flatmates, Cash flow, Profit and loss | Records and your own: Audit, Tax year, Make your own report |
| Bills | One 760 px column, by the owner's approval: the list is the page | None |
| Spending | The answer and the payees | How sure: on a statement, not yet, refunds |

Focused tasks with no rail (Name payees) are one centred 760 px column. Plan's add-an-expense form and its preview stay side by side: a form and its result.

- **A section looks like a section.** A 1 px `rule` line across its column, 24 px, then its heading at `t-head`, with 48 px above the line. The top of a column has no line. Panels (the Line, the portfolio) keep their surface and take the rule. Inside a column nothing adds its own page margin, so headings share the column's left edge.
- **Columns should balance.** If one runs far longer, move a section by its job and update the table. Checked at 1000, 1280 and 1600 px in both themes.

### Rules for every screen
- The first heading is the answer, as a sentence with the figure in it. "₹44,444 so far in November", not "Spending overview". Exception: Invest's card, which is titled "Your portfolio" with its figures as separate parts.
- Every section has a title that says what it is. No section opens on an orphan instruction or a compressed clause. Test: does a tired person get it on the first read?
- Section headings are answers too, but only when computed by a stated rule from the data. If no rule fires, use a plain label ("Holdings"). Never generate them with free-form text.
- Any figure can be tapped to show where it came from.
- No cards by default. Group with space, greenbar banding in tables, and rows.
- Rows at least 64 px, controls at least 48 px, about 8 px apart. Exception: 7 calendar columns do not fit at 360 with page margins, so the calendar uses the margin and its cells measure 48.9 wide at 360.
- No legends. A colour change is named where it happens, in a word, a figure or one plain sentence under the chart.

### Home skeleton (never reorders)
1. Reclaim mark and name at the owner's 42 px with large margins, date and freshness in one small line, Reports
2. Likely left: hero range
3. "Where you stand": Have, Owe, Own
4. *Chores slot, only from about the 26th to the 3rd, only when something is outstanding*
5. "What is coming this month", the Line, on its own panel (section 3): past summary, Today, each stop, Likely left, Salary
6. Variability: category strips
7. Trend: 12 months
8. Year of months: spend tiles, invest tiles
9. "How sure these figures are": trust note

### What changes through the month
| | 16th, ordinary | 28th, under soft | 28th, under hard | Earned month |
|---|---|---|---|---|
| Hero | ₹30k ±5k, ink, "Near your ₹25k soft cushion" | ₹24k ±2k, `r2` text, tinted chip, "About ₹1k under your ₹25k soft cushion" | ₹6k ±2k, white on a filled `r3` band, "About ₹4k under your ₹10k hard cushion" | ₹1.3 L ±5k, `g2` text, "Far above your usual balance" |
| Line | Teal-blue column, red bites, green salary | Pale red column from today, both lines shown | Deep red column from today, both lines shown | Green column, and one sentence says why |
| Slot 4 | Absent | Top up cushion, name payees, send split | Same, against the hard cushion | Absent |

Positions stay the same throughout. Only the chores slot pushes content down.

## 3. Status system and colour

**Hue says what kind. Lightness says how much or how urgent. Pale steps are fills only: never text, never a thin mark, line or outline.** Text and marks on status use `r2`, `r3t` or `g2`. Scripted check: no text on any audited page uses `r0`, `r1`, `g0`, `g1`, `t1`, `t2`, `i1`, `i2` or `a0`.

### The ramps

| Hue | Step | Token | Exact meaning | Paired with |
|---|---|---|---|---|
| Red | pale | `r0` tint, `r1` area fill | Warning: under the soft cushion, or near the top of usual. Figure and mark are `r2`. Chip and tile are `r0` with an `r2` outline, ink text | `!` and a word |
| | medium | `r2f` fill, `r2` text and marks | Past it, or must sell | `!` and a word |
| | deep | `r3` fill, `r3t` text and marks | Critical, or selling a lot. White text on the fill | `!` and a word |
| Ink | none | `ink` | Ordinary, nothing to flag | Plain words, or nothing |
| Green | pale | `g0` tint, `g1` area fill | Earned, or a little better than usual. Marks are `g2` | Tick and a word |
| | strong | `g2f` fill, `g2` text and marks | Clearly ahead | Tick and a word |
| | deep | `g3` | Portfolio gain of 75% or more only | Figure |
| Ink tints | `t1`→`t4` | | Amount only, no judgement. Stronger is more | Printed value |
| Indigo | `i1`→`i4` | | Size of investing only, never a state | Printed value |
| Amber | `a0`, `a2` | | Attention: something only you can do, not a danger. Includes old data | `?` and a word |

**Dark mode.** The ramp cannot simply invert, because `r2` as text must be bright while `r3` is a saturated fill. So fills and text are separate tokens: `r2f` `#8F3B30` is a muted fill, `r3` `#C8261B` a saturated one, and deep still reads as more. `g2f` does the same for green. Plan's build carried a stale `r3` `#FFA89C`. It now inlines `tokens.css`, so the bug cannot return.

### One rule for cash against the cushions

**The one status rule for Today, Plan, Bills and every other page. `plan2/SPEC.md` refers here. Code: `STATUS` in `mocks/assets/shared.js`.**

The owner set two cushions: **soft ₹25k** (try to stay above it) and **hard ₹10k** (the line not to cross). Always written "your ₹25k soft cushion" and "your ₹10k hard cushion". For any forecast: `m` is the median, `h` the ±, `lo = m − h`. First match wins.

| Kind | Rule | Today says | Plan tile says | Step |
|---|---|---|---|---|
| `sell` | `m < hard` | About ₹X under your hard cushion | Sell ₹X, where `X = soft − m` | Critical, depth by amount below |
| `dip` | `hard ≤ m < soft` | About ₹X under your soft cushion | Dips ₹X | Pale, `r1` |
| `could` | `m ≥ soft`, `lo < hard` | Could fall under your hard cushion | Could dip | Pale, `r1` |
| `just` | `m ≥ soft`, `hard ≤ lo < soft` | Near your soft cushion | Just fits | Ink |
| `fits` | `lo ≥ soft` | Above your soft cushion | Fits | Ink, or green if earned |

**Green must be earned.** A salaried person is above the cushion most months, so that alone says nothing. `g1` needs both: `lo` beats 10 of the last 12 balances on the day before salary, the same basis as Likely left, and it is in the top 3 of the months being compared. `g2` is the top one, with `lo` at least twice last year's best. Under 12 month-ends of history, nothing is green. Words: "Fits easily" on tiles, "Far above your usual balance" elsewhere. Today compares one figure, so only the first test bites. In the mocks the bar is ₹1,22,222, which is why the earned Today state now shows ₹1.3 L, where ₹75k would be plain ink. Being covered is not an achievement: Have in bank, Owe on cards and covered bills no longer turn green.

**Red by amount.** Deeper red means a bigger amount wherever months or options are compared: tiles, expense rows, month list, chart marks.

| Depth | When | In the mock |
|---|---|---|
| Pale fill | You dip below the soft cushion, or could | Dips ₹20k |
| Medium, `r2f` | You must sell, up to 5% of liquid money | Sell ₹44k, Sell ₹88k |
| Deep, `r3` | You must sell more than 5% of liquid money | Sell ₹1.3 L, Sell ₹2.2 L |

**Liquid money** is cash in the bank plus stocks and funds you could sell within a week: not EPF, PPF, FDs or gold. With no holdings known it is not stated, so nothing can be called deep. On the invented data that is ₹25 L, so the line falls at ₹1.27 L. Selling 5% is roughly two months of investing here. The share is a judgement, not a measurement: check it against real figures and move `DEEP_SHARE` in one place if it reads wrong. It scales with the owner's money, as a fixed ₹1 L does not. Every tile prints its word and number, and when a deep month is chosen the foot says it: "You would need to sell ₹2 L, over 5% of your ₹25 L liquid money." The rule is also in Plan's "What this is based on".

**Critical is a filled red band, by form as well as shade.** When the answer on any page is `sell`, it sits on a full-width `r3` band with white text: Today's hero, Plan's opening sentence, a what-if's answer. The band is always `r3`, since it states one fact and compares nothing. Warning: `r2` figure, tinted outlined chip.

### Theme: an owner-approved extension of the freeze

**Owner's decisions, 3 November.** Light is the default when nothing is saved (this replaces "System stays the default"). A 44 px icon button beside Reports cycles Light, Dark and System, named in words. The choice alone is kept, in `localStorage` key `reclaim-theme`, and applied before first paint by `public/theme.js`, with `theme-color` in step. No other key is ever stored.

### Out of money: an owner-approved extension of the freeze

**Owner's decision, 3 November, for this state only.** When `forecast.shortfall.active`, Today's hero states it plainly: "You run out on the 24th." in the label's type, "₹18k short" in hero type, "Rent would fail." in the critical chip, on the filled `r3` band, with a link to Plan. Overdrawn already: "You are out of money today." Nothing new in type or colour. It never says sell with no holdings, on Today or Plan. The Line draws below zero: the axis opens left of a thin ink zero line, only when something goes there. Checked at 360 and 390 px in both themes.

A late salary reads "Your salary is late, so this does not count it." under the hero, and the figure leaves it out.

### Spend's opening: the last 30 days

**Owner's decision, 3 November.** "A figure in the last 30 days. Normal for you." The calendar month is empty on the 3rd. Everyday spending only, and the sub line says what is out. Under it: large one-offs by name, days not on a statement yet, then 30-day totals by week, then each group against its own usual. The month picker and the calendar view stay below for looking back. Monthly bars, the heatmap, Reports, Bills, rent, salary and Likely left stay calendar. Data: `spend.rolling`, contract section "The running 30 days".

### Spend's allocation: fixed, variable, one-offs

**Owner's request, 3 November.** "Rent will almost always be the biggest cash mover. This dwarfs any other significant activity." After the opening: fixed costs, then the map, then one-offs. Data: `spend.allocation`, contract section "Fixed, variable, one-off". Looking back with a period or filter, the map follows that view. Filtered to one group it holds all of that group, by merchant.

- **Fixed costs are a sentence, not a chart:** "₹38k a month on fixed costs. About the same as usual." The list is one tap away. A row surfaces, with an amber chip in words, only if it changed, is missing or came twice. No marker: there is nothing to point at when it is calm.
- **The map holds variable spending only, in blocks by kind of spending.** Merchant blocks were weighed and rejected on real shapes: in 30 days the largest of 43 named payees held 8%, and only 3 reached 5%, so nearly all would merge. Who got the money is one tap away in each block, and the list keeps each payee. The heading names the largest group, under the marker. If unnamed money is half or more: "Most of it has no name yet".
- **Unnamed money is one block:** a strip across the foot, as tall as its share up to 60%, and at least 64 px.
- **Large one-offs get their own row under the map** and never enter it. A laptop would otherwise be the map.
- This month's group rows leave out Housing: on one shared scale it would flatten the rest, and it is in fixed costs.

### One ladder against your usual

Usual is the median and ± over the last 12 months, measured at the same point in the month. The month total's usual is ₹64k ±6k in the mock. z = (now − median) / ±, and the difference must also be at least ₹2,000 (₹2k in matrix cells).

| Step | Rule | Word |
|---|---|---|
| `r3` | z > 2 | Far above |
| `r2f` | z > 1 | Above |
| `r1` | z > 0.75 | Near top |
| ink | Otherwise | none |
| `g1` | z < −1 | Below |
| `g2f` | z < −2 | Well below |

Being below your own usual spending is measured, so this ladder needs no further test for green.

### The Line's panel

**Revised on owner feedback, 3 November 2026:** a grey column reads as ugly, in either theme, so the column and its hatching are now a teal-blue fade (below). Green would have blurred with earned and with salary, and stays out of an ordinary month.

**Revised on owner feedback, 2 November 2026:** the grey column and dark panel read as dull, so this section reverses the last review on both. The panel is white on a light page (`#FFFFFF`, row band `#EFF1EA`) and lifted on a dark page (`#262B26`, row band `#333933`). It no longer borrows the dark tokens, so `tl` has its own small block in `tokens.css`. The hatched-edge sentence is gone: the hatching sits beside a printed ± on the same row.

**Width is your balance on one fixed scale. Each colour below has one job, and none of them is "this month is fine".** So colour shows up every month without painting a normal month green.

| Colour | Job | When | How you know, with no legend |
|---|---|---|---|
| Teal-blue column, `col-a` to `col-b` | The money you have, from today | Ordinary month. One hue fading from today down to Likely left, so it says amount and no state. `#147DA8` to `#2F97B8` on light, `#52AEDC` to `#2A80AC` on dark. Hue stays at least 25° from investing's indigo | The sentence under the column |
| Paler teal-blue, `col-past`, with `bite0` for what left | Money already behind you | Rows before today. Past money never turns red | Row says "1 to 15 Nov" |
| Red bite, `bite1`, `bite2`, `bite3` | Money going out, as a step cut from the column at that row. Lighter is less: under ₹5k, under ₹20k, ₹20k and up | Every outgoing row. Pale family only, so a bite never reaches `r2f` or `r3` and cannot be read as the critical state | Row prints name and amount |
| Indigo bite, `i2` | Money going to investing | SIP and Investments rows. Existing rule: indigo is size of investing only | Row says SIP or Investments |
| Green block, `in` (`g2f`) | Salary coming in, stacked on what was left | Salary row. Says money arrived, not that the month is good. This is the one green an ordinary month gets, and the earned rule below still governs the column | Row says Salary, figure has a + sign in `g2` |
| Pale red or deep red column | Median under soft, or under hard, from today on | The one status rule | Row says "Under soft cushion" or "Under hard cushion", and Likely left is a filled band under hard |
| Green column, `g1` | The month earned it | Earned rule | A sentence under the column says why |

**Cushions and today.** Soft is a dashed `r2` line, hard a solid `r3t` line, each with a paper halo so they survive any fill. Each is drawn only from the first row whose low end is under 1.5× that cushion (₹45,000 and ₹22,500), down to Likely left, and only those rows. A filled diamond marks the first row where the median falls through a cushion. A month that starts under it, or where only the low end reaches it, has no diamond. Red marks are diamonds everywhere. Today is a 3 px `now` rule, the Line's one yellow element, and its word is plain. The marker stays on the amount in the Likely left row (section 4). **Both Today and Plan draw the soft ₹25k cushion dashed and the hard ₹10k cushion solid**, so a line means one thing everywhere.

**Off the scale.** Above the scale there is no edge to bite, so a bite shows at its true width against the column's clipped end. A bite is never under 4 px wide, and the sentence says so when one is widened; the row prints the amount. A wide ± cannot hide the salary block, which starts from the median left, not the high end. Each row's drop now equals its printed amount: everyday spending used to be smeared across earlier rows, which an amount-coloured bite would have made look wrong.

Kept: the hatched edge, which is the ± itself, and one sentence under the column, naming only what this month draws: "The column is your bank balance, hatched where unsure. Red is money out, deeper for more, tiny ones widened; green, salary. Indigo is investing. Dashed: ₹25k soft cushion. Solid: ₹10k hard cushion."

**Extra moves to investing.** The note beside it is computed from `unplanned`, and claims only what that history supports, since real transfers are lumpy. "Usually" needs at least three months with a move and a largest month within twice the median. Otherwise it says "up to" the largest, or "You made one" for a single month. Under three covered months it gives no count or amount, and with no moves there is no note.

Measured on the panel (`work/type/contrast.txt`), light page then dark page: ink 18.42 and 12.79; ink3 7.10 and 5.87, on the row band 6.23 and 4.82; `r2` 6.18 and 4.55; `g2` 6.61 and 8.29. Fills against the panel: `col-a` 4.64 and 5.80; `col-b` 3.37 and 3.28; `bite3` 3.70 and 3.59; `in` 6.61 and 4.97; pale red column 3.70 and 3.59; deep red column 10.54 and 3.30; green column 3.66 and 4.10. `col-past` 1.53 and 1.62, `bite1` 1.42 and 1.48, `bite2` 2.13 and 2.35 and dark indigo 2.89 are under 3:1, allowed because every row prints its word and figure.

### Where each ramp is used

| Place | Ink or indigo carries amount | Tips to status when |
|---|---|---|
| **The Line** | Teal-blue column, red and indigo bites for money out, green for salary in | The one rule, row by row from today. Only the ± edge is hatched |
| **Month tiles** | `t1` under ₹62k, `t2` above | Usual ladder. `r1`, `g1` are tint with an `r2` or `g2` outline, `r2`+ solid, always with a mark |
| **Calendar days** | `t1` <₹1,000, `t2` <₹2,500, `t3` <₹4,000, `t4` <₹6,000 | `r2` from ₹6,000, `r3` from ₹10,000, `g1` tint for no spend |
| **Spend rows, Today strips** | Ink mark on the usual band | Usual ladder, with `r1` and `g1` drawn as `r2` and `g2` marks, plus a chip. Red marks are diamonds |
| **Bill urgency** | Plain date, with "covered" or "near soft cushion" at weight 400 | `r3` 7+ days late, cash won't cover, or likely leaves you under hard; `r2f` late; `r1` within 3 days, or likely leaves you under soft; `g1` tint with tick for paid |
| **Bill price** | Black last bar | `r2` over 20% up on a year ago, `g1` over 20% down |
| **Treemap** | Share of the map: `t1` under 10%, `t2` under 25%, `t3` from 25%. Fixed rupee steps went dark on every 30-day block | Merchant's usual ladder. Unnamed money is amber with `?` |
| **Category grid** | `t1` below its median, `t2` at or above | Usual ladder, each row against itself |
| **Invest** | Weekly series `i2` <₹20k, `i3` <₹40k, `i4` above. Month tiles `i1` <₹50k, `i2` <₹70k, `i3` <₹1 L, `i4` above | Allocation against target, and gain against what you put in (below) |
| **Portfolio gain** | Ink at zero | Up: `g0` under 10%, `g1` 10–25%, `g2` 25–75%, `g3` 75%+. Down: `r0` under 10%, `r2` 10–25%, `r3` 25%+. Always a signed % or a word. Mock shows only gains |
| **Plan rows, tiles, chart marks** | Ink | The one rule, with depth by amount. Chart marks use the strong form: `r2`, `r3t`, `g2` |

### Other numbers

| Number | Red | Ink | Green |
|---|---|---|---|
| **Have in bank** | `r2` less than bills before salary | Otherwise: "Covers bills" or "Covered" | not used |
| **Owe on cards** | `r2` more than cash, or overdue | Otherwise: "40% of cash" | not used |
| **Scheduled SIP** | `r2` date passed, not seen | Sent | not used |
| **Allocation** | `r2` over 5 points off | 2 to 5 | `g1` within 2 |
| **Net in a report** | `r2` negative | Under 10% of income | `g1` 10%+, `g2` 25%+ |
| **Data age** | Not red. Over 24 hours: amber strip, section 8 | Otherwise | not used |

### The one active element: the highlight rule

**Owner's decisions, 3 November.** "Just make the today line yellow." "All other active, focus elements in vizs" meant one element in each other chart, not more treatments in the same one. An earlier cyan system with rings and frames was rejected.

**Each chart has one yellow element: its today, or the thing being read. Nothing else in that chart changes colour.** Marks keep their plain look. No rings, frames or second treatments.

| Chart | The yellow element | When it is tapped |
|---|---|---|
| The Line on Today | Today as a 3 px rule across the panel | Rows do not change |
| Time axis: Bills' due strip, Spend's pace chart, Invest's year | Today as a thin line. The strip and Invest's year print the word Today | Marks do not change. The read line or panel below shows what was tapped |
| Year tiles, calendar, matrix, treemap, Plan's month tiles | A 4 px cap on the top edge of one cell | The cap moves to the tapped cell. The tiles and calendar start on this month and today; the matrix and treemap have none until tapped |
| Monthly bars | A 3 px foot on this month's bar, and its letter takes the label's token | Bars do not change; the read line shows it |
| Plan's year and long-range charts | A dot at today, and the long-range chart's word Today | Nothing is tapped |

Tokens: `--now` for the mark and `--now-t` for its word. Dark: both `--mark`, `#EFCF30`, 11.50:1 on paper. Light: `--now` `#9E8600`, darkened from the marker so a thin line holds, 3.1:1 on paper and 3.6:1 on white; `--now-t` is `ink`, since yellow words fail on paper. Beside some fills the cap is close in lightness, such as `r2` and `t3` in light, so it is told apart by hue and by being the only cap.

**This overrides "yellow never next to red" (section 4) for this thin line and cap only**, by the owner's instruction. The marker's own rules stand for `.hl`. It is not a status.

Keyboard focus is a plain 3 px ink outline, 2 px offset, and it stays that way everywhere. Fields are a 2 px ink inset. Event pins, filter chips, segments and tabs keep their ink selected state. The Line's today rule belongs to the Line's own job.

### Where colour stops

Neutral on purpose, in every step of every ramp: Own in assets on Today, money put in, market events, long-range medians and the fan, mix and US share, flatmate amounts, trust percentage, future yearly bills, paid-vs-plan differences. Categories as identities get no hue.

Revised on owner feedback: gain on Invest now shows as status, and the "How it's counted" sheet says it only compares with what was put in and is not advice. Today's Own stays neutral because it has no action attached. Unnamed payees are a chore, so amber. No other hues exist. No gradients between hues.

**The rule:** every step is also readable without colour, through a word, a mark or a printed number. Two adjacent steps never rely on lightness alone, since chips carry different words and cells print their values.

### Tokens

Source: `mocks/assets/tokens.css`. Two tiers: raw values, role names, one name per role with a value per theme.

| Group | Light | Dark |
|---|---|---|
| paper, band, lift | `#EEEFEA #E5E7E0 #F8F9F5` | `#161917 #1E221E #262B26` |
| ink, ink2, ink3, rule | `#111512 #3D433E #535A54 #A8ADA5` | `#F0F2EC #C3C8C0 #A1A79F #4E544D` |
| r0 r1 r2 r2f r3 r3t | `#F9E1DC #D85F4F #BF1D0E #BF1D0E #7F1209 #7F1209` | `#3A1D19 #A94438 #F4604E #8F3B30 #C8261B #FF7F6E` |
| r1-on r2f-on r3-on | `#111512 #FFFFFF #FFFFFF` | `#FFFFFF #FFFFFF #FFFFFF` |
| g0 g1 g2 g2f g3 | `#D6ECDD #4F9370 #0B6B3A #0B6B3A #06401F` | `#173326 #26805A #5ADBA0 #48A97B #C8FAE0` |
| g1-on g2-on g3-on | `#111512 #FFFFFF #FFFFFF` | `#FFFFFF #06180F #06180F` |
| t1 t2 t3 t4 | `#D5D8D1 #A3A8A0 #6A706A #2B302C` | `#2C312C #5A605A #9AA09A #E3E6DF` |
| i1 i2 i3 i4, inv | `#C9CFF0 #7381D6 #4A5BBE #27317A`, `#4A5BBE` | `#2A3056 #5A68C4 #8E9DF2 #C4CCFB`, `#8E9DF2` |
| a0 a2 | `#F5E6BE #7A5200` | `#3A2E10 #E8C26A` |
| now, now-t | `#9E8600`, `ink` | `#EFCF30`, `#EFCF30` |
| scrim | `rgba(17,21,18,.45)` | `rgba(0,0,0,.6)` |
| press, press-on | `rgba(17,21,18,.10)`, `rgba(238,239,234,.20)` | `rgba(240,242,236,.12)`, `rgba(17,21,18,.16)` |

Lines: `rule` is decorative only. `ink3` is any control edge (6.14:1 light, 7.21 dark). `t1` is a row divider. No blur shadows, no glass, no translucent bars.

| Elevation | Surface |
|---|---|
| 0 page | paper |
| 1 card | lift |
| 2 fixed bar | lift or paper, opaque, 1 px `rule` |
| 3 sheet | lift, `rad-l`, scrim |

### Computed contrast (WCAG; `work/type/scripts/contrast.py` reads `tokens.css`, output in `work/type/contrast.txt`)

| Text on page, paper / band / lift | Light | Dark |
|---|---|---|
| ink | 15.94 / 14.77 / 17.42 | 15.70 / 14.29 / 12.79 |
| ink2 | 8.77 / 8.13 / 9.59 | 10.41 / 9.47 / 8.48 |
| ink3 | 6.14 / 5.69 / 6.71 | 7.21 / 6.56 / 5.87 |
| r2 words | 5.35 / 4.96 / 5.85 | 5.59 / 5.09 / 4.55 |
| r3t words | 9.12 / 8.45 / 9.97 | 7.18 / 6.53 / 5.85 |
| g2 words | 5.72 / 5.30 / 6.25 | 10.19 / 9.27 / 8.29 |
| inv | 5.15 / 4.77 / 5.62 | 6.96 / 6.34 / 5.67 |
| a2 | 5.99 / 5.55 / 6.54 | 10.42 / 9.48 / 8.49 |

| Step | Text on it | Light: text / step vs paper | Dark: text / step vs paper |
|---|---|---|---|
| r0 | ink | 14.77 / 1.08 | 13.59 / 1.16 |
| r1 | r1-on | 4.97 / 3.20 | 5.88 / 3.01 |
| r2f | r2f-on | 6.18 / 5.35 | 7.40 / 2.39 |
| r3 | r3-on | 10.54 / 9.12 | 5.60 / 3.16 |
| g0 | ink | 14.83 / 1.08 | 12.11 / 1.30 |
| g1 | g1-on | 5.04 / 3.17 | 4.86 / 3.64 |
| g2f | g2-on | 6.61 / 5.72 | 6.32 / 6.10 |
| g3 | g3-on | 11.93 / 10.32 | 15.90 / 15.36 |
| t1 | ink | 12.78 / 1.25 | 11.76 / 1.34 |
| t2 | ink | 7.60 / 2.10 | 5.72 / 2.75 |
| t3 | t3-on | 5.07 / 4.39 | 6.90 / 6.64 |
| t4 | t4-on | 13.45 / 11.63 | 14.61 / 14.04 |
| i1 | ink | 11.99 / 1.33 | 11.24 / 1.40 |
| i2 | i2-on | 5.12 / 3.11 | 4.99 / 3.55 |
| i3 | i3-on | 5.95 / 5.15 | 7.19 / 6.96 |
| i4 | i4-on | 11.62 / 10.06 | 11.65 / 11.28 |
| a0 | ink | 14.87 / 1.07 | 11.80 / 1.33 |

Medium against deep on tiles: 1.70 light, 1.32 dark. In dark they also differ in saturation, and each tile prints its word and figure. Dark `r2f` is 2.39 against paper, under 3:1, allowed because it always carries a word, a mark and a printed value.

The tints `r0`, `g0`, `a0`, `t1`, `t2`, `i1` and dark `r2f` are under 3:1 against paper. They are allowed because each carries its own word, mark or printed value, and status tints add a 2 px outline in cells. `rule` must not carry meaning alone.

The earlier colour-vision check (`work/cvd-*.txt`) covered only the strong red, green and indigo. **The new steps were not re-run through it.** Marks and words carry the state regardless.

## 4. Type

Fonts are SIL OFL, subset to Latin plus ₹, in `mocks/fonts/` as woff2, about 150 KB for the three faces Till uses. Nothing loads from a third party.

| Role | Font | Why |
|---|---|---|
| **Figures** | Vollkorn 400–800, with true italic | Sturdy, warm, built for body text. ₹ present. Lining and tabular features. |
| **Words** | Asap 400–700, width 75–100, set at 84 for text and 80 for headings | Tall and narrow: cap height 0.70, x-height 0.52 of the em. One variable file, 33 KB, SIL OFL with no reserved name, so subsetting is clean. ₹ (U+20B9) and tabular figures checked in the font file (`tnum`, and all digits are one width by default). No italic is loaded, because no words use it. |

Figures are serif, words are sans, which reverses the usual editorial pairing.

Compared on Today and Spend in `shots/type/candidates.png`: Asap won. Anek Latin has ₹ and `tnum` but a cap height of 0.64, so it reads a size smaller and thin at 14. IBM Plex Sans Condensed has ₹ and fixed-width digits but sets wider, so Spend's line under the answer wraps; it also has a reserved font name, so subsetting it is awkward, and takes three files. Rejected without a test, no ₹: Barlow Semi Condensed, Sofia Sans Semi Condensed, Instrument Sans. Archivo stays in `mocks/fonts/` only for older pages kept as history.

**Nine roles, whole pixels, no other size anywhere.** Weights 400, 500, 600. Width axis 84% for text, 80% for headings and tight labels. Narrow type reads smaller, so the floor rose by one pixel, and Note and Small are tracked `+.012em` and `+.006em`. No `em` multiples. Sizes are set only in the "type roles" block of `till.css` and the top of `plan.css`.

| Role | Token | Size/line | Used for |
|---|---|---|---|
| Note | `t-note` | 14/18 | Date line, tags, chart labels, calendar day numbers, table heads, fine print |
| Small | `t-small` | 15/20 | Row sub-lines, chips, tap-to-read, calendar figures, tile words, tab labels |
| Body | `t-body` | 17/24 | Sentences, row names, buttons, links, month tile figures |
| Row | `t-row` | 18/24 | Row figures, inputs, sub-headings on focused screens, Plan's line under the answer |
| Head | `t-head` | 24/30, 600, 80%, 0 | Section titles, sheet titles, position figures, amount input |
| Title | `t-title` | 32/36, 500, `ink2`, 80%, −.004em | Page titles, focused screen titles. Rail wordmark on desktop |
| Answer | `t-answer` | 36/40, 600, 80%, −.008em | The page's answer. Hero's ± |
| Stat | `t-stat` | 44/48, 600, −.02em | Portfolio value, the payee amount. Hero's ₹ |
| Hero | `t-hero` | clamp(48, 18.5vw, 76)/1.02, 600 italic, −.025em | Today's figure: 66.6 at 360, 72 at 390, 76 at 430 up |

**One exception, by the owner's decision:** Today's Reclaim wordmark, `t-brand`, Vollkorn italic 600 at 42/48 with a 36 px mark, 36 px above and 28 px below, date at 14 beneath. The review's proposal to shrink it to 32 was rejected. Page titles stay at 32, lighter than the answer below them, so the answer leads. Header bar at least 84 px, 28 above, 20 below. Answer directly under, no extra gap.

`font-variant-numeric: lining-nums tabular-nums` on all figures. No all-caps, no mono.

**Which face a figure takes.** Figures in chips and status sentences are Words: they are read as prose ("Near your ₹25k soft cushion"), and chips stay narrow. Figures in rows and answers are Figures (`.n`, Vollkorn), including figures in section headings ("₹64k a month"). Decided by the owner, 3 November 2026.

### Emphasis: three treatments, one job each

The type was monochrome because hierarchy came only from size and weight, and every sentence was one colour. These classes in `till.css` give a sentence a single focal point. Values per theme in `tokens.css`.

| Class | Looks like | Its one job | Examples |
|---|---|---|---|
| `.hl` | Yellow marker, uneven edges and a heavier streak, wraps line by line | **Look here.** The answer, key figure or key phrase of a section | "Spending has held near ₹64k a month", "You spent the most at Swiggy" |
| `.u-hand` | Hand-drawn stroke. Ink, `.u-bad` red or `.u-good` green | **The exception.** The words that break from normal. The stroke says which way, and the words say it too | "Food is running high", "Shopping came in low" |
| `.u-rule` | Thick offset rule in ink | **The yardstick.** What a figure is measured against: a cushion, your usual, a threshold | "Near your ₹25k soft cushion", "This month against your usual" |

Links keep the thin 1 px underline, which is its own job. No other text effects.

**Rules for `.hl`:**
- At most one per section. Sections with nothing to point at get none. If everything is highlighted, nothing is.
- Yellow means "look here". It is never a status, and sits outside the red, ink and green ladder. A chart's one active element uses it too (section 3, the highlight rule). It is lemon, not amber, so it does not read as `a0`.
- Never on or inside a chip or a filled band. Never in a row or block that holds a red word or chip, and never on a red figure. `bills-end` and `bills-hard` carry none at all: their red is already the look-here. A green figure is the one exception, on Today only: under the marker it turns `mark-on`, and its ± and chip stay green and keep saying the state.
- **Today's marker goes on the amount left**, by the owner's decision: the hero figure and the amount in the Line's Likely left row. The ± is always outside it. "Likely left" and "Today" are plain words.
- Text on it is always `mark-on`, bold. Contrast: 14.33 on the fill and 13.07 on the streak in light; 11.84 and 9.73 in dark.
- **Dark:** the marker stays lit, `#EFCF30`, and the text turns near-black `#14160F`. A dim gold fill with light text was rejected because that is what the amber chip already looks like.
- The shared report sheet is paper in both themes, so it uses the light marker in both.
- Forced colours: `.hl` falls back to system Mark, `.u-hand` to a wavy underline.

**To build it.** Copy the "emphasis" block of `mocks/assets/till.css` and `--mark`, `--mark-on`, `--mark-img`, `--hand-*` from `tokens.css`. No other CSS is needed and no value should be retyped. The class goes on a `<span>` around the words; nothing else changes in the sentence. In React that is `<span className="hl">`.

| Where | Exact markup | Condition |
|---|---|---|
| Today hero | `<span class="n e"><span class="hl"><span class="r">₹</span>30k</span><span class="v">±5k</span></span>` inside `button.hero` | `STATUS.step(STATUS.kind(m,h,c))` is `n` (kinds `just`, `fits`), or the figure is earned green. Otherwise the same markup with no `.hl`. `could`, `dip` and `sell` get none |
| Line, Likely left row | `<span class="n"><span class="hl">₹30k</span> ±5k</span>` in `li.end` | Same test, same result as the hero. `li.end.warn` and `li.end.fill` get none |
| Today, trend heading | `<span class="hl"><span class="n">₹64k</span> a month</span>` | Always, when the rule that writes the heading fires |
| Today, trust note | `<span class="hl">83%</span>` | Always |
| Spend answer | `<span class="hl"><span class="n">₹44,444</span></span>` | Spend is not above usual |
| Spend, variable section and swing section | The largest group of variable spending, or the largest payee when filtered to one group; the group that swings most | One each, when computed |
| Bills | The words "Yearly bills" | Only on the main Bills page, when no answer or chip above it is at `r3` or under a cushion |
| Invest | `<span class="hl">` on the portfolio value, with `.pf-val .hl` sizing | Always |
| Reports | "Nothing is sent unless you share it." | Always |
| Flatmates report | The amount to settle | When non-zero |
| Name payees | The memory cue in `.lede` | One per queue item |
| Plan | "Free to invest" amount in the invest answer; the 5-year figure | When `ct.free > 0`; always |

`.u-hand` goes on the words that break from normal, with `.u-bad` or `.u-good` when the words themselves say which way ("running high"), and no modifier when they do not. `.u-rule` goes on the yardstick, and only there: a cushion, "your usual", a threshold such as "₹6,000 a day". Both may share a section with `.hl`. Neither carries status alone, because the words say it.

### Number rules

- Grouping: lakh and crore, using `Intl.NumberFormat('en-IN')`.
- Facts: exact, ₹1,11,111. No paise outside a statement line.
- Summaries: ₹24 L, ₹1.7 Cr. "k" is allowed under a lakh.
- USD: shown as dollars, with rate and "as of" stated.
- Minus is U+2212.

### Forecast format: median ± variance

Every forecast reads **₹30k ±5k**, on every screen including Plan. Near each forecast chart, one sentence says what ± means: "Grey band: the likely range. About 8 months in 10 should land inside it." It must be reworded if the back-test finds a different rate.

**How it is computed**

1. Median: today's balance, less payments due before the next salary, less the median everyday spend for those days. Likely left is the balance on the day before salary, with that date printed (decision of 2026-11-03; contract: `snapshot-v2.md`).
2. Variance: for each past month, make the same forecast from the same day of that month, and record how far it missed the actual. ± is the smallest ₹1,000 step that holds 8 of each 10 of those misses. Walked forward on real data it landed about 6 times in 10, so the app labels it "still being tested: about 6 times in 10". Contract: `snapshot-v2.md`.
3. A single bill uses the spread of its own last 12 amounts the same way. Fixed bills have no ±.

**How it is rounded**

- ± is rounded **up** to one significant figure, or two when the first digit is 1: 4.3k becomes 5k, 280 becomes 300, ₹1.1 L stays ₹1.1 L rather than ₹2 L. This is for show. `lo` and status use the unrounded ±, which the contract carries to the ₹1,000 above. A printed range uses the printed ±.
- The median is rounded to the nearest ₹1,000 if ± is ₹1,000 or more, otherwise to the nearest ₹100.
- Under 6 months of history, show "Not enough history yet" and no ±.

With 12 months this width rule is rough and not a statistical guarantee. The back-test measured about 6 in 10.

Historical usual values use the same format ("usually ₹45k ±7k"), so there is one thing to learn.

## 5. Trust grammar

| Mark | Means | Example |
|---|---|---|
| Plain | The figure, wherever it came from | ₹44,444 |
| `Est` tag | Estimated value, like EPF or gold | `Est` ₹1,00,000 |
| `Plan` tag | A planned expense, a projection | `Plan` ₹1,44,444 |
| `Sample` tag | Made-up example, on Invest's upcoming box | |
| ± | A forecast | ₹30k ±5k |
| Hatching | Not happened yet, the width of the uncertainty | Line fringe, pace chart, last bar |

**The visible SMS tag is gone, by the owner's decision, 3 November 2026.** Where it came from no longer shows on a figure. Provisional money is labelled in these places, which must stay:
- "83% of November is on a bank statement. The rest may change." in "How sure these figures are", on every Today state.
- "See what is not confirmed", directly under it, and the "Unconfirmed only" filter on Spend.
- The Have in bank source sheet: "Less payments since then", "These payments are not on a statement yet, so the figure may shift a little."
- On the shared flatmates report, where the reader has no such section, the foot note names the line: "except electricity, which is not on a statement yet".

**No data contract changes.** `Figure.confidence: "provisional"` and `Figure.source` stay in `snapshot-v1` and stay in the data, and the app reads them to compute the percentage, the filter and the source sheet. It just draws no tag from them.

Figures are roman everywhere; only the hero is italic, as display type, so italics never carry a meaning. Tags are neutral. Any figure can be tapped for its arithmetic and source.

## 6. Charts

No cell needs dragging. Everything tappable is at least 48 px. Chart text is drawn at real pixels, so it is its stated size at every width. Tap-to-read writes to a text line below the chart, and a list is one tap away under each one.

| Need | Form | Target size at 360 px | Notes |
|---|---|---|---|
| Month ahead | The Line: stepped vertical area with cushion line | Whole row, 50 px+ | Full width = one ordinary month of outgoings. Larger sums get a break mark |
| Pace | Line against usual-range band, hatched to month end | Tap anywhere, nearest day | |
| Group vs usual | Usual-band rows: band, median tick, mark for now | Whole row, 62 px | Replaces first list |
| Who gets the money | Treemap by group, names and amounts in blocks, 8 px inner padding (10 on outlined blocks) | Smallest block must be 46 px each way | Replaces second list. Blocks too small go into one rollup, so no label appears twice, and a block tapped is known by id. Groups stay together only if that costs no blocks. A panel leads to "See all". Unnamed money is hatched and links to naming; "See all with no name yet" sits under the map |
| Group by month | Matrix heatmap, 6 months × 5 groups, numbers in cells | 53 × 48 | Replaces third list. Each row judged against itself |
| Year of months | 12 tiles, 6 × 2 | 50 × 56 | Spend in ink tints, tipping to status. Invest carries amount in indigo |
| A month's days | Year tiles under "Your year, month by month", then "November, day by day" directly above a 7-column calendar, using the page margin on phones. Six tiles across on phones, as on Today | 48 × 54 | Tile picks the month |
| Invest year | Stepped weekly area, India above and US below, with event pins | Pins 48 × 48, plot taps to nearest week | |
| Variability on Home | Strip: dots for earlier months, large mark for now | Whole row | |
| Trend | 12 bars, ordinary in `t3`, unusual in their step | Row | Forecast part hatched |
| Long range | Fan with median dots, no centre line | Plan | Indigo, never a status |
| Portfolio | Two-row map: India, then US. Block size is money, green step is gain, name, value and gain printed in each block | Smallest block about 70 × 76 | Block tap jumps to that holding. Chosen over a pie because labels fit inside, there is no legend, and it matches the Spend treemap. EPF, PPF, FDs and gold share one block, split in Holdings |

Never: dual axes, pies, chart text in a status colour unless the state is real.

Spend: largest days is an open list of the top 5, each naming its two biggest purchases with amounts. "Shopping swings the most" now closes the page.

Invest currency: India in ₹. US in $ with its ₹ value, gains in ₹ including the exchange rate, and "$1 = ₹84, prices and rate from 15 Nov" on the card.

### Market events on the Invest year

Rule for inclusion: an index move of about 2% or more in a day, a first-of-its-kind market level, or a change in central bank policy rate. Six pins maximum on a phone, three per market, with the rest in the list. Pins are numbered in date order, spread at least 50 px apart, with a leader to the true date. Tap shows the date, what happened, and what the owner put in during the next two weeks. Investment amounts are invented. Events are real.

| # | Date | Market | Event | Source | How verified |
|---|---|---|---|---|---|
| 1 | 1 Feb 2026 | India | Budget raises STT on derivatives. Nifty −1.96% to 24,825.45, worst Budget day since 2020 | [Outlook Money](https://www.outlookmoney.com/invest/stock-market-today-nifty-50-sensex-see-worst-budget-day-fall-in-six-years-as-stt-hike-weighs-on-sentiment) | Opened |
| 2 | 28 Feb 2026 | US | US strikes on Iran begin the war. Next trading day, 2 Mar: Brent +6.7%, stocks about flat | [PBS/AP](https://www.pbs.org/newshour/economy/u-s-stocks-rebound-from-sharp-losses-while-oil-prices-leap-on-worries-about-iran-war), [ABC](https://www.goodmorningamerica.com/news/story/stocks-slide-after-iran-attack-130671835) | Search summary |
| 3 | 19 Mar 2026 | India | Sensex −3.26% to 74,207.24, sharpest in nearly two years, on oil and West Asia | [Business Today](https://www.businesstoday.in/markets/stocks/story/rs-12-lakh-crore-shock-sensex-nifty-wipe-out-3-day-gains-on-fag-end-selling-whats-ahead-521425-2026-03-19), [Free Press Journal](https://www.freepressjournal.in/amp/business/sensex-plunges-2497-points-nifty-776-as-middle-east-conflict-drives-oil-to-119-per-barrel) | Search summary |
| 4 | 8 Apr 2026 | US | US and Iran two-week ceasefire. S&P 500 +2.51% to 6,782.83. Sensex about +4% | [Reuters via NST](https://www.nst.com.my/amp/business/corporate/2026/04/1413579/wall-street-ends-sharply-higher-us-iran-ceasefire), [Free Press Journal](https://www.freepressjournal.in/business/sensex-surges-4-to-77605-nifty-jumps-385-as-oil-tumbles-137-on-us-iran-two-week-ceasefire) | Opened. The Sensex page is an intraday figure; closes vary 3.9 to 4.0% |
| 5 | 15 Apr 2026 | US | S&P 500 first close above 7,000, at 7,022.95 | [Quartz](https://qz.com/sp500-record-7000-iran-war-losses-nasdaq) | Search summary |
| 6 | 7 Oct 2026 | India | RBI raises repo rate 25 bps to 5.50%, first rise since Feb 2023 | [Kotak Neo](https://www.kotakneo.com/news/market-news/sensex-nifty-recover-rbi-rate-hike-rate-cuts-off-table/) | Opened. One other result described a hold, against several reporting the hike |
| List | 3 Feb 2026 | India | India and US trade deal. Indices close about +2.5% | [Deccan Herald/PTI](https://www.deccanherald.com/business/markets/stock-markets-cheer-india-us-trade-deal-sensex-nifty-surge-25-3884746) | Search summary |
| List | 20 Feb 2026 | US | Supreme Court strikes down IEEPA tariffs. S&P 500 +0.7% | [Nasdaq](https://www.nasdaq.com/articles/us-close-mostly-higher-after-supreme-court-strikes-down-trumps-tariffs), [National](https://www.thenationalnews.com/news/2026/02/20/tariffs-supreme-court-trump) | Search summary |

**Left out on purpose:** the 28 Oct Fed meeting. Sources agreed on a 10–2 hold but gave a target range that conflicts with the July range, and I could not open the Fed's own release.

The web tool refused many domains during this work, including federalreserve.gov, Quartz, PBS and The Print. So three of the six pins rest on search-result summaries rather than pages I read. **Check these against primary sources before shipping real data.** In production, events should be a small curated file, updated by hand or reviewed, never scraped.

### Upcoming events on the Invest year

A small dashed box under the past events, three rows at most, titled "Coming up, rough dates" with a `Sample` tag. Dashed outline, no fill, no pin. All mock rows are invented. The owner rates this low ROI, so it stays this small.

**Later, not built, sources not checked in this work:** SEC EDGAR's free submissions feed for US filings; a free-tier earnings and IPO calendar such as Finnhub; NSE corporate announcements for India; a hand-kept yearly list of Fed and RBI meeting dates. **Privacy:** asking a service about each ticker tells it what is held, and collected data must stay on the tailnet. Prefer whole-market calendars filtered on the box, and let the owner decide on any per-ticker query.

## 7. Name-fixing flow

Queue is ordered by **unknown money, largest first**, and progress is measured in rupees rather than count. The bar goes green when under 5% of the month has no name. Most value comes first and they can stop any time.

1. Screen shows raw ID, amount, and payment dates and times as memory cues.
2. Thumb area holds suggestions, each with the reason it was suggested, and "Something else".
3. One tap applies to all payments from that ID. Name and group change together. Commodities are valid names: Milk, Auto rides.
4. Confirmation states what changed, with Undo on the same screen. No "are you sure".
5. Skip and "Not spending" (a transfer to self, say) are always available.

The tab bar is hidden here. It is a focused task and thumbs are near the bottom. The suggestion engine is not designed here and its quality decides whether this flow is pleasant.

## 8. Spacing, shape, touch, motion, states

- **Spacing scale:** `s1` to `s7` = 4, 8, 12, 16, 24, 32, 48 px. Page margin 20 px. Sections 48 px apart, inside a section 12 to 16, inside a row 4 to 8, so space itself shows grouping. Rows 64 to 72 px. Tab bar 60.
- **Shape:** `rad-s` 4 tags and chips, `rad-m` 8 controls and tiles, `rad-l` 16 sheets, `rad-f` for pills and round steppers. Data blocks stay square. Button variants: primary, secondary, text. One primary per screen. **Save anyway** is secondary, since it should not push a bad choice.
- **Status chips sit beside the name**, owner's feedback, 3 November. Name, then chip, on one line, inline, so a chip follows the last word of a wrapped name and drops whole to the next line when it does not fit. A chip holds a word or two ("2 days late", "Paid 1 Nov"); anything longer goes in the sub-line under the name. An ordinary date is a plain sub-line, not a chip. On phones a bill's 12 bars move under the name so the name and chip keep the width.
- **Steppers:** the glyph is drawn, not typed, so it sits on the exact centre of its circle. The target is always 48 px. The circle inside it is 44 px on phones and 34 px at 1000 px up, where its edge lines up with the figures above. The value has a column at least 88 px wide, so rows align.
- **One tap away, not gone:** how Have in bank is covered, how Own is counted, tap-to-read on every chart, month arithmetic, and in Plan the mix reading notes and cash split working. Rows hold one name, one short chip or date, one figure.
- **Press:** every button, row, tile and link gets a state layer, `::after` at `press` (ink 10%), or `press-on` on filled controls. Hover is 80% of that on devices with a pointer. It stays for `d-press` after release, then fades over `d-press`, so a quick tap still shows. The browser's blue tap flash is off everywhere. Needs a passive `touchstart` listener on the document for Android Chrome.
- **Motion, as state only:** `d-press` 90 ms, `d-state` 160 ms (toggles, toast), `d-move` 220 ms (screens and sheets rise 12 px and fade from .4; the Plan chart line moves to the newly tapped month). Easing `cubic-bezier(.2,0,0,1)`. No overshoot, no count-ups, no animation that is not an answer to a touch. All off with `prefers-reduced-motion`. No points, streaks, rewards or sound.
- **Forms:** amount shows ₹ and lakh commas as you type. Focus on a field is a 2 px inset, no outer ring. Everything else: 3 px outline, 2 px offset.

### Data states

The mock shows these with `?data=`. Each is real in production, driven by `as_of` and the fetch result.

| State | When | What shows | `?data=` |
|---|---|---|---|
| Fresh | Under 24 hours | "updated 6:10 am" in the date line | none |
| Stale | Over 24 hours | Amber strip under the header, with `?`: "Last updated Sat 14 Nov, 6:10 am. These numbers may be old." Try again | `stale` |
| Updating | Fetch running | All last numbers stay. Grey strip: "Updating. These are the 6:10 am figures." No spinner or skeleton over money | `loading` |
| Could not update | Fetch failed, numbers exist | Amber strip: "Could not update. These are the 6:10 am figures." Try again | `error` |
| Empty | No data for this page | A sentence as the answer, what will fill it, one button. Plan keeps working: "No big expenses yet", with its primary | `empty` |
| First load | Nothing cached | "Getting your numbers." No figures, no spinner | `first` |
| Could not load | Failed, nothing cached | "Could not load your numbers." "Nothing is lost." Try again | `failed` |

Rejected, and not to return: glass or blur, Material's look (its numbers only), gamification, a legend on any chart.

- **Brand:** a square R whose bowl closes around one solid block: what you took back, kept with you. Beside it "Reclaim" in Vollkorn italic 600. Ink only, never a status colour. Today shows both in the page header with date and freshness below. Desktop puts them at the top of the rail. Other phone pages show only the page title. Page titles read "Reclaim: …". Icon: `mocks/assets/reclaim-icon.svg`, samples on `mocks/brand.html`.
- **Report actions:** every report row has an outlined Preview button and a solid Download PDF, Download CSV or Share PDF button, with Lucide icons. The row states format and length.

### Icons

Icons add recognition and give the pages some character. They never replace a word and never carry status: the word is always beside them, and `aria-hidden` is always on. Status marks stay as they were: red `!`, green tick, amber `?`, the empty chore ring. Licences and the list of brands are in `ICONS.md`.

**Nothing loads at runtime from a third party, ever.** No logo CDN, favicon service, icon API or web font host, and no `<img src>` built from a merchant name. A merchant name in a URL would send private spending data off the tailnet. Every glyph ships inside the app bundle. The real app should enforce it with `Content-Security-Policy: default-src 'self'; img-src 'self' data:`.

**Sets.** Lucide (ISC) for categories, bills and UI, drawn as lines. Simple Icons (CC0, with the trademark caveat in `ICONS.md`) for brands, drawn solid. Both are single colour in `currentColor`. No brand colours, ever: red, ink and green stay reserved for meaning.

**Files.** `icons/map.json` holds every mapping. `icons/svg/` has one file per glyph. `icons/react/` is what the app imports. `node icons/build.mjs` regenerates `react/icons.tsx` and `mocks/assets/icons.js`; `node --test icons/test/iconFor.test.ts` tests the choice; rebuild Plan with `plan2/work/build.py` afterwards. To use it, copy `icons/react/` and `icons/map.json` into `app/src/icons/`, keeping that layout. Checked against the app's own `tsc` settings, React 19:

```tsx
import { Icon, iconFor } from './icons/react';
const c = iconFor({ name: payee.name, group: payee.group, merchant_id: payee.merchant_id, confidence: payee.confidence });
<Icon name={c.name} />   // or the named export: <SwiggyIcon />
```

**How a row gets its icon. `iconFor()` in `icons/react/iconFor.ts` is the rule, first match wins:**

1. **Unnamed: neutral.** `unnamed` is set, `name` is empty, or `confidence` is `none`. Result: `circle-dashed`. Never a fabricated logo.
2. **Known brand: its glyph.** Skipped if `confidence` is `suggested`, since a guess must not earn a logo. First `brandOverrides[merchant_id]`, then the whole cleaned `name`, lowercased with punctuation turned to spaces, against `brands[*].names` in `map.json`. Whole name only: "Zara Tailors" is not Zara.
3. **Group: its category icon.** `groups[group]`, then `groups[top part of group]`.
4. **No group: whole words of the name** against `keywords`, in table order. This is how bills, plans and holdings get an icon, since those lines have no group. "Scarf" does not match "car".
5. **Otherwise neutral.** `Uncategorized` is deliberately absent from `groups`, so it ends here.

**What the contract gives, unchanged.** `snapshot-v1` stays as it is.
- There is no `category` field. The field is `group`: a top group from `finance/ledger.py` `TOP_GROUPS`, optionally with detail, such as `Food:Groceries`.
- `merchant_id` cannot identify a brand. It exists only on `TopPayee` and `ReviewItem`, is often null, and is "never derived from the name". So brands match on `name`, and `merchant_id` is only the key to an optional table the owner keeps on the box. Ship that table empty. It never goes in the repo.
- `raw` is never an input.

| Row | Path | Pass to `iconFor` |
|---|---|---|
| Group | `spend.groups[]` | `{name, group: name}` |
| A day's purchase | `spend.days[].items[]` | `{name, group}` |
| Top payee | `payees.top[]` | `{name, group, merchant_id, confidence}` |
| Payee to name | `payees.review.items[]` | `{unnamed: true}` |
| A suggestion for it | `.suggestion` | `{name, group, confidence: 'suggested'}` |
| Bill | `bills.recurring[]`, `bills.upcoming[]`, `forecast.due_items[]` | `{name, group}`; group is often null |
| Plan | `plan_inputs.plans[]`, `forecast.with_plans.plans[]` | `{name}`; in Plan's own storage, `{name: title}` |
| Holding | `invest.holdings[]` | `{name}` |
| Account | `position.accounts[]` | `{name}`, which can match a bank brand |

`Figure.confidence` (statement, provisional) never affects an icon. Fixed UI rows use `Icon` directly with the name in `map.json` `ui`: Have, Owe, Own, report rows, Preview, Download, Share.

**Group names differ in the mocks.** The mocks use friendly labels ("Going out", "Getting around") that are not in `TOP_GROUPS`. `map.json` `mock_group_labels` maps them for the mocks only; the app must not use it. Which labels the app shows is for the real-data analysis to settle.

**Where they appear.** Sizes are `--ic` 22, `--ic-s` 18 and 20 in the Line. Colour is always `--ink2`, or inherited on a filled block, button or chip. Never a status token.

| Page | Has icons | Goes without, on purpose |
|---|---|---|
| Today | Where you stand, Line stops, category strips | "Today", "Likely left" and the past row, chores (the ring is the mark), month tiles |
| Spend | Usual-band rows, treemap, matrix row labels, payee list, group filter chips | Calendar, largest days, the "See as list" group tables |
| Bills | Every bill row, including price changes | Due strip |
| Invest | Holdings, targets | Portfolio map, event pins, upcoming box |
| Reports | Each report row, Preview, Download and Share, flatmates' shared costs | |
| Plan | Expense rows, chart flags when the name has a category, what-if rows | Month list, tiles, chart cushions |
| Name payees | Neutral on the raw ID, category on suggestions | "Something else" |

Tabs stay words only. **Treemap:** the icon shows only when it and the name fit on one line: `w − padding − status mark − 24 ≥ characters × 7.8`. Merged blocks ("Auto, movies") and the amber `?` block never get one.

## 9. Accessibility

- Hue never stands alone: words, marks, shape and hatching carry it. Audited by `work/freeze-final/audit.py` at 360, 390, 430 and 1280 px in both modes, per state, under touch emulation: overflow, clipped text, text contrast including SVG, 48 px targets, type sizes, weights, pale text, chart label overlap, script errors, external requests. Results from the last run are summarised in `FROZEN.md`.
- The river is `aria-hidden`, and the ordered list carries all of it.
- Charts have text alternatives, and each Spend and Invest chart has a list one tap away.
- Under 340 px, a proxy for large Android text: header wraps, chips wrap, bill sparklines drop, matrix cells give up their minimum. No page overflows at 277 px. Real font scaling is untested.

## 10. Build notes

Static PWA, no external requests (icons included, section 8), wrapped for Android later (a Trusted Web Activity is the cheapest first step). Suggested, not evaluated in this work:

- Preact or plain web components for UI
- Hand-written SVG for river, strips, year grid (the mock's versions are small and need no library)
- uPlot only if desktop needs a zoomable pace chart
- TanStack Table core for sort and filter on tables
- uFuzzy for name search
- Workbox for offline cache
- Native `<dialog>` for sheets, as in the mocks

Data each figure carries is `Figure` in `snapshot-v1`; the UI needs nothing more for the trust grammar, and no field is removed because the tag is gone. Sheets use native `<dialog>`, up to 640 px wide. A forecast must be back-tested against their history before it goes in the headline: the printed range should contain the actual month-end figure about 8 times in 10.

## 11. Mock coverage

`alt-letter` and `alt-sheet` are **not part of the freeze**: they keep their old look. The Plan runner-ups (`alt-hub`, `alt-ask`, `alt-agenda`) are also rejected and have no icons.

Built: Today in four states, Bills under soft and under hard, brand samples, Spend with filter sheets and tap-to-read, Name payees with undo, Bills, Invest with tappable events, Reports, Flatmates report, Plan with pick-a-month and what-ifs (`plan2/`), desktop, data states, and runner-up homes, which keep their own look on purpose. Light and dark.

Inert or missing: filter logic, the other four reports (their buttons open a sheet saying so), a falling-portfolio state, date picker, bill detail, source sheets for most figures, assumptions editor, onboarding, a missed-SIP example, the mock's Today not computing from Plan's engine (figures are written by hand to agree).

**Not verified:** a real phone or thumb, an actual reader, real data, whether ± holds in a back-test, the 5% line on real money, Android font scaling, screen readers, gesture bars with edge-to-edge, GPU cost, haptics. The press state was seen by synthetic touch in Chromium, not on Android Chrome.

Note that charts and chrome are injected by `mocks/assets/till.js`, so the mocks need JavaScript.
