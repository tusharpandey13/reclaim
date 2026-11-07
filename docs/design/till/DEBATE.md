# Till: the design debate

Working title only. "Till" is what the person is asking: how much is left till the end of the month, till salary. It is also a cash till.

The critics below are personas I wrote and argued against. They are not real people, and nothing here has been tested with a real user. Where I say "evidence", a source says it. Where I say "taste", I do.

---

## 1. Research log

Accessed 2 Nov 2026. "Read" means I opened the source. "Summary" means I only saw a search-result summary, so treat it as weaker.

| # | Source | Date | Claim used | Type | Access |
|---|---|---|---|---|---|
| 1 | [Blascheck et al., Glanceable Visualization on smartwatches](https://hal.archives-ouvertes.fr/hal-01851306) | 2018 | Bar and donut charts beat radial bars for fast comparisons at 7, 12 and 24 values | Evidence, on watches not phones | Summary. The page and [aviz.fr](https://www.aviz.fr/Research/Smartwatchperception) both refused fetching |
| 2 | [While et al., glanceable charts and older adults](https://arxiv.org/html/2403.12343v1) | 2024 | Reading time worsens with more data points. Small sample | Evidence, adjacent population | Summary |
| 3 | [G-Sparks, Graphics Interface](https://graphicsinterface.org/wp-content/uploads/gi2019-23.pdf) | 2019 | Line graphs compressed to one sample per pixel stayed legible | Evidence, narrow | Summary |
| 4 | [NN/g, Mobile Tables, Amy Schade](https://www.nngroup.com/articles/mobile-tables/) | 17 Sep 2017 | Lock the left column, signal sideways scroll with a cut-off column, numeric tables fit more columns, let people filter first | Expert guidance | Read |
| 5 | [MDPI Applied Sciences 15(19) 10832](https://www.mdpi.com/2076-3417/15/19/10832/pdf) | 2025 | Phone study: segmenting helps bars and tables, fixed columns for tables | Evidence | Summary, fetch got 403 |
| 6 | [Kay et al., When(ish) is My Bus?](https://idl.uw.edu/papers/when-ish-is-my-bus) | CHI 2016 | Everyday predictive mobile tools need visible uncertainty. Quantile dotplots reduced variance of estimates about 1.15 times over density plots | Evidence | Summary |
| 7 | [Fernandes et al., Uncertainty Displays](https://idl.uw.edu/papers/uncertainty-bus) | CHI 2018 | Showing uncertainty beat a no-uncertainty control on actual decisions | Evidence | Summary |
| 8 | [McMahon et al., Bank of England SWP 1,196](https://www.bankofengland.co.uk/working-paper/2026/anchors-aweigh-the-effect-of-communicating-forecast-uncertainty) | 17 Jul 2026 | Fan charts did best at conveying both the expectation and the uncertainty, against dots, boxes, speedometers and ranges. People underestimate uncertainty. Point forecasts lose trust after misses | Evidence, inflation forecasts and a working paper | Read abstract page |
| 9 | [Findlater and Gajos, adaptive UI overview](https://www.eecs.harvard.edu/~kgajos/papers/2009/AIMag09-AUIs.pdf) | 2009 | Adaptation creates spatial instability and can stop people forming spatial memory | Evidence, menus not home screens | Summary |
| 10 | [Findlater and McGrenere](https://www.cs.ubc.ca/labs/edapt/papers/findlater2004.pdf) | 2004 | Adaptive menus were not faster than static or customisable ones | Evidence, menus | Summary |
| 11 | [Hoober, How Do Users Really Hold Mobile Devices?](https://www.uxmatters.com/mt/archives/2013/02/how-do-users-really-hold-mobile-devices.php) | Feb 2013 | 49% one-handed, 36% cradled, 15% two-handed in public observation. Hoober later warned his thumb zones get read too rigidly | Evidence, old and pre-tall phones | Summary |
| 12 | [Dark Sky eulogy, via lavx summary](https://news.lavx.hu/article/dark-sky-shutdown-lessons-from-a-weather-app-that-mastered-data-visualization) | 2023 | "Shape of the weather at a glance", one unified timeline | Taste, well argued | Summary, and it is second-hand |
| 13 | [Sinclair on Dark Sky](https://jaredsinclair.com/2014/01/27/dark-sky-some-constructive-crit.html) | Jan 2014 | Sections blurred into each other. Useful warning for a continuous timeline | Taste | Summary |
| 14 | [Vignelli diagram, AGI](https://a-g-i.org/design/new-york-city-subway-diagram) and [subway map history](https://wiki.krisyotam.com/content/wikipedia_en_all_nopic_2026-03/New_York_City_Subway_map) | 1972 to 2012 | Called a diagram, not a map. Replaced in 1979 after riders cross-referenced it against streets, later revived for an app | History, secondary sources | Summary |
| 15 | [Marey graphic train schedule](https://bagdcontext.myblog.arts.ac.uk/?p=2112) and [Rendgen](https://gwern.net/doc/www/sandrarendgen.wordpress.com/194f9945b816bf213f1d3a085b8adb161f06af75.html) | 1885, on Tufte's cover | Timetables can be drawn. The method is credited to Ibry, not Marey | History | Summary |
| 16 | [925 Studios on WHOOP](https://www.925studios.co/blog/whoop-design-breakdown) | Dated both Mar and Nov 2026 | One score, three metrics, layered screens | Taste, agency blog | Read |
| 17 | [Readiness-score scepticism](https://wellnessproject.ai/blog/2026-07-23-protocol-can-you-trust-your-oura-or-whoop-readiness-score) | Jul 2026 | 14 composite scores across 10 makers with undisclosed weights | Secondary claim, weak source | Summary |
| 18 | [Crosley on Copilot Money](https://blakecrosley.com/guides/design/copilot-money) | Undated | Dark navy, bright data, green/red/blue. I read this as the exact fintech default to avoid. Also little on transaction review | Taste | Read |
| 19 | [CRED design](https://cred.club/design) | Undated | NeoPOP: 1960s art-movement references, isometric visuals, serif headings. Its own identity, not a template to borrow | Vendor claim | Summary |
| 20 | [Zerodha on separate apps](https://support.zerodha.com/category/your-zerodha-account/your-profile/general-profile-questions/articles/separate-apps-for-each-offering), [TradingQnA](https://tradingqna.com/t/coin-as-mobile-application-or-merged-to-kite-app/40205) | Undated | Kite is dense, Coin is calm, and users value that split | Forum opinion | Summary |
| 21 | [Where is my Train, YourStory](https://yourstory.com/2018/11/app-fridays-access-irctc-timetable-check-live-train-status-set-station-alarms-without-internet) | Nov 2018 | 10M+ downloads, no login. **No source confirmed its vertical stop list**. That detail is from my memory of the app | Popularity is evidence, layout is unverified | Summary |
| 22 | [Android navigation bar docs](https://developer.android.google.cn/develop/ui/compose/components/navigation-bar?hl=ca) | Current | Three to five equally important destinations | Platform guidance | Summary |
| 23 | [UK DSIT revisions policy](https://www.gov.uk/government/publications/dsit-compliance-with-official-statistics/dsit-revisions-and-corrections-policy-for-statistics), [Swiss FSO symbols](https://www.bfs.admin.ch/bfs/en/home/basics/symbols-abbreviations.html), [StatCan](https://www.statcan.gc.ca/en/concepts/definitions/guide-symbol) | Current | Official statistics mark provisional figures with a small typographic symbol and remove it when final. Nothing supports italics specifically | Convention. Italics is my choice | Summary |
| 24 | [Effect of colour palettes in heatmap perception](https://diglib.eg.org/items/bc1c1255-3957-4e09-b980-21b84af1db29/full) | EuroVis 2023 | Calendar heatmaps have a fixed cell order, palette matters. No guidance on small mobile cells | Evidence, thin | Summary |
| 25 | [PT Sans ₹ bug report](https://lists.fedoraproject.org/archives/list/fonts-bugs@lists.fedoraproject.org/thread/EK6XG4QHRI55U4NYMRQG6TKEDUH4QO2R) | Undated | A family shipped the wrong glyph at U+20B9. Always test | Evidence, one case | Summary |

**Own test, not from a source.** I checked 19 open-licensed families with fontTools and rendered 12 side by side. Besley and Sofia Sans have no ₹ at all. Libre Franklin has ₹ but no `tnum`. Schibsted's tabular commas are absurdly wide. Newsreader and Brygada's tilde is broken for this use. Mona's tabular italic zero is slashed in a distracting way. See section 4 of SPEC.md.

**Searched and found nothing usable:** Fold's design, Carrot Weather, a critique of Apple Weather's redesign, safe-to-spend criticism, Gentler Streak, bahi-khata or passbook design, greenbar paper history, tide-table typography, calendar heatmaps on phones. So my claim that banded accounts paper exists to guide the eye is **from memory and taste, not sourced**.

**What the research did and did not settle.** Fairly solid: show uncertainty, do not use a point forecast, keep layouts stable, lock table columns. Not settled: nobody has studied glanceable personal-finance data on phones. The closest work is watches and bus arrivals. Most of what looks excellent in the field is recorded as taste.

---

## 2. Frame: what are they actually doing?

They have ten seconds and a question. They are not "viewing their finances". Data refreshes about daily, so opening it more than daily gains nothing.

| Job | Trigger | How often, state | Decision it serves |
|---|---|---|---|
| **1. Am I fine till salary?** | Morning, a purchase, a mild worry | Near daily, 10 seconds, one hand | Relax, or hold back this week |
| **2. What is about to hit me?** | Before a due date | Weekly, 30 seconds | Is the money in the right account? |
| **3. Where did it go, and is that unusual?** | Month end, a surprising number | Weekly to monthly, 5 minutes, some attention | Change a habit, or correct a wrong name |
| **4. Hand something to someone** | Flatmates, CA, audit | Monthly or rarer, wants to be finished | None. They want an output, not an exploration |
| **5. What should my money do?** | Bonus, big life question, parents | Quarterly, unhurried, maybe on a laptop | Change allocation, or accept a household cost |

**8 am vs the 28th.**
- 8 am mid-month: one thing matters, the likely amount left at month end. Current balance misleads, because it is high before rent has gone.
- The 28th: that same number is still the top line, but it is nearly known. What is new is chores: name the unknowns, send the flatmate split, decide what to do with what is spare.

**Should Home change by time of month?** Initially yes, heavily. See reversal 1. The final answer: the skeleton never moves, the numbers and range change by themselves, and one extra slot appears near month end.

**Should it be a dashboard at all?** A dashboard is a set of independent answers for someone who has time to scan. Their money is not independent facts. It is one quantity moving through time, with known events. That is a timetable. So Home is one vertical column of time, with the rest below it.

**Where I am challenging the brief:**
- "Cash in bank" as the first item. Cash is in the first screen, but it is not the headline. The headline is cash after what is already committed.
- "End of month". If salary lands on the 30th, then the 30th is the wrong moment to measure. The real concept is *just before next salary*. The label shows the date so the idea stays correct either way. I do not know their salary date, so this needs their input.
- Year heatmap on the dashboard. It is on Home as asked, but below the fold. It answers no daily question.
- The GitHub-style heatmap. Rejected. See reversal 4.
- "Reports" as a builder. They asked to prepare quickly, so they are already prepared.

---

## 3. Concepts

Two ideas died quickly, before full debate:

- **The Gauge**: a single safe-to-spend score. Dead on evidence: sources 8 and 17 argue against opaque composites and point forecasts, and this owner needs to see the sum.
- **The Feed**: cards for what changed. Dead because most days nothing has changed, it rewards checking, and it cannot answer "where do I stand" without scrolling.

Three went to full debate.

### Concept A: The Line
Time runs down the phone. A left column of solid green narrows as money leaves, with named stops beside it. Today is a rule across the screen. Past is compressed, future is listed, and the column turns hatched where it is only a guess. Identity: ledger-green paper, serif figures, italics for anything unconfirmed.

**Strongest case.** The phone is tall, and time is what their question is about. Every other dashboard forces a horizontal month into 360 px. This uses the long axis and gives each stop a full-width, tappable row. Nothing needs learning, because the text alone is a complete list, and the picture only adds shape. Sources: 12 (shape at a glance), 21 (familiar vertical progress, from memory), 15 (timetables can be graphics).

### Concept B: The Letter
Home is a short generated letter. "You will likely end the month with about ₹25–35k." Phrases are links that open the data. Identity: large Literata, wine underlines on cool lilac-grey paper. Nav is Letters, Ask, Tables.

**Strongest case.** It needs literally no learning, since it is just reading. It handles uncertainty naturally in words ("about"), it is the least boilerplate thing imaginable, and it would convert beautifully to a notification. Honestly the most charming of the three.

### Concept C: The Month Sheet
Home is a one-month wall planner. Past days are filled with spend heat, future days have black bill tags, and pinch goes from year to month to day. Identity: stark black and white with one orange ramp, condensed Anek, poster type.

**Strongest case.** The calendar is the one interface everyone already knows. The heatmap the owner asked for *is* the navigation. It has the highest information per pixel and truly tells you when.

---

## 4. The critics

**Hana** is a senior mobile UX researcher. **Anselm** is a data-visualisation purist. **The Owner** is tired, on a train, one-handed, and has seen boilerplate. **Rukmini** hunts clichés, both Indian-themed gimmicks and generic fintech looks.

### Against A, The Line

**Hana:** "Vertical time is unconventional. And your green column takes 30% of a narrow screen. Do people need it, or is it decoration?"
*Rebuttal, partial.* Vertical lists of days are not unconventional on phones: every weather app's ten-day list works this way. But the column-cost point stands. It is 84 px of 328. I concede it is redundant with the text. **Kept on a condition**: if testing shows people never look at it, remove it and lose nothing. That is also why it cannot be required reading.

**Anselm:** "Rows are evenly spaced but dates are not. You have broken the time axis. And your first version scaled width to the salary peak, so the whole last third of the month was a sliver."
*Conceded in full on both.* First: it is a diagram and not a chart, and it says so by printing every date. Vignelli (14) is the warning. Vignelli's diagram failed when people needed real geography, so true calendar position needs a real calendar view, which the Bills strip and year grid supply. Second: I built the peak scale, looked at the render, and it was bad. See reversal 3.

**Anselm again:** "Truncating the axis at salary is lying."
*Rebuttal.* It would be, if unmarked. There is a visible break mark and the row carries the exact figure. Accepted as the cost of making the decision-relevant zone readable.

**The Owner:** "I'm on a train. Is the top number just one more thing to decode? What's the tilde? What's italics?"
*Rebuttal.* "Likely left on 30 Nov, ~₹25–35k" reads as a sentence. The italic and tilde add meaning for those who notice, and cost nothing if not. The footnote says what they mean, and any figure opens its arithmetic. I have not proved anyone notices. It is risk 1.

**The Owner:** "Have I seen this before?"
*Rebuttal.* Not in finance apps, as far as I found. Copilot-style navy with bright charts (18) is the look they are tired of.

**Rukmini:** "Green money is the oldest cliché in finance. And a rail-line metaphor from an Indian train app? That's a theme."
*Conceded on rail.* No train icons, no "stations", no "next stop" copy, and nothing in the UI says so. Only the structure survives. *Rebuttal on green.* Fair, but here it is not "money good, red bad". It is one job only: cash in hand. Spending is violet rather than red because spending is not a sin. The tint on the paper comes from old accounts stationery, which is not an Indian motif at all.

### Against B, The Letter

**Hana:** "Reading is slower than scanning, and repeated daily it becomes wallpaper. People learn where a number is; here it moves whenever the sentence changes."
*Conceded.* This was the fatal blow. Stable position is what makes the ten-second check work (9, 10). Sentences reflow, so the figure's position shifts every day.

**Anselm:** "Where's the comparison? A sentence can state one number, not show five against each other."
*Partly conceded.* Links open charts, but that means a tap for every comparison. It violates the brief's "put effort in the app to get data" complaint.

**The Owner:** "Cute for a week. On day nine I want the number. Also I've read enough generated text today."
*Conceded.* And a wrong sentence feels worse than a wrong chart.

**Rukmini:** "Large serif letter on soft paper is exactly the current AI-editorial look."
*Conceded.* I moved its paper from cream to lilac-grey to dodge the worst of it, which is a cosmetic fix.

**Verdict: dies as a home screen.** Its best idea survives: **every section heading is the answer, in a sentence**. "Food is running high. The rest is usual." That is in the winner on every screen.

### Against C, The Month Sheet

**Hana:** "It's strong for 'when', weak for 'how much will I have left'. And cells hold at most a few characters."
*Conceded.* The top job has to be answered outside the calendar, in a box above it. Then the calendar is just a decorative second thing.

**Anselm:** "Colour for amount in a 7-column grid is a low-accuracy encoding. And your week layout buries monthly patterns."
*Conceded, and it produced something good.* Rent and salary are monthly, not weekly, so the week grid is wrong for money. That insight gave the month-aligned year grid in the winner.

**The Owner:** "Today's fine, I can see a calendar. How much do I owe? Oh, down there. Where's my investing? Other tab. And the bold black type is shouting at me at 8 am."
*Partly conceded.* It has the most personality of the three, which they asked for, and it would be the one to pick if bill dates were their main anxiety.

**Rukmini:** "Black, white and orange posters are Swiss-revival default."
*Conceded.*

**Verdict: loses the home screen.** Its grid idea moves to Year.

### Second round: attacks on the synthesis

**Hana:** "Five tabs, no icons? And where's Reports? Hidden in the corner?"
*Rebuttal on icons.* The labels are plain nouns and an icon would add nothing. Platform guidance (22) caps tabs at five, and their list has six destinations. **Reports is the one I am least sure about**: a text link at top right of every page, and hard to reach one-handed (11). I accepted this because it is monthly and because it opens pre-scoped to the page you are on. Risk 3.

**Anselm:** "Heat cells are 8.6 by 11 px. Nobody can tap that, and your low steps are under 3:1 against empty cells."
*Conceded as a known exception.* Tapping is a drag-to-read loupe, and the page must offer a list view. The Invest page has a table of biggest days. A full list view is specified but not mocked. Low-contrast cells are only allowed because the readout and the list carry the values.

**The Owner:** "The year grid, in spending, looks like noise."
*Conceded.* I cut the data's noise once, but on Spend it really is close to noise, and this is a fake dataset. The Invest grid with its two stripes is plainly better. If the real spending grid looks like static, it should move off Home to Spend. I would still keep it for now because they asked for it.

**Rukmini:** "Sage paper, plum, ochre. Isn't that a tasteful-muted-palette default?"
*Rebuttal, partial.* It is not on the usual list, but it is a mood I can't fully clear. What protects it is the rule that each hue has one job, and that large areas stay neutral. And there is one thing nobody else's system has: italics means unconfirmed.

---

## 5. Reversals: where I changed my mind

1. **Home should reshape itself by time of month. I reversed this.** My first plan had a mid-month dashboard and a different month-end screen, because the jobs differ. Hana and sources 9 and 10 stopped it: spatial stability is the thing that makes a ten-second check possible, and the evidence on adaptation is discouraging unless it saves many steps. Those sources are about menus, so this is an inference. Now the skeleton is fixed, the range narrows on its own, the column shows how far through the month you are, and one chores slot appears near month end. Nothing moves except that it pushes the line down.

2. **Everything on one endless timeline, no tabs. I reversed this.** This was the idea I fell in love with: no pages at all, just scroll through time, pinch to zoom. It is elegant, and it fails the brief's central complaint. They would have to learn it. "Bills" and "Spend" are words they already know, so five plain tabs won, and the timeline became Home only. This was the largest reversal and it made the concept less clever.

3. **River scale: peak salary was the honest scale. I reversed this after seeing it.** I argued for a fixed peak scale because scaling to today would make ₹33k look like plenty. Correct, but I rendered it: a giant green wedge at the top, then a sliver for the part of the month with all the decisions, with the range only 3 px wide. The new fixed scale is one ordinary month of outgoings, with salary running off it behind a break mark. Still constant every day, and the band is now visible. Anselm dislikes the break, and I accepted that.

4. **Year heatmap in the GitHub layout. I reversed this.** I assumed weeks by weekdays because everyone knows it. At 360 px that is 53 columns of about 6 px, and worse, weekly rhythm is the wrong rhythm for money. Months as rows and day-of-month as columns gives 31 columns at about 9.6 px, and regular payments line up as stripes. The stripes in the Invest grid were the first thing in the mock that made me think the design was right.

5. **Figures in a sans, because data should be neutral. I reversed this.** Conventional dataviz practice says clean sans for numbers. I began with a Clarendon idea (Besley), and it died immediately: no ₹. Then in the specimen, Vollkorn's italic figures looked entirely different from its upright ones, even at 13 px. So I gave the numbers the serif, the words the sans, and italics a real meaning. The reverse of the usual editorial pairing.

6. **Category colours. Reversed early.** I assumed five category hues. Then the colour budget ran out before the owner's actual complaint was answered. Categories now get none: earlier months are neutral dots, this month is a violet ring.

---

## 6. Synthesis and verdict

**Winner: The Line, with B's answer-as-heading and C's month-aligned grid.**

What I rejected:
- Any single score or gauge.
- Pie and donut charts, even though 1 favours donuts on watches. Sorted rows with labels do it here without a legend.
- Stacked rainbow category charts.
- Red and green as judgement.
- A custom report builder.
- Icons in the tab bar.
- Cards as the default container.
- Chat or "Ask" as a primary surface. It might be a good later addition, but any wrong answer about money is expensive, and it isn't needed for read-mostly daily use.

**What would change my mind:**
- If they cannot say what the italic and tilde mean after a week, drop italics as signal and use one mark only.
- If they never look at the river, delete it. The list stands alone, and 84 px comes back.
- If their main anxiety turns out to be dates rather than amounts, The Month Sheet was right.
- If they mostly open from a notification, then The Letter's sentence becomes the notification, and maybe more.
- If real forecasts are usually outside the printed range, the headline must get wider or lose its prominence. A confident wrong range is worse than no number.

**Asymmetric costs that decided things.**
- Wrong daily headline: high cost, since trust goes and does not come back. Hence ranges, shown arithmetic, and rounding.
- A tab too many: low cost. Learning a novel navigation model: high cost, paid every time they have been away.
- Removing the river later: nearly free, since the text stands alone. That is why I can afford to try it.

---

## 7. Revision after owner feedback, 2 Nov 2026

The owner said Till was "good almost everywhere", then asked for five changes. This section records what changed and where the owner overruled me.

### 7.1 Reversals forced by the owner

7. **"Text is always ink, categories get no colour, red and green are judgement." Reversed.** Section 5 and the first SPEC treated status colour as a fintech cliché. I argued spending is not a sin, so nothing should be red. The owner wants the opposite: colour that tells you something on every screen. They are right about what I missed. My one-job-per-hue rule gave hues to *kinds of money* (cash, debt, assets), and a label already says that. Colour was spent on something the words carried. Status is what you cannot read at a glance. Hue now answers "is this a problem?" The old objection survives in a narrower form: red is never used for merely spending money. It takes a comparison with the owner's own baseline, and many numbers stay neutral.

8. **Green paper. Reversed by the status system.** Tinted accounts-stationery paper made sense when green meant only cash. If green now means safe, a green page weakens that signal. The paper is now near-neutral. The owner liked the design language, and this is the one piece of it I removed without being asked. It is less characterful, and I accept that.

9. **Italics as the trust signal. Reversed.** I listed this as my own top risk and kept it anyway. It is now a word, `SMS` or `Est`, in a dashed outline. Italics stay as a quiet echo. ± marks forecasts.

10. **Range as the honest form of a forecast. Partly reversed.** I argued that a range avoids a point forecast, and that a midpoint invites false confidence. ₹30k ±5k carries the same width in fewer characters, and it reads faster than ₹25–35k. My concern is smaller than I claimed: the ± stays attached. The risk is that people will drop it when they remember the number, so the hero keeps it large.

11. **31-column year grid. Reversed, and I'm sorry to lose the stripes.** I called the month-aligned grid the moment the design felt right. The owner called the investing version "a month long boolean chart", which is fair: at that size it can say only yes or no. Its cells also needed dragging. It is gone from Home and Invest.

### 7.2 Debate on the new visualisations

**What did each of the three Spend lists answer?**

| Old list | The question it was really answering | Chart now | Why that form |
|---|---|---|---|
| Group, so far, usual by now | Which group is off, compared with its own normal? | Usual-band rows: grey band, median tick, mark for now | Comparison against a personal range, which a bar cannot show |
| Group by month table | Which group is unstable, and when? | 5 × 6 matrix heatmap, each row judged against itself | Two categorical axes. Patterns across cells are what matters |
| Places | Who actually gets the money, and how concentrated is it? | Treemap, grouped by category | Part-to-whole with names inside the marks, and unnamed money becomes a visible hatched block |

Closing the page: 12 month tiles over a 7-column day calendar.

**Anselm:** "Treemap areas are hard to compare."
*Conceded.* Every block prints its amount, so nobody has to judge area. It answers "what dominates", and a list is one tap away. Blocks too small to tap get merged, so the treemap hides the smallest places until the list is opened.

**Hana:** "Five read boxes on one page, plus tap-to-read everywhere. That's work."
*Partly conceded.* Numbers on the cells mean most of them can be read without tapping. The placeholder is now a faint line, not a box.

**The Owner:** "Is the calendar a wall of red?"
*Conceded after the first render.* It was. Four or more red days in 16, one of ₹14k. The threshold moved to ₹6,000, about 3 times a usual day, and the mock's data got less extreme. Real data needs checking against this rule (see risks).

**Heatmap or area for the Invest year? I chose area, and here is the honest case.**

- For a heatmap: the owner mentioned it first, and it fits the app's grids.
- Against: a year-wide heatmap at a tappable 44 px fits 7 columns on a phone, so it can't be both year-wide and comfortably tappable. Going to 52 weeks means about 6 px cells, which is what the owner just rejected. Shade is also a weak way to read an amount.
- Area: height reads an amount directly, position reads a date directly, and events can sit on the same axis.
- A catch: this money arrives in lumps. The stepped area looks more like columns than a smooth area. I rejected smoothing, because a smoothed curve would show money moving in weeks when none moved. So this is an area by construction and looks like bars. If the owner wanted a flowing shape, this will disappoint.
- Rejected: cumulative area. It rises every week and hides the timing the owner asked about.
- Rejected: an index line behind it. It would need verified daily data, and a second scale.

India sits above the line and US below, with events on the matching side, so position alone says which market. Events use neutral ink, because a market fall is not a judgement on the owner's money.

**How many events fit?** Six pins on a phone: three India, three US. Each pin is a 44 px target, and pins get spread apart when dates are close, with a dashed leader line back to the true date. Two more are in the list. The real year clusters: four of the six fall between February and mid-April. I did not spread them to look neater.

### 7.3 Attacks on the status system

**Rukmini:** "Red, black, green on a green-less paper is the trading-terminal default you rejected in round one."
*Partly conceded.* Yes, and the owner asked for it. What is different is that it is applied to *their* baselines, not market moves. Gains and market falls are deliberately uncoloured.

**Hana:** "Red-green is the classic colour-vision failure."
*Handled, not eliminated.* Light mode reaches ΔE 8.4 under protanopia. Dark needed lighter green and darker red to reach 13.1. Every state also has a mark or word. In charts, critical is a diamond and ordinary is a circle.

**The Owner:** "If everything is coloured, nothing is."
*The strongest attack.* On a calm mid-month Home, Have and Owe are both green and it does start to look decorative. I considered colouring only exceptions, with green left out, and I am still unsure. The owner explicitly asked for safe to be green, so green stays. **If the owner stops noticing red within a month, drop green from everything except the hero and the Line.**

**Anselm:** "'Average' for a bar in ink and 'Black' in dark mode is white."
*Accepted.* The state is "nothing to flag", and its colour is whatever ink is. The word "black" only holds in light mode.

### 7.4 What I pushed back on

- **Not every number gets a state.** Assets, gains, market moves, flatmate amounts and money put in stay neutral. They have no good or bad that the owner could act on, and red on a falling market invites the panic selling a long-term plan exists to prevent.
- **Unnamed payees are not red.** It is a chore, not danger. Red has to keep meaning money trouble.
- **The stated thresholds are my invention.** They are reasoned defaults, not tuned on real data, and the owner should adjust them.
- **Plan is untouched as asked**, so it keeps its old ochre, ranges and italics until the other designer's version arrives. Its colours are pinned in the shared stylesheet.

### 7.5 New risks

1. Thresholds are untuned. On real data, red could fire too often or never.
2. `±` is computed from 12 months of the owner's own history. A new or unusual month can fall outside it, and the first few months of use have too little history.
3. Green may become wallpaper.

Previously risk 1 (nobody notices italics) is now addressed by the tag, but still untested with a person.
