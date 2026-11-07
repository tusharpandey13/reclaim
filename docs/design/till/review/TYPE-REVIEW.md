# Reclaim: type design review

Every Till screen at 360 and 390 px, light and dark, in Chromium, before and after. Ranked by how much each one changes the read. Layout and Plan's structure were left alone. Before-state files: `work/pre-type-20261102-231632/`. Rules now live in `SPEC.md` section 4.

## Why it read monochrome

Hierarchy came only from size and weight. Every sentence on a screen was one colour, one weight and one underline style, and status colour was held inside chips and marks. So a section title and its answer looked the same whether it said something ordinary or something important. The Line, the one big graphic, had also gone grey.

## Applied

| # | Problem | Screen | Fix |
|---|---|---|---|
| 1 | No way to emphasise inside a sentence. Nothing tells the eye where to land | All | Three treatments with one job each: `.hl` marker (look here), `.u-hand` stroke (the exception), `.u-rule` thick rule (the yardstick). At most one marker a section |
| 2 | Words were wide and ordinary next to the serif figures, and sat close to any default grotesque | All | Asap at width 84, headings at 80. Tall and narrow: cap height 0.70, x-height 0.52. Figures and wordmark stay Vollkorn, no clash found |
| 3 | A narrower face at the old sizes reads small. 13 px was the floor | All, worst on row sub-lines, chart labels, date line | Note 14/18, Small 15/20, Body 17/24. Note and Small tracked `+.012em` and `+.006em` |
| 4 | Section titles too close to body once the words narrowed | All | Head 22/28 to 24/30 |
| 5 | Negative tracking left over from Archivo clogged a narrow face | Titles, answers, section heads | Head to 0, Answer −.018 to −.008em, Title −.012 to −.004em |
| 6 | Box text 4 px from the edge, and 2 px from the outline on outlined boxes | Spend treemap. Same fault on Invest's portfolio boxes | 8 px, or 10 px on outlined boxes. Status mark moved in to match, name keeps clear of it. Small third line only shows when it fits. Invest's short row 76 to 84 px so nothing clips |
| 7 | Grey column on a dark panel: the page's main graphic had no colour | Today | White panel, colour by job. `SPEC.md` section 3 |
| 8 | Sentence figures in the Words face beside serif figures in the same heading | Today's "₹64k a month" | Set in Figures, like every other heading figure. Rule now in `SPEC.md` section 4 |
| 9 | Paragraphs would run past 80 characters on wide screens now that words are narrower | Desktop only | Section text capped at 68ch from 1000 px up |

## Open list, all decided 3 November 2026

| # | Finding | Decision |
|---|---|---|
| 1 | Page titles at 32 sit straight above an answer of 36 | **Decided: titles stay at 32.** |
| 2 | Figures in chips and status sentences are in Words, figures in rows and answers in Figures | **Decided: keep it, and it is now written down** in `SPEC.md` section 4. |
| 3 | Today's row stacked a status chip and an SMS tag | **Decided: the owner dropped the SMS tag everywhere**, so the stacking is gone. `SPEC.md` section 5. |
| 4 | No marker on `bills-end` and `bills-hard` | **Decided: stay without one.** |
| 5 | Secondary text is all grey (`ink2`, `ink3`) | **Decided: leave it**, as recommended. The owner also likes the type, so Asap stays. |
| 6 | Today drew soft dashed and hard solid; Plan the reverse | **Decided: soft dashed, hard solid, on both.** |
| Also | Indigo for investing | **Decided: stays.** |

## Checked and fine

Wordmark and hero: no change. Numerals: Vollkorn lining tabular on `.n`; Asap's digits are all one width. No caps or mono anywhere. Line height is comfortable at the new sizes. Measure on phones is about 45 to 60 characters, read off the 390 px shots.
