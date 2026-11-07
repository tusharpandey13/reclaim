# 0006. Per-group normalised scales in charts

Status: Accepted

## Context

Spending groups differ in size by an order of magnitude. Housing alone is usually the largest cash mover and dwarfs everything else. When the group rows on Today and Spend shared one rupee scale, small groups were flat lines, and a group that had doubled looked the same as one on track. The owner's review was direct: the scales are not normalised, and there is no point showing items with insignificant variance.

The design already judged groups against themselves in other places. The group-by-month matrix judges each row against its own history, and the usual ladder is built from each group's own median and spread.

## Decision

Each group is drawn on its own scale, centred on its usual.

- A group's row shows a centred "Usual" line with its usual band, running from Less to More. Usual is the median and spread over the last 12 complete months, measured at the same day of the month.
- The mark for now sits where the group stands against that band. The step is z = (now minus median) divided by the spread, and the difference must also clear a minimum rupee gap, so a small group does not flag on pocket change.
- Only groups off their usual are drawn. The rest collapse into one line naming them as within usual.
- With under 6 months of history, a group has no band, no number and no colour.
- Housing stays out of this month's group rows; it lives in fixed costs, which read as a sentence.

## Consequences

The reader sees which groups are unusual, not which are big, and the method is the same on every page. The trade-off is that rows are no longer comparable to each other in rupees: two rows at the same position may differ tenfold in money. Each row therefore prints its own figure ("₹5k more than its usual"), and the absolute picture lives in the treemap and the lists.

Rejected: one shared scale (flattens small groups); percent of total (still dominated by rent); drawing every group even when calm (noise the owner asked to remove).
