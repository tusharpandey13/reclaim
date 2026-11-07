# Plan page, second attempt: the debate

Invented figures throughout. Working notes saved early; sections fill in as the work proceeds.

## 1. Research (read 2 Nov 2026)

"Page" means I read the page. "Summary" means a search-result summary only: I did not read the full text.

| # | Source | Date | Finding used | Kind | Read |
|---|---|---|---|---|---|
| 1 | [Digital.gov plain language guide](https://digital.gov/guides/plain-language/writing/clear-short) | Undated | "Express only one idea in each sentence." Break an idea into parts, each the subject of its own sentence. No word limit given and no research cited | Guidance | Page |
| 2 | [van der Bles et al. 2020, PNAS, summary by Cambridge](https://www.cam.ac.uk/research/news/uncertainty-about-facts-can-be-reported-without-damaging-public-trust-in-news-study) | 2020 | 5,780 people. A numeric range barely lowers trust in the source. A verbal caveat lowers trust in the number more and inflates perceived uncertainty | Evidence, news statistics | Summary |
| 3 | [Kerr et al. 2023, Royal Society Open Science](https://doaj.org/article/f976256fe94e402888b221aa79257f77) | 2023 | Give a quantity where you can. Saying "uncertain" without one lowers trust in both number and source. Ranges can be hard for non-experts to place in context | Evidence | Summary |
| 4 | [McMahon et al., Bank of England SWP](https://www.bankofengland.co.uk/working-paper/2026/anchors-aweigh-the-effect-of-communicating-forecast-uncertainty) | Jul 2026 | 300 public, 75 experts. Fan charts best at showing expectation and spread together. Public underestimates uncertainty; fans help | Evidence, inflation forecasts | Summary |
| 5 | [Padilla et al. 2017, Cognitive Research](https://pmc.ncbi.nlm.nih.gov/articles/PMC5626802) | 2017 | Summary displays (cones) are misread more than ensembles; salient features get read as size. The band's hard edge invites "outside is safe" ([later redesign](https://bmcnoldy.earth.miami.edu/papers/MMCMEB2022_IJHCI.pdf)) | Evidence, hurricanes | Summary |
| 6 | [Wesslen et al. 2021](https://arxiv.org/abs/2107.02334) | 2021 | Some uncertainty displays worsened long-term choices. Intervals and bars did best | Evidence, retirement investing | Via plan/DEBATE.md |
| 7 | [Scientific American on hurricane cones](https://doi.org/10.1038/scientificamerican0919-80) | 2019 | "3 out of 10" often reads easier than 30% | Press | Summary |
| 8 | [Bruine de Bruin & Slovic 2021, PLOS ONE](https://pubmed.ncbi.nlm.nih.gov/34807946/) | 2021 | Low numeracy linked to financial mistakes, even controlling for income. Not about displays, and this owner is numerate | Evidence, background | Summary |
| 9 | [Monarch goals](https://www.monarch.com/blog/goals) | Jun 2026 | "On-track" or "off-track". The page does not say whether one goal's status accounts for other goals. You must first enter date and contribution | Vendor | Page |
| 10 | [INDmoney goal tracker](https://www.indmoney.com/networth/goals-tracker) | Undated | Goals against mapped investments and "Required SIP". On track, behind, needing review. No monthly cash flow described | Vendor | Page |
| 11 | [ProjectionLab milestones](https://projectionlab.com/blog/milestones) | Undated | Milestones plotted on the chart; plan elements attach to them | Vendor | Page |
| 12 | [Groww-style goal calculators, via INDmoney](https://www.indmoney.com/calculators/groww-sip-calculator) | Undated | Goal mode outputs a monthly SIP. Third-party descriptions, not Groww's own. No yes/no "can I afford it" found | Third-party | Summary |
| 13 | [Mobile reading, secondary on NN/g](https://uxmag.com/articles/why-reading-on-mobile-is-uniquely-challenging), [later finding](https://cte.ku.edu/reason-reconsider-students-mobile-reading) | Various | **Conflicting.** Older cloze tests found about half the comprehension on mobile; a later NN/g study found parity, slightly slower. I don't rest anything on it | Secondary | Summary |
| 14 | [Graph legends, Springer 2011](https://link.springer.com/article/10.3758/s13414-011-0155-1) | 2011 | Direct labelling commonly recommended; can clutter dense graphs. **I did not find a controlled result on speed** | Evidence, partial | Summary |

Failed to read: Monarch help centre (HTTP 403). Searches for ProjectionLab reviews returned noise. Nothing found for Copilot or Fi beyond plan/DEBATE.md #9 and an app listing.

**Evidence**
- One idea per sentence is consistent guidance. It's guidance, not a tested threshold. "12 words" comes from the brief, and I found no study behind any number.
- Give the number with its range rather than a verbal hedge (#2, #3). So "₹48k ±45k" beats "roughly ₹48k, but uncertain".
- A band shows spread better than points or ranges (#4), and readers misread band edges as boundaries (#5). So no hard edge on the band.

**Taste, and I'm labelling it**
- A month grid for choosing. Line over bars. Question-form section titles. Word choice ("Fits easily", "Could dip").

**The gap**
No source tests any of this on a personal cash-flow screen on a phone. No competitor I could read checks one purchase against all your others month by month. That may be an opportunity, or a sign it's hard to get right.

**Simulator method, from the earlier handoff, as requirements:** seeded paths; no resampling of a short strong history; annual steps hide falls within a year, so state it; a rule that favours one option must be caught; all text computed so nothing goes stale; everything rendered.

## 2. Why the old page needed rereading

**The sentence.** "Nothing is spare today, ₹1 L ±65k by Feb, after your plans."
- It has three ideas and one verb. The second clause drops its verb and subject: "[₹1 L ±65k is spare] by Feb".
- "Spare" is the app's own computed idea (the most that could leave this month without any later month dipping). The ordinary word means money in the bank, and the same person has ₹1.1 L in the bank.
- "After your plans" could attach to either clause.
- A clean control: a fresh model reader shown that screen guessed correctly but wrote "contradicts itself", and took ₹1 L and the row's ₹1.5 L to be mismatched. Both figures were right; they measure different things.

**The section.** "Keep all ₹1.1 L as cash. Nothing is free to invest yet." The app-wide rule "headings are answers" is the root cause. An answer with no question looks like an order from nowhere. The owner saw this: "What is this section?"

**First-screen demands, counted from the screenshot:**

| Demand | Kind | Cold reader's likely error |
|---|---|---|
| Spare | Invented concept | "But I have money" |
| ± on spare | Symbol on an unknown | Range of what? |
| Today vs by Feb | Two time points in one clause | Which is the headline? |
| Household, Job switch, Parents' money chips | Nouns with no verb | Filters? Categories? |
| Cushion ₹25k, with a tick on every bar | Label and legend | What does the black mark do? |
| Solid bar, darker hatch, pale hatch | Three encodings | Hatching needs teaching |
| Green at 3 lightnesses | Ladder | "More money"; nothing asks for attention |
| Tight | Status word | Tight what? |
| Month end column | Implicit | End of what, doing what? |
| Bold vs regular event names | Encoding | Why are some bold? |
| 12 rows, 3 numbers a row | Dense list | The owner asked for graphs |

Eleven things to learn before the first answer. Each was sound arithmetic. The page failed because it showed its model, not the answer.

**Jobs when opening Plan, ranked (my judgement from their words, not measured):**
1. Is anything wrong in my year?
2. Can I afford X, and when? They asked for this directly.
3. What have I already planned?
4. Should I invest my cash, or keep it?
5. What if costs or job change?
6. Where will I be in 5 years, and in what mix?
7. With my parents' money?

**Should allocation and big expenses share a screen?** Same page, separate sections with plain titles. Both rest on one forecast, and the cash answer depends on the plans. Tabs would hide the second, which is a thing to learn.

## 3. Structures

| | A. One picture | B. Ask | C. Question list | D. Agenda |
|---|---|---|---|---|
| Opens with | One plain statement, a chart, a list | "Can I afford something?" and a form | Six questions with answers | Only months where something happens |
| Plans by | Button, then a tile for each month | Form, then an answer | Tap into a question | Button |
| Mock | `mocks/plan.html` | `mocks/alt-ask.html` | `mocks/alt-hub.html` | `mocks/alt-agenda.html` |

I went in liking C. It is the most direct fix for "what is this section?", and I expected it to win.

## 4. The critics

**Pia**, plain-language editor: strikes anything that needs a second read. **Hana**, mobile UX researcher. **Prakash**, financial-planning sceptic. **Anselm**, data-viz purist. **The owner**, tired, one thumb, annoyed.

### C. Question list (my first choice)
**Pia:** "Best page here. Every line reads first time." *Agreed.*
**The owner:** "I asked for graphs. This is a list again, and I still tap to see the thing." *Conceded. That's a standing rule, and "Getting to info I need requires... effort" is the anti-pattern they named.*
**Anselm:** "No shape. You cannot see the dip in June from the sentence 'Both should fit'." *Conceded.*
**Hana:** "Tap, back, tap, back, one-handed." *Conceded.*
**Verdict:** rejected as the page. Its question titles survive as section titles.

### B. Ask
**The owner:** "I get it instantly." *Agreed.*
**Hana:** "It's the same empty form on day 100. Nothing tells me if something is wrong." *Conceded. It only answers the question you came with, and job 1 needs no question.*
**Prakash:** "Yes or no on a forecast is the most confident form there is." *Conceded.*
**Verdict:** rejected. The plain button and "When can you buy it?" survive.

### D. Agenda
**Pia:** "'Feb, Laptop, then ₹75k.' A story. Good." *Agreed.*
**Anselm:** "Rises are invisible, so you can't see why a month is fine. And 'quiet months' still hold money." *Conceded.*
**The owner:** "It's the same list with fewer rows." *Conceded.*
**Verdict:** rejected. Would change my mind if they say they only ever care about events.

### A. One picture (winner)
**Pia:** "'Your 2 big expenses should fit. March could fall below your ₹10k minimum.' Fit and fall. I read that twice." *Conceded, repeatedly. See reversal 3. Took four rewrites.*
**Prakash:** "'Fits' on a forecast sounds like a promise, when ± is nearly as big as the figure." *Partly rebutted.* "Fits" requires the low end to clear, the sentence carries its ±, and "Just fits" and "Could dip" exist so "Fits" can mean something. The ± rests on a back-test not yet done.
**Prakash:** "Your band is a wall. People read inside as safe, outside as impossible." *Conceded (Padilla, #5).* No outline, only a tint, and "Likely range" says what it is. 1 in 5 outcomes falls outside by construction, stated in the based-on section.
**Anselm:** "A line implies a path between month-ends that doesn't exist. Cash falls before salary and jumps." *Partly conceded.* Bars would be more literal, but bars plus ± needs a whisker, and that means a legend. Taste, recorded as taste. I did not test bars.
**Anselm:** "The y-axis has no scale and its floor isn't zero." *Conceded as a real cost.* Line labels and direct figures replace it. It caused a misread: a reader took the cushion line for zero (COLD-READ). Unsolved.
**The owner:** "Twelve tiles of dark red for the car looks like an alarm for no reason." *Rebutted.* It's accurate: a ₹2.2 L cost really doesn't fit before August. But a wall of red is heavy; watch it.
**The owner:** "Too much page." *Partly conceded.* Six sections, down from ten. Bad year and the 20-dot view went. The order never changes.
**Hana:** "12 points in 320 px: 27 px each." *Rebutted.* The chart isn't a control: any tap opens the month list. Choosing a month is the tile grid, 75 px wide.

## 5. Reversals

1. **"Cushion".** I removed it as jargon and wrote "Keep ₹25k" on the chart, on the theory that an instruction needs no learning. Then the owner said they understand "cushion" and set two levels, and "Keep ₹25k, minimum ₹10k" was odd. Restored, always with its figure, and the same word as Today.
2. **Green.** The old page had 10 of 12 months green on this data. Asked whether statistics could help, I tried a history bar alone: the low end above their second-highest month-end. It still greened 4 months because cash piles up in a forecast with nothing sweeping it out. So I added a cap: top 3 only. The first version of the red rule also changed when the owner set two levels (SPEC 4).
3. **The opening sentence.** Four rewrites, each after a fresh reader said they read it twice:
   - "Your 2 big expenses should fit. March could fall below your ₹10k minimum. Expected: ₹53k ±45k."
   - "Your 2 big expenses fit. One risk: March could fall below your ₹10k minimum."
   - "Your 2 big expenses fit. March could get tight. March balance: ₹53k ±45k."
   - "March could get tight. March balance: ₹53k ±45k. Your 2 big expenses still fit."
   - Final: "March could get tight. March balance: ₹53k ±45k."
   I kept trying to say the good news and the bad news together. The fix was to stop: say the exception, and let the expenses list say the rest. The first three all led with the fit, which is what I wanted to tell them, not what they need first.
4. **Question list to one picture.** See C above.
5. **What-if as a page mode.** The old page tinted everything while a what-if was on. I kept that in my first outline. Dropped: a mode you can forget is on is a thing to learn. A what-if is now a separate screen, and the page always shows the real plan.
6. **Month rows to tiles.** Vertical rows beat the horizontal strip last time, on target size. A 4×3 grid gives all 12 on one screen at 75 px wide, and it reads as a calendar.

## 6. Rejected, and what would change my mind

| Rejected | Why | Would change my mind |
|---|---|---|
| Question list | No shape, more taps | They say the chart isn't what they look at |
| Ask form first | Silent about problems | Usage shows they arrive only with one question |
| Agenda | Hides money between events | They only care about events |
| Page-wide what-if mode | Can be forgotten | They want to place a plan under a what-if (likely later) |
| Horizon picker | Control for a chart that can show it all | Never needed so far |
| Bars for months | Whiskers need a legend | A real test where the line is misread |
| Removing ± from the first view | Owner's rule; a quantity beats a verbal hedge (#2, #3) | Owner says it slows them |
| Bad-year section, 20-dot view | Weight; bad-year figure now sits on each stock choice | They ask |
| Plan-level "can move" and "by when" questions | Tiles show every month, so the reader judges. Fixed plans via one row on the expense | They miss a deadline |

**Owner-confirmed items.** 12 months first and the long range lower: kept. Fits, Dips, Sell: kept. I added Just fits, Could dip and Fits easily, because the two cushions need five states. "Tight" as a status: gone, but "could get tight" remains in the opening sentence, because it read cleanly there. I'd revisit if they object.

**Asks for the design language.** `../SPEC.md` says "Section headings are answers". This page needs a title and then an answer. That rule is what the owner hit, so it should change app-wide. Not mine to edit.

## 7. Top risks

1. **The 12-month forecast and its ± are unproven.** The whole page, and now the top sentence, rests on it. On today's real data it may not exist, and ± hasn't been back-tested.
2. **A sentence rule on real data.** It may fire daily on trivial risks, or say "could get tight" every month if ± is wide. Then it becomes noise, as green was.
3. **Green and red rules were tested only on invented data.** The 10-of-12 bar needs 12 real month-ends, and it treats a cash build-up as good, which may really mean uninvested cash.
