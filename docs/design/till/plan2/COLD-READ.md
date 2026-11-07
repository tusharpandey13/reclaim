# Cold-read protocol

**This is not a usability test.** I am not a real user, and neither are the readers below. They are fresh model instances given only a screenshot. They read well, are fluent in English, and are not tired or on a train. They have no thumb. They catch contradictions and unclear labels. They can't tell me what the owner would actually do. Acceptance rule from the brief: any sentence needing a second read fails, as does anything needing a legend or a concept that isn't self-evident. Sentences under about 12 words, one fact each.

## 1. Readers (all model instances, sonnet, image only)

| # | Screen | Situation in their words | Button right? | Top lines read twice? |
|---|---|---|---|---|
| Control | Old page | "Spare cash is roughly ₹1 L by Feb" | Yes | "Headline contradicts itself" |
| 1 | "should fit / could fall below / Expected" | "Should fit, but one month may be tight" | Yes | "A bit contradictory" |
| 2 | "fit / One risk" | "Affordable, but March is tight" | Yes | "I had to read it twice" |
| 3 | "fit / could get tight / March balance" | "Fit, but money gets low around March" | Yes | "I read the top lines twice" |
| 4 | "could get tight / balance / still fit" | "Dip around March, should recover" | Yes | "I read the top lines twice" |
| 5 | Final two sentences | "Dips toward a low point in March, then rises" | Yes | Top lines clean. Read "could get tight" next to "Far above usual" twice |

The caption was reordered after reader 5, so months come first ("Aug, Sep, Oct: far above your usual balance"). **I did not re-test that change.**

## 2. First view, string by string

Final state: opening data, 390 px light. "Reader thinks" is what I'd expect a first-time reader to think, written before explanation, then checked against the readers above.

| String or visual | Reader thinks | Verdict |
|---|---|---|
| Plan | This is the plan page | Pass |
| All figures invented | Demo note. Prototype only | Pass |
| Reports | Reports. Unclear why here (reader 3, 4, 5) | Pass, app-wide link, not this page's |
| **March could get tight.** | Money will be low in March | Pass, 5 readers |
| March balance: ₹53k ±45k. | About 53k, could be 45k either way | Pass. ± read as margin by all |
| Money in your bank, next 12 months | What this chart is | Pass |
| Black line | Expected balance | Pass |
| Today ₹1.1 L | What I have now | Pass. "L" was a guess for the model readers. The owner uses lakh daily |
| Laptop, Feb / Trip, May | Purchases at those months | Pass after fix F16 |
| Grey band, Likely range | Spread of outcomes | Pass |
| Red diamond at Mar, bold Mar on axis | The problem month | Pass after fix F11 |
| Pink strip | Below here is bad | Pass, with F13's remainder |
| Cushion ₹25k, hard minimum ₹10k | Comfort target and absolute floor. "Not sure how they differ" (readers 3, 4, 5) | **Partial.** The owner set both. A cold reader guesses right but unsure |
| Oct ₹4.3 L ±70k | Balance by October | Pass |
| Green discs | Months above usual, matched to caption | Pass. Light vs dark green not understood; harmless because the word is the same |
| Aug, Sep, Oct: far above your usual balance | Good months. Usual for what? | **Partial.** See open items |
| See each month | A monthly table | Pass |
| Your big expenses | Things I planned | Pass |
| Laptop, February 2027, ₹1,33,333, Could dip | This might push me below | Pass. Reader 5 worked out Laptop causes March's dip |
| Trip, May 2027, ₹1,11,111, Fits | OK | Pass |
| Plan a big expense | Where to start | Pass, 6 of 6 readers |

**The 5-second and 10-second targets.** All 5 readers stated the situation in one sentence and found the button. That's readers without a clock, so it's not timing evidence.

## 3. Failures found and fixed

| # | What failed | Found by | Fix |
|---|---|---|---|
| F1 | "Spare" | Diagnosis | Gone. Now "Free to invest", in a labelled bar |
| F2 | "Room" | Diagnosis | Gone. "From April, you could invest ₹17k more each month" |
| F3 | Chips with noun labels | Diagnosis, control reader | Three rows lower down, saying what happens ("I switch jobs") |
| F4 | Hatched bars | Diagnosis, control reader | Soft band with a label |
| F5 | Section with an answer and no title | Owner | Plain title, then the answer |
| F6 | Tight as a status | Diagnosis | Just fits, Could dip |
| F7 | Month end column | Diagnosis | Chart title |
| F8 | Green everywhere | Owner | Green must be earned (SPEC 4) |
| F9 | "should fit" with "could fall below" | Reader 1 | Rewrite |
| F10 | "Expected:" Expected what? | Readers 1, 2 | "March balance:" |
| F11 | Red diamond unclear | Reader 1 | Its month is bold on the axis, and the axis always includes it |
| F12 | Uneven axis | Reader 1 | Every 2 months |
| F13 | Cushion and minimum no different | Reader 1 | "hard minimum" on the chart. Partly fixed; see open items |
| F14 | "Far above your usual": usual what | Reader 1, 2 | "usual balance", with a definition in What this is based on. Partly fixed |
| F15 | "One risk:" and "fit" read twice | Reader 2 | Rewrite |
| F16 | Laptop label appeared at Jan | Reader 4 | Flags name their month |
| F17 | Likely range over the green discs | Reader 2 | Moved below the band |
| F18 | Cushion label collided with data | My screenshot review | Moved into the pink strip, which now has fixed room |
| F19 | "fit" then "could get tight" read twice | Reader 3 | Exception first |
| F20 | "still fit" then "Could dip" on the row | Reader 4 | Sentence removed; the list says it |
| F21 | "Keep ₹25k" unlike Today's word | Owner | "Cushion" |
| F22 | Job what-if said "Laptop does not fit" | My test output | What-ifs say "Money runs short in April" |

22 found, 20 fixed, 2 partly (F13, F14).

## 4. Still open

- **Cushion vs hard minimum** for a cold reader. Fine for the owner, who chose them. The difference is spelled out at the bottom of the page.
- **"Your usual balance."** A definition exists, but it's 5 sections away.
- **The cushion line reads like the zero line** (reader 3: "a dip to zero?"). The chart's floor isn't zero. Unsolved.
- **Good news near bad news.** Reader 5 still read "could get tight" and "far above" together twice. Months-first wording is untested.
- **Mix of ₹53k, ₹4.3 L and ₹1,33,333** called jarring by reader 3. Those are the app's number rules. Left.
- **Lower screens** got only my reading, not a fresh reader. That includes tiles, conflict, what-ifs and the 5-year section.
